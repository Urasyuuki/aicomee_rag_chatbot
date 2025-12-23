import { NextRequest, NextResponse } from "next/server";
import { Message as PrismaMessage } from "@prisma/client";
import { getModel } from "@/lib/gemini";
import { vectorStore } from "@/lib/vector-store";
import { prisma } from "@/lib/prisma";
import { streamOllamaResponse } from "@/lib/ollama";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  console.log("Chat API Hit");
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversationId, model = "auto" } = await req.json(); // Default to auto/cloud if not specified
    console.log(`Received: "${message.slice(0, 20)}...", ID: ${conversationId}, Model: ${model}`);

    // 1. Ensure Conversation Exists & Ownership
    if (conversationId) {
        // Check if it exists
        const existing = await prisma.conversation.findUnique({
            where: { id: conversationId }
        });

        if (existing) {
            if (existing.userId !== user.id) {
                return NextResponse.json({ error: "Unauthorized access to conversation" }, { status: 403 });
            }
            // Update timestamp
            await prisma.conversation.update({
                where: { id: conversationId },
                data: { updatedAt: new Date() }
            });
        } else {
            // Create new
             await prisma.conversation.create({
                data: {
                    id: conversationId,
                    title: message.slice(0, 30) || "New Conversation",
                    updatedAt: new Date(),
                    userId: user.id
                }
            });
        }

        // 2. Save User Message immediately
        await prisma.message.create({
            data: {
                role: "user",
                content: message,
                conversationId
            }
        });
    }
    
    // 3. RAG Retrieval (Always try to get context, useful for both unless "chat-only" mode is requested)
    const relevantDocs: any[] = await vectorStore.similaritySearch(message, 3);
    let context = "";
    let sources: string[] = [];

    if (relevantDocs.length > 0) {
       context = relevantDocs.map(d => d.text).join("\n\n");
       sources = Array.from(new Set(relevantDocs.map(d => d.metadata?.source).filter(Boolean)));
    }

    // 4. Fetch History
    let history: { role: "user" | "model"; content: string }[] = [];
    if (conversationId) {
        const prevMessages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: "desc" }, // Get newest first
            take: 20 // Increase context size
        });
        // Reverse to chronological order (Oldest -> Newest)
        history = prevMessages.reverse().map((m: PrismaMessage) => ({ 
            role: m.role as "user" | "model", 
            content: m.content 
        }));
        console.log(`Debug: Fetched ${history.length} history items for ID ${conversationId}`);
        if(history.length > 0) {
             console.log("Debug: Last history item:", history[history.length - 1].content.slice(0, 50));
        }
    } else {
        console.log("Debug: No conversationId provided, history skipped.");
    }
    
    // Debug Context
    if (context) {
        console.log("Debug: RAG Context Found. Length:", context.length);
    } else {
        console.log("Debug: No RAG Context.");
    }

    // 5. Generate Response (Manual Selection)
    let stream: ReadableStream;
    let usedModelName = "gemini";
    let shouldUseOllama = false;

    // Determine Mode
    if (model === "local") {
        shouldUseOllama = true;
    } else if (model === "cloud") {
        shouldUseOllama = false;
    } else {
         // Auto defaults to Cloud
         shouldUseOllama = false; 
    }

    // Interactive Manual Prompt Injection
    // We add the current message to the end, history is prepended.
    const systemInstruction = context 
        ? `You are a helpful AI assistant. 
Use the following context to answer the user's question.

IMPORTANT: 
- If the user is proceeding through a manual (e.g. saying "Next", "Start"), present ONLY the current/next step. Do NOT output the whole manual at once.
- If the user asks a SPECIFIC QUESTION (e.g. "What about breaks?", "Tell me about X"), answer it using ANY relevant context provided, even if it is not part of the current step.

Context:
${context}` 
        : `You are a helpful AI assistant.`;

    if (shouldUseOllama) {
        console.log("Using Local LLM (Ollama)");
        usedModelName = "ollama-qwen2.5";
        
        const messages = [
            { role: "system", content: systemInstruction },
            ...history.map(m => ({
                role: m.role === "model" ? "assistant" : "user",
                content: m.content
            })),
            { role: "user", content: message }
        ];

        try {
            const ollamaStream = await streamOllamaResponse(messages);
             stream = new ReadableStream({
                async start(controller) {
                    const reader = ollamaStream.getReader();
                    while(true) {
                        const {done, value} = await reader.read();
                        if (done) break;
                        controller.enqueue(value);
                    }
                    controller.close();
                }
            });
        } catch (e) {
            console.error("Local LLM failed, falling back to Cloud", e);
             usedModelName = "gemini-fallback";
             // Fallback logic -> Just retry with Gemini block code below or duplicate logic?
             // Simplest is to just call Gemini here, but we need to construct prompt string manually for history
             const historyText = history.map(m => `${m.role === "user" ? "User" : "Model"}: ${m.content}`).join("\n");
             const prompt = `${systemInstruction}\n\nChat History:\n${historyText}\n\nUser: (Fallback) ${message}`;
             
             const m = getModel();
             const result = await m.generateContentStream(prompt);
             stream = new ReadableStream({
                 async start(controller) {
                     for await (const chunk of result.stream) {
                         controller.enqueue(chunk.text());
                     }
                     controller.close();
                 }
             });
        }

    } else {
        // Cloud (Gemini)
        console.log("Using Cloud LLM (Gemini)");
        usedModelName = "gemini-flash";
        
        // For Gemini single-turn, we construct a long prompt with history
        const historyText = history.map(m => `${m.role === "user" ? "User" : "Model"}: ${m.content}`).join("\n");
        const prompt = `${systemInstruction}\n\nChat History:\n${historyText}\n\nUser: ${message}`;

        const geminiModel = getModel();
        const genStream = await geminiModel.generateContentStream(prompt);
        
        stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of genStream.stream) {
                    controller.enqueue(chunk.text());
                }
                controller.close();
            }
        });
    }
    
    // Create a TransformStream to save the full response to DB while streaming
    const encoder = new TextEncoder();
    let fullResponse = "";

    const customStream = new ReadableStream({
      async start(controller) {
        try {
            const reader = stream.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                // value is string chunk
                const text = value as string;
                fullResponse += text;
                controller.enqueue(encoder.encode(text));
            }

            if (conversationId) {
                try {
                    // Double check if conversation still exists (it might have been deleted mid-stream)
                    const count = await prisma.conversation.count({ where: { id: conversationId } });
                    if (count > 0) {
                        await prisma.message.create({
                            data: {
                                role: "model",
                                content: fullResponse,
                                conversationId
                            }
                        });
                    } else {
                        console.warn(`Conversation ${conversationId} not found when saving model response. Skipping save.`);
                    }
                } catch (dbError) {
                    console.error("Failed to save model response to DB:", dbError);
                    // Do not throw, just log. We don't want to crash the stream if DB fails here.
                }
            }
            controller.close();
        } catch (e) {
            console.error("Stream processing error:", e);
            controller.error(e);
        }
      }
    });

    return new NextResponse(customStream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "X-Sources": JSON.stringify(sources),
            "X-Model-Used": usedModelName
        },
    });

  } catch (error) {
    console.error("Chat API Error:", error);
    const err = error as any;
    
    // Check for Gemini API Rate Limit (429) or Overloaded (503)
    if (err.status === 429 || err.status === 503 || err.response?.status === 429) {
        return NextResponse.json(
            { error: "AI Service is busy (Rate Limit). Please try again later." },
            { status: 429 }
        );
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
