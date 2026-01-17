
import { GoogleGenAI, Type } from "@google/genai";
import { Medium, MCQQuestion } from "../types.ts";

/**
 * Robust JSON extraction that handles markdown blocks and accidental prefix text.
 */
const extractJsonArray = (text: string): any[] => {
  try {
    const cleanText = text.trim();
    const startIdx = cleanText.indexOf('[');
    const endIdx = cleanText.lastIndexOf(']');
    
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const jsonStr = cleanText.substring(startIdx, endIdx + 1);
      return JSON.parse(jsonStr);
    }
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
  // Always use process.env.API_KEY as per platform requirements
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("Lumina Engine: API Key is missing. If you are seeing this on Netlify, please add the 'API_KEY' environment variable in your Site Settings.");
  }

  const ai = new GoogleGenAI({ apiKey });
  // Using gemini-3-pro-preview for high-complexity STEM/Commerce reasoning required for A/Ls
  const modelName = "gemini-3-pro-preview";
  
  const safeSubject = subject || "General";
  const safeTopic = topic || "General Syllabus";

  const systemInstruction = `You are an expert Sri Lankan A/L Examiner for ${safeSubject}.
Medium: ${medium}
Syllabus: Official Ministry of Education Sri Lanka Teacher Guides and Syllabuses.

Task: Generate ${count} MCQ questions based on the A/L curriculum.
Rules:
- 5 options per question.
- 1 correct answer index (0-4).
- Provide a detailed pedagogical explanation for the correct answer.

Return ONLY a raw JSON array. Technical terms must be standard for the ${medium} medium in Sri Lanka.`;

  const prompt = `Generate ${count} MCQ questions for A/L ${safeSubject} in ${medium}. Topic context: ${safeTopic}. Session type: ${type}.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
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
    if (!text) throw new Error("The curriculum engine returned an empty response. Please try again.");

    const questions = extractJsonArray(text);
    if (questions.length === 0) throw new Error("Failed to parse the curriculum data. Please retry with a more specific topic.");
    
    return questions.filter(q => q.question && Array.isArray(q.options) && q.options.length === 5);
  } catch (error: any) {
    console.error("Lumina Connection Error:", error);
    throw new Error(error.message || "A secure connection to the Lumina engine could not be established.");
  }
};

export const generateSimplerExplanation = async (
  subject: string,
  question: string,
  originalExplanation: string,
  medium: Medium
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "Simplified tutor service unavailable: API key missing.";

  const ai = new GoogleGenAI({ apiKey });
  const modelName = "gemini-3-flash-preview";

  const systemInstruction = `You are a friendly Sri Lankan tutor. Simplify this technical A/L ${subject} concept using an easy-to-understand analogy. Language: ${medium}.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Question: ${question}\nTechnical Explanation: ${originalExplanation}`,
      config: { systemInstruction, temperature: 0.8 }
    });

    return response.text || "I'm having trouble simplifying this right now.";
  } catch (error) {
    return "The simplified tutor service is temporarily unavailable.";
  }
};
