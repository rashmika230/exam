
import { GoogleGenAI, Type } from "@google/genai";
import { Medium, MCQQuestion } from "../types.ts";

/**
 * Extracts JSON from a string, even if surrounded by markdown or extra text.
 */
const extractJson = (text: string): any => {
  try {
    // Attempt direct parse first
    return JSON.parse(text);
  } catch (e) {
    // Attempt to find JSON array or object using markers
    const startIdx = text.indexOf('[');
    const endIdx = text.lastIndexOf(']');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const jsonStr = text.substring(startIdx, endIdx + 1);
      try {
        return JSON.parse(jsonStr);
      } catch (innerE) {
        console.error("Failed to parse extracted JSON segment:", innerE);
      }
    }
    throw new Error("No valid JSON found in model response");
  }
};

export const generateQuestions = async (
  subject: string,
  medium: Medium,
  count: number = 5,
  topic: string = "general",
  type: 'quick' | 'topic' | 'past' | 'model' = 'quick'
): Promise<MCQQuestion[]> => {
  const model = "gemini-3-flash-preview";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let specialization = "";
  if (type === 'past') {
    specialization = "Style: Sri Lankan A/L Past Papers (2010-2024). High accuracy on standard question patterns.";
  } else if (type === 'model') {
    specialization = "Style: Advanced Model Papers. Deep application-level questions testing edge cases of theories.";
  } else if (type === 'topic') {
    specialization = `Strictly focus on the unit/topic: "${topic}".`;
  }

  const systemInstruction = `You are a Senior Sri Lankan A/L Examiner.
Subject: ${subject}
Medium: ${medium}
Syllabus: Official Ministry of Education Sri Lanka.
Task: Generate ${count} high-quality MCQs.

Requirements for each question:
1. Clear question text.
2. Exactly 5 options (SL A/L standard).
3. correctAnswerIndex (0-4).
4. Concise pedagogical explanation.

CRITICAL: Return ONLY a valid JSON array. Ensure all technical terms match the ${medium} medium curriculum.`;

  const prompt = `Generate ${count} MCQs for SL A/L ${subject} (${medium}). Topic: ${topic}. Purpose: ${type} exam.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        // Setting a high token limit to avoid truncation of JSON which causes parsing errors
        maxOutputTokens: 8192,
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

    if (!response.text) {
      console.warn("Empty response from AI - possibly safety blocked");
      return [];
    }

    const questions = extractJson(response.text);
    
    if (!Array.isArray(questions) || questions.length === 0) {
      return [];
    }

    return questions;
  } catch (error) {
    console.error("Generation service failure:", error);
    return [];
  }
};

export const generateSimplerExplanation = async (
  subject: string,
  question: string,
  originalExplanation: string,
  medium: Medium
): Promise<string> => {
  const model = "gemini-3-flash-preview";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `Help an A/L student understand a difficult ${subject} concept. 
  Language: ${medium}. 
  Explain the logic using a simple, relatable analogy. 
  Keep it short and encouraging.`;

  const prompt = `Question: ${question}\nTechnical Explanation: ${originalExplanation}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    });

    return response.text || "I couldn't simplify this right now, but focus on the core principles mentioned above.";
  } catch (error) {
    return "Simplified tutor engine is currently offline. Please use the standard explanation.";
  }
};
