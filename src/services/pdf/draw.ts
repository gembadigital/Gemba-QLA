// Gemba Tools yönetici raporu tasarım dilinin jsPDF karşılığı: A4 yatay (297 × 210 mm),
// sayfa başlığı + tek cümlelik ana mesaj + kartlar + ince çizgili tablolar + vektörel grafikler.
import { jsPDF } from 'jspdf';
import { COLOR, REPORT } from './reportConfig';

export const PAGE = { w: 297, h: 210, mx: 14, top: 12, contentTop: 42, contentBottom: 192, footerLine: 196 };
export const CW = PAGE.w - 2 * PAGE.mx;

export interface Ctx {
  doc: jsPDF;
  font: string;
  logo: string | null;
}

// ---------- metin ----------

export function setText(c: Ctx, size: number, color: string = COLOR.ink, bold = false) {
  c.doc.setFont(c.font, bold ? 'bold' : 'normal');
  c.doc.setFontSize(size);
  c.doc.setTextColor(color);
}

/** Küçük, harf aralıklı, büyük harfli etiket (".label") */
export function label(c: Ctx, text: string, x: number, y: number, color: string = COLOR.muted, align: 'left' | 'right' | 'center' = 'left') {
  setText(c, 6.6, color, true);
  c.doc.setCharSpace(0.35);
  c.doc.text(text.toLocaleUpperCase('tr-TR'), x, y, { align });
  c.doc.setCharSpace(0);
}

/** Satırlara bölünmüş paragraf; bittiği y'yi döner */
export function para(c: Ctx, text: string, x: number, y: number, w: number, size = 8.6, color: string = COLOR.ink, lineH = 1.42, bold = false): number {
  setText(c, size, color, bold);
  const lines = c.doc.splitTextToSize(text, w) as string[];
  const step = size * 0.3528 * lineH;
  lines.forEach((ln, i) => c.doc.text(ln, x, y + i * step));
  return y + lines.length * step;
}

export interface Seg { t: string; red?: boolean; bold?: boolean }

/** Ana mesaj başlığı: kelime kelime sarılır, vurgulu bölümler kırmızı */
export function headline(c: Ctx, segs: Seg[], y = 29, size = 14.5, w = 245): number {
  const doc = c.doc;
  const words: { t: string; red: boolean; bold: boolean }[] = [];
  segs.forEach(s => s.t.split(/(\s+)/).filter(Boolean).forEach(t => words.push({ t, red: !!s.red, bold: s.bold !== false })));
  const lh = size * 0.3528 * 1.28;
  let x = PAGE.mx, line = 0;
  for (const wd of words) {
    doc.setFont(c.font, 'bold');
    doc.setFontSize(size);
    const ww = doc.getTextWidth(wd.t);
    if (/^\s+$/.test(wd.t)) { if (x > PAGE.mx) x += ww; continue; }
    if (x + ww > PAGE.mx + w && x > PAGE.mx) { line++; x = PAGE.mx; }
    doc.setTextColor(wd.red ? COLOR.red : COLOR.ink);
    doc.text(wd.t, x, y + line * lh);
    x += ww;
  }
  return y + (line + 1) * lh;
}

// ---------- kutular ----------

export function card(c: Ctx, x: number, y: number, w: number, h: number, fill: string = COLOR.soft) {
  c.doc.setFillColor(fill);
  c.doc.roundedRect(x, y, w, h, 2.2, 2.2, 'F');
}

export function pill(c: Ctx, text: string, x: number, y: number, color: string, filled = false): number {
  setText(c, 6.3, filled ? COLOR.white : color, true);
  const w = c.doc.getTextWidth(text) + 4;
  c.doc.setDrawColor(color);
  c.doc.setLineWidth(0.25);
  if (filled) { c.doc.setFillColor(color); c.doc.roundedRect(x, y - 2.9, w, 4, 2, 2, 'F'); }
  else c.doc.roundedRect(x, y - 2.9, w, 4, 2, 2, 'S');
  c.doc.text(text, x + 2, y);
  return w;
}

export function poly(c: Ctx, pts: [number, number][], fill: string) {
  const [x0, y0] = pts[0];
  const segs = pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]]);
  c.doc.setFillColor(fill);
  c.doc.lines(segs as any, x0, y0, [1, 1], 'F', true);
}

export function opacity(c: Ctx, v: number) {
  const GS = (jsPDF as any).GState || (c.doc as any).GState;
  if (GS) c.doc.setGState(new GS({ opacity: v }));
}

// ---------- sayfa çerçevesi ----------

export function logo(c: Ctx, x: number, y: number, h: number) {
  if (!c.logo) {
    setText(c, h * 1.6, COLOR.ink, true);
    c.doc.text('GEMBA PARTNER', x, y + h * 0.8);
    return;
  }
  c.doc.addImage(c.logo, 'PNG', x, y, h * REPORT.logo.ratio, h);
}

/** İç sayfa üst bilgisi: solda logo, sağda bölüm etiketi, altında ince çizgi */
export function pageHeader(c: Ctx, section: string) {
  logo(c, PAGE.mx, 8.5, 7.5);
  label(c, section, PAGE.w - PAGE.mx, 14, COLOR.muted, 'right');
  c.doc.setDrawColor(COLOR.line);
  c.doc.setLineWidth(0.25);
  c.doc.line(PAGE.mx, 19, PAGE.w - PAGE.mx, 19);
}

export function pageFooter(c: Ctx, left: string, n: number) {
  const y = PAGE.footerLine;
  c.doc.setDrawColor(COLOR.line);
  c.doc.setLineWidth(0.25);
  c.doc.line(PAGE.mx, y, PAGE.w - PAGE.mx, y);
  setText(c, 6.6, COLOR.muted);
  c.doc.text(left, PAGE.mx, y + 4.5);
  c.doc.text(REPORT.report.footerConfidential, PAGE.w / 2, y + 4.5, { align: 'center' });
  c.doc.text(String(n), PAGE.w - PAGE.mx, y + 4.5, { align: 'right' });
}

/** Kapak ve arka kapaktaki kırmızı / gri çapraz şekiller (referans kapağın oranlarıyla) */
export function coverShapes(c: Ctx) {
  const s = PAGE.w / 842; // referans kapak pt → mm
  const P = (pts: [number, number][]) => pts.map(([x, y]) => [x * s, y * s] as [number, number]);
  poly(c, P([[465, -14], [842, -14], [842, 610], [740, 610]]), COLOR.coverGrey);
  poly(c, P([[630, -14], [740, -14], [842, 182], [842, 245]]), COLOR.red);
  poly(c, P([[811, 245], [842, 245], [842, 308]]), COLOR.red);
  poly(c, P([[551, 426], [669, 426], [763, 610], [646, 610]]), COLOR.red);
  poly(c, P([[481, 426], [551, 426], [567, 457], [496, 457]]), '#E05257');
}

// ---------- tablo ----------

export type Cell = string | { t: string; color?: string; bold?: boolean; pill?: string; filled?: boolean };
export interface Col { h: string; w: number; align?: 'left' | 'right' | 'center' }

/** İnce çizgili tablo; satır yüksekliği metne göre büyür. maxY aşılırsa kalan satırları döner. */
export function table(c: Ctx, cols: Col[], rows: Cell[][], x: number, y: number, opt: { size?: number; maxY?: number; boldLast?: boolean } = {}): { y: number; rest: Cell[][] } {
  const size = opt.size ?? 7.6;
  const maxY = opt.maxY ?? PAGE.contentBottom;
  let cx = x;
  cols.forEach(col => {
    const ax = col.align === 'right' ? cx + col.w - 1.5 : col.align === 'center' ? cx + col.w / 2 : cx + 1.5;
    label(c, col.h, ax, y, COLOR.muted, col.align ?? 'left');
    cx += col.w;
  });
  const total = cols.reduce((s, col) => s + col.w, 0);
  c.doc.setDrawColor(COLOR.ink);
  c.doc.setLineWidth(0.35);
  c.doc.line(x, y + 2, x + total, y + 2);
  let ry = y + 2;
  const lh = size * 0.3528 * 1.3;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const isLast = opt.boldLast && r === rows.length - 1;
    const wrapped = row.map((cell, i) => {
      const t = typeof cell === 'string' ? cell : cell.t;
      setText(c, size, COLOR.ink, isLast || (typeof cell !== 'string' && !!cell.bold));
      return cell && typeof cell !== 'string' && cell.pill ? [t] : (c.doc.splitTextToSize(t, cols[i].w - 3) as string[]);
    });
    const h = Math.max(...wrapped.map(w => w.length)) * lh + 2.6;
    if (ry + h > maxY) return { y: ry, rest: rows.slice(r) };
    if (isLast) { c.doc.setFillColor(COLOR.soft); c.doc.rect(x, ry, total, h, 'F'); }
    cx = x;
    row.forEach((cell, i) => {
      const col = cols[i];
      const obj = typeof cell === 'string' ? { t: cell } : cell;
      const ty = ry + 1.3 + size * 0.3528;
      if (obj.pill) {
        pill(c, obj.t, cx + 1.5, ty, obj.pill, obj.filled);
      } else {
        setText(c, size, obj.color ?? COLOR.ink, isLast || !!obj.bold);
        const ax = col.align === 'right' ? cx + col.w - 1.5 : col.align === 'center' ? cx + col.w / 2 : cx + 1.5;
        wrapped[i].forEach((ln, k) => c.doc.text(ln, ax, ty + k * lh, { align: col.align ?? 'left' }));
      }
      cx += col.w;
    });
    ry += h;
    c.doc.setDrawColor(COLOR.line);
    c.doc.setLineWidth(0.2);
    c.doc.line(x, ry, x + total, ry);
  }
  return { y: ry, rest: [] };
}

// ---------- grafikler ----------

/** Seviye bandı: renkli bölümler, değer işareti ve hedef çizgisi */
export function levelBand(c: Ctx, x: number, y: number, w: number, levels: { name: string; min: number; max: number; color: string }[], max: number, value: number, target?: number) {
  const bh = 3.6;
  levels.forEach(lv => {
    const x0 = x + (lv.min / max) * w, x1 = x + (Math.min(max, lv.max + (lv.max < max ? 1 : 0)) / max) * w;
    const on = value >= lv.min && value <= lv.max;
    opacity(c, on ? 1 : 0.28);
    c.doc.setFillColor(lv.color);
    c.doc.rect(x0 + 0.3, y, x1 - x0 - 0.6, bh, 'F');
    opacity(c, 1);
    setText(c, 6, COLOR.muted);
    c.doc.text(lv.name, (x0 + x1) / 2, y + bh + 3.6, { align: 'center' });
  });
  const xv = x + (Math.max(0, Math.min(max, value)) / max) * w;
  c.doc.setFillColor(COLOR.ink);
  c.doc.triangle(xv - 1.6, y - 3.4, xv + 1.6, y - 3.4, xv, y - 0.8, 'F');
  setText(c, 6.4, COLOR.ink, true);
  c.doc.text(String(value), xv + 2.2, y - 1.4);
  if (target !== undefined) {
    const xt = x + (target / max) * w;
    c.doc.setDrawColor(COLOR.ink);
    c.doc.setLineWidth(0.3);
    c.doc.setLineDashPattern([0.8, 0.6], 0);
    c.doc.line(xt, y - 2, xt, y + bh + 1);
    c.doc.setLineDashPattern([], 0);
    setText(c, 6, COLOR.ink);
    c.doc.text(`Hedef ${target}`, xt + 1, y - 2.4);
  }
}

/** Radar: gerçekleşen (kırmızı), hedef (kesikli), ızgara halkaları */
export function radar(c: Ctx, cx: number, cy: number, r: number, labels: string[], values: number[], max: number, target?: number) {
  const n = labels.length;
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i: number, v: number): [number, number] => [cx + Math.cos(ang(i)) * r * (v / max), cy + Math.sin(ang(i)) * r * (v / max)];
  const ring = (v: number) => Array.from({ length: n }, (_, i) => pt(i, v));
  const outline = (pts: [number, number][], color: string, w: number, dash = false) => {
    c.doc.setDrawColor(color);
    c.doc.setLineWidth(w);
    if (dash) c.doc.setLineDashPattern([1, 0.8], 0);
    pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; c.doc.line(p[0], p[1], q[0], q[1]); });
    c.doc.setLineDashPattern([], 0);
  };
  for (let k = 1; k <= max; k++) {
    outline(ring(k), COLOR.line, 0.2);
    setText(c, 5.5, COLOR.muted);
    c.doc.text(String(k), cx + 0.8, cy - (r * k) / max + 2);
  }
  for (let i = 0; i < n; i++) {
    const [ex, ey] = pt(i, max);
    c.doc.setDrawColor(COLOR.line); c.doc.setLineWidth(0.2); c.doc.line(cx, cy, ex, ey);
    const [lx, ly] = pt(i, max * 1.17);
    setText(c, 6.6, COLOR.ink, true);
    const align = Math.abs(lx - cx) < 3 ? 'center' : lx > cx ? 'left' : 'right';
    (c.doc.splitTextToSize(labels[i], 26) as string[]).forEach((ln, k) => c.doc.text(ln, lx, ly + k * 2.8, { align }));
  }
  const pts = values.map((v, i) => pt(i, Math.max(0, v)));
  opacity(c, 0.22);
  poly(c, pts, COLOR.red);
  opacity(c, 1);
  outline(pts, COLOR.red, 0.6);
  pts.forEach(p => { c.doc.setFillColor(COLOR.red); c.doc.circle(p[0], p[1], 0.7, 'F'); });
  if (target !== undefined) outline(ring(target), COLOR.ink, 0.35, true);
}

/** Yatay çubuk listesi (en büyük değer = tam genişlik) */
export function hbars(c: Ctx, x: number, y: number, w: number, items: { label: string; value: number; text: string; color?: string }[], rowH = 7.2) {
  const max = Math.max(...items.map(i => i.value), 1);
  const labelW = w * 0.3, barW = w * 0.4;
  items.forEach((it, k) => {
    const yy = y + k * rowH;
    setText(c, 7.6, COLOR.ink);
    c.doc.text(it.label, x, yy + 3);
    c.doc.setFillColor(COLOR.line);
    c.doc.rect(x + labelW, yy, barW, 3.6, 'F');
    c.doc.setFillColor(it.color ?? COLOR.red);
    c.doc.rect(x + labelW, yy, Math.max(0.6, (it.value / max) * barW), 3.6, 'F');
    setText(c, 7.6, COLOR.ink, true);
    c.doc.text(it.text, x + w, yy + 3, { align: 'right' });
  });
  return y + items.length * rowH;
}

// ---------- sayı biçimi ----------

/** Para birimi son eki: TRY → TL, EUR → €, USD → $ (₺ simgesi gömülü yazı tipinde olmayabilir) */
export const unitOf = (currency: string) => (currency === 'EUR' ? '€' : currency === 'USD' ? '$' : 'TL');
export const money = (n: number, unit = 'TL') => `${Math.round(n).toLocaleString('tr-TR')} ${unit}`;
/** Kısa tutar: 31,3 Mn TL / 1,2 Mr TL */
export const moneyShort = (n: number, unit = 'TL') => {
  const a = Math.abs(n);
  const f = (v: number, d: number) => v.toLocaleString('tr-TR', { maximumFractionDigits: d });
  if (a >= 1e9) return `${f(n / 1e9, 1)} Mr ${unit}`;
  if (a >= 1e6) return `${f(n / 1e6, 1)} Mn ${unit}`;
  if (a >= 1e3) return `${f(n / 1e3, 0)} bin ${unit}`;
  return `${Math.round(n)} ${unit}`;
};
export const pct = (n: number, d = 1) => `%${n.toLocaleString('tr-TR', { maximumFractionDigits: d })}`;
