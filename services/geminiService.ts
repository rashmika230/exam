
import { GoogleGenAI, Type } from "@google/genai";
import { Medium, MCQQuestion } from "../types.ts";

/**
 * Robust JSON extraction that handles markdown blocks and accidental prefix text.
 */
const extractJsonArray = (text: string): any[] => {
  try {
    // 1. Direct try
    const cleanText = text.trim();
    if (cleanText.startsWith('[') && cleanText.endsWith(']')) {
      return JSON.parse(cleanText);
    }

    // 2. Look for the first [ and last ]
    const startIdx = text.indexOf('[');
    const endIdx = text.lastIndexOf(']');
    
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const jsonStr = text.substring(startIdx, endIdx + 1);
      return JSON.parse(jsonStr);
    }
    
    throw new Error("Could not locate JSON array boundaries");
  } catch (e) {
    console.error("JSON Extraction Error:", e, "Raw Text:", text);
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
  const modelName = "gemini-3-flash-preview";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Sanitize inputs
  const safeSubject = subject || "General Science";
  const safeTopic = topic || "General Syllabus";

  let styleGuide = "";
  if (type === 'past') {
    styleGuide = "Mimic the exact structure and difficulty of Sri Lankan A/L National Past Papers from the last 10 years.";
  } else if (type === 'model') {
    styleGuide = "Create high-difficulty model questions that test complex application of theories according to the SL A/L syllabus.";
  } else if (type === 'topic') {
    styleGuide = `Strictly focus only on the unit: ${safeTopic}.`;
  }

  const systemInstruction = `You are a Senior Sri Lankan A/L Examiner specializing in ${safeSubject}.
Language: ${medium}
Syllabus: Ministry of Education Sri Lanka.

Task: Generate ${count} MCQs.
Each question must have:
- Exactly 5 options (SL A/L standard).
- A valid correctAnswerIndex (0 to 4).
- A concise explanation of the logic.

${styleGuide}

CRITICAL: Return ONLY a raw JSON array. Do not use markdown backticks like \`\`\`json. Ensure all technical terms are standard for the ${medium} medium in Sri Lanka.`;

  const prompt = `Generate ${count} MCQ questions for A/L ${safeSubject} in ${medium}. Topic: ${safeTopic}.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.4, // More deterministic for structured data
        maxOutputTokens: 4000,
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                minItems: 5,
                maxItems: 5
              },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const questions = extractJsonArray(text);
    
    // Final validation of structure
    return questions.filter(q => 
      q.question && 
      Array.isArray(q.options) && 
      q.options.length === 5 && 
      typeof q.correctAnswerIndex === 'number'
    );
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};

export const generateSimplerExplanation = async (
  subject: string,
  question: string,
  originalExplanation: string,
  medium: Medium
): Promise<string> => {
  const modelName = "gemini-3-flash-preview";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `You are a friendly Sri Lankan A/L tutor. Explain the following ${subject} concept to a student using simple analogies in ${medium}.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Question: ${question}\nOriginal Explanation: ${originalExplanation}`,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "Sorry, I couldn't simplify this right now.";
  } catch (error) {
    return "The tutor engine is busy. Please try again later.";
  }
};
