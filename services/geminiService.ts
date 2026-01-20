
// @ts-nocheck
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  /**
   * Mantém o histórico da conversa para dar memória à IA.
   */
  async chat(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const chatSession = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: history,
      config: {
        systemInstruction: `Você é o "Assistente Portal", um tutor e assistente pessoal inteligente. 
        Sua principal característica é ter memória impecável das mensagens anteriores do usuário. 
        Seja amigável, educado e use formatação Markdown.`,
      },
    });

    try {
      const result = await chatSession.sendMessage({ message });
      return result.text;
    } catch (error) {
      console.error("Erro no Gemini:", error);
      throw error;
    }
  }

  /**
   * Analisa uma imagem em busca de conteúdo impróprio (Moderação).
   * @param base64Data Dados da imagem em base64.
   * @param mimeType Tipo MIME da imagem (image/jpeg, image/png, etc).
   * @returns Retorna 'safe' se a imagem for permitida ou o motivo do bloqueio.
   */
  async analyzeImage(base64Data: string, mimeType: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: `Analise esta imagem estritamente em busca de:
              1. Nudez ou conteúdo sexualmente explícito.
              2. Violência gráfica ou gore.
              3. Racismo, discursos de ódio ou símbolos de ódio (como suásticas/símbolos nazistas).
              
              Responda APENAS "safe" se a imagem NÃO contiver nada disso.
              Se contiver algum desses itens, responda APENAS "blocked" seguido do motivo em uma palavra (ex: "blocked nudity", "blocked violence", "blocked hate").`,
            },
          ],
        },
      });

      const decision = response.text.trim().toLowerCase();
      return decision;
    } catch (error) {
      console.error("Erro na moderação Vision:", error);
      return 'safe'; // Em caso de erro técnico, permitimos (ou podemos bloquear por segurança)
    }
  }
}

export const gemini = new GeminiService();
