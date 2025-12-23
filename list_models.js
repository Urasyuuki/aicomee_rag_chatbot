
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API KEY");
    return;
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  console.log("Testing gemini-pro...");
  try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent("Hello");
      console.log("gemini-pro SUCCESS:", result.response.text());
  } catch(e) {
      console.error("gemini-pro FAILED:", e.message);
  }
  
  console.log("Testing gemini-1.5-flash-001...");
  try {
      const model2 = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
      const result2 = await model2.generateContent("Hello");
      console.log("gemini-1.5-flash-001 SUCCESS:", result2.response.text());
  } catch(e) {
      console.error("gemini-1.5-flash-001 FAILED:", e.message);
  }

  console.log("Testing gemini-1.5-flash...");
  try {
      const model3 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result3 = await model3.generateContent("Hello");
      console.log("gemini-1.5-flash SUCCESS:", result3.response.text());
  } catch(e) {
      console.error("gemini-1.5-flash FAILED:", e.message);
  }

}

main();
