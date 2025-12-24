import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI;
let model: any;
let embeddingModel: any;

function init() {
    if (genAI) return;
    const apiKey = process.env.GEMINI_API_KEY!;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
}

export async function getEmbeddings(text: string) {
  init();
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

export function getModel() {
    init();
    return model;
}

export async function describeImage(imageBuffer: Buffer, mimeType: string): Promise<string> {
    init();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = "この画像の内容を詳細に日本語で説明してください。文字が含まれている場合は正確に書き起こしてください。マニュアルや文書の場合は、その要点とルールを日本語で要約してください。";
    
    const imagePart = {
        inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType
        }
    };

    const result = await model.generateContent([prompt, imagePart]);
    return result.response.text();
}
