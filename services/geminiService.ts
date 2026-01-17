
import { GoogleGenAI, Type } from "@google/genai";
import { Medium, MCQQuestion } from "../types";

// Note: Initialization moved inside function to ensure fresh API key usage and correct scoping.

export const generateQuestions = async (
  subject: string,
  medium: Medium,
  count: number = 5,
  topic: string = "general",
  type: 'quick' | 'topic' | 'past' | 'model' = 'quick'
): Promise<MCQQuestion[]> => {
  // Use gemini-3-pro-preview for complex STEM and Advanced Level curriculum logic
  const model = "gemini-3-pro-preview";
  // Always initialize with direct process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let specialization = "";
  if (type === 'past') {
    specialization = "The questions should mimic the style, difficulty, and structure of real Sri Lankan A/L Past Papers from previous years (2010-2023). Focus on common repeating patterns.";
  } else if (type === 'model') {
    specialization = "Generate challenging 'Model Paper' style questions that test deep application of theories, similar to those found in elite school model papers or high-difficulty trial exams.";
  } else if (type === 'topic') {
    specialization = `Focus EXCLUSIVELY on the topic: "${topic}". Do not include questions from other units.`;
  }

  const systemInstruction = `You are an expert Sri Lankan Advanced Level (A/L) examiner. 
  Generate high-quality multiple choice questions (MCQs) for the subject: ${subject}.
  The questions must be strictly based on the Sri Lankan Ministry of Education teacher guides and syllabus.
  Language: ${medium}.
  ${specialization}
  For each question, provide 5 options (common for SL A/L), the index of the correct answer, and a detailed explanation.
  Ensure the tone and technical terms are accurate for the ${medium} medium SL A/L curriculum.`;

  const prompt = `Generate ${count} MCQ questions for SL A/L ${subject} in ${medium} language. Return only valid JSON.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
              },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr || '[]');
  } catch (error) {
    console.error("Error generating questions:", error);
    return [];
  }
};
