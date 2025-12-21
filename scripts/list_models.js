const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

function getEnvKey() {
    try {
        const p = path.join(process.cwd(), '.env.local');
        const content = fs.readFileSync(p, 'utf-8');
        const match = content.match(/GEMINI_API_KEY=(.*)/);
        if (match) return match[1].trim();
    } catch (e) {
        console.error("Could not read .env.local");
    }
    return process.env.GEMINI_API_KEY;
}

async function listModels() {
    console.log("Listing models...");
    const apiKey = getEnvKey();
    if (!apiKey) {
        console.error("No API Key");
        return;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        
        if (data.error) {
            console.error("API Error:", data.error);
            return;
        }

        if (data.models) {
            console.log("Found " + data.models.length + " models.");
            data.models.forEach(m => {
                 console.log(`MODEL: ${m.name}`);
            });
        } else {
            console.log("No models found or unexpected format:", data);
        }

    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

listModels();
