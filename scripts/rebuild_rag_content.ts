
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import * as fs from "fs";
import * as path from "path";

// 1. Env Setup
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const apiKey = process.env.GEMINI_API_KEY!;

if (!sbUrl || !sbKey || !apiKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabase = createClient(sbUrl, sbKey);
const genAI = new GoogleGenerativeAI(apiKey);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

async function getEmbeddings(text: string) {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
}

async function run() {
    console.log("Starting Rebuild...");

    // 2. Delete company_manual.md
    console.log("Deleting 'company_manual.md'...");
    // Attempt deletion by metadata filter
    // Note: If metadata is JSONB, we need specific operator or we select first then delete by ID.
    // Let's try direct delete with filter.
    const { error: delError, count } = await supabase
        .from('document_chunks')
        .delete({ count: 'exact' })
        .filter('metadata->>source', 'eq', 'company_manual.md');
    
    if (delError) console.error("Delete Error:", delError);
    else console.log(`Deleted ${count} chunks for company_manual.md`);

    // 3. Ingest security_policy.md
    const filePath = path.join(process.cwd(), "testdata/security_policy.md");
    if (!fs.existsSync(filePath)) {
        console.error("File not found:", filePath);
        return;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    const fileName = "security_policy.md";
    
    console.log(`Ingesting ${fileName}...`);
    
    // Split
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const docs = await splitter.createDocuments([content]);
    console.log(`Split into ${docs.length} chunks.`);

    // Embed and Insert
    const rows = [];
    for (const doc of docs) {
        const embedding = await getEmbeddings(doc.pageContent);
        rows.push({
            content: doc.pageContent,
            metadata: { source: fileName },
            embedding
        });
    }

    const { error: insError } = await supabase
        .from('document_chunks')
        .insert(rows);
    
    if (insError) console.error("Insert Error:", insError);
    else console.log("Ingestion Complete.");
}

run();
