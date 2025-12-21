const path = require('path');
const fs = require('fs');
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach((line: string) => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} else {
    console.error(".env.local not found");
}

// Now require the modules
// We need to require the TS files. npx tsx can run this if we rename to .ts and use dynamic import 
// OR we can just use tsx to run this .js file which imports .ts files? 
// tsx handles .ts imports in .js files too.

async function run() {
    // We need to import the TS file. 
    // Since we are in CJS, we can use dynamic import() to load the ESM/TS module if 'tsx' is handling it.
    // src/lib/vector-store.ts uses 'export const'.
    
    // Let's try to just use npx tsx on this file, but use dynamic import to prevent hoisting.
    const { vectorStore } = await import('../src/lib/vector-store');

    const query = "休暇の規定は";
    console.log(`Checking similarity for: "${query}"`);
    
    try {
        const results = await vectorStore.similaritySearch(query, 5);
        
        console.log("Results:");
        results.forEach((r, i) => {
            console.log(`[${i}] Score: ${r.similarity.toFixed(4)}`);
            console.log(`    Snippet: ${r.text.substring(0, 100).replace(/\n/g, ' ')}...`);
        });
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
