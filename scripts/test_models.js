const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY; // This might not be set in process unless I load dotenv.
// But Next.js loads it from .env.local.
// For this standalone script, I need to read .env.local manually or pass it.
// I'll just hardcode reading .env.local for this script since it's a dev tool.

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
        console.error("No API KEY found in .env.local");
        return;
    }
    const genAI = new GoogleGenerativeAI(key);
    // There isn't a direct listModels on genAI instance in some versions, 
    // but let's try assuming the library exposes it or we just try a known model.
    // Actually, the SDK doesn't always expose listModels easily in the high level client.
    // We can use the model manager if available in this version.
    
    // Instead of fighting SDK versions, let's just try a simple generation with 'gemini-pro' to check connectivity.
    console.log("Testing gemini-pro...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("gemini-pro Success:", await result.response.text());
    } catch (e) {
        console.error("gemini-pro Failed:", e.message);
    }
    
    console.log("Testing gemini-1.5-flash...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("gemini-1.5-flash Success:", await result.response.text());
    } catch (e) {
        console.error("gemini-1.5-flash Failed:", e.message);
    }
}

listModels();
