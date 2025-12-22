
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

console.log("Loading env from:", path.resolve(process.cwd(), '.env.local'));
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') }); // Also load .env

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log("URL exists:", !!supabaseUrl);
console.log("Key exists:", !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listDocs() {
    console.log("Checking document_chunks table...");
    const { count, error: countError } = await supabase
        .from('document_chunks')
        .select('*', { count: 'exact', head: true });
    
    if (countError) {
        console.error("Error counting docs:", countError);
    } else {
        console.log(`Total chunks: ${count}`);
    }

    const { data: fullData, error: fullError } = await supabase
        .from('document_chunks')
        .select('id, embedding'); // Select only embedding to limit size

    if (fullError) {
        console.error("Error fetching embeddings:", fullError);
    } else {
         const { data: contentData } = await supabase
            .from('document_chunks')
            .select('content, metadata')
            .eq('id', 1)
            .single();
         
         if (contentData) {
             console.log("--- Content of ID 1 (training_manual.md) ---");
             console.log(contentData.content);
             console.log("------------------------------------------");
         } else {
             console.log("ID 1 not found");
         }
    }
}

listDocs();
