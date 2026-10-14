import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeQla, QlaInput, normalizeTr } from './qla.ts';

const base: QlaInput = {
  turnover: 500_000_000,
  costPct: { malzeme: 50, iscilik: 18, enerji: 10, bakim: 7, genel: 15 },
  scrapPct: 3, reworkPct: 2, overtimePct: 8,
  plannedEffPct: 85, actualEffPct: 70, oeePct: 0,
  setupPerWeek: 4, setupMinutes: 60, setupMachines: 20, setupOperators: 3,
  laborCostMonthly: 48_000, operators: 120,
  recommendedDays: 104,
  budgetOf: d => d * 24_500,
};

test('kayıplar maliyet modelinden türetilir', () => {
  const q = computeQla(base);
  // Hurda = 3% × (250M + 0.5 × (90M + 50M)) = 9.6M
  assert.equal(q.lossByKey.hurda, 9_600_000);
  // Rework = 2% × 0.5 × 140M = 1.4M
  assert.equal(q.lossByKey.kalite, 1_400_000);
  // Mesai = 90M × 8% × 0.5 = 3.6M
  assert.equal(q.lossByKey.mesai, 3_600_000);
  // Verimsizlik = 90M × 15/85
  assert.equal(q.lossByKey.iscilik, Math.round(90_000_000 * 15 / 85));
  assert.ok(q.lossPctOfTurnover > 3 && q.lossPctOfTurnover < 15, `kayıp/ciro %${q.lossPctOfTurnover}`);
});

test('veri girilmeyen satır sıfırdır ve fırsat üretmez', () => {
  const q = computeQla({ ...base, setupPerWeek: 0, oeePct: 0 });
  assert.equal(q.lossByKey.durus, 0);
  assert.equal(q.lossByKey.kapasite, 0);
  const setupOpp = q.opportunities.find(o => o.key === 'durus')!;
  assert.equal(setupOpp.gainMax, 0);
  assert.equal(setupOpp.pctMax, 0);
});

test('sadece ciro girilirse kayıp havuzu boştur', () => {
  const q = computeQla({ ...base, scrapPct: 0, reworkPct: 0, overtimePct: 0, plannedEffPct: 0, actualEffPct: 0, setupPerWeek: 0 });
  assert.equal(q.totalLoss, 0);
});

test('fırsatlar toplamı seçili paket aralığına eşittir (çifte sayım yok)', () => {
  const q = computeQla({ ...base, oeePct: 60 });
  const sumMax = q.opportunities.reduce((s, o) => s + o.gainMax, 0);
  assert.ok(Math.abs(sumMax - q.selected.gainMax) <= 6);
  for (const o of q.opportunities) assert.ok(o.gainMax <= o.loss);
});

test('ROI önerilen paketin bütçesini kullanır', () => {
  const q = computeQla(base);
  assert.equal(q.selected.def.days, 104);
  assert.equal(q.selected.budget, 104 * 24_500);
  assert.ok(q.selected.gainMid > 0);
  assert.equal(q.selected.paybackExpMonths, Math.round(q.selected.budget / q.selected.gainMid * 12 * 10) / 10);
});

test('geri ödeme çok uzunsa (24+ ay) bilgi notu verilir, normal aralıkta yargı yoktur', () => {
  const small = computeQla({ ...base, turnover: 10_000_000, recommendedDays: 156 });
  assert.ok(small.warnings.some(w => w.startsWith('Bilgi:')));
  const normal = computeQla(base);
  assert.ok(!normal.warnings.some(w => w.includes('geri ödeme')));
  assert.ok(['daha-hizli', 'ortalama', 'daha-uzun'].includes(normal.selected.paybackVsAvg));
});

test('OEE kaybı setup payını tekrar saymaz', () => {
  const withSetup = computeQla({ ...base, oeePct: 70 });
  const noSetup = computeQla({ ...base, oeePct: 70, setupPerWeek: 0 });
  assert.ok(withSetup.lossByKey.kapasite < noSetup.lossByKey.kapasite);
});

test('Türkçe sektör adı normalize edilir', () => {
  assert.equal(normalizeTr('Gıda & İçecek'), 'gida & icecek');
  assert.equal(normalizeTr('Çimento'), 'cimento');
});

test('tam kapsamlı program (156 gün) kaybın %25-35ini hedefler; küçük paketler bandın bir kısmını', () => {
  const q = computeQla(base);
  const p156 = q.packages.find(p => p.def.days === 156)!;
  const p52 = q.packages.find(p => p.def.days === 52)!;
  assert.equal(p156.gainMin, Math.round(q.totalLoss * 0.25));
  assert.equal(p156.gainMax, Math.round(q.totalLoss * 0.35));
  assert.ok(p52.gainMax < p156.gainMin);
});

test('olgunluk düşükse beklenen kazanç bandın üst ucuna yaklaşır', () => {
  const low = computeQla({ ...base, maturityScore: 5 }).selected;
  const high = computeQla({ ...base, maturityScore: 45 }).selected;
  const pos = (p: typeof low) => (p.gainMid - p.gainMin) / (p.gainMax - p.gainMin);
  assert.ok(pos(low) > 0.8 && pos(high) < 0.2);
});

test('örnek: 35M€ ciro, ~7M€ kayıp → tam program ~2M€ hedefler', () => {
  // kayıp havuzunu doğrudan test etmek için yalnızca verimlilik kaybı: işçilik %30 × (85-60)/85 ≈ %8,8 → ölçekle
  const q = computeQla({ ...base, turnover: 35_000_000, costPct: { malzeme: 45, iscilik: 30, enerji: 8, bakim: 5, genel: 12 },
    scrapPct: 4, reworkPct: 3, overtimePct: 10, plannedEffPct: 85, actualEffPct: 55, oeePct: 55, leadTimeDays: 30, annualVolume: 500_000,
    setupMachines: 10, laborCostMonthly: 3_000, recommendedDays: 156, maturityScore: 20, budgetOf: d => d * 650 });
  assert.ok(q.lossPctOfTurnover >= 8 && q.lossPctOfTurnover <= 25, `kayıp %${q.lossPctOfTurnover}`);
  const sel = q.selected;
  assert.ok(sel.gainMid / q.totalLoss >= 0.25 && sel.gainMid / q.totalLoss <= 0.35);
});

test('kayıp havuzu %8-20 dışında kalırsa bilgi notu verilir', () => {
  const tiny = computeQla({ ...base, scrapPct: 0.5, reworkPct: 0, overtimePct: 0, plannedEffPct: 0, actualEffPct: 0, setupPerWeek: 0 });
  assert.ok(tiny.warnings.some(w => w.includes('tipik %8–20')));
});

test('kazanç ürün ömrü boyunca sürdürülür: kümülatif = 1. yıl + (N-1) × yıllık', () => {
  const q = computeQla({ ...base, sustainYears: 3 });
  const p = q.selected;
  assert.ok(p.year1Gain < p.gainMid);
  assert.ok(Math.abs(p.cumulativeGain - (p.year1Gain + 2 * p.gainMid)) <= 1);
  assert.equal(p.roiMultiple, Math.round(p.cumulativeGain / p.budget * 10) / 10);
});

test('stok: adet girilirse birim maliyetten, girilmezse lead time ile tahmin', () => {
  const byLt = computeQla({ ...base, leadTimeDays: 20, annualVolume: 1_000_000 });
  assert.equal(byLt.inventory.source, 'lead time');
  // (250M + 0.5 × 140M) / 365 × 20 takvim günü = 17.53M; × %30 taşıma
  assert.equal(byLt.inventory.value, Math.round(320_000_000 / 365 * 20));
  assert.equal(byLt.lossByKey.stok, Math.round(320_000_000 / 365 * 20 * 0.3));
  const byUnits = computeQla({ ...base, leadTimeDays: 20, annualVolume: 1_000_000, stockUnits: 50_000 });
  assert.equal(byUnits.inventory.source, 'stok adedi');
  // birim maliyet = (250M + 90M + 50M) / 1M = 390 → 50.000 × 390 = 19.5M
  assert.equal(byUnits.inventory.value, 19_500_000);
  assert.ok(byUnits.selected.cashRelease > 0);
});

test('kapasite büyüme fırsatı kayıp havuzuna eklenmez', () => {
  const a = computeQla({ ...base, oeePct: 60 });
  assert.ok(a.capacityUpside.hasData && a.capacityUpside.extraContribution > 0);
  const sum = a.losses.reduce((s, l) => s + l.amount, 0);
  assert.equal(sum, a.totalLoss);
});

test('OEE setup/arıza ile ayrıştırılır, kalite kaybı tekrar sayılmaz', () => {
  const q = computeQla({ ...base, oeePct: 62, setupTimePct: 12, breakdownPct: 8, scrapPct: 10, reworkPct: 8, setupPerWeek: 0 });
  assert.deepEqual(q.oeeBreakdown, { availability: 80, performance: 94.5, quality: 82 });
  const direct = q.bases.enerji + q.bases.bakim;
  // Talep kanıtı yok → yalnızca doğrudan maliyet (Enerji + Bakım), genel gider yok
  assert.equal(q.lossByKey.durus, Math.round(0.12 * direct));
  assert.equal(q.lossByKey.ariza, Math.round(0.08 * direct));
  // İlave kapasite havuz dışında fırsat olarak görünür
  assert.ok(q.capacityUpside.hasData && q.capacityUpside.inPool === 0);
  const setupCap = q.capacityLines.find(c => c.key === 'durus')!;
  assert.equal(setupCap.outputPct, 15); // %12 / %80 kullanılabilirlik
  assert.ok(q.laborDuringStops > 0);
});

test('plan açığı varsa (talep kanıtı) ilave kapasite havuza girer, plan açığıyla sınırlı', () => {
  const noDemand = computeQla({ ...base, oeePct: 62, setupTimePct: 12, breakdownPct: 8, setupPerWeek: 0 });
  const demand = computeQla({ ...base, oeePct: 62, setupTimePct: 12, breakdownPct: 8, setupPerWeek: 0, planRealizationPct: 72 });
  assert.ok(demand.lossByKey.durus > noDemand.lossByKey.durus);
  assert.ok(demand.capacityUpside.inPool > 0);
  // %98 plan → açık çok küçük → havuza giren kapasite sınırlanır
  const nearPlan = computeQla({ ...base, oeePct: 62, setupTimePct: 12, breakdownPct: 8, setupPerWeek: 0, planRealizationPct: 98 });
  assert.ok(nearPlan.capacityUpside.inPool < demand.capacityUpside.inPool);
  assert.ok(nearPlan.capacityUpside.extraContribution > 0);
});
