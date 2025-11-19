import { GoogleGenAI } from "@google/genai";

// Initialize the client securely using the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const suggestReply = async (
  title: string,
  lastComment: string
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Gere uma resposta profissional e empática para uma requisição de suporte.
      
      Contexto da Requisição: ${title}
      Última mensagem do usuário: "${lastComment}"
      
      A resposta deve ser curta, profissional e oferecer ajuda ou confirmar recebimento.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    console.error("Error generating reply:", error);
    return "";
  }
};