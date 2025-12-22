import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database setup...");

  try {
    // 1. Enable pgvector extension
    console.log("Enabling vector extension...");
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);

    // 2. Create document_chunks table
    console.log("Creating document_chunks table...");
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id bigserial primary key,
        content text,
        metadata jsonb,
        embedding vector(768)
      );
    `);

    // 3. Create match_documents function
    console.log("Creating match_documents function...");
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION match_documents (
        query_embedding vector(768),
        match_threshold float,
        match_count int
      )
      RETURNS TABLE (
        id bigint,
        content text,
        metadata jsonb,
        similarity float
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT
          document_chunks.id,
          document_chunks.content,
          document_chunks.metadata,
          1 - (document_chunks.embedding <=> query_embedding) AS similarity
        FROM document_chunks
        WHERE 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
        ORDER BY document_chunks.embedding <=> query_embedding
        LIMIT match_count;
      END;
      $$;
    `);

    console.log("Database setup completed successfully!");

  } catch (e) {
    console.error("Error setting up database:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
