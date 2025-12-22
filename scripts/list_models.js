
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
        console.error("No API Key found.");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Note: listModels is on the genAI instance or model manager?
        // Actually it's usually via a separate admin client or just getting a model doesn't list them.
        // Wait, the Google Generative AI JS SDK might not have a simple listModels method exposed on the main entry easily in older versions?
        // Let's check docs or try common pattern.
        // In newer SDK: genAI.getGenerativeModel is the main way.
        // Actually, there isn't a direct listModels on GoogleGenerativeAI instance in the simplified SDK.
        // We might need to try a known working model like 'gemini-pro'.
        
        console.log("Trying gemini-pro...");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("gemini-pro worked:", await result.response.text());
        
    } catch (e) {
        console.error("Error:", e);
    }
}

listModels();
