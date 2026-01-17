
import { GoogleGenAI, Type } from "@google/genai";
import { Medium, MCQQuestion } from "../types.ts";

/**
 * Robust JSON extraction that handles markdown blocks and accidental prefix text.
 */
const extractJsonArray = (text: string): any[] => {
  try {
    const cleanText = text.trim();
    // Try to find the first array [
    const startIdx = cleanText.indexOf('[');
    const endIdx = cleanText.lastIndexOf(']');
    
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const jsonStr = cleanText.substring(startIdx, endIdx + 1);
      return JSON.parse(jsonStr);
    }
    
    // Fallback: try direct parse
    return JSON.parse(cleanText);
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
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("System configuration error: API Key is missing. Please ensure your environment is correctly configured.");
  }

  const modelName = "gemini-3-flash-preview";
  const ai = new GoogleGenAI({ apiKey });
  
  const safeSubject = subject || "General";
  const safeTopic = topic || "General Syllabus";

  let styleGuide = "";
  if (type === 'past') {
    styleGuide = "Structure: Mimic Sri Lankan A/L National Past Papers. High technical accuracy required.";
  } else if (type === 'model') {
    styleGuide = "Structure: Challenging Model Exam. Focus on multi-step reasoning and application.";
  } else if (type === 'topic') {
    styleGuide = `Strictly focus only on: ${safeTopic}.`;
  }

  const systemInstruction = `You are a Senior Sri Lankan A/L Examiner for ${safeSubject}.
Language: ${medium}
Syllabus: Ministry of Education Sri Lanka Official Teacher Guides.

Task: Generate ${count} MCQ questions.
Rules:
- Exactly 5 options per question.
- 1 correct answer index (0-4).
- Clear, syllabus-accurate explanation.

${styleGuide}

CRITICAL: Return ONLY a raw JSON array. Technical terms must be standard for the ${medium} medium in the SL A/L curriculum.`;

  const prompt = `Generate ${count} MCQ questions for A/L ${safeSubject} in ${medium}. Topic: ${safeTopic}. Plan: ${type}.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.3,
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

    // Check if candidates exist (safety filter might have blocked all content)
    if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content) {
      throw new Error("Content generation was blocked by safety filters. Please try a different topic.");
    }

    const text = response.text;
    if (!text) return [];

    const questions = extractJsonArray(text);
    
    // Final filtering to ensure valid data
    return questions.filter(q => 
      q.question && 
      Array.isArray(q.options) && 
      q.options.length === 5 && 
      typeof q.correctAnswerIndex === 'number' &&
      q.correctAnswerIndex >= 0 &&
      q.correctAnswerIndex < 5
    );
  } catch (error: any) {
    console.error("Gemini Generation Exception:", error);
    // Rethrow to let the UI catch block handle specific error messages
    throw error;
  }
};

export const generateSimplerExplanation = async (
  subject: string,
  question: string,
  originalExplanation: string,
  medium: Medium
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "Configuration error: API Key missing.";

  const modelName = "gemini-3-flash-preview";
  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `You are a tutor in Sri Lanka. Simplify this technical A/L ${subject} explanation using a relatable analogy. Language: ${medium}.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Q: ${question}\nExplanation: ${originalExplanation}`,
      config: { systemInstruction, temperature: 0.8 }
    });

    return response.text || "Couldn't simplify at this moment.";
  } catch (error) {
    return "The simplified tutor engine is currently offline.";
  }
};
