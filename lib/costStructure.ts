// ─── SEKTÖR MALİYET YAPISI ÖNERİSİ (web araştırmalı) ─────────────────────────
// Claude + web arama aracı ile, verilen sektör/ürün grubu için ciroya oranla tipik
// maliyet kırılımını araştırır. Sonuç bir ÖNERİDİR: danışman onaylamadan uygulanmaz.
import type { Express } from "express";
import type Anthropic from "@anthropic-ai/sdk";
import { getClaude, createMessage, textOf, friendlyClaudeError } from "./claude.js";

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

const buildPrompt = (sector: string, product: string) => `Türkiye'de "${sector}" sektöründe${product ? ` "${product}" ürün grubu üreten` : ""} imalat firmalarının tipik maliyet yapısını, CİROYA ORAN (%) olarak araştır.
Önce web araması yaparak en az 3 farklı güncel kaynak bul; kaynak olarak sektör raporları, TÜİK / Sanayi Bakanlığı verileri, sektör dernekleri, halka açık şirketlerin (KAP) mali tabloları ve akademik çalışmaları kullan.

Kalemler (toplamları yaklaşık %100 olmalı):
- malzeme: direkt hammadde + yardımcı malzeme
- iscilik: direkt işçilik
- enerji: elektrik, doğalgaz, yakıt
- bakim: bakım-onarım
- genel: diğer genel üretim giderleri (amortisman, kira, endirekt)
- kar: faaliyet kârı

Her kalem için min, max ve ort (önerilen ortalama) ver. Araştırmayı bitirdikten sonra yanıtının sonunda yalnızca aşağıdaki JSON'u ver:
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

/** Web arama sonuç bloklarından kaynak listesini çıkarır (tekilleştirilmiş) */
export function sourcesOf(content: Anthropic.Beta.BetaContentBlock[]): { title: string; url: string }[] {
  const out: { title: string; url: string }[] = [];
  for (const block of content) {
    if (block.type !== "web_search_tool_result" || !Array.isArray(block.content)) continue;
    for (const r of block.content) {
      if (r.type === "web_search_result" && !out.some(o => o.url === r.url)) out.push({ title: r.title || r.url, url: r.url });
    }
  }
  return out.slice(0, 6);
}

export function registerCostStructureRoute(app: Express) {
  app.post("/api/cost-structure", async (req, res) => {
    const sector = String(req.body?.sector || "").trim();
    const product = String(req.body?.product || "").trim();
    if (!sector) return res.status(400).json({ error: "Sektör gerekli." });

    const client = getClaude();
    if (!client) return res.status(503).json({ error: "Claude API anahtarı henüz eklenmedi" });

    try {
      const response = await createMessage(client, {
        max_tokens: 16000,
        // Basit araştırma + çıkarım: düşük effort sunucusuz fonksiyon süresine sığar
        output_config: { effort: "low" },
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
        messages: [{ role: "user", content: buildPrompt(sector, product) }],
      });
      const parsed = parseSuggestion(textOf(response));
      const result: CostSuggestion = { ...parsed, kaynaklar: sourcesOf(response.content) };
      return res.json(result);
    } catch (err) {
      console.warn("[cost-structure] başarısız:", err);
      return res.status(502).json({ error: friendlyClaudeError(err) });
    }
  });
}
