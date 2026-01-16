
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getSauceRecommendations(peopleCount: number, availableSauces: string[]) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Eres un chef experto en eventos. Un cliente está pidiendo una pata flambeada para ${peopleCount} personas. 
      Las salsas disponibles son: ${availableSauces.join(', ')}. 
      Recomienda una combinación de 6 salsas (pueden repetirse si alguna es muy popular) para que el evento sea un éxito. 
      Explica brevemente por qué elegiste esa combinación. Responde en español y formato amigable.`,
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching Gemini recommendations:", error);
    return "No se pudo obtener una recomendación en este momento, pero te sugerimos elegir variedad entre picantes, agridulces y clásicas.";
  }
}
