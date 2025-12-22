
import fs from 'fs';
import path from 'path';
import { vectorStore } from '../src/lib/vector-store';
// Mock environment if needed, but vector-store imports gemini which needs API key.
// Assuming .env is loaded or process.env has the key.
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const manualPath = path.join(process.cwd(), 'documents', 'training_manual.md');
  
  if (!fs.existsSync(manualPath)) {
    console.error(`File not found: ${manualPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(manualPath, 'utf-8');
  
  // We add the whole manual as one chunk for now to preserve the "flow" instructions in one context.
  // Or we could split by "Step", but if we split, the "Step 2" might not be in context when "Start" is asked.
  // Given it's small, one chunk is safer for specific instructions like "Show Step 1 then Step 2".
  // However, vector search typically retrieves only relevant chunks. 
  // If user says "研修を開始" (Start Training), it might match the Header or Step 1.
  // To ensure the "structure" is understood, let's keep it as one document or large chunks.
  
  console.log("Seeding Training Manual...");
  
  await vectorStore.addDocuments(
    [content], 
    [{ source: "training_manual.md", type: "manual" }]
  );

  console.log("Done!");
}

main().catch(console.error);
