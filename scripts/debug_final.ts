import fs from 'fs';
import path from 'path';

// Load env vars first
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf-8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) process.env[key.trim()] = value.trim();
        });
    }
} catch (e) {
    console.error("Failed to load env", e);
}

async function main() {
    // Dynamic import to ensure env is loaded first
    const { vectorStore } = await import('../src/lib/vector-store');

    const queries = [
        "休暇の規定は",
        "フランスの首都は？",
        "こんにちは",
        "ランチのおすすめは？"
    ]; // Check RAG vs General vs Chat vs Irrelevant

    for (const q of queries) {
        console.log(`\nChecking: "${q}"`);
        const results = await vectorStore.similaritySearch(q, 1);
        if (results.length > 0) {
            console.log(`Score: ${results[0].similarity.toFixed(4)}`);
            console.log(`Snippet: ${results[0].text.substring(0, 50).replace(/\n/g, ' ')}...`);
        } else {
            console.log("No results");
        }
    }
}

main();
