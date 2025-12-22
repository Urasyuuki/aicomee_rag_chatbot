import { Readable } from "stream";

interface OllamaMessage {
  role: string;
  content: string;
}

interface OllamaRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
}

export async function streamOllamaResponse(
  messages: OllamaMessage[],
  model: string = "qwen2.5"
): Promise<ReadableStream> {
  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    } as OllamaRequest),
  });

  if (!response.ok) {
    throw new Error(`Ollama API Error: ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error("No response body from Ollama");
  }

  // Create a transform stream to parse the NDJSON output from Ollama
  // Ollama returns objects like { "message": { "content": "..." }, "done": false }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          // Ollama can return multiple JSON objects in one chunk or partials
          // For simplicity in this basic implementation, we'll try to split by newlines
          // A more robust parser might be needed for production
          const lines = chunk.split("\n").filter(line => line.trim() !== "");
          
          for (const line of lines) {
            try {
              const json = JSON.parse(line);
              if (json.message?.content) {
                controller.enqueue(json.message.content);
              }
              if (json.done) {
                 // streamline end
              }
            } catch (e) {
              console.error("Error parsing Ollama chunk:", e);
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    }
  });
}
