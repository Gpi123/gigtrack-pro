
import { GoogleGenAI, Type } from "@google/genai";
import { Gig, GigStatus } from "../types";

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMusicianInsights = async (gigs: Gig[]): Promise<string> => {
  const ai = getAIInstance();
  
  const gigDataSummary = gigs.map(g => 
    `- ${g.date}: ${g.title} (${g.band_name || 'Freelance'}) - R$ ${g.value} (${g.status})`
  ).join('\n');

  const prompt = `
    Sou um músico e esta é minha agenda de compromissos recentes e futuros:
    ${gigDataSummary}

    Com base nesses dados, forneça um breve insight (em português) sobre:
    1. Meu desempenho financeiro (ex: meses mais lucrativos).
    2. Uma dica prática para melhorar minha rotina ou ganhos.
    3. Uma mensagem motivacional curta.
    Seja conciso e use um tom profissional porém amigável.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "Não foi possível gerar insights no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao conectar com o assistente musical.";
  }
};

export interface ExcelMapping {
  titleKey: string;
  dateKey: string;
  valueKey: string;
  locationKey: string;
  bandNameKey: string;
  statusKey?: string;
  dateFormatHint?: string;
}

export const getExcelColumnMapping = async (sampleData: any[]): Promise<ExcelMapping> => {
  const ai = getAIInstance();
  const sample = JSON.stringify(sampleData.slice(0, 5));

  const prompt = `
    Analise esta amostra de dados de uma planilha de músicos:
    ${sample}

    Identifique quais chaves do JSON correspondem aos campos abaixo. 
    Retorne APENAS um objeto JSON com este formato exato:
    {
      "titleKey": "nome da coluna de titulo/evento",
      "dateKey": "nome da coluna de data",
      "valueKey": "nome da coluna de valor/cachê",
      "locationKey": "nome da coluna de local",
      "bandNameKey": "nome da coluna de banda/projeto",
      "statusKey": "coluna de status se existir",
      "dateFormatHint": "ex: DD/MM/YYYY ou YYYY-MM-DD"
    }

    Se não encontrar uma coluna para algum campo, use string vazia.
    Retorne APENAS o JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Mapping Error:", error);
    throw new Error("Erro ao mapear colunas da planilha.");
  }
};
