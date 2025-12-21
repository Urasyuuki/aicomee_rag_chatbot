import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/gemini";
import { vectorStore } from "@/lib/vector-store";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  console.log("Chat API Hit");
  try {
    const { message, conversationId } = await req.json();
    console.log("Received message:", message);

    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }
    
    // 1. Ensure Conversation exists (or user should have created it)
    if (conversationId) {
        await prisma.conversation.upsert({
            where: { id: conversationId },
            update: {},
            create: { id: conversationId, title: message.slice(0, 30) }
        });
        
        // 2. Save User Message
        await prisma.message.create({
            data: {
                role: "user",
                content: message,
                conversationId
            }
        });
    }

    // 3. RAG Retrieval
    const relevantDocs = await vectorStore.similaritySearch(message, 3);
    let context = "";
    let sources: string[] = [];

    // 4. Relevance Check (Simplified)
    if (relevantDocs.length > 0) {
       context = relevantDocs.map(d => d.text).join("\n\n");
       sources = Array.from(new Set(relevantDocs.map(d => d.metadata?.source).filter(Boolean)));
    }

    // 5. Generate Response (Streaming)
    const prompt = context 
        ? `Use the following context to answer the user's question. If the context is not relevant, ignore it.\n\nContext:\n${context}\n\nQuestion: ${message}`
        : message;

    const model = getModel();
    const stream = await model.generateContentStream(prompt);
    
    // Create a TransformStream to save the full response to DB while streaming
    const encoder = new TextEncoder();
    let fullResponse = "";

    const customStream = new ReadableStream({
      async start(controller) {
        try {
            for await (const chunk of stream.stream) {
                const text = chunk.text();
                fullResponse += text;
                controller.enqueue(encoder.encode(text));
            }
            if (conversationId) {
                await prisma.message.create({
                    data: {
                        role: "model",
                        content: fullResponse,
                        conversationId
                    }
                });
            }
            controller.close();
        } catch (e) {
            controller.error(e);
        }
      }
    });

    return new NextResponse(customStream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "X-Sources": JSON.stringify(sources),
        },
    });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    
    // Check for Gemini API Rate Limit (429) or Overloaded (503)
    if (error.status === 429 || error.status === 503 || error.response?.status === 429) {
        return NextResponse.json(
            { error: "AI Service is busy (Rate Limit). Please try again later." },
            { status: 429 }
        );
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
