
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

async function testGemini() {
    console.log("Testing Gemini API...");
    const apiKey = getEnvKey();
    if (!apiKey) {
        console.error("No API Key found.");
        return;
    }
    console.log("API Key found (length):", apiKey.length);

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Hello");
        const response = await result.response;
        console.log("Gemini Chat Response:", response.text());
    } catch (e) {
        console.error("Gemini Chat Failed:", e);
    }
}

testGemini();
