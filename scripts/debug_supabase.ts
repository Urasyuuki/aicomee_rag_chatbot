import 'dotenv/config';

async function testSupabase() {
    console.log("1. Testing connection variables...");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log("URL:", url);
    console.log("Key Exists:", !!key);

    // Dynamic import to ensure env vars are loaded before vector-store initializes process.env values
    const { supabase } = await import("../src/lib/vector-store");
    const { getEmbeddings } = await import("../src/lib/gemini");

    if (!supabase) {
        console.error("Supabase client not initialized.");
        return;
    }

    console.log("2. Testing Table Existence (Selecting empty)...");
    const { data, error } = await supabase.from('document_chunks').select('*').limit(1);
    
    if (error) {
        console.error("ERROR accessing table:", error);
        return;
    }
    console.log("Table Access OK:", data);

    console.log("3. Testing Embedding Generation...");
    try {
        const dummyEmbedding = await getEmbeddings("Test");
        console.log(`Embedding generated. Length: ${dummyEmbedding.length}`);

        console.log("4. Testing Vector Insertion...");
        const { error: insertError } = await supabase.from('document_chunks').insert({
            content: "Test content",
            metadata: { source: "debug_script" },
            embedding: dummyEmbedding
        });

        if (insertError) {
             console.error("Insert ERROR:", insertError);
        } else {
            console.log("Insert OK!");
            // Cleanup
             await supabase.from('document_chunks').delete().match({ content: "Test content" });
        }

    } catch (e) {
        console.error("Embedding/Insert Exception:", e);
    }
}

testSupabase();
