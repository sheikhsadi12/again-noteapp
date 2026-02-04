import { GoogleGenAI } from "@google/genai";

// Initialize the client. 
// NOTE: In a real production app, use a proxy. For this demo, we assume the environment variable is set.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTIONS = `
You are a highly skilled, bilingual (Bengali and English) AI Teacher. 
Your goal is to assist the user based on specific instructions provided.
Format your response using Markdown. Use bolding for emphasis. 
Always be encouraging and educational.
If the user provides an image containing math problems, solve them step-by-step with clear explanations and verify the result.
`;

export const generateTeacherResponse = async (
  text: string, 
  instruction: string,
  context?: string,
  imageBase64?: string
): Promise<string> => {
  
  try {
    // Switched to 'gemini-3-flash-preview' for faster responses ("promptly").
    // It is capable of handling text and reasoning efficiently.
    const model = 'gemini-3-flash-preview';
    
    const parts: any[] = [];

    // Process Image Attachment if present
    if (imageBase64) {
        const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
            parts.push({
                inlineData: {
                    mimeType: matches[1],
                    data: matches[2]
                }
            });
        }
    }

    let prompt = `Task Instruction: ${instruction}\n\n`;
    
    if (context) {
        prompt += `Context/Source Text:\n"${context}"\n\n`;
    }
    
    prompt += `Input Content to process:\n"${text}"`;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS,
        temperature: 0.7, // Creativity balance
      },
    });

    return response.text || "দুঃখিত, আমি উত্তর তৈরি করতে পারিনি। অনুগ্রহ করে আবার চেষ্টা করুন।";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI শিক্ষকের সাথে সংযোগ স্থাপন করা যাচ্ছে না। অনুগ্রহ করে ইন্টারনেট সংযোগ বা API Key পরীক্ষা করুন।";
  }
};