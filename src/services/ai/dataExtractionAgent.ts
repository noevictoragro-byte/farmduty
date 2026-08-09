import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ExtractedTransactionData {
  item: string; // Produto/Serviço
  quantity: number;
  unit: string; // kg, L, unidade, hora, etc
  unitPrice: number;
  totalPrice: number;
  supplier?: string; // Fornecedor ou comprador
  category: string; // Classificação automática
  wallet: "FARM" | "PERSONAL"; // Carteira
  transactionType: "INCOME" | "EXPENSE"; // Tipo
  issueDate: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  paymentStatus: "PENDING" | "PAID"; // Status de pagamento
  confidenceScore: number; // 0.0 a 1.0
  extractionNotes: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Agente de extração de dados financeiros
 * Processa informações de áudio transcrito, texto ou imagem
 * Classifica automaticamente em Carteira Fazenda/Pessoal
 */
export class DataExtractionAgent {
  private conversationHistory: ChatMessage[] = [];
  private systemPrompt: string;

  constructor() {
    this.systemPrompt = `Você é um assistente especializado em gestão agrícola e financeira para produtores rurais.

Sua função é extrair informações de transações financeiras a partir de áudios, fotos ou textos fornecidos pelo produtor.

REGRAS DE CLASSIFICAÇÃO:

1. CARTEIRA FAZENDA (Custos operacionais):
   - Insumos: sementes, fertilizantes, pesticidas, defensivos
   - Combustível: diesel, gasolina, óleo
   - Manutenção de máquinas e equipamentos
   - Aluguel de maquinário
   - Mão de obra: diárias, salários de colaboradores
   - Fretes de colheita
   - Consultorias agrícolas

2. CARTEIRA PESSOAL (Produtor e família):
   - Pró-labore/Retiradas do produtor
   - Alimentação familiar
   - Saúde e medicamentos
   - Educação
   - Contas de casa (água, luz, internet)
   - Impostos pessoais

AO PROCESSAR:
1. Extraia: item, quantidade, unidade, preço unitário, total
2. Classifique automaticamente a CARTEIRA
3. Determine se é RECEITA ou DESPESA
4. Atribua a CATEGORIA específica
5. Extraia datas quando disponíveis
6. Gere um CONFIDENCE_SCORE (0.0 a 1.0) de confiança na extração

RESPONDA SEMPRE EM JSON ESTRUTURADO.
Se faltarem informações críticas, pergunte ao usuário antes de finalizar.`;
  }

  /**
   * Inicia conversa e extrai dados
   */
  async extractTransaction(
    userInput: string
  ): Promise<ExtractedTransactionData> {
    this.conversationHistory.push({
      role: "user",
      content: userInput,
    });

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      system: this.systemPrompt,
      messages: this.conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    this.conversationHistory.push({
      role: "assistant",
      content: assistantMessage,
    });

    // Parse JSON response
    const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
    const extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      item: extracted.item || "",
      quantity: extracted.quantity || 1,
      unit: extracted.unit || "unidade",
      unitPrice: extracted.unitPrice || 0,
      totalPrice: extracted.totalPrice || 0,
      supplier: extracted.supplier,
      category: extracted.category || "OTHER",
      wallet: extracted.wallet || "FARM",
      transactionType: extracted.transactionType || "EXPENSE",
      issueDate: extracted.issueDate || new Date().toISOString().split("T")[0],
      dueDate: extracted.dueDate,
      paymentStatus: extracted.paymentStatus || "PENDING",
      confidenceScore: extracted.confidenceScore || 0.7,
      extractionNotes: extracted.notes || assistantMessage,
    };
  }

  /**
   * Conversa multi-turno para refinamento de dados
   */
  async askForClarification(question: string): Promise<string> {
    this.conversationHistory.push({
      role: "user",
      content: question,
    });

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: this.systemPrompt,
      messages: this.conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    this.conversationHistory.push({
      role: "assistant",
      content: assistantMessage,
    });

    return assistantMessage;
  }

  /**
   * Sugere categorias para uma descrição
   */
  async suggestCategory(description: string): Promise<string[]> {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `Para esta descrição de transação agrícola: "${description}"

Sugira 3 categorias mais prováveis. Responda como array JSON: ["categoria1", "categoria2", "categoria3"]`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);

    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  }

  /**
   * Valida e corrige dados extraídos
   */
  async validateAndCorrect(data: Partial<ExtractedTransactionData>): Promise<ExtractedTransactionData> {
    const validationPrompt = `Valide e corrija se necessário estes dados de transação agrícola:

${JSON.stringify(data, null, 2)}

Verifique:
1. Valores numéricos fazem sentido?
2. Classificação de carteira está correta?
3. Data está em formato correto?
4. Quantidade e unidade estão coerentes?

Responda com os dados corrigidos em JSON.`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: validationPrompt,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const validated = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      item: validated.item || data.item || "",
      quantity: validated.quantity || data.quantity || 1,
      unit: validated.unit || data.unit || "unidade",
      unitPrice: validated.unitPrice || data.unitPrice || 0,
      totalPrice: validated.totalPrice || data.totalPrice || 0,
      supplier: validated.supplier || data.supplier,
      category: validated.category || data.category || "OTHER",
      wallet: validated.wallet || data.wallet || "FARM",
      transactionType: validated.transactionType || data.transactionType || "EXPENSE",
      issueDate: validated.issueDate || data.issueDate || new Date().toISOString().split("T")[0],
      dueDate: validated.dueDate || data.dueDate,
      paymentStatus: validated.paymentStatus || data.paymentStatus || "PENDING",
      confidenceScore: validated.confidenceScore || data.confidenceScore || 0.7,
      extractionNotes: validated.notes || data.extractionNotes || "",
    };
  }

  /**
   * Limpa histórico de conversa
   */
  resetConversation(): void {
    this.conversationHistory = [];
  }

  /**
   * Retorna histórico de conversa
   */
  getConversationHistory(): ChatMessage[] {
    return this.conversationHistory;
  }
}

// Singleton instance
let agentInstance: DataExtractionAgent | null = null;

export function getDataExtractionAgent(): DataExtractionAgent {
  if (!agentInstance) {
    agentInstance = new DataExtractionAgent();
  }
  return agentInstance;
}
