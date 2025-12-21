import { NextRequest, NextResponse } from "next/server";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { vectorStore } from "@/lib/vector-store";
import { prisma } from "@/lib/prisma";
import { describeImage } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    let docs;
    if (file.type === "application/pdf") {
        const loader = new WebPDFLoader(file);
        docs = await loader.load();
    } else if (file.type === "text/plain" || file.type === "text/markdown" || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
        const text = await file.text();
        docs = [{
            pageContent: text,
            metadata: { source: file.name }
        }];
    } else if (file.type.startsWith("image/")) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const description = await describeImage(buffer, file.type);
        docs = [{
             pageContent: `[Image Description for ${file.name}]\n${description}`,
             metadata: { source: file.name }
        }];
    } else {
        return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }
    
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const chunks = await splitter.splitDocuments(docs);

    // 4. Add to Vector Store
    const texts = chunks.map((d: any) => d.pageContent);
    const metadatas = chunks.map(() => ({ source: file.name }));
    await vectorStore.addDocuments(texts, metadatas);

    // 5. Save to Database (Prisma)
    const existing = await prisma.document.findFirst({ where: { name: file.name } });
    if (!existing) {
        await prisma.document.create({
            data: {
                name: file.name,
                source: file.name,
            }
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ingestion error:", error);
    return NextResponse.json({ error: "Failed to process document" }, { status: 500 });
  }
}
