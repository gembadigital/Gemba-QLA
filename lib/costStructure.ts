// ─── SEKTÖR MALİYET YAPISI ÖNERİSİ (web araştırmalı) ─────────────────────────
// Gemini + Google Search ile, verilen sektör/ürün grubu için ciroya oranla tipik
// maliyet kırılımını araştırır. Sonuç bir ÖNERİDİR: danışman onaylamadan uygulanmaz.
import type { Express } from "express";
import { GoogleGenAI } from "@google/genai";

export interface CostRange { min: number; max: number; ort: number }
export interface CostSuggestion {
  sektor: string;
  malzeme: CostRange;
  iscilik: CostRange;
  enerji: CostRange;
  bakim: CostRange;
  genel: CostRange;
  kar: CostRange;
  aciklama: string;
  kaynaklar: { title: string; url: string }[];
}

const KEYS = ["malzeme", "iscilik", "enerji", "bakim", "genel", "kar"] as const;

const researchPrompt = (sector: string, product: string) =>
  `Türkiye'de "${sector}" sektöründe${product ? ` "${product}" üreten` : ""} imalat firmalarının maliyet yapısını web'de araştır: hammadde/malzeme, direkt işçilik, enerji, bakım, genel üretim giderleri ve faaliyet kârının ciroya oranı (%). Sektör raporları, PAGEV/TAYSAD/İSO gibi dernek verileri, KAP'taki şirket mali tabloları kullan. Bulduğun oranları kaynaklarıyla birlikte kısa maddeler halinde özetle.`;

const buildPrompt = (sector: string, product: string) => `Türkiye'de "${sector}" sektöründe${product ? ` "${product}" ürün grubu üreten` : ""} imalat firmalarının tipik maliyet yapısını, CİROYA ORAN (%) olarak araştır.
Önce Google Search ile en az 3 farklı güncel kaynak ara; kaynak olarak sektör raporları, TÜİK / Sanayi Bakanlığı verileri, sektör dernekleri, halka açık şirketlerin (KAP) mali tabloları ve akademik çalışmaları kullan.

Kalemler (toplamları yaklaşık %100 olmalı):
- malzeme: direkt hammadde + yardımcı malzeme
- iscilik: direkt işçilik
- enerji: elektrik, doğalgaz, yakıt
- bakim: bakım-onarım
- genel: diğer genel üretim giderleri (amortisman, kira, endirekt)
- kar: faaliyet kârı

Her kalem için min, max ve ort (önerilen ortalama) ver. Yalnızca aşağıdaki JSON'u döndür, başka metin ekleme:
\`\`\`json
{"sektor":"...","malzeme":{"min":0,"max":0,"ort":0},"iscilik":{"min":0,"max":0,"ort":0},"enerji":{"min":0,"max":0,"ort":0},"bakim":{"min":0,"max":0,"ort":0},"genel":{"min":0,"max":0,"ort":0},"kar":{"min":0,"max":0,"ort":0},"aciklama":"1-2 cümle: hangi kaynaklara dayandığı ve sektöre özgü notlar"}
\`\`\``;

/** Model yanıtından JSON'u çıkarır, sayıları doğrular ve ortalamaları %100'e normalize eder */
export function parseSuggestion(text: string): Omit<CostSuggestion, "kaynaklar"> {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  const obj = JSON.parse(raw);
  const out: any = { sektor: String(obj.sektor || ""), aciklama: String(obj.aciklama || "") };
  for (const k of KEYS) {
    const v = obj[k] || {};
    const ort = Number(v.ort);
    if (!Number.isFinite(ort) || ort < 0 || ort > 100) throw new Error(`Geçersiz oran: ${k}`);
    out[k] = { min: Number(v.min) || ort, max: Number(v.max) || ort, ort };
  }
  const sum = KEYS.reduce((s, k) => s + out[k].ort, 0);
  if (sum < 50 || sum > 150) throw new Error(`Oran toplamı mantıksız: %${sum}`);
  if (Math.abs(sum - 100) > 0.5) {
    for (const k of KEYS) out[k].ort = Math.round(out[k].ort / sum * 1000) / 10;
  }
  return out;
}

export function registerCostStructureRoute(app: Express, getApiKey: () => string | undefined) {
  app.post("/api/cost-structure", async (req, res) => {
    const sector = String(req.body?.sector || "").trim();
    const product = String(req.body?.product || "").trim();
    if (!sector) return res.status(400).json({ error: "Sektör gerekli." });

    const apiKey = getApiKey();
    if (!apiKey) return res.status(503).json({ error: "GEMINI_API_KEY tanımlı değil." });

    const ai = new GoogleGenAI({ apiKey });
    const models = ["gemini-3.8-flash", "gemini-flash-latest"];
    let lastErr: any;
    for (const model of models) {
      try {
        // 1) Web araştırması (Google Search grounding) → kaynaklı özet
        const research = await ai.models.generateContent({
          model,
          contents: researchPrompt(sector, product),
          config: { tools: [{ googleSearch: {} }] },
        });
        // 2) Özeti yapılandırılmış orana çevir (araç yok, deterministik)
        const response = await ai.models.generateContent({
          model,
          contents: `Aşağıdaki araştırma özetine dayanarak:\n\n${research.text || ""}\n\n${buildPrompt(sector, product)}`,
          config: { temperature: 0.1 },
        });
        const parsed = parseSuggestion(response.text || "");
        const chunks: any[] = (research as any).candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const kaynaklar = chunks
          .map(c => c.web)
          .filter((w: any) => w?.uri)
          .filter((w: any, i: number, arr: any[]) => arr.findIndex(x => x.title === w.title) === i)
          .slice(0, 6)
          .map((w: any) => ({ title: String(w.title || w.uri), url: String(w.uri) }));
        const result: CostSuggestion = { ...parsed, kaynaklar };
        return res.json(result);
      } catch (err: any) {
        lastErr = err;
        console.warn(`[cost-structure] ${model} başarısız:`, err?.message || err);
      }
    }
    return res.status(502).json({ error: `Web araştırması başarısız: ${lastErr?.message || "bilinmeyen hata"}` });
  });
}
