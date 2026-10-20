// ─── CLAUDE API YARDIMCILARI ─────────────────────────────────────────────────
// Anahtar yalnızca ANTHROPIC_API_KEY ortam değişkeninden okunur (Vercel proje ayarları / yerel .env).
// Anahtar yoksa çağıran taraf kendi yedeğine (dahili tablo / hazır metin) düşer.
import Anthropic from "@anthropic-ai/sdk";

export const CLAUDE_MODEL = "claude-opus-5-5";

/** Güvenlik sınıflandırıcısı reddederse istek aynı çağrı içinde uygun modele yönlendirilir */
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

export function getClaude(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  return apiKey ? new Anthropic({ apiKey }) : null;
}

/** Ham API hatasını danışmanın anlayacağı kısa Türkçe mesaja çevirir */
export function friendlyClaudeError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "API anahtarı geçersiz (ANTHROPIC_API_KEY)";
  if (err instanceof Anthropic.PermissionDeniedError) return "API anahtarının bu işlem için yetkisi yok";
  if (err instanceof Anthropic.RateLimitError) return "Çok fazla istek; biraz sonra tekrar deneyin";
  if (err instanceof Anthropic.APIConnectionError) return "Claude API'ye bağlanılamadı";
  if (err instanceof Anthropic.APIError) return `Claude API hatası (${err.status ?? "bilinmiyor"})`;
  return err instanceof Error ? err.message : "bilinmeyen hata";
}

type CreateParams = Omit<Anthropic.Beta.MessageCreateParamsNonStreaming, "model" | "betas" | "fallbacks">;

/**
 * Tek bir Messages çağrısı. Sunucu araçları (web arama) uzun sürerse API `pause_turn` döner;
 * yanıtı geçmişe ekleyip kaldığı yerden devam ettirir.
 */
export async function createMessage(client: Anthropic, params: CreateParams, maxContinuations = 3): Promise<Anthropic.Beta.BetaMessage> {
  const messages = [...params.messages];
  let response = await client.beta.messages.create({
    ...params, messages, model: CLAUDE_MODEL, betas: [FALLBACK_BETA], fallbacks: "default",
  });
  for (let i = 0; i < maxContinuations && response.stop_reason === "pause_turn"; i++) {
    messages.push({ role: "assistant", content: response.content });
    response = await client.beta.messages.create({
      ...params, messages, model: CLAUDE_MODEL, betas: [FALLBACK_BETA], fallbacks: "default",
    });
  }
  if (response.stop_reason === "refusal") {
    throw new Error("Yanıt güvenlik filtresince reddedildi");
  }
  return response;
}

/** Yanıttaki tüm metin bloklarını birleştirir */
export function textOf(response: Anthropic.Beta.BetaMessage): string {
  return response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map(b => b.text)
    .join("\n")
    .trim();
}
