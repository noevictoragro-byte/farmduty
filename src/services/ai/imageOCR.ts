import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface OCRResult {
  text: string;
  items: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    totalPrice?: number;
  }>;
  supplier?: string;
  issueDate?: string;
  dueDate?: string;
  documentType: "invoice" | "quote" | "receipt" | "label" | "unknown";
}

/**
 * Extrai texto de imagens usando Claude Vision
 * Ideal para notas fiscais, boletos, rótulos de insumos, etc.
 *
 * @param imageUrl - URL da imagem
 * @param documentType - Tipo de documento esperado
 * @returns Dados extraídos estruturados
 */
export async function extractFromImage(
  imageUrl: string,
  documentType: "invoice" | "quote" | "receipt" | "label" | "auto" = "auto"
): Promise<OCRResult> {
  try {
    const prompt =
      documentType === "auto"
        ? `Analise esta imagem de um documento agrícola.
           Pode ser: nota fiscal, boleto, recibo, rótulo de insumo, ou outro documento comercial.

           Extraia:
           1. Tipo de documento
           2. Texto completo
           3. Itens/produtos com quantidade, unidade e preços
           4. Fornecedor/Vendedor
           5. Data de emissão
           6. Data de vencimento (se houver)

           Responda em JSON estruturado.`
        : `Analise esta imagem que é um documento do tipo "${documentType}".

           Extraia:
           1. Texto completo do documento
           2. Itens/produtos com quantidade, unidade e preços (se aplicável)
           3. Fornecedor/Vendedor/Emissor
           4. Data de emissão
           5. Data de vencimento (se houver)

           Responda em JSON estruturado.`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "url",
                url: imageUrl,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsedData = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : parseManualResponse(responseText);

    return {
      text: responseText,
      items: parsedData.items || [],
      supplier: parsedData.supplier || parsedData.fornecedor,
      issueDate: parsedData.issueDate || parsedData.dataEmissao,
      dueDate: parsedData.dueDate || parsedData.dataVencimento,
      documentType:
        (parsedData.documentType as OCRResult["documentType"]) || "unknown",
    };
  } catch (error) {
    console.error("Image OCR error:", error);
    throw new Error(`Falha ao extrair dados da imagem: ${error}`);
  }
}

/**
 * Extrai dados estruturados de rótulo de insumo
 * Especializado em embalagens de fertilizantes, pesticidas, sementes
 */
export async function extractFromInsumoLabel(
  imageUrl: string
): Promise<{
  productName: string;
  manufacturer: string;
  activeIngredient: string;
  dosage: string;
  volume: string;
  registrationNumber: string;
  recommendations: string[];
}> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "url",
                url: imageUrl,
              },
            },
            {
              type: "text",
              text: `Analise o rótulo deste insumo agrícola (fertilizante, pesticida, semente, etc).

              Extraia:
              1. Nome do produto
              2. Fabricante
              3. Princípio ativo
              4. Dosagem recomendada
              5. Volume/Quantidade na embalagem
              6. Número de registro (MAPA/INMETRO)
              7. Recomendações de aplicação

              Responda em JSON estruturado com campos: productName, manufacturer, activeIngredient, dosage, volume, registrationNumber, recommendations (array).`,
            },
          ],
        },
      ],
    });

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      productName: parsed.productName || "",
      manufacturer: parsed.manufacturer || "",
      activeIngredient: parsed.activeIngredient || "",
      dosage: parsed.dosage || "",
      volume: parsed.volume || "",
      registrationNumber: parsed.registrationNumber || "",
      recommendations: parsed.recommendations || [],
    };
  } catch (error) {
    console.error("Insumo label extraction error:", error);
    throw new Error(`Falha ao extrair dados do rótulo: ${error}`);
  }
}

function parseManualResponse(text: string) {
  // Fallback parser if JSON extraction fails
  return {
    documentType: "unknown",
    items: [],
    supplier: null,
    issueDate: null,
    dueDate: null,
  };
}
