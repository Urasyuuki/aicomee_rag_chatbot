
import { createClient } from "@supabase/supabase-js";

// Load env vars BEFORE importing anything that uses them
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

// Now import vector store (or just use supabase client directly here to be safe)
// Indeed, if vector-store.ts evaluates process.env at top level, we might be too late if we import it with static import.
// Let's re-import dynamically or just create the client here for debugging to be 100% sure.

const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(sbUrl, sbKey);

async function run() {
    if (!sbUrl || !sbKey) {
        console.error("Supabase credentials missing in env");
        return;
    }


    // 1. Check total count
    const { count, error: countError } = await supabase
        .from('document_chunks')
        .select('*', { count: 'exact', head: true });
    
    if (countError) console.error("Count Error:", countError);
    console.log("Total chunks in DB:", count);

    // 2. List distinct sources (using a hacky way if distinct not easy, just fetch some metadata)
    const { data, error } = await supabase
        .from('document_chunks')
        .select('metadata')
        .limit(100);

    if (error) {
        console.error("Fetch Error:", error);
    } else {
        const sources = new Set(data.map((d: any) => d.metadata?.source));
        console.log("Found Sources:", Array.from(sources));
    }

     const query = "社内のセキュリティに関する規定について教えて";
    console.log(`\nSearching for: "${query}" with k=10, threshold=0.1`);
    // ... search logic
    const { data: searchData, error: searchError } = await supabase.rpc('match_documents', {
        query_embedding: await require("../src/lib/gemini").getEmbeddings(query),
        match_threshold: 0.1,
        match_count: 10
    });
     if (searchError) {
        console.error("Search Error:", searchError);
    } else {
        console.log(`Found ${searchData.length} chunks.`);
        searchData.forEach((r: any, i: number) => {
             console.log(`\n--- Chunk ${i + 1} (Score: ${r.similarity}, Source: ${r.metadata?.source}) ---`);
             console.log(r.content.substring(0, 100) + "...");
        });
    }

}

run();
