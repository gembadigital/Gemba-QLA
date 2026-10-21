// Rapor sayfaları — içerik ve sıra eski raporla aynı (11 sayfa), tasarım dili Gemba Tools
// yönetici raporunun dili: A4 yatay, tek cümlelik ana mesaj, kartlar, ince tablolar, vektörel grafik.
import { ReportData } from './types';
import { COLOR, REPORT, MATURITY_LEVELS, MATURITY_MAX, levelOf, ACTION_BY_LOSS } from './reportConfig';
import {
  Ctx, PAGE, CW, setText, label, para, headline, card, pill, pageHeader, coverShapes, logo, table,
  levelBand, radar, hbars, money, moneyShort, unitOf, Seg, Cell,
} from './draw';
import { CRITERIA } from '../../data/criteria';
import { splitGain } from '../../engine/qla';

const num = (v: any) => Number(String(v ?? '').replace(/\./g, '').replace(',', '.')) || 0;
const has = (v: any) => num(v) > 0;
/** Girilen ham değeri Türkçe ondalıkla yazar (7.5 → 7,5) */
const tr = (v: any) => String(v ?? '').replace(/^(\d+)\.(\d+)$/, '$1,$2');
const fmtNum = (n: number, d = 1) => n.toLocaleString('tr-TR', { maximumFractionDigits: d });
/** Sayıya Türkçe iyelik eki: "%7,5" → "%7,5'i", "%11,2" → "%11,2'si", "%10" → "%10'u" (okunuşun son kelimesine göre) */
const DIGIT_SUFFIX = ['ı', 'i', 'si', 'ü', 'ü', 'i', 'sı', 'si', 'i', 'u'];
const TENS_SUFFIX: Record<string, string> = { '1': 'u', '2': 'si', '3': 'u', '4': 'ı', '5': 'si', '6': 'ı', '7': 'i', '8': 'i', '9': 'ı' };
const iyelik = (num: string, ek: 'i' | 'ini' = 'i') => {
  const digits = num.replace(/[^\d,]/g, '');
  const [int, dec] = digits.split(',');
  let base: string;
  if (dec) base = DIGIT_SUFFIX[Number(dec.slice(-1))];
  else if (/000$/.test(int)) base = 'i';
  else if (/00$/.test(int)) base = 'ü';
  else if (/0$/.test(int) && int.length > 1) base = TENS_SUFFIX[int.slice(-2, -1)] ?? 'ı';
  else base = DIGIT_SUFFIX[Number(int.slice(-1))];
  if (ek === 'ini') base = base + 'n' + base.slice(-1);
  return `${num}'${base}`;
};
const pctOf = (n: number, ek: 'i' | 'ini' = 'i') => iyelik(`%${fmtNum(n)}`, ek);
const fmtDate = (d?: string) => {
  if (!d) return '-';
  const t = new Date(d);
  return isNaN(t.getTime()) ? d : t.toLocaleDateString('tr-TR');
};
const PRIORITY_COLOR: Record<string, string> = { Kritik: COLOR.bad, 'Yüksek': COLOR.amber, Orta: COLOR.good, 'Düşük': COLOR.muted };

/** Sayfa numaraları (içindekiler için) */
export type TocMap = Record<string, number>;

export class SectionRenderer {
  // ---------- 1. KAPAK ----------
  static cover(c: Ctx, d: ReportData, reportNo: string) {
    const doc = c.doc;
    doc.setFillColor(COLOR.white);
    doc.rect(0, 0, PAGE.w, PAGE.h, 'F');
    coverShapes(c);
    logo(c, 18, 18, 13);

    setText(c, 6.8, COLOR.red, true);
    doc.setCharSpace(0.45);
    doc.text(REPORT.report.kicker, 18, 60);
    doc.setCharSpace(0);
    setText(c, 27, COLOR.ink, true);
    REPORT.report.titleLines.forEach((t, i) => doc.text(t, 17, 72 + i * 11));
    setText(c, 11, COLOR.muted);
    doc.text(REPORT.report.subtitle, 18, 72 + REPORT.report.titleLines.length * 11 - 2);

    const firma = d.company.companyName || 'Firma';
    doc.setFillColor(COLOR.red);
    doc.rect(18, 103, 0.9, 14, 'F');
    label(c, 'Hazırlanan kurum', 22.5, 107);
    setText(c, 15, COLOR.ink, true);
    doc.text(firma, 22.5, 114.5, { maxWidth: 135 });

    // Doküman bilgi tablosu
    const x = 18, w = 128, y0 = 130;
    const rows: [string, string, string?, string?][] = [
      ['Rapor no', reportNo, 'Versiyon', REPORT.report.version],
      ['Saha ziyareti', fmtDate(d.company.visitDate), 'Rapor tarihi', new Date().toLocaleDateString('tr-TR')],
      ['Değerlendiren', d.company.consultant || '-'],
      ['Görüşülen', d.operation.gorusulen || '-'],
      ['Sektör', [d.company.sector, d.company.location].filter(Boolean).join(' · ') || '-'],
      ['Gizlilik', REPORT.report.confidentiality.replace('{firma}', firma)],
    ];
    let y = y0;
    rows.forEach(r => {
      const four = r.length === 4;
      const lines = doc.splitTextToSize(r[1], four ? 30 : w - 34) as string[];
      const h = Math.max(6.5, lines.length * 3.4 + 3);
      doc.setDrawColor(COLOR.line); doc.setLineWidth(0.25);
      doc.setFillColor(COLOR.soft);
      doc.rect(x, y, 30, h, 'FD');
      label(c, r[0], x + 2, y + h / 2 + 1);
      doc.rect(x + 30, y, four ? 34 : w - 30, h, 'S');
      setText(c, 7.4, COLOR.ink, r[0] === 'Gizlilik');
      lines.forEach((ln, i) => doc.text(ln, x + 32, y + 4.4 + i * 3.4));
      if (four) {
        doc.setFillColor(COLOR.soft);
        doc.rect(x + 64, y, 30, h, 'FD');
        label(c, r[2]!, x + 66, y + h / 2 + 1);
        doc.rect(x + 94, y, w - 94, h, 'S');
        setText(c, 7.4, COLOR.ink);
        doc.text(r[3]!, x + 96, y + 4.4);
      }
      y += h;
    });

    // Alt koyu şerit
    doc.setFillColor(COLOR.ink);
    doc.rect(5, 182, 256, 8, 'F');
    setText(c, 6.6, COLOR.white, true);
    doc.setCharSpace(0.4);
    doc.text(REPORT.company.legalName, 14, 187.2);
    doc.text(REPORT.company.website, 252, 187.2, { align: 'right' });
    doc.setCharSpace(0);
  }

  // ---------- 2. İÇİNDEKİLER (sayfa numaraları sonda doldurulur) ----------
  static toc(c: Ctx, toc: TocMap) {
    const doc = c.doc;
    pageHeader(c, 'İçindekiler');
    setText(c, 18, COLOR.ink, true);
    doc.text('İçindekiler', PAGE.mx, 32);
    const items: [string, string, string][] = [
      ['exec', 'Yönetici özeti', 'Kayıp havuzu · olgunluk · geri ödeme · öncelikli aksiyonlar'],
      ['case', 'Yönetim için yatırım gerekçesi', 'Kâra etkisi · başa baş · toplantıda savunulacak argümanlar'],
      ['profile', 'Firma profili ve üretim altyapısı', 'Kapasite, ciro ve maliyet yapısı'],
      ['ops', 'Operasyonel veriler', 'KPI gerçekleşenleri ve referans değerler'],
      ['lean', 'Yalın olgunluk değerlendirmesi', '17 kriter · 6 grup · radar'],
      ['obs', 'Saha bulguları', 'Tespitler ve önerilen iyileştirmeler'],
      ['savings', 'Potansiyel kazanımlar', 'Kayıp dağılımı ve geri kazanım matrisi'],
      ['ai', 'Stratejik değerlendirme', 'Riskler, fırsatlar ve yol haritası'],
      ['plan', 'Aksiyon planı', 'Öncelik, sorumlu ve termin'],
      ['end', 'Sonuç ve yatırım dönüşü', 'Kazanım özeti ve onay'],
    ];
    let y = 46;
    items.forEach(([key, title, desc], i) => {
      doc.setFillColor(COLOR.ink);
      doc.circle(PAGE.mx + 3.2, y - 1.2, 3.2, 'F');
      setText(c, 7.6, COLOR.white, true);
      doc.text(String(i + 1), PAGE.mx + 3.2, y + 0.1, { align: 'center' });
      setText(c, 10, COLOR.ink, true);
      doc.text(title, PAGE.mx + 10, y - 0.6);
      setText(c, 7, COLOR.muted);
      doc.text(desc, PAGE.mx + 10, y + 3.4);
      setText(c, 11, COLOR.red, true);
      doc.text(String(toc[key] ?? ''), 200, y + 0.6, { align: 'right' });
      doc.setDrawColor(COLOR.line); doc.setLineWidth(0.2);
      doc.line(PAGE.mx + 10, y + 6, 200, y + 6);
      y += 15;
    });
    card(c, 212, 46, CW - 198, 52);
    label(c, 'Kullanım ve gizlilik', 217, 54);
    para(c, 'Bu rapor firmaya özel olarak hazırlanmıştır. Finansal projeksiyonlar, kayıp verileri ve iyileşme oranları saha tespitlerine ve işletme beyanlarına dayanır; ±%20 tahmin bandı içinde değerlendirilmelidir. Üçüncü kişilerle paylaşılamaz.', 217, 60, CW - 208, 7.6, COLOR.ink);
  }

  // ---------- 3. YÖNETİCİ ÖZETİ ----------
  static executive(c: Ctx, d: ReportData) {
    const doc = c.doc;
    const m = d.metrics;
    const unit = unitOf(m?.currency || 'TRY');
    pageHeader(c, 'Yönetici özeti');
    const q = m?.qla && m.qla.totalLoss > 0 ? m.qla : undefined;
    const rec = q?.selected;
    const score = m?.maturityScore ?? d.assessment.overallScore ?? 0;
    const lvl = levelOf(score);
    if (q && q.totalLoss > 0 && rec) {
      headline(c, [
        { t: 'Yıllık ' }, { t: `${moneyShort(q.totalLoss, unit)} kayıp`, red: true },
        { t: ` — cironun ${pctOf(q.lossPctOfTurnover)}. ${rec.def.name} ile yılda ${moneyShort(rec.gainMin, unit)} – ${moneyShort(rec.gainMax, unit)} geri kazanılabilir.` },
      ]);
    } else headline(c, [{ t: 'Kayıp hesabı için operasyonel veriler henüz tamamlanmadı.' }]);

    const L = PAGE.mx, LW = 150, R = L + LW + 4, RW = CW - LW - 4;
    // Sol üst: kayıp havuzu
    card(c, L, 42, LW, 60);
    label(c, 'Yıllık kayıp havuzu', L + 5, 49);
    setText(c, 30, COLOR.ink, true);
    const big = q ? moneyShort(q.totalLoss, unit) : 'Veri girilmedi';
    doc.text(big, L + 5, 63);
    const bigW = doc.getTextWidth(big);
    setText(c, 10, COLOR.muted);
    if (q) doc.text('/ yıl', L + 7 + bigW, 63);
    if (q) {
      para(c, `Cironun ${pctOf(q.lossPctOfTurnover)} · ±%20 bant ${moneyShort(q.totalLossMin, unit)} – ${moneyShort(q.totalLossMax, unit)}`, L + 5, 70, LW - 10, 8.4, COLOR.ink);
    }
    label(c, `Olgunluk skoru: ${score} / ${MATURITY_MAX} · ${lvl.name}`, L + 5, 81);
    levelBand(c, L + 5, 87, LW - 10, MATURITY_LEVELS, MATURITY_MAX, score);

    // Sağ üst: tek bakışta
    card(c, R, 42, RW, 60);
    label(c, 'Tek bakışta', R + 5, 49);
    const facts: [string, string][] = rec ? [
      [`${rec.def.name}`, `${rec.def.days} adam-gün · bütçe ${moneyShort(rec.budget, unit)}`],
      [`${fmtNum(rec.paybackExpMonths)} ay`, 'beklenen geri ödeme süresi'],
      [`${fmtNum(rec.budget > 0 ? rec.year1Gain / rec.budget : 0)}x`, '1. yıl kazanç / yatırım (ROI)'],
      [`${q!.losses.filter(l => l.hasData).length} / ${q!.losses.length}`, 'kayıp kalemi veriyle hesaplandı'],
    ] : [['Veri girilmedi', 'Ciro, maliyet yapısı ve kayıp oranları girildiğinde hesaplanır']];
    let fy = 57;
    facts.forEach(([b, t], i) => {
      setText(c, 10, COLOR.ink, true); doc.text(b, R + 5, fy);
      setText(c, 7.6, COLOR.muted); doc.text(t, R + 5, fy + 4);
      if (i < facts.length - 1) { doc.setDrawColor(COLOR.line); doc.setLineWidth(0.2); doc.line(R + 5, fy + 6.5, R + RW - 5, fy + 6.5); }
      fy += 11.2;
    });

    // Sol alt: genel değerlendirme
    card(c, L, 106, LW, 84);
    label(c, 'Genel değerlendirme ve ilerleme yolu', L + 5, 113);
    para(c, d.aiAnalysis.generalEvaluation, L + 5, 119, LW - 10, 8.6);

    // Sağ alt: koyu kart — öncelikli aksiyonlar
    card(c, R, 106, RW, 84, COLOR.ink);
    label(c, 'Önerilen ilk 5 öncelikli aksiyon', R + 5, 113, '#AFB7C2');
    const acts = q
      ? [...q.losses].filter(l => l.amount > 0).sort((a, b) => b.amount - a.amount).map(l => ACTION_BY_LOSS[l.key]).filter(Boolean).slice(0, 5)
      : [];
    let ay = 120;
    if (!acts.length) para(c, 'Kayıp verisi girildiğinde aksiyonlar otomatik önceliklendirilir.', R + 5, ay, RW - 10, 8, COLOR.white);
    acts.forEach((a, i) => {
      setText(c, 8.2, COLOR.white, true);
      doc.text(`${i + 1}.`, R + 5, ay);
      const e = para(c, a.act, R + 10, ay, RW - 15, 8.2, COLOR.white, 1.3, true);
      ay = para(c, a.desc, R + 10, e + 0.2, RW - 15, 7.2, '#C9CFD8', 1.3) + 2.6;
    });
  }

  // ---------- 4. YATIRIM GEREKÇESİ (danışmanın toplantıda önce savunacağı sayfa) ----------
  static businessCase(c: Ctx, d: ReportData) {
    const doc = c.doc;
    const m = d.metrics;
    const unit = unitOf(m?.currency || 'TRY');
    pageHeader(c, 'Yatırım gerekçesi');
    const q = m?.qla && m.qla.totalLoss > 0 ? m.qla : undefined;
    if (!q || !m) {
      headline(c, [{ t: 'Yatırım gerekçesi için ciro, maliyet yapısı ve kayıp verileri gereklidir.' }]);
      return;
    }
    const rec = q.selected;
    const g = splitGain(q, rec);
    const turnover = m.turnover > 0 ? m.turnover : 0;
    const margin = m.profitPct && m.profitPct > 0 ? m.profitPct : 0;
    const profit = g.profitImpact.mid;
    // Yeni marj: (bugünkü kâr + kâr etkisi) / (ciro + ek satış cirosu)
    const newMargin = turnover > 0 && margin > 0 ? (turnover * margin / 100 + profit) / (turnover + g.extraRevenue) * 100 : 0;
    const upliftPts = newMargin - margin;
    const months = (gain: number) => (gain > 0 ? rec.budget / gain * 12 : 0);
    const pbProfit = months(profit);
    const pbCost = months(g.cost.mid);
    const planPct = num(d.operation.planRealizationPct);

    headline(c, margin > 0 && upliftPts > 0 ? [
      { t: 'Yalın dönüşüm faaliyet kârını yılda ' }, { t: moneyShort(profit, unit), red: true },
      { t: ` artırır; kâr marjı %${fmtNum(newMargin)} olur (bugün %${fmtNum(margin)}).` },
    ] : [
      { t: 'Yalın dönüşüm faaliyet kârına yılda ' }, { t: `${moneyShort(profit, unit)} katkı`, red: true },
      { t: ` sağlar; toplam beklenen kazanç ${moneyShort(g.total.mid, unit)}.` },
    ]);

    const L = PAGE.mx, LW = 160, R = L + LW + 5, RW = CW - LW - 5;

    // Sol üst: kazancın katmanları (ilk ikisi faaliyet kârına dahil)
    card(c, L, 42, LW, 80);
    label(c, `Kazanç nereden gelir? — ${rec.def.name}, yıllık beklenen`, L + 5, 49);
    const layers = [
      { k: g.cost, color: COLOR.red, inProfit: true, tag: 'KÂRA DAHİL', t: 'Maliyet düşüşü', d: 'Hurda, yeniden işleme, fazla mesai, duruşların enerji/bakım maliyeti azalır.' },
      { k: g.sales, color: '#E05257', inProfit: true, tag: 'KÂRA DAHİL', t: 'Ek satış katkısı',
        d: `Setup, arıza ve OEE kayıplarından açılan kapasite planlanıp üretilemeyen siparişi karşılar${planPct > 0 ? ` (plan gerçekleşme %${tr(d.operation.planRealizationPct)})` : ''}; ${moneyShort(g.extraRevenue, unit)} ek ciro, katkı payıyla kâra iner.` },
      { k: g.efficiency, color: COLOR.ink, inProfit: false, tag: 'KOŞULLU', t: 'İşgücü verimi', d: 'Aynı iş daha az işçilik saatiyle; ek işe alımı önlediği ölçüde kâra döner.' },
      { k: g.finance, color: COLOR.good, inProfit: false, tag: 'FİNANSMAN', t: 'Finansman yükü', d: 'Daha az stok: finansman ve depolama maliyeti azalır.' },
    ].filter(x => x.k.mid > 0);
    const barX = L + 5, barW = LW - 10, barY = 53;
    let bx = barX;
    const tot = layers.reduce((acc, x) => acc + x.k.mid, 0) || 1;
    layers.forEach(x => {
      const w = barW * x.k.mid / tot;
      if (w > 0) { doc.setFillColor(x.color); doc.rect(bx, barY, w, 4, 'F'); bx += w; }
    });
    let ly = 65;
    layers.forEach(x => {
      doc.setFillColor(x.color); doc.rect(L + 5, ly - 3, 3, 3, 'F');
      setText(c, 9, COLOR.ink, true); doc.text(x.t, L + 10, ly);
      const tw = doc.getTextWidth(x.t);
      setText(c, 6.6, x.inProfit ? COLOR.red : COLOR.muted, true);
      doc.text(x.tag, L + 12 + tw, ly);
      setText(c, 11, COLOR.ink, true); doc.text(moneyShort(x.k.mid, unit), L + LW - 5, ly, { align: 'right' });
      setText(c, 6.8, COLOR.muted); doc.text(`aralık ${moneyShort(x.k.min, unit)} – ${moneyShort(x.k.max, unit)}`, L + LW - 5, ly + 3.8, { align: 'right' });
      const e = para(c, x.d, L + 10, ly + 3.8, LW - 60, 7.2, COLOR.muted, 1.3);
      ly = Math.max(ly + 11, e + 4.2);
    });
    if (g.oneTimeCash > 0) {
      para(c, `Ayrıca stok düşüşüyle bir kerelik ${moneyShort(g.oneTimeCash, unit)} nakit (işletme sermayesi) serbest kalır — yıllık kazanca dahil değildir.`, L + 5, Math.min(ly + 1, 117), LW - 10, 7.2, COLOR.ink, 1.3, true);
    }

    // Sol alt-1: kâr marjı (koyu kart)
    const by = 126, bh = 64, mw = 70;
    card(c, L, by, mw, bh, COLOR.ink);
    label(c, 'Kâr marjına etkisi', L + 5, by + 7, '#AFB7C2');
    if (margin > 0 && turnover > 0) {
      setText(c, 20, COLOR.white, true); doc.text(`+${fmtNum(upliftPts)} puan`, L + 5, by + 19);
      setText(c, 7.6, '#C9CFD8'); doc.text(`faaliyet kâr marjı: bugün %${fmtNum(margin)}, sonra %${fmtNum(newMargin)}`, L + 5, by + 24.5);
      const salesEq = profit / (margin / 100);
      setText(c, 14, COLOR.white, true); doc.text(moneyShort(salesEq, unit), L + 5, by + 37);
      para(c, `Aynı kârı bugünkü %${fmtNum(margin)} marjla satış büyümesiyle yaratmak için gereken ek ciro. Maliyetten kazanılan 1 ${unit} ≈ ${fmtNum(100 / margin)} ${unit} satış.`, L + 5, by + 42.5, mw - 10, 7.2, '#C9CFD8', 1.3);
    } else {
      setText(c, 20, COLOR.white, true); doc.text(moneyShort(profit, unit), L + 5, by + 19);
      para(c, 'yıllık faaliyet kârı etkisi. Maliyet yapısında kâr payı girilirse marj etkisi ve satış eşdeğeri hesaplanır.', L + 5, by + 25, mw - 10, 7.4, '#C9CFD8', 1.3);
    }

    // Sol alt-2: duyarlılık
    const sx = L + mw + 4, sw = LW - mw - 4;
    card(c, sx, by, sw, bh);
    label(c, 'Kaybın ne kadarı geri kazanılırsa?', sx + 5, by + 7);
    const rate = (p: number) => {
      const gain = q.totalLoss * p;
      const pb = months(gain);
      return [`%${Math.round(p * 100)}`, moneyShort(gain, unit), pb > 0 ? `${fmtNum(pb)} ay` : '-', moneyShort(gain * q.sustainYears - rec.budget, unit)];
    };
    const plan = [`Plan (%${Math.round(rec.def.recovery[0] * 100)}–${Math.round(rec.def.recovery[1] * 100)})`, moneyShort(rec.gainMid, unit), `${fmtNum(rec.paybackExpMonths)} ay`, moneyShort(rec.gainMid * q.sustainYears - rec.budget, unit)];
    const cw = sw - 10;
    table(c, [
      { h: 'Oran', w: cw * 0.3 }, { h: 'Kazanç/yıl', w: cw * 0.24, align: 'right' },
      { h: 'Ödeme', w: cw * 0.18, align: 'right' }, { h: `${q.sustainYears} yıl net`, w: cw * 0.28, align: 'right' },
    ], [rate(0.1), rate(0.2), rate(0.3), plan.map(t => ({ t, bold: true }))], sx + 5, by + 14, { size: 7.4 });
    const bePct = rec.budget / q.totalLoss * 100;
    para(c, `Başa baş (12 ayda kendini ödemesi) için kaybın ${pctOf(bePct)} yeterli.`, sx + 5, by + bh - 9, sw - 10, 7.4, COLOR.red, 1.3, true);

    // Sağ: toplantıda savunulacak argümanlar
    label(c, 'Toplantıda öncelikle savunulacak 5 argüman', R, 47);
    const lo = Math.round(rec.def.recovery[0] * 100), hi = Math.round(rec.def.recovery[1] * 100);
    const args: [string, string][] = [
      ['Yatırım kârdan geri döner',
        pbCost > 0 && pbCost <= 12
          ? `Ek satış hiç gerçekleşmese bile, yalnızca maliyet düşüşüyle ${moneyShort(rec.budget, unit)} bütçe ${fmtNum(pbCost)} ayda geri döner.`
          : pbProfit > 0
            ? `Faaliyet kârına etkisiyle ${moneyShort(rec.budget, unit)} bütçe ${fmtNum(pbProfit)} ayda geri döner${pbCost > 0 && pbCost <= 36 ? `; ek satış hiç gerçekleşmese bile yalnızca maliyet düşüşü ${fmtNum(pbCost)} ayda öder` : ''}.`
            : `Toplam beklenen kazançla ${moneyShort(rec.budget, unit)} bütçe ${fmtNum(rec.paybackExpMonths)} ayda geri döner.`],
      g.sales.mid > g.cost.mid
        ? ['Talep hazır, kayıp kapasitede', `Plan gerçekleşmesi %${tr(d.operation.planRealizationPct)}: siparişler var, üretilemiyor. Duruş ve OEE kayıplarını geri almak yeni yatırım ve kadro olmadan ${moneyShort(g.extraRevenue, unit)} ek satış demektir.`]
        : ['Başa baş için küçük bir iyileşme yeterli',
          `Programın 12 ayda kendini ödemesi için kaybın yalnızca ${pctOf(bePct, 'ini')} geri kazanmak yeterli. Plan hedefi %${lo}–${hi}.`],
      margin > 0
        ? ['Tasarruf, satıştan değerlidir', `%${fmtNum(margin)} kâr marjında maliyetten kazanılan her 1 ${unit}, yaklaşık ${fmtNum(100 / margin)} ${unit} ek satışa eşdeğer — üstelik pazar riski taşımaz.`]
        : ['Tasarruf, satıştan değerlidir', 'Maliyetten kazanılan her lira doğrudan kâra iner; aynı kârı satışla yaratmak çok daha fazla ciro ve pazar riski gerektirir.'],
      ['Hedef temkinli, rakamlar abartılı değil',
        `Kayıp havuzu cironun ${pctOf(q.lossPctOfTurnover)} (${q.lossPctOfTurnover > 20 ? 'tipik %8–20 aralığının üstünde; ilk iki haftada doğrulanır' : 'sektörde tipik %8–20'}). Hedef bunun yalnızca ${iyelik(`%${lo}–${hi}`)}; bu aralığın alt ucunda bile geri ödeme ${fmtNum(rec.paybackSlowMonths)} ay.`],
      ['Ölçülebilir, karar sizde',
        'İlk iki haftada başlangıç değerleri sizin verinizle doğrulanır; kazanç aylık KPI (hurda, OEE, stok günü, fazla mesai) ile izlenir. Her aşamada devam kararı yönetimdedir.'],
    ];
    let ay = 55;
    args.forEach(([t, s], i) => {
      doc.setFillColor(COLOR.red);
      doc.circle(R + 3, ay - 1.2, 3, 'F');
      setText(c, 7.6, COLOR.white, true); doc.text(String(i + 1), R + 3, ay - 0.1, { align: 'center' });
      const e = para(c, t, R + 9, ay, RW - 9, 9, COLOR.ink, 1.3, true);
      ay = para(c, s, R + 9, e + 0.4, RW - 9, 7.6, COLOR.muted, 1.35) + 4.5;
    });
    para(c, 'Dayanak: ciro ve maliyet yapısı firma beyanı; kayıp oranları saha tespiti ve işletme verisi; stok taşıma oranı yıllık %' +
      `${Math.round(q.inventory.carryingRate * 100)}; geri kazanım oranları Gemba proje referansları. Rakamlar yön göstericidir, ilk iki haftada doğrulanır.`,
      R, Math.max(ay, 176), RW, 6.6, COLOR.muted, 1.3);
  }

  // ---------- 5. FİRMA PROFİLİ ----------
  static profile(c: Ctx, d: ReportData) {
    const doc = c.doc;
    const op = d.operation;
    const unit = unitOf(d.metrics?.currency || 'TRY');
    const ciro = d.metrics?.turnover || num(op.turnoverLira);
    pageHeader(c, 'Firma profili ve üretim altyapısı');
    const segs: Seg[] = [{ t: `${d.company.companyName || 'Firma'}: ` }];
    if (ciro) segs.push({ t: `${moneyShort(ciro, unit)} yıllık ciro`, red: true });
    if (has(op.operatorsCount)) segs.push({ t: `, ${op.operatorsCount} mavi yaka çalışan` });
    if (has(op.costPropMaterial)) segs.push({ t: `; maliyetin ${iyelik(`%${tr(op.costPropMaterial)}`)} malzeme.` });
    headline(c, segs);

    const v = (x: any, suffix = '') => (has(x) ? `${x}${suffix}` : 'Veri yok');
    const rows: Cell[][] = [
      ['Sektörel faaliyet alanı', d.company.sector || '-'],
      ['Ürün / proses grubu', op.urunGrubu || '-'],
      ['Çalışan sayısı bandı · vardiya', [op.calisanSayisi, op.vardiya ? `${op.vardiya} vardiya` : ''].filter(Boolean).join(' · ') || '-'],
      ['Mavi yaka çalışan', v(op.operatorsCount, ' kişi')],
      ['Yıllık üretim hacmi', has(op.annualVolume) ? `${op.annualVolume} ${op.productionUnit || ''}` : 'Veri yok'],
      ['Kapalı alan', v(op.coveredArea, ' m²')],
      ['Yıllık ciro', ciro ? money(ciro, unit) : 'Veri yok'],
      ['Setup yapılan makine / hat', v(op.setupMachineCount, ' adet')],
      ['Değerlendiren danışman', d.company.consultant || '-'],
    ];
    table(c, [{ h: 'Parametre', w: 70 }, { h: 'Beyan edilen değer', w: 70 }], rows, PAGE.mx, 46);

    const R = PAGE.mx + 150, RW = CW - 150;
    card(c, R, 42, RW, 148);
    label(c, 'Maliyet yapısı (cironun %)', R + 5, 49);
    const costs: [string, any][] = [
      ['Malzeme', op.costPropMaterial], ['Direkt işçilik', op.costPropLabor], ['Enerji', op.costPropEnergy],
      ['Bakım', op.costPropMaintenance], ['Genel üretim gideri', op.costPropOverhead], ['Faaliyet kârı', op.costPropProfit],
    ];
    const palette = [COLOR.ink, COLOR.red, COLOR.amber, COLOR.good, COLOR.muted, COLOR.green];
    // Yığılmış çubuk
    let sx = R + 5;
    const sw = RW - 10;
    costs.forEach(([, p], i) => {
      const w = (num(p) / 100) * sw;
      if (w > 0) { doc.setFillColor(palette[i]); doc.rect(sx, 54, w, 6, 'F'); sx += w; }
    });
    hbars(c, R + 5, 68, RW - 10, costs.map(([n, p], i) => ({
      label: n, value: num(p), color: palette[i],
      text: has(p) ? `%${fmtNum(num(p))}${ciro ? ` · ${moneyShort(ciro * num(p) / 100, unit)}` : ''}` : 'Veri yok',
    })), 9);
    const total = costs.reduce((s, [, p]) => s + num(p), 0);
    para(c, `Toplam %${fmtNum(total)}${Math.abs(total - 100) > 0.5 ? ' — toplamın %100 olması önerilir' : ''}. Kayıp hesabında malzeme, işçilik, enerji ve bakım tabanları bu oranlardan türetilir.`, R + 5, 130, RW - 10, 7.6, COLOR.muted);
  }

  // ---------- 5. OPERASYONEL VERİLER ----------
  static operations(c: Ctx, d: ReportData) {
    const op = d.operation;
    pageHeader(c, 'Operasyonel veriler');
    type K = { name: string; ref: string; act: string; worse: boolean | null; note: string };
    const lower = (v: number, ref: number) => (v > 0 ? v > ref : null);
    const higher = (v: number, ref: number) => (v > 0 ? v < ref : null);
    const kpis: K[] = [
      { name: 'Toplam ekipman etkinliği (OEE)', ref: '%85 (dünya standardı)', act: has(op.oee) ? `%${tr(op.oee)}` : 'Ölçülmüyor', worse: higher(num(op.oee), 85), note: 'Kullanılabilirlik × performans × kalite' },
      { name: 'Hat / proses verimliliği', ref: has(op.plannedEfficiency) ? `%${op.plannedEfficiency} (plan)` : '-', act: has(op.actualEfficiency) ? `%${tr(op.actualEfficiency)}` : 'Veri yok', worse: has(op.plannedEfficiency) ? higher(num(op.actualEfficiency), num(op.plannedEfficiency)) : null, note: 'Planlanana göre gerçekleşen' },
      { name: 'Kalitesizlik oranı (COPQ)', ref: '%2,5', act: has(op.copqRate) ? `%${tr(op.copqRate)}` : 'Veri yok', worse: lower(num(op.copqRate), 2.5), note: 'Hurda + tamir' },
      { name: 'Hurda oranı', ref: '%0,5', act: has(op.scrapRate) ? `%${tr(op.scrapRate)}` : 'Veri yok', worse: lower(num(op.scrapRate), 0.5), note: '' },
      { name: 'Tamir / rework oranı', ref: '%1,0', act: has(op.reworkRate) ? `%${tr(op.reworkRate)}` : 'Veri yok', worse: lower(num(op.reworkRate), 1), note: '' },
      { name: 'Fazla mesai oranı', ref: '%3,0', act: has(op.overtimeRate) ? `%${tr(op.overtimeRate)}` : 'Veri yok', worse: lower(num(op.overtimeRate), 3), note: '' },
      { name: 'Teslim süresi (lead time)', ref: '7 gün', act: has(op.leadTime) ? `${tr(op.leadTime)} gün` : 'Veri yok', worse: lower(num(op.leadTime), 7), note: 'Siparişten sevkiyata' },
      { name: 'Setup sıklığı', ref: '1–2 / vardiya', act: has(op.setupFrequency) ? `${tr(op.setupFrequency)} / hafta` : 'Veri yok', worse: null, note: '' },
      { name: 'Ortalama setup süresi', ref: '15 dakika', act: has(op.setupDuration) ? `${tr(op.setupDuration)} dakika` : 'Veri yok', worse: lower(num(op.setupDuration), 15), note: '' },
      { name: 'Aylık operatör maliyeti (yüklü)', ref: '-', act: has(op.grossLaborCost) ? `${op.grossLaborCost} ${unitOf(d.metrics?.currency || 'TRY')}` : 'Veri yok', worse: null, note: '' },
    ];
    const behind = kpis.filter(k => k.worse === true).length;
    const measured = kpis.filter(k => k.worse !== null).length;
    headline(c, [
      { t: 'Operasyonel göstergeler: ölçülen ' }, { t: `${measured} göstergenin ${behind} tanesi referansın gerisinde`, red: behind > 0 }, { t: '.' },
    ]);
    const rows: Cell[][] = kpis.map(k => [
      { t: k.name, bold: true }, k.ref, { t: k.act, bold: true },
      k.worse === null ? { t: k.act.startsWith('Veri') || k.act === 'Ölçülmüyor' ? 'Veri yok' : 'Bilgi', pill: COLOR.muted }
        : k.worse ? { t: 'Referansın gerisinde', pill: COLOR.bad } : { t: 'Referans içinde', pill: COLOR.green },
      { t: k.note, color: COLOR.muted },
    ]);
    const end = table(c, [{ h: 'Gösterge', w: 72 }, { h: 'Referans / hedef', w: 45 }, { h: 'Gerçekleşen', w: 35 }, { h: 'Durum', w: 45 }, { h: 'Not', w: CW - 197 }], rows, PAGE.mx, 46).y;

    const parts: string[] = [];
    if (has(op.oee)) parts.push(`%${tr(op.oee)} OEE`);
    if (has(op.copqRate)) parts.push(`%${tr(op.copqRate)} kalitesizlik oranı`);
    const text = (parts.length
      ? `Mevcut ${parts.join(' ve ')} değerleri, operasyonel kayıpların finansal etkisinin yüksek olduğunu göstermektedir. `
      : 'Operasyonel veriler kısmen ölçülebildiğinden değerlendirme saha gözlemlerine dayanmaktadır. ')
      + (has(op.setupDuration) ? `Setup sürelerinin ${op.setupDuration} dakika seviyesinde olması planlama esnekliğini sınırlamaktadır.` : '');
    const y = Math.min(end + 6, 168);
    card(c, PAGE.mx, y, CW, 22);
    label(c, 'Kritik KPI eşikleri ve darboğaz değerlendirmesi', PAGE.mx + 5, y + 7);
    para(c, text, PAGE.mx + 5, y + 13, CW - 10, 8.2);
  }

  // ---------- 6. YALIN OLGUNLUK ----------
  static lean(c: Ctx, d: ReportData) {
    const doc = c.doc;
    pageHeader(c, 'Yalın olgunluk değerlendirmesi');
    const scores = d.operation.scores || {};
    const groups = CRITERIA.map(g => {
      const vals = g.items.map(it => Number(scores[it.no]));
      const scored = vals.filter(v => v >= 0);
      const sum = scored.reduce((s, v) => s + v, 0);
      return { name: g.group, avg: scored.length ? sum / scored.length : 0, sum, max: g.items.length * 3, unscored: vals.length - scored.length, n: g.items.length };
    });
    const total = d.metrics?.maturityScore ?? groups.reduce((s, g) => s + g.sum, 0);
    const lvl = levelOf(total);
    const ranked = [...groups].sort((a, b) => b.avg - a.avg);
    headline(c, [
      { t: `Olgunluk skoru ${total} / ${MATURITY_MAX} (${lvl.name}). En güçlü grup ${ranked[0].name}, ` },
      { t: `en zayıf grup ${ranked[ranked.length - 1].name}`, red: true }, { t: '.' },
    ]);

    card(c, PAGE.mx, 42, 128, 148);
    label(c, 'Grup ortalamaları (0–3)', PAGE.mx + 5, 49);
    radar(c, PAGE.mx + 64, 116, 37, groups.map(g => g.name), groups.map(g => g.avg), 3, 2);
    setText(c, 6.6, COLOR.muted);
    doc.setFillColor(COLOR.red); doc.rect(PAGE.mx + 8, 183, 3, 2, 'F');
    doc.text('Gerçekleşen', PAGE.mx + 12.5, 184.8);
    doc.setDrawColor(COLOR.ink); doc.setLineDashPattern([1, 0.8], 0); doc.line(PAGE.mx + 34, 184, PAGE.mx + 39, 184); doc.setLineDashPattern([], 0);
    doc.text('Referans: 2 = faaliyet var', PAGE.mx + 40.5, 184.8);

    const R = PAGE.mx + 134, RW = CW - 134;
    label(c, `Seviye: ${lvl.name} · ${d.metrics?.answeredCount ?? '-'} / 17 kriter değerlendirildi`, R, 47);
    levelBand(c, R, 54, RW, MATURITY_LEVELS, MATURITY_MAX, total);
    const status = (a: number) => (a >= 2.5 ? ['Güçlü', COLOR.green] : a >= 1.5 ? ['Faaliyet var', COLOR.good] : a >= 0.75 ? ['Zayıf', COLOR.amber] : ['Kritik', COLOR.bad]);
    const rows: Cell[][] = groups.map(g => {
      const [t, col] = status(g.avg);
      return [{ t: g.name, bold: true }, fmtNum(g.avg, 2), `${g.sum} / ${g.max}`, { t, pill: col }, g.unscored ? `${g.unscored} kriter puanlanmadı` : ''];
    });
    rows.push(['Genel', fmtNum(total / 17, 2), `${total} / ${MATURITY_MAX}`, { t: lvl.name, pill: lvl.color }, '']);
    table(c, [{ h: 'Grup', w: 44 }, { h: 'Ortalama', w: 17, align: 'right' }, { h: 'Puan', w: 15, align: 'right' }, { h: 'Durum', w: 24 }, { h: 'Not', w: RW - 100 }], rows, R, 72, { boldLast: true });
    para(c, 'Puanlama: 0 izlenmedi · 1 zayıf · 2 faaliyet var · 3 geliştirilebilir. Seviyeler toplam puana göredir: 0–12 Başlangıç, 13–25 Gelişen, 26–40 Yapılanmış, 41–51 İleri.', R, 168, RW, 7, COLOR.muted);
  }

  // ---------- 7. SAHA BULGULARI (gerekirse devam sayfası) ----------
  static observations(c: Ctx, d: ReportData, newPage: () => void) {
    const doc = c.doc;
    const obs = d.observations || [];
    const findings = d.metrics?.findings || [];
    const crit = obs.filter(o => o.priority === 'Kritik' || o.priority === 'Yüksek').length;
    const head = () => {
      pageHeader(c, 'Saha bulguları');
      headline(c, obs.length
        ? [{ t: `Saha turunda ${obs.length} bulgu kayıt altına alındı; ` }, { t: `${crit} tanesi kritik / yüksek öncelikli`, red: crit > 0 }, { t: '.' }]
        : [{ t: 'Olgunluk değerlendirmesinde en zayıf kriterler ve finansal etkileri.' }]);
    };
    head();
    type Item = { title: string; prio: string; a: [string, string]; b: [string, string]; photo?: string };
    const items: Item[] = obs.length
      ? obs.map(o => ({ title: o.category, prio: o.priority || 'Orta', a: ['Tespit', o.finding || '-'], b: ['Önerilen iyileştirme', o.improvement || '-'], photo: o.photo }))
      : findings.map(f => ({ title: f.title, prio: f.score <= 0 ? 'Kritik' : f.score === 1 ? 'Yüksek' : 'Orta', a: ['Gözlem', f.obs], b: ['Finansal etki · yalın araç', `${f.finImpact} Araç: ${f.leanTool}`] }));
    if (!items.length) {
      card(c, PAGE.mx, 44, CW, 24);
      para(c, 'Henüz girilmiş bir saha gözlemi bulunmamaktadır.', PAGE.mx + 5, 57, CW - 10, 9, COLOR.muted);
      return;
    }
    const colW = (CW - 5) / 2, cardH = 47;
    let i = 0;
    while (i < items.length) {
      for (let slot = 0; slot < 6 && i < items.length; slot++, i++) {
        const it = items[i];
        const x = PAGE.mx + (slot % 2) * (colW + 5), y = 42 + Math.floor(slot / 2) * (cardH + 3);
        card(c, x, y, colW, cardH);
        doc.setFillColor(PRIORITY_COLOR[it.prio] || COLOR.muted);
        doc.rect(x, y + 3, 1.2, cardH - 6, 'F');
        setText(c, 9, COLOR.ink, true);
        doc.text((doc.splitTextToSize(`${i + 1}. ${it.title}`, colW - 40) as string[])[0], x + 5, y + 7);
        pill(c, it.prio, x + colW - 22, y + 7, PRIORITY_COLOR[it.prio] || COLOR.muted);
        let tx = x + 5, tw = colW - 10;
        if (it.photo) {
          try { doc.addImage(it.photo, 'JPEG', x + colW - 37, y + 11, 32, 32); tw = colW - 46; } catch { /* görsel okunamadı */ }
        }
        label(c, it.a[0], tx, y + 13);
        const e = para(c, clip(c, it.a[1], tw, 3), tx, y + 17, tw, 7.6);
        label(c, it.b[0], tx, e + 2.5, COLOR.good);
        para(c, clip(c, it.b[1], tw, 3), tx, e + 6.5, tw, 7.6);
      }
      if (i < items.length) { newPage(); head(); }
    }
  }

  // ---------- 8. POTANSİYEL KAZANIMLAR ----------
  static savings(c: Ctx, d: ReportData) {
    const m = d.metrics;
    const unit = unitOf(m?.currency || 'TRY');
    pageHeader(c, 'Potansiyel kazanımlar');
    const q = m?.qla;
    if (!q || q.totalLoss <= 0) {
      headline(c, [{ t: 'Potansiyel kazanım hesabı için kayıp verisi girilmedi.' }]);
      return;
    }
    const rec = q.selected;
    const losses = [...q.losses].filter(l => l.amount > 0).sort((a, b) => b.amount - a.amount);
    const top = losses[0];
    headline(c, [
      { t: `En büyük kayıp kalemi ${top.label.toLocaleLowerCase('tr-TR')} (${moneyShort(top.amount, unit)}). ` },
      { t: `${rec.def.name} ile yıllık ${moneyShort(rec.gainMin, unit)} – ${moneyShort(rec.gainMax, unit)} tasarruf`, red: true }, { t: '.' },
    ]);
    card(c, PAGE.mx, 42, 118, 148);
    label(c, 'Kayıp dağılımı (yıllık)', PAGE.mx + 5, 49);
    const end = hbars(c, PAGE.mx + 5, 55, 108, losses.map(l => ({ label: l.label, value: l.amount, text: moneyShort(l.amount, unit) })), 8.4);
    setText(c, 8.4, COLOR.ink, true);
    c.doc.text('Toplam', PAGE.mx + 5, end + 5);
    c.doc.text(moneyShort(q.totalLoss, unit), PAGE.mx + 113, end + 5, { align: 'right' });
    const missing = q.losses.filter(l => !l.hasData).map(l => l.label);
    if (missing.length) para(c, `Veri girilmediği için hesaba katılmayan: ${missing.join(', ')}.`, PAGE.mx + 5, end + 12, 108, 7, COLOR.muted);

    const R = PAGE.mx + 124, RW = CW - 124;
    label(c, `Geri kazanım matrisi — ${rec.def.name} (${rec.def.days} adam-gün)`, R, 47);
    const opps = [...q.opportunities].filter(o => o.loss > 0).sort((a, b) => b.gainMax - a.gainMax);
    const rows: Cell[][] = opps.map(o => [{ t: o.label, bold: true }, o.tool, moneyShort(o.loss, unit), `${moneyShort(o.gainMin, unit)} – ${moneyShort(o.gainMax, unit)}`, `%${o.pctMin}–${o.pctMax}`]);
    rows.push(['Toplam', '', moneyShort(q.totalLoss, unit), `${moneyShort(rec.gainMin, unit)} – ${moneyShort(rec.gainMax, unit)}`, `%${Math.round(rec.def.recovery[0] * 100)}–${Math.round(rec.def.recovery[1] * 100)}`]);
    const t = table(c, [{ h: 'Kalem', w: 33 }, { h: 'Yalın araç', w: 37 }, { h: 'Mevcut kayıp', w: 25, align: 'right' }, { h: 'Yıllık tasarruf', w: 33, align: 'right' }, { h: 'Pay', w: RW - 128, align: 'right' }], rows, R, 53, { boldLast: true, size: 7.3 });
    const y = Math.min(t.y + 6, 166);
    const kpi = (x: number, w: number, lab: string, val: string) => { card(c, x, y, w, 22); label(c, lab, x + 4, y + 7); setText(c, 13, COLOR.ink, true); c.doc.text(val, x + 4, y + 16); };
    const kw = (RW - 8) / 3;
    kpi(R, kw, 'Proje bütçesi', moneyShort(rec.budget, unit));
    kpi(R + kw + 4, kw, 'Geri ödeme', `${fmtNum(rec.paybackExpMonths)} ay`);
    kpi(R + 2 * (kw + 4), kw, `${q.sustainYears} yıllık kazanç`, moneyShort(rec.cumulativeGain, unit));
  }

  // ---------- 9. STRATEJİK DEĞERLENDİRME ----------
  static strategy(c: Ctx, d: ReportData) {
    const ai = d.aiAnalysis;
    pageHeader(c, 'Stratejik değerlendirme');
    headline(c, [{ t: `Stratejik değerlendirme: ${ai.criticalRisks.length} kritik kayıp alanı, ` }, { t: `${ai.opportunities.length} yalın fırsat`, red: true }, { t: ' ve üç aşamalı yol haritası.' }]);
    card(c, PAGE.mx, 42, CW, 26);
    label(c, 'Genel değerlendirme', PAGE.mx + 5, 49);
    para(c, clip(c, ai.generalEvaluation, CW - 10, 3), PAGE.mx + 5, 55, CW - 10, 8.2);
    const half = (CW - 5) / 2;
    const list = (x: number, title: string, items: string[], col: string) => {
      card(c, x, 72, half, 50);
      label(c, title, x + 5, 79, col);
      let y = 85;
      (items.length ? items : ['Veri yok']).slice(0, 4).forEach(t => { y = para(c, `• ${t}`, x + 5, y, half - 10, 7.8) + 1.6; });
    };
    list(PAGE.mx, 'Kritik kayıp alanları', ai.criticalRisks, COLOR.bad);
    list(PAGE.mx + half + 5, 'Stratejik yalın fırsatlar', ai.opportunities, COLOR.good);
    const third = (CW - 10) / 3;
    const terms: [string, string[]][] = [['Hızlı kazanımlar · 0–3 ay', ai.quickWins], ['Orta vade · 3–9 ay', ai.mediumTermProjects], ['Sürdürülebilirlik · 9+ ay', ai.longTermProjects]];
    terms.forEach(([title, items], i) => {
      const x = PAGE.mx + i * (third + 5);
      card(c, x, 126, third, 64, i === 0 ? COLOR.ink : COLOR.soft);
      label(c, title, x + 5, 133, i === 0 ? '#AFB7C2' : COLOR.muted);
      let y = 139;
      (items.length ? items : ['Veri yok']).slice(0, 3).forEach((t, k) => {
        y = para(c, `${k + 1}. ${t}`, x + 5, y, third - 10, 7.4, i === 0 ? COLOR.white : COLOR.ink) + 1.6;
      });
    });
  }

  // ---------- 10. AKSİYON PLANI ----------
  static actionPlan(c: Ctx, d: ReportData, newPage: () => void) {
    pageHeader(c, 'Aksiyon planı');
    const obs = d.observations || [];
    const owner = (cat: string) => {
      const x = (cat || '').toLocaleLowerCase('tr-TR');
      if (x.includes('smed') || x.includes('kurulum') || x.includes('setup')) return 'Üretim ve metot mühendisi';
      if (x.includes('5s') || x.includes('görsel')) return '5S pilot alan sorumlusu';
      if (x.includes('bakım') || x.includes('tpm') || x.includes('arıza')) return 'Bakım / TPM';
      if (x.includes('kalite') || x.includes('hata') || x.includes('poka') || x.includes('hurda') || x.includes('rework')) return 'Kalite güvence';
      if (x.includes('lojistik') || x.includes('malzeme') || x.includes('stok')) return 'Lojistik ve planlama';
      return 'Saha operasyon ekibi';
    };
    const due = (p: string) => (p === 'Kritik' ? '15 gün' : p === 'Yüksek' ? '30 gün' : p === 'Orta' ? '60 gün' : '90 gün');
    let src: { act: string; cat: string; prio: string }[] = obs.map(o => ({ act: o.improvement || o.finding || 'İyileştirme aksiyonu', cat: o.category, prio: o.priority || 'Orta' }));
    if (!src.length && d.metrics) {
      const losses = [...d.metrics.qla.losses].filter(l => l.amount > 0).sort((a, b) => b.amount - a.amount);
      src = losses.map((l, i) => ({ act: `${ACTION_BY_LOSS[l.key]?.act ?? l.label}: ${ACTION_BY_LOSS[l.key]?.desc ?? ''}`, cat: l.label, prio: i < 2 ? 'Yüksek' : i < 4 ? 'Orta' : 'Düşük' }));
    }
    const urgent = src.filter(s => s.prio === 'Kritik' || s.prio === 'Yüksek').length;
    headline(c, [{ t: `${src.length} aksiyon önceliklendirildi; ` }, { t: `${urgent} tanesi ilk 30 günde başlamalı`, red: urgent > 0 }, { t: '.' }]);
    let rows: Cell[][] = src.map((s, i) => [String(i + 1), { t: s.act, bold: true }, owner(s.cat), due(s.prio), { t: s.prio, pill: PRIORITY_COLOR[s.prio] || COLOR.muted }, 'Planlandı']);
    const cols = [{ h: '#', w: 8 }, { h: 'Yapılacak iş / iyileştirme', w: 128 }, { h: 'Sorumlu', w: 50 }, { h: 'Termin', w: 22 }, { h: 'Öncelik', w: 25 }, { h: 'Durum', w: CW - 233 }];
    let r = table(c, cols, rows, PAGE.mx, 46, { maxY: 166 });
    while (r.rest.length) { newPage(); pageHeader(c, 'Aksiyon planı (devam)'); r = table(c, cols, r.rest, PAGE.mx, 30, { maxY: 166 }); }
    const y = Math.max(r.y + 6, 168);
    card(c, PAGE.mx, Math.min(y, 170), CW, 18);
    label(c, 'Aksiyon planı yönetim metodu', PAGE.mx + 5, Math.min(y, 170) + 7);
    para(c, 'Tüm aksiyonlar PDCA döngüsü ile haftalık gözden geçirmelerde takip edilir. Kritik ve yüksek öncelikli işler gecikme durumunda doğrudan üst yönetime raporlanır.', PAGE.mx + 5, Math.min(y, 170) + 12.5, CW - 10, 7.8);
  }

  // ---------- 11. SONUÇ ----------
  static conclusion(c: Ctx, d: ReportData) {
    const doc = c.doc;
    const m = d.metrics;
    const unit = unitOf(m?.currency || 'TRY');
    const q = m?.qla && m.qla.totalLoss > 0 ? m.qla : undefined, rec = q?.selected;
    pageHeader(c, 'Sonuç ve yatırım dönüşü');
    if (rec && rec.gainMid > 0) {
      headline(c, [{ t: 'Sonuç: yatırım ' }, { t: `${fmtNum(rec.paybackExpMonths)} ayda geri dönüyor`, red: true }, { t: `; ${q!.sustainYears} yılda ${moneyShort(rec.cumulativeGain, unit)} kazanç.` }]);
    } else headline(c, [{ t: 'Sonuç ve yatırım dönüşü değerlendirmesi.' }]);
    card(c, PAGE.mx, 42, 120, 92, COLOR.ink);
    label(c, 'Nihai kazanım analizi', PAGE.mx + 6, 50, '#AFB7C2');
    const rowsK: [string, string][] = q && rec ? [
      ['Toplam yıllık kayıp', moneyShort(q.totalLoss, unit)],
      [`Beklenen yıllık kazanç`, moneyShort(rec.gainMid, unit)],
      ['Proje bütçesi', moneyShort(rec.budget, unit)],
      [`${q.sustainYears} yıllık kümülatif kazanç`, moneyShort(rec.cumulativeGain, unit)],
    ] : [['Kayıp hesabı', 'Veri girilmedi']];
    let y = 62;
    rowsK.forEach(([l, v], i) => {
      setText(c, 8, '#C9CFD8'); doc.text(l, PAGE.mx + 6, y);
      setText(c, 16, i === 0 ? '#F28B8E' : COLOR.white, true); doc.text(v, PAGE.mx + 6, y + 7.5);
      y += 17.5;
    });
    if (rec) { setText(c, 7.4, '#C9CFD8'); doc.text(`${rec.def.name} · ${rec.def.days} adam-gün`, PAGE.mx + 6, 129); }

    const R = PAGE.mx + 126, RW = CW - 126;
    label(c, 'Baş danışman değerlendirmesi', R, 47);
    const firma = d.company.companyName || 'Firma';
    const score = m?.maturityScore ?? 0;
    const lvlName = levelOf(score).name;
    const maturityText = score >= 26
      ? `${score}/${MATURITY_MAX} olgunluk skoru (${lvlName}), operasyonlarda yapılandırılmış iyileştirme için sağlam bir zemin olduğunu göstermektedir.`
      : `${score}/${MATURITY_MAX} olgunluk skoru (${lvlName}), saha yönetimi ve standartlaşmada geniş bir iyileştirme alanı olduğunu göstermektedir.`;
    const text = (q
      ? `Bir günlük Gemba saha turu ve operasyonel veriler ışığında, ${firma} bünyesinde yıllık ${moneyShort(q.totalLoss, unit)} kayıp havuzu ve buna bağlı önemli bir kârlılık potansiyeli tespit edilmiştir. `
      : `${firma} için saha turu gerçekleştirilmiştir; kayıp hesabı için operasyonel veriler henüz tamamlanmamıştır. `) + maturityText +
      (rec ? ` ${rec.recommended ? "Önerilen" : "Seçilen"} ${rec.def.name} ile ilk yıl ${moneyShort(rec.year1Gain, unit)} geri kazanım hedeflenmektedir; kazanımlar ürün grubu üretimde kaldıkça sürdürülebilirdir.` : '') +
      ' İlk adım olarak verilerin firma ile birlikte doğrulanması ve en büyük kayıp kaleminde pilot çalışma başlatılması önerilir.';
    para(c, text, R, 54, RW, 9, COLOR.ink, 1.5);

    label(c, 'Rapor onay', PAGE.mx, 150);
    doc.setDrawColor(COLOR.line); doc.setLineWidth(0.25); doc.line(PAGE.mx, 152, PAGE.w - PAGE.mx, 152);
    const sigs: [string, string][] = [
      ['Hazırlayan / baş danışman', d.company.consultant || '-'],
      ['Üretim / operasyon direktörü', d.operation.gorusulen || ''],
      ['Genel müdür / onay', ''],
    ];
    const sw = (CW - 20) / 3;
    sigs.forEach(([role, name], i) => {
      const x = PAGE.mx + i * (sw + 10);
      doc.setDrawColor(COLOR.muted); doc.setLineWidth(0.3); doc.line(x, 175, x + sw, 175);
      label(c, role, x, 180, COLOR.ink);
      setText(c, 7.6, COLOR.muted); doc.text(name, x, 184.5);
    });
  }
}

/** Metni en fazla n satıra kısaltır */
function clip(c: Ctx, text: string, w: number, n: number): string {
  const lines = c.doc.splitTextToSize(text || '', w) as string[];
  if (lines.length <= n) return text || '';
  return lines.slice(0, n).join(' ').replace(/\s+\S*$/, '') + '…';
}
