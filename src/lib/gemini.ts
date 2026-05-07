import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface TextAnalysisResult {
  errors: {
    type: "orthography" | "grammar" | "punctuation" | "style";
    original: string;
    suggested: string;
    explanation: string;
    startIndex: number;
    endIndex: number;
  }[];
  summary: string;
}

export interface PlagiarismResult {
  score: number;
  details: string;
  sources?: string[];
}

export interface CopyrightResult {
  suggestion: string;
  creativeModifications: string[];
}

export async function analyzeText(text: string): Promise<TextAnalysisResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a professional linguistic analyst. 
    Analyze the following text for orthography, grammar, punctuation, and stylistic errors. 
    The text can be in any language (Russian, Kazakh, English, etc).
    
    1. Identify all types of errors.
    2. Provide a JSON object with:
       - errors: A list of objects {type, original, suggested, explanation, startIndex, endIndex}.
       - summary: A professional summary of the text quality in the language of the source text.
    
    Text: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          errors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ["orthography", "grammar", "punctuation", "style"] },
                original: { type: Type.STRING },
                suggested: { type: Type.STRING },
                explanation: { type: Type.STRING },
                startIndex: { type: Type.NUMBER },
                endIndex: { type: Type.NUMBER }
              },
              required: ["type", "original", "suggested", "explanation", "startIndex", "endIndex"]
            }
          },
          summary: { type: Type.STRING }
        },
        required: ["errors", "summary"]
      }
    }
  });

  const textOutput = response.text || "{}";
  return JSON.parse(textOutput);
}

export async function fixText(text: string, errors: any[]): Promise<string> {
  const prompt = `You are a world-class editor. 
  REWRITE the provided text perfectly.
  1. FIX errors: ${JSON.stringify(errors)}
  2. Maintain original structure, meaning, and tone.
  3. Return ONLY the final corrected text.
  
  Text: "${text}"`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });

  return response.text || text;
}

export async function analyzePlagiarism(text: string): Promise<PlagiarismResult> {
  const prompt = `Analyze the following text for originality and plagiarism across global sources.
  Estimate score (0-100) and provide details in the user's language (prefer Russian if context is Russian).
  
  Text: "${text}"`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          details: { type: Type.STRING },
          sources: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["score", "details"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function protectCopyright(text: string): Promise<CopyrightResult> {
  const prompt = `Suggest copyright protection strategies and 3-5 unique style modifications for this text.
  IMPORTANT: Provide all suggestions and modifications in RUSSIAN (на русском языке).
  
  Text: "${text}"`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestion: { type: Type.STRING },
          creativeModifications: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["suggestion", "creativeModifications"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
