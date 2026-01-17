import { GoogleGenAI, Type } from "@google/genai";
import { Medium, MCQQuestion } from "../types.ts";

/**
 * Extracts JSON array even if the model includes markdown or surrounding text.
 */
const safeParseJson = (text: string): any[] => {
  try {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start !== -1 && end !== -1) {
      return JSON.parse(text.substring(start, end + 1));
    }
    return JSON.parse(text);
  } catch (e) {
    console.error("Lumina Parse Error:", e);
    return [];
  }
};

export const generateQuestions = async (
  subject: string,
  medium: Medium,
  count: number = 5,
  topic: string = "general",
  type: 'quick' | 'topic' | 'past' | 'model' = 'quick'
): Promise<MCQQuestion[]> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("Lumina Engine: API_KEY missing. Please configure 'API_KEY' in your Netlify Environment Variables.");
  }

  // Create fresh instance for every call to ensure latest key state
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-pro-preview"; // High-reasoning model for Sri Lankan STEM subjects

  const systemInstruction = `You are a Senior Sri Lankan A/L Examiner.
Subject: ${subject}
Medium: ${medium}
Task: Generate ${count} MCQs (5 options each) strictly based on the Sri Lankan National Syllabus.
Format: Provide 1 correct answer and a pedagogical explanation.
Language: Technical terms must be standard for the ${medium} medium in SL.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: `Generate ${count} ${type} questions for A/L ${subject} (Topic: ${topic}).`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.4,
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 5, maxItems: 5 },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    const questions = safeParseJson(response.text || "[]");
    return questions.length > 0 ? questions : [];
  } catch (error: any) {
    console.error("Exam Generation Error:", error);
    throw new Error(error.message || "Lumina Engine is currently busy. Please retry in a moment.");
  }
};

export const generateSimplerExplanation = async (
  subject: string,
  question: string,
  originalExplanation: string,
  medium: Medium
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "Simplified tutor service offline.";

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Subject: ${subject}\nQ: ${question}\nTechnical Explanation: ${originalExplanation}\nTask: Explain this using a simple real-world analogy in ${medium}.`,
    config: { temperature: 0.7 }
  });

  return response.text || "I couldn't simplify this concept at the moment.";
};