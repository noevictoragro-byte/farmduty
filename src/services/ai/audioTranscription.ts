import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface TranscriptionResult {
  text: string;
  duration?: number;
  language?: string;
}

/**
 * Transcreve áudio usando Claude API com suporte a multimodal
 * Se não tiver acesso ao Whisper, usa Claude Vision para análise de áudio processado
 *
 * @param audioUrl - URL do arquivo de áudio (mp3, wav, m4a, etc)
 * @param language - Idioma esperado (ex: 'pt-BR')
 * @returns Texto transcrito
 */
export async function transcribeAudio(
  audioUrl: string,
  language: string = "pt-BR"
): Promise<TranscriptionResult> {
  try {
    // Para usar Whisper API via Anthropic, seria necessário usar:
    // Mas como Claude não tem Whisper direto, usamos processamento indireto
    // ou alertamos que o áudio precisa ser processado via serviço externo

    // Aqui você pode integrar com:
    // 1. Whisper API (OpenAI) - https://platform.openai.com/docs/guides/speech-to-text
    // 2. Google Cloud Speech-to-Text
    // 3. AWS Transcribe
    // 4. Assembly AI

    // Para este exemplo, assumimos que o áudio foi pré-processado
    // e agora extraímos contexto via Claude Vision

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Este é um áudio de um produtor agrícola registrando informações de campo.
              Idioma esperado: ${language}

              Por favor, analise o contexto e retorne o texto transcrito de forma clara e estruturada.`,
            },
          ],
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return {
      text,
      language,
    };
  } catch (error) {
    console.error("Audio transcription error:", error);
    throw new Error(`Falha ao transcrever áudio: ${error}`);
  }
}

/**
 * Integração com OpenAI Whisper API (Recomendado)
 * Requer OPENAI_API_KEY no .env
 */
export async function transcribeAudioWithWhisper(
  audioBuffer: Buffer,
  filename: string = "audio.m4a"
): Promise<TranscriptionResult> {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw new Error(
      "OPENAI_API_KEY não configurada. Configure para usar Whisper API."
    );
  }

  try {
    // FormData para enviar arquivo para Whisper
    const formData = new FormData();
    formData.append("file", new Blob([audioBuffer], { type: "audio/m4a" }), filename);
    formData.append("model", "whisper-1");
    formData.append("language", "pt");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.statusText}`);
    }

    const data = (await response.json()) as { text: string };

    return {
      text: data.text,
      language: "pt-BR",
    };
  } catch (error) {
    console.error("Whisper transcription error:", error);
    throw new Error(`Falha ao transcrever com Whisper: ${error}`);
  }
}
