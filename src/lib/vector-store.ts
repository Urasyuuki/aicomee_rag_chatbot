import { createClient } from "@supabase/supabase-js";
import { getEmbeddings } from "./gemini";

// Environment variables should be set in .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize Supabase client only if env vars are present (handles build time)
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

interface Document {
  id: string;
  content: string; // Renamed from text to content for clarity/standardization
  metadata?: Record<string, any>;
  embedding: number[];
}

export class SupabaseVectorStoreService {
  
  constructor() {}

  async addDocuments(texts: string[], listMetadata: Record<string, any>[]) {
    if (!supabase) throw new Error("Supabase credentials not configured");

    const rows = [];
    for (let i = 0; i < texts.length; i++) {
        const content = texts[i];
        const metadata = listMetadata[i];
        const embedding = await getEmbeddings(content);
        
        rows.push({
            content,
            metadata,
            embedding, 
        });
    }

    // Insert into 'documents' table. 
    // Mapped to Prisma model: The Prisma model 'Document' currently has 'name', 'source'.
    // We need a table that supports vectors. 
    // Usually we separate the raw chunks (vectors) from the source file record.
    // Let's assume we are inserting into a 'document_chunks' table or modifying 'Document' to have embeddings?
    // Given the previous simple implementation, let's create a new table 'document_chunks' via SQL in setup,
    // OR just use a standard table name 'vectors'.
    // Let's use 'document_chunks'.
    
    const { error } = await supabase
      .from('document_chunks')
      .insert(rows);

    if (error) {
      console.error("Error inserting vectors:", error);
      throw error;
    }
  }

  async similaritySearch(query: string, k: number = 3) {
    if (!supabase) return [];

    const queryEmbedding = await getEmbeddings(query);

    // Call configued RPC function 'match_documents'
    const { data: documents, error } = await supabase
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.5, // Minimum similarity threshold
        match_count: k,
      });

    if (error) {
      console.error("Error searching vectors:", error);
      return [];
    }

    // Map back to expected format
    return documents.map((doc: any) => ({
      id: doc.id,
      text: doc.content,
      metadata: doc.metadata,
      similarity: doc.similarity,
    }));
  }

  async deleteDocumentsBySource(source: string) {
    if (!supabase) return;
    
    // This requires metadata->>'source' syntax support in PostgREST or separate column
    // Let's assume metadata is JSONB
    const { error } = await supabase
        .from('document_chunks')
        .delete()
        .filter('metadata->>source', 'eq', source);

    if (error) {
        console.error("Error deleting documents:", error);
    }
  }
}

export const vectorStore = new SupabaseVectorStoreService();
