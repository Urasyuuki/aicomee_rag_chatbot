import fs from "fs";
import path from "path";
import { getEmbeddings } from "./gemini";

const VECTOR_STORE_PATH = path.join(process.cwd(), "vector_store.json");

interface Document {
  id: string;
  text: string;
  metadata?: Record<string, any>;
  embedding: number[];
}

export class SimpleVectorStore {
  private documents: Document[] = [];

  constructor() {
    this.load();
  }

  private load() {
    if (fs.existsSync(VECTOR_STORE_PATH)) {
      try {
        const data = fs.readFileSync(VECTOR_STORE_PATH, "utf-8");
        this.documents = JSON.parse(data);
      } catch (error) {
        console.error("Failed to load vector store:", error);
        this.documents = [];
      }
    }
  }

  private save() {
    fs.writeFileSync(VECTOR_STORE_PATH, JSON.stringify(this.documents, null, 2));
  }

  async addDocuments(texts: string[], listMetadata: Record<string, any>[]) {
    for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        const metadata = listMetadata[i];
        const embedding = await getEmbeddings(text);
        this.documents.push({
            id: crypto.randomUUID(),
            text,
            metadata,
            embedding,
        });
    }
    this.save();
  }

  async similaritySearch(query: string, k: number = 3) {
    const queryEmbedding = await getEmbeddings(query);
    
    // Calculate cosine similarity
    const results = this.documents.map((doc) => {
      const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
      return { ...doc, similarity };
    });

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, k);
  }

  listSources() {
    // Extract unique sources from metadata
    const sources = new Set(
        this.documents
            .map(d => d.metadata?.source)
            .filter(Boolean)
    );
    return Array.from(sources);
  }

  deleteDocumentsBySource(source: string) {
    this.documents = this.documents.filter(doc => doc.metadata?.source !== source);
    this.save();
  }

  getDocumentsBySource(source: string) {
      return this.documents.filter(doc => doc.metadata?.source === source);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const vectorStore = new SimpleVectorStore();
