
import { vectorStore } from "@/lib/vector-store";
import dotenv from "dotenv";
import path from "path";

// Load environment variables manually if running with tsx
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkScores() {
    console.log("Checking Scores...");
    
    const queries = [
        "休暇の規定は？", // Relevant to manual
        "What is the capital of France?", // Irrelevant
        "今日の天気は？", // Irrelevant
        "セキュリティについて", // Relevant
    ];

    for (const q of queries) {
        console.log(`\nQuery: "${q}"`);
        const results = await vectorStore.similaritySearch(q, 3);
        results.forEach((r, i) => {
            console.log(`  ${i+1}. [${r.similarity.toFixed(4)}] ${r.metadata?.source}`);
        });
    }
}

checkScores();
