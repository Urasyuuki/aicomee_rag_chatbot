const fs = require('fs');
const path = require('path');

function getEnv() {
    try {
        const envPath = path.join(__dirname, '..', '.env.local');
        const content = fs.readFileSync(envPath, 'utf-8');
        const match = content.match(/GEMINI_API_KEY=(.*)/);
        return match ? match[1].trim() : null;
    } catch (e) {
        return null;
    }
}

async function listModels() {
    const key = getEnv();
    if (!key) {
        console.error("No API KEY found");
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => console.log(m.name));
        } else {
            console.log("No models found or error:", data);
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

listModels();
