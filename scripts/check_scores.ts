import dotenv from "dotenv";
import path from "path";

// Load environment variables manually if running with tsx
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function checkScores() {
    const { vectorStore } = await import("@/lib/vector-store");
    console.log("Checking Scores...");
    
    const queries = [
        "勤務時間と休憩について教えて",
        "休憩時間",
        "始業時間",
    ];

    for (const q of queries) {
        console.log(`\nQuery: "${q}"`);
        const results = await vectorStore.similaritySearch(q, 3);
        results.forEach((r: any, i: number) => {
            console.log(`  ${i+1}. [${r.similarity.toFixed(4)}] ${r.metadata?.source}`);
        });
    }
}

checkScores();
