import { NextRequest, NextResponse } from "next/server";
import { vectorStore } from "@/lib/vector-store";

export async function POST(req: NextRequest) {
  try {
    const { source } = await req.json();

    if (!source) {
      return NextResponse.json({ error: "Source required" }, { status: 400 });
    }

    const docs = await vectorStore.getDocumentsBySource(source);
    
    if (!docs || docs.length === 0) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Reconstruct content (join chunks)
    // Note: This might not be perfect if chunks are out of order, but usually they are added in order.
    // Ideally, we would have stored the full original text separately or sorted by index.
    // For this simple implementation, we just join them.
    const content = docs.map((d: any) => d.text).join("\n\n--- Chunk Boundary ---\n\n");

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Get content error:", error);
    return NextResponse.json({ error: "Failed to get content" }, { status: 500 });
  }
}
