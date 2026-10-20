// ─── GEMBA QLA HESAP MOTORU ─────────────────────────────────────────────────
// Tek kaynak: kayıp havuzu, paket geri kazanımları, geri ödeme ve KPI hedefleri.
// Tüm tutarlar seçili para biriminde, yıllıktır. React'tan bağımsızdır, test edilebilir.

export type LossKey = 'hurda' | 'kalite' | 'mesai' | 'iscilik' | 'durus' | 'ariza' | 'kapasite' | 'stok';
export type PackageId = 'kocluk' | 'standart' | 'hizli' | 'donusum' | 'opmuk';

// ─── VARSAYIMLAR (tek yerden düzenlenir) ────────────────────────────────────
export const ASSUMPTIONS = {
  /** Hurda parçada kaybolan işçilik+enerji payı (ortalama işlenmişlik derecesi) */
  scrapConversionShare: 0.5,
  /** Yeniden işlenen parçanın, ilk işlemeye göre tükettiği işçilik+enerji oranı */
  reworkEffort: 0.5,
  /** Fazla mesainin kayıp sayılan kısmı: %50 mesai primi (saatler zaten üretime gidiyor) */
  overtimePremium: 0.5,
  /** Makine başına yıllık çalışma saati (2 vardiya ≈ 250 gün × 16 saat) */
  machineHoursPerYear: 4000,
  /** Yılda aktif üretim haftası */
  weeksPerYear: 50,
  /** Aylık brüt maliyetten saatlik işçiliğe geçiş */
  hoursPerMonth: 180,
  /** OEE için dünya standardı hedef */
  oeeTarget: 85,
  /** OEE bileşenleri girildiğinde performans için dünya standardı */
  performanceTarget: 0.95,
  /** Bu değerin altındaki ayrıştırılmış performans veri tutarsızlığına işaret eder */
  minPlausiblePerformance: 0.75,
  /** Kayıp havuzu belirsizlik bandı (±) — QLA kabul edilen sapma */
  lossBand: 0.2,
  /** Tecrübe: benzer firmalarda toplam kayıp cironun %8–20'si arasında çıkar (referans, sınır değil) */
  typicalLossPctOfTurnover: [8, 20] as [number, number],
  /** Tam kapsamlı programda hedeflenen iyileştirme havuzu: toplam kaybın %25–35'i.
   *  Band içindeki konumu olgunluk skoru belirler (düşük olgunluk → üst uç). */
  recoveryBand: [0.25, 0.35] as [number, number],
  /** Bu sürenin üzerindeki geri ödemede danışmana daha küçük bir giriş paketi hatırlatılır (ay) — bilgi amaçlı */
  longPaybackMonths: 24,
  /** Stok değeri cironun bu oranını aşarsa giriş hatası sayılır */
  maxStockShareOfTurnover: 0.6,
  /** Toplam kayıp cironun bu oranını aşarsa veri hatası uyarısı */
  maxLossShareOfTurnover: 0.5,
  /** Ciro × işçilik oranı ile kişi × maliyet arasındaki fark bu oranı aşarsa uyarı */
  laborMismatchTolerance: 0.5,
  /** Lead time takvim günü girildiği için Little Kanunu'nda yıl 365 gün alınır */
  calendarDaysPerYear: 365,
  /** Stok taşıma maliyeti (finansman + depolama + eskime), yıllık — TL'de faiz yüksek */
  carryingRate: { TRY: 0.30, other: 0.12 } as Record<string, number>,
  /** Kazanç kaç yıl sürdürülür (ürün/ürün grubu üretimde kaldıkça) */
  defaultSustainYears: 3,
  /** İlk 4 ayda kademeli devreye alma → 1. yıl kazancı yıllık kazancın %87,5'i */
  year1RampFactor: (0.25 + 0.5 + 0.75 + 9) / 12,
};

// ─── PAKETLER: adam-gün ve toplam kayıp havuzundan geri kazanım aralığı ─────
export interface PackageDef {
  id: PackageId;
  name: string;
  days: number;
  /** Paketin hedef iyileştirme bandını (%25–35) ne ölçüde kapsadığı; 1 = tam kapsamlı program */
  coverage: number;
  /** Toplam kayıp havuzunun yıllık geri kazanım oranı [min, max] = recoveryBand × coverage */
  recovery: [number, number];
  /** Benzer projelerde ORTALAMA gerçekleşen geri ödeme süresi, ay [min, max].
   *  Referanstır, hedef/zorunluluk değildir: sektör ve ürün yapısına göre çok daha kısa veya uzun olabilir. */
  avgPayback: [number, number];
  /** Paketle hedeflenen KPI iyileşmeleri (% değişim; OEE için mutlak puan) */
  kpi: { setup: number; leadTime: number; copq: number; productivity: number; oeePoints: number };
  focus: string;
}

type PackageSeed = Omit<PackageDef, 'recovery'>;
const PACKAGE_SEEDS: PackageSeed[] = [
  { id: 'kocluk', name: 'Eğitim ve Koçluk Programı', days: 24, coverage: 0.35, avgPayback: [5, 6],
    kpi: { setup: 10, leadTime: 10, copq: 10, productivity: 5, oeePoints: 3 }, focus: 'Liderlik, Kaizen, hedeflere göre yönetim' },
  { id: 'standart', name: 'Standart Gelişim Programı', days: 52, coverage: 0.6, avgPayback: [5, 5.5],
    kpi: { setup: 20, leadTime: 20, copq: 15, productivity: 10, oeePoints: 5 }, focus: 'Darboğazda pilot, 5S, temel yalın' },
  { id: 'hizli', name: 'Hızlandırılmış Program', days: 104, coverage: 0.8, avgPayback: [3, 3.5],
    kpi: { setup: 35, leadTime: 30, copq: 25, productivity: 15, oeePoints: 8 }, focus: 'VSM, SMED, hat dengeleme, hücresel akış' },
  { id: 'donusum', name: 'Dönüşüm Liderliği Programı', days: 156, coverage: 1.0, avgPayback: [2, 2.5],
    kpi: { setup: 45, leadTime: 40, copq: 35, productivity: 20, oeePoints: 12 }, focus: 'Yaygınlaştırma, TPM, saha liderliği' },
  { id: 'opmuk', name: 'Operasyonel Mükemmellik Programı', days: 208, coverage: 1.15, avgPayback: [1, 1.5],
    kpi: { setup: 50, leadTime: 50, copq: 40, productivity: 25, oeePoints: 15 }, focus: 'Uçtan uca değer zinciri, WCM' },
];

const round3 = (n: number) => Math.round(n * 1000) / 1000;
export const PACKAGES: PackageDef[] = PACKAGE_SEEDS.map(p => ({
  ...p,
  recovery: [round3(ASSUMPTIONS.recoveryBand[0] * p.coverage), round3(ASSUMPTIONS.recoveryBand[1] * p.coverage)],
}));

export const packageByDays = (days: number): PackageDef | undefined => PACKAGES.find(p => p.days === days);
export const packageById = (id: string): PackageDef | undefined => PACKAGES.find(p => p.id === id);

/** Kategorinin yalın araçlara tepki hızı — paket kazancının kategorilere dağıtımında kullanılır */
const RESPONSE: Record<LossKey, number> = {
  durus: 1.3, mesai: 1.2, iscilik: 1.0, hurda: 0.9, kalite: 0.9, ariza: 1.0, kapasite: 0.8, stok: 1.0,
};

export const LOSS_LABELS: Record<LossKey, string> = {
  hurda: 'Hurda & Fire',
  kalite: 'Yeniden İşleme (Rework)',
  mesai: 'Fazla Mesai Primi',
  iscilik: 'İşçilik Verimsizliği',
  durus: 'Setup / Model Değişimi',
  ariza: 'Arıza / Plansız Duruş',
  kapasite: 'OEE Kapasite Kaybı',
  stok: 'Stok Taşıma Maliyeti',
};

export const LOSS_TOOLS: Record<LossKey, string> = {
  hurda: 'Süreç kontrol, Poka-Yoke',
  kalite: 'Kök neden analizi, standart iş',
  mesai: 'Hat dengeleme, kapasite planlama',
  iscilik: 'Standart iş, 5S, hat dengeleme',
  durus: 'SMED',
  ariza: 'TPM: otonom & planlı bakım',
  kapasite: 'TPM, OEE takibi, darboğaz yönetimi',
  stok: 'Akış, Kanban, lead time kısaltma',
};

// ─── GİRDİ / ÇIKTI TİPLERİ ──────────────────────────────────────────────────
export interface CostStructurePct {
  malzeme: number; iscilik: number; enerji: number; bakim: number; genel: number;
}

export interface QlaInput {
  turnover: number;
  /** Ciroya oran olarak maliyet yapısı (%) — boş alanlar sektör varsayılanından gelir */
  costPct: CostStructurePct;
  costFromSector?: boolean;
  scrapPct: number;
  reworkPct: number;
  overtimePct: number;
  plannedEffPct: number;
  actualEffPct: number;
  oeePct: number;
  setupPerWeek: number;
  setupMinutes: number;
  setupMachines: number;
  setupOperators: number;
  /** Opsiyonel: setup'ın planlı üretim süresine oranı (%) — sıklık/süre yerine */
  setupTimePct?: number;
  /** Opsiyonel: arızaların planlı üretim süresine oranı (%) */
  breakdownPct?: number;
  /** Opsiyonel: plana göre gerçekleşen üretim (%). <100 ise talep var kabul edilir → ilave kapasite havuza girer */
  planRealizationPct?: number;
  /** Operatör başı aylık tam yüklü işçilik maliyeti */
  laborCostMonthly: number;
  operators: number;
  /** Sipariş → sevkiyat lead time (gün); stok değeri tahmini için */
  leadTimeDays?: number;
  /** Yıllık üretim hacmi (adet/ton…); birim maliyet için */
  annualVolume?: number;
  /** Opsiyonel: toplam stok DEĞERİ (hammadde + yarı mamul + mamul), seçili para biriminde. Öncelikli kaynak. */
  stockValue?: number;
  /** Eski kayıtlar için: stok miktarı (üretim birimi). stockValue yoksa birim maliyetle değerlenir. */
  stockUnits?: number;
  /** Para birimi (stok taşıma oranı için) */
  currency?: string;
  /** Kazancın sürdürüleceği yıl sayısı */
  sustainYears?: number;
  /** Olgunluk skoruna göre önerilen paketin adam-günü */
  recommendedDays: number;
  /** Olgunluk skoru (0–51): geri kazanımın band içindeki konumunu belirler; yoksa band ortası */
  maturityScore?: number;
  /** Adam-güne göre proje bütçesi (indirimler dahil, seçili para birimi) */
  budgetOf: (days: number) => number;
  /** Seçilen paket (yoksa önerilen) */
  selectedPackageId?: string;
  /** Hassasiyet simülatörü: hedef kazancın gerçekleşme oranı (0-1) */
  successRate?: number;
}

export interface LossLine {
  key: LossKey;
  label: string;
  amount: number;
  hasData: boolean;
  formula: string;
  missing?: string;
}

export interface PackageResult {
  def: PackageDef;
  budget: number;
  gainMin: number;
  gainMax: number;
  gainMid: number;
  paybackFastMonths: number;
  paybackExpMonths: number;
  paybackSlowMonths: number;
  /** İlk yıl kazancı (kademeli devreye alma dahil) */
  year1Gain: number;
  /** sustainYears boyunca kümülatif kazanç */
  cumulativeGain: number;
  /** Kümülatif kazanç / bütçe */
  roiMultiple: number;
  /** Ortalama gerçekleşen süreye göre konum (yargı değil, karşılaştırma) */
  paybackVsAvg: 'daha-hizli' | 'ortalama' | 'daha-uzun';
  /** Seçili pakette lead time kısalmasıyla serbest kalan stok (tek seferlik nakit) */
  cashRelease: number;
  recommended: boolean;
}

export interface OpportunityLine {
  key: LossKey;
  label: string;
  tool: string;
  loss: number;
  pctMin: number;
  pctMax: number;
  gainMin: number;
  gainMax: number;
}

export interface QlaResult {
  bases: { malzeme: number; iscilik: number; enerji: number; bakim: number; genel: number; laborFromHeadcount: boolean };
  losses: LossLine[];
  lossByKey: Record<LossKey, number>;
  totalLoss: number;
  totalLossMin: number;
  totalLossMax: number;
  lossPctOfTurnover: number;
  /** OEE bileşenleri (setup/arıza girildiyse) */
  oeeBreakdown?: { availability: number; performance: number; quality: number };
  /** Beklenen kazancın paket aralığındaki konumu (0 = alt uç, 1 = üst uç) */
  bandPosition: number;
  setup: { annualSetups: number; annualHours: number; laborPart: number; fixedPart: number };
  inefficiencyHours: number;
  packages: PackageResult[];
  recommended: PackageResult;
  selected: PackageResult;
  opportunities: OpportunityLine[];
  breakEven: { month: number; cumSavings: number; cumCost: number; netFlow: number }[];
  breakEvenMonth: number;
  inventory: { value: number; source: 'stok değeri' | 'stok adedi' | 'lead time' | 'yok'; unitCost: number; carryingRate: number };
  /** Kapasite büyüme fırsatı — talep varsa ek kâr; ROI'ye dahil edilmez */
  capacityUpside: { hasData: boolean; freedPct: number; extraRevenue: number; extraContribution: number; contributionPct: number; demandEvidence: boolean; inPool: number };
  /** Zaman kayıplarının ilave kapasite etkisi (kalem bazında) */
  capacityLines: { key: LossKey; label: string; outputPct: number; extraUnits: number; contribution: number; inPool: number }[];
  /** Setup/arızada operatör zamanı — havuz dışı ek fırsat */
  laborDuringStops: number;
  sustainYears: number;
  /** Önerilen paketin geri ödemesi uzunsa, makul geri ödemeli en büyük küçük paket */
  affordableAlternative?: PackageResult;
  warnings: string[];
}

const r = (n: number) => Math.round(n);
const pos = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
const payback = (budget: number, gain: number) => (gain > 0 ? Math.round((budget / gain) * 12 * 10) / 10 : 0);

// ─── ANA HESAP ──────────────────────────────────────────────────────────────
export function computeQla(input: QlaInput): QlaResult {
  const A = ASSUMPTIONS;
  const C = pos(input.turnover);
  const warnings: string[] = [];

  // 1) Maliyet tabanları (ciro × oran)
  const pct = input.costPct;
  const costSum = pos(pct.malzeme) + pos(pct.iscilik) + pos(pct.enerji) + pos(pct.bakim) + pos(pct.genel);
  if (costSum > 100) warnings.push(`Maliyet oranları toplamı %${Math.round(costSum)} — ciroyu aşıyor, oranları kontrol edin.`);

  const malzeme = C * pos(pct.malzeme) / 100;
  let iscilik = C * pos(pct.iscilik) / 100;
  let laborFromHeadcount = false;
  if (iscilik === 0 && pos(input.operators) && pos(input.laborCostMonthly)) {
    iscilik = input.operators * input.laborCostMonthly * 12;
    laborFromHeadcount = true;
  }
  const laborByHeadcount = pos(input.operators) * pos(input.laborCostMonthly) * 12;
  if (!laborFromHeadcount && iscilik > 0 && laborByHeadcount > 0) {
    const ratio = iscilik / laborByHeadcount;
    if (ratio > 1 + A.laborMismatchTolerance || ratio < 1 / (1 + A.laborMismatchTolerance)) {
      warnings.push(`İşçilik tabanı tutarsız: ciro × işçilik oranı = ${Math.round(iscilik).toLocaleString('tr-TR')}, operatör × aylık maliyet × 12 = ${Math.round(laborByHeadcount).toLocaleString('tr-TR')} (${Math.round(ratio * 10) / 10} kat). İşçilik oranı taşeron/endirekt işçilik içeriyorsa doğrudur; içermiyorsa oranı düzeltin — işçilik kaynaklı kayıplar bu tabandan hesaplanıyor.`);
    }
  }
  const enerji = C * pos(pct.enerji) / 100;
  const bakim = C * pos(pct.bakim) / 100;
  const genel = C * pos(pct.genel) / 100;
  const fixed = bakim + genel;

  const lines: LossLine[] = [];
  const add = (key: LossKey, amount: number, hasData: boolean, formula: string, missing?: string) =>
    lines.push({ key, label: LOSS_LABELS[key], amount: hasData ? r(pos(amount)) : 0, hasData, formula, missing });

  // 2) Hurda: hammadde + işlenmişlik payı
  const scrap = pos(input.scrapPct) / 100;
  add('hurda', scrap * (malzeme + A.scrapConversionShare * (iscilik + enerji)), scrap > 0 && C > 0,
    `Hurda %${input.scrapPct} × (Malzeme + %${A.scrapConversionShare * 100} × (İşçilik + Enerji))`, 'Hurda oranı');

  // 3) Rework: yeniden işleme işçilik + enerji tüketir
  const rework = pos(input.reworkPct) / 100;
  add('kalite', rework * A.reworkEffort * (iscilik + enerji), rework > 0 && C > 0,
    `Rework %${input.reworkPct} × %${A.reworkEffort * 100} × (İşçilik + Enerji)`, 'Rework oranı');

  // 4) Fazla mesai: sadece prim kısmı kayıptır
  const ot = pos(input.overtimePct) / 100;
  add('mesai', ot * A.overtimePremium * iscilik, ot > 0 && iscilik > 0,
    `İşçilik × Mesai %${input.overtimePct} × %${A.overtimePremium * 100} prim`, 'Fazla mesai oranı');

  // 5) İşçilik verimsizliği
  const planned = pos(input.plannedEffPct);
  const actual = pos(input.actualEffPct);
  const effGap = planned > 0 && actual > 0 ? Math.max(0, (planned - actual) / planned) : 0;
  // Satır, zaman kayıpları hesaplandıktan sonra eklenir (kapasiteyle örtüşen pay düşülür) — bkz. "İşçilik ↔ kapasite örtüşmesi"
  const inefficiencyHours = pos(input.operators) * A.hoursPerMonth * 12 * effGap;

  // 6–7) ZAMAN KAYIPLARI (setup, arıza, OEE performans)
  //  • Doğrudan maliyet: kayıp süre payı × (Enerji + Bakım) — makine çalışır/beklerken tüketir; genel gider dahil edilmez
  //  • İlave kapasite: kayıp süre geri kazanılırsa üretilebilecek ek ürün × katkı payı.
  //    Talep kanıtı (plana göre gerçekleşen üretim < %100) varsa plan açığı kadarı havuza girer; yoksa fırsat olarak gösterilir.
  //  • Operatör zamanı: setup/arızada operatör genelde boşta kalmaz → havuz dışı "ek fırsat"
  const machines = pos(input.setupMachines);
  const annualSetups = pos(input.setupPerWeek) * A.weeksPerYear * machines;
  const annualHours = annualSetups * pos(input.setupMinutes) / 60;
  const hourlyLabor = pos(input.laborCostMonthly) / A.hoursPerMonth;
  const setupLabor = annualHours * pos(input.setupOperators) * hourlyLabor;
  const setupTimePct = pos(input.setupTimePct ?? 0);
  // Setup süre oranı doğrudan verilmişse o kullanılır; yoksa sıklık × süre / makine saati
  const setupShare = setupTimePct > 0 ? Math.min(1, setupTimePct / 100)
    : machines > 0 ? Math.min(1, annualHours / (machines * A.machineHoursPerYear)) : 0;
  const oee = pos(input.oeePct);
  const breakdownShare = Math.min(1, pos(input.breakdownPct ?? 0) / 100);
  const oeeGapShare = oee > 0 && oee < A.oeeTarget ? (A.oeeTarget - oee) / A.oeeTarget : 0;
  // Kullanılabilirlik bileşenleri bilinirse OEE ayrıştırılır (OEE = K × P × Kalite); kalite kaybı hurda/rework'te sayılır
  const decomposed = oee > 0 && (setupTimePct > 0 || breakdownShare > 0);
  const availability = Math.max(0.05, 1 - setupShare - breakdownShare);
  const qualityRate = Math.max(0.05, 1 - (scrap + rework));
  const performance = decomposed ? Math.min(1, oee / 100 / (availability * qualityRate)) : 0;

  // Her zaman kaybı için: süre payı (doğrudan maliyet) ve geri kazanılınca ek çıktı oranı
  const timeLoss = {
    durus: { share: setupShare, outputFrac: setupShare > 0 ? setupShare / availability : 0, hasData: annualHours > 0 || setupTimePct > 0 },
    ariza: { share: breakdownShare, outputFrac: breakdownShare > 0 ? breakdownShare / availability : 0, hasData: breakdownShare > 0 },
    kapasite: decomposed
      ? { share: Math.max(0, A.performanceTarget - performance) * availability, outputFrac: performance > 0 && performance < A.performanceTarget ? (A.performanceTarget - performance) / performance : 0, hasData: performance < A.performanceTarget }
      : { share: Math.max(0, oeeGapShare - setupShare), outputFrac: oee > 0 ? Math.max(0, (A.oeeTarget - oee) / oee - setupShare / (oee / 100)) : 0, hasData: oeeGapShare > 0 },
  };
  const contributionPct = C > 0 ? Math.max(0, 1 - (malzeme + enerji) / C) : 0;
  const planPct = pos(input.planRealizationPct ?? 0);
  const demandEvidence = planPct > 0 && planPct < 100;
  const planGapFrac = demandEvidence ? 100 / planPct - 1 : 0;
  const totalOutputFrac = timeLoss.durus.outputFrac + timeLoss.ariza.outputFrac + timeLoss.kapasite.outputFrac;
  const capScale = demandEvidence && totalOutputFrac > 0 ? Math.min(1, planGapFrac / totalOutputFrac) : 0;
  const capacityLines: QlaResult['capacityLines'] = [];
  const addTimeLoss = (key: 'durus' | 'ariza' | 'kapasite', basis: string, missing: string) => {
    const t = timeLoss[key];
    const direct = t.share * (enerji + bakim);
    const extraUnitsFrac = t.outputFrac;
    const capValue = C * extraUnitsFrac * contributionPct;
    const inPool = capValue * capScale;
    if (t.hasData && extraUnitsFrac > 0) {
      capacityLines.push({
        key, label: LOSS_LABELS[key], outputPct: Math.round(extraUnitsFrac * 1000) / 10,
        extraUnits: pos(input.annualVolume ?? 0) > 0 ? Math.round(pos(input.annualVolume ?? 0) * extraUnitsFrac) : 0,
        contribution: r(capValue), inPool: r(inPool),
      });
    }
    add(key, direct + inPool, t.hasData && (enerji + bakim > 0 || inPool > 0),
      `${basis} × (Enerji + Bakım)` + (inPool > 0 ? ` + ilave kapasite %${Math.round(extraUnitsFrac * 1000) / 10} × katkı payı %${Math.round(contributionPct * 100)}${capScale < 1 ? ` (plan açığıyla sınırlı, %${Math.round(capScale * 100)})` : ''}` : ''),
      missing);
  };
  addTimeLoss('durus', setupTimePct > 0 && annualHours === 0 ? `Setup süre payı %${setupTimePct}` : `Setup süre payı %${Math.round(setupShare * 1000) / 10} (saat / makine saati)`, 'Setup sıklığı/süresi veya setup süre oranı');
  addTimeLoss('ariza', `Arıza süre payı %${input.breakdownPct}`, 'Arıza süre oranı');
  addTimeLoss('kapasite', decomposed
    ? `Performans %${Math.round(performance * 1000) / 10} (OEE %${oee} / (K %${Math.round(availability * 100)} × Kalite %${Math.round(qualityRate * 100)})) → hedef %${A.performanceTarget * 100}`
    : `(Hedef OEE %${A.oeeTarget} − OEE %${oee}) / %${A.oeeTarget} − setup payı`, 'OEE');

  // İşçilik ↔ kapasite örtüşmesi: aynı kayıp süre ya ek üretime (katkı payı, işçilik dahil) ya da işçilik tasarrufuna
  // dönüşür, ikisine birden değil. Havuza giren ek çıktı f ise, aynı kadroyla f oranında fazla üretim
  // f/(1+f) kadar işçilik verimliliği geri kazanımına eşittir → işçilik kaleminden düşülür.
  const capacityOutputInPool = capScale * totalOutputFrac;
  const laborOverlap = capacityOutputInPool / (1 + capacityOutputInPool);
  const laborGapNet = Math.max(0, effGap - laborOverlap);
  add('iscilik', iscilik * laborGapNet, effGap > 0 && iscilik > 0,
    `İşçilik × (Planlanan %${planned} − Gerçekleşen %${actual}) / Planlanan` +
      (laborOverlap > 0 ? ` − ilave kapasiteyle örtüşen %${Math.round(laborOverlap * 1000) / 10} (çifte sayım düşüldü)` : ''),
    'Planlanan/gerçekleşen verimlilik');

  // Tutarlılık: setup/arıza girildiğinde performans çok düşük çıkıyorsa veriler birbirini tutmuyor olabilir
  if (decomposed && performance < A.minPlausiblePerformance) {
    warnings.push(`Bilgi: OEE %${oee}, setup %${Math.round(setupShare * 1000) / 10} ve arıza %${Math.round(breakdownShare * 1000) / 10} ile performans %${Math.round(performance * 1000) / 10} çıkıyor (makineler normal hızın altında). Setup/arıza oranları eksik girilmiş ya da OEE düşük ölçülmüş olabilir — müşteriyle teyit edin.`);
  }

  // Duruşlarda operatör zamanı — havuz dışı ek fırsat
  const laborDuringStops = setupLabor > 0 ? setupLabor + breakdownShare * iscilik : (setupShare + breakdownShare) * iscilik;

  // 8) Stok taşıma maliyeti: stok değeri × yıllık taşıma oranı
  //    Stok değeri = stok adedi × birim maliyet; stok adedi yoksa Little Kanunu: günlük üretim maliyeti × lead time
  const volume = pos(input.annualVolume ?? 0);
  const variableCost = malzeme + iscilik + enerji;
  const unitCost = volume > 0 ? variableCost / volume : 0;
  const stockValue = pos(input.stockValue ?? 0);
  const stockUnits = pos(input.stockUnits ?? 0);
  const lt = pos(input.leadTimeDays ?? 0);
  let invValue = 0;
  let invSource: QlaResult['inventory']['source'] = 'yok';
  if (stockValue > 0) {
    invValue = stockValue;
    invSource = 'stok değeri';
  } else if (stockUnits > 0 && unitCost > 0) {
    invValue = stockUnits * unitCost;
    invSource = 'stok adedi';
  }
  // Akıl kontrolü: stok cironun %60'ını aşıyorsa giriş hatası (adet ↔ TL karışması) kabul edilir, lead time'a dönülür
  if (invValue > 0 && C > 0 && invValue > A.maxStockShareOfTurnover * C) {
    warnings.push(`Stok değeri ${Math.round(invValue).toLocaleString('tr-TR')} hesaplandı (cironun ${Math.round(invValue / C * 10) / 10} katı) — giriş hatası olabilir (adet yerine tutar ya da tersi). Stok hesabı yok sayıldı; stok değerini para birimi olarak girin.`);
    invValue = 0;
    invSource = 'yok';
  }
  if (invSource === 'yok' && lt > 0 && C > 0) {
    // Malzeme süreç başında, işçilik/enerji süreç boyunca eklenir → ortalama değer malzeme + ½ dönüşüm
    invValue = (malzeme + 0.5 * (iscilik + enerji)) / A.calendarDaysPerYear * lt;
    invSource = 'lead time';
  }
  const carryingRate = A.carryingRate[input.currency ?? 'TRY'] ?? A.carryingRate.other;
  add('stok', invValue * carryingRate, invValue > 0,
    invSource === 'stok değeri'
      ? `Stok değeri ${Math.round(stockValue).toLocaleString('tr-TR')} × %${Math.round(carryingRate * 100)} taşıma`
      : invSource === 'stok adedi'
      ? `Stok ${stockUnits.toLocaleString('tr-TR')} birim × birim maliyet (Malzeme+İşçilik+Enerji / hacim) × %${Math.round(carryingRate * 100)} taşıma`
      : `(Malzeme + ½ (İşçilik + Enerji)) / ${A.calendarDaysPerYear} gün × Lead time ${lt} takvim günü × %${Math.round(carryingRate * 100)} taşıma`,
    'Lead time veya stok adedi');

  const ORDER: LossKey[] = ['hurda', 'kalite', 'mesai', 'iscilik', 'durus', 'ariza', 'kapasite', 'stok'];
  lines.sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key));
  const lossByKey = Object.fromEntries(lines.map(l => [l.key, l.amount])) as Record<LossKey, number>;
  const totalLoss = lines.reduce((s, l) => s + l.amount, 0);
  if (C > 0 && totalLoss > A.maxLossShareOfTurnover * C) {
    warnings.unshift(`UYARI: Toplam kayıp cironun %${Math.round(totalLoss / C * 100)}'i — veri giriş hatası olmalı (birim, nokta/virgül veya yanlış alan). Girdileri kontrol edin.`);
  }
  if (input.costFromSector) warnings.push('Maliyet yapısı sektör ortalamasından alındı (müşteri verisi değil); toplantıda müşterinin kendi oranlarını teyit edin.');
  const missing = lines.filter(l => !l.hasData).map(l => l.missing);
  if (missing.length) warnings.push(`Veri girilmediği için hesaba katılmadı: ${missing.join(', ')}.`);

  // 9) Paketler — beklenen kazanç band içinde olgunluğa göre konumlanır (düşük olgunluk = yüksek potansiyel)
  const bandPosition = input.maturityScore === undefined ? 0.5
    : Math.min(1, Math.max(0, 1 - input.maturityScore / 51));
  if (C > 0 && totalLoss > 0) {
    const [lo, hi] = A.typicalLossPctOfTurnover;
    const pctTurn = totalLoss / C * 100;
    if (pctTurn < lo) warnings.push(`Bilgi: kayıp havuzu cironun %${Math.round(pctTurn * 10) / 10}'i — benzer firmalarda tipik %${lo}–${hi}. Eksik veri (OEE, setup, stok…) havuzu küçük gösteriyor olabilir.`);
    else if (pctTurn > hi) warnings.push(`Bilgi: kayıp havuzu cironun %${Math.round(pctTurn * 10) / 10}'i — tipik %${lo}–${hi} aralığının üstünde; varsayımları müşteriyle teyit edin.`);
  }
  const sustainYears = Math.max(1, Math.round(input.sustainYears ?? A.defaultSustainYears));
  const packages: PackageResult[] = PACKAGES.map(def => {
    const budget = r(pos(input.budgetOf(def.days)));
    const gainMin = r(totalLoss * def.recovery[0]);
    const gainMax = r(totalLoss * def.recovery[1]);
    const gainMid = r(gainMin + (gainMax - gainMin) * bandPosition);
    const year1Gain = r(gainMid * A.year1RampFactor);
    const cumulativeGain = r(year1Gain + gainMid * (sustainYears - 1));
    const paybackExpMonths = payback(budget, gainMid);
    const paybackVsAvg: PackageResult['paybackVsAvg'] =
      paybackExpMonths > 0 && paybackExpMonths < def.avgPayback[0] ? 'daha-hizli'
      : paybackExpMonths > 0 && paybackExpMonths <= def.avgPayback[1] ? 'ortalama' : 'daha-uzun';
    return {
      def, budget, gainMin, gainMax, gainMid,
      paybackFastMonths: payback(budget, gainMax),
      paybackExpMonths,
      paybackSlowMonths: payback(budget, gainMin),
      year1Gain, cumulativeGain,
      roiMultiple: budget > 0 ? Math.round(cumulativeGain / budget * 10) / 10 : 0,
      paybackVsAvg,
      cashRelease: r(invValue * def.kpi.leadTime / 100),
      recommended: def.days === input.recommendedDays,
    };
  });
  const recommended = packages.find(p => p.recommended) ?? packages[1];
  const selected = (input.selectedPackageId && packages.find(p => p.def.id === input.selectedPackageId)) || recommended;

  let affordableAlternative: PackageResult | undefined;
  if (recommended.paybackExpMonths > A.longPaybackMonths || recommended.paybackExpMonths === 0) {
    affordableAlternative = [...packages]
      .filter(p => p.def.days < recommended.def.days && p.paybackExpMonths > 0 && p.paybackExpMonths <= A.longPaybackMonths)
      .sort((a, b) => b.def.days - a.def.days)[0];
    warnings.push(`Bilgi: önerilen ${recommended.def.name} için hesaplanan geri ödeme ${recommended.paybackExpMonths || '∞'} ay; kayıp havuzunu sahada doğrulayın.` +
      (affordableAlternative ? ` Giriş teklifi alternatifi: ${affordableAlternative.def.name} (${affordableAlternative.paybackExpMonths} ay).` : ''));
  }

  // 10) Seçili paketin kazancı kategorilere dağıtılır (toplam = paket aralığı, çifte sayım yok)
  const weighted = lines.map(l => ({ l, w: l.amount * RESPONSE[l.key] }));
  const wSum = weighted.reduce((s, x) => s + x.w, 0) || 1;
  const opportunities: OpportunityLine[] = weighted.map(({ l, w }) => {
    const gainMin = r(selected.gainMin * w / wSum);
    const gainMax = r(selected.gainMax * w / wSum);
    return {
      key: l.key, label: l.label, tool: LOSS_TOOLS[l.key], loss: l.amount,
      pctMin: l.amount > 0 ? Math.round(gainMin / l.amount * 100) : 0,
      pctMax: l.amount > 0 ? Math.round(gainMax / l.amount * 100) : 0,
      gainMin, gainMax,
    };
  });

  // 11) Kapasite fırsatı (havuz dışı): zaman kayıplarından açılan kapasitenin havuza girmeyen kısmı
  const capTotal = capacityLines.reduce((acc, c) => acc + c.contribution, 0);
  const capInPool = capacityLines.reduce((acc, c) => acc + c.inPool, 0);
  const freedPct = capacityLines.reduce((acc, c) => acc + c.outputPct, 0) / 100;
  const capacityUpside = {
    hasData: capTotal - capInPool > 0,
    freedPct: Math.round(freedPct * 1000) / 10,
    extraRevenue: r(C * freedPct * (capTotal > 0 ? (capTotal - capInPool) / capTotal : 0)),
    extraContribution: r(capTotal - capInPool),
    contributionPct: Math.round(contributionPct * 1000) / 10,
    demandEvidence,
    inPool: r(capInPool),
  };

  // 12) Başa baş: seçili paket, beklenen kazanç × başarı oranı
  const { curve: breakEven, month: breakEvenMonth } = breakEvenCurve(selected.budget, selected.gainMid * (input.successRate ?? 1));

  return {
    bases: { malzeme: r(malzeme), iscilik: r(iscilik), enerji: r(enerji), bakim: r(bakim), genel: r(genel), laborFromHeadcount },
    losses: lines,
    lossByKey,
    totalLoss,
    totalLossMin: r(totalLoss * (1 - A.lossBand)),
    totalLossMax: r(totalLoss * (1 + A.lossBand)),
    bandPosition: Math.round(bandPosition * 100) / 100,
    oeeBreakdown: decomposed ? {
      availability: Math.round(availability * 1000) / 10,
      performance: Math.round(performance * 1000) / 10,
      quality: Math.round(qualityRate * 1000) / 10,
    } : undefined,
    lossPctOfTurnover: C > 0 ? Math.round(totalLoss / C * 1000) / 10 : 0,
    setup: { annualSetups: r(annualSetups), annualHours: Math.round(annualHours * 10) / 10, laborPart: r(setupLabor), fixedPart: r(setupShare * (enerji + bakim)) },
    inefficiencyHours: r(inefficiencyHours),
    packages,
    recommended,
    selected,
    opportunities,
    breakEven,
    breakEvenMonth,
    affordableAlternative,
    inventory: { value: r(invValue), source: invSource, unitCost: Math.round(unitCost * 100) / 100, carryingRate },
    capacityUpside,
    capacityLines,
    laborDuringStops: r(laborDuringStops),
    sustainYears,
    warnings,
  };
}

/** Kazancın finansal katmanları — yönetici (CFO) bakışı:
 *  - profit: doğrudan faaliyet kârına iner (hurda, rework, fazla mesai, duruşların enerji/bakım payı)
 *  - capacity: açılan kapasite ve işgücü verimi; ancak satılır ya da ek işe alım önlenirse kâra döner
 *  - finance: stok taşıma maliyeti (finansman, depolama); ayrıca bir kerelik nakit serbest kalır
 *  Kalem payları qla.opportunities'ten (kazanç dağılımı) alınır, paketin aralığına ölçeklenir. */
export interface GainLayer { min: number; mid: number; max: number }
export interface GainSplit {
  profit: GainLayer;
  capacity: GainLayer;
  finance: GainLayer;
  oneTimeCash: number;
  total: GainLayer;
}

export function splitGain(q: QlaResult, pkg: PackageResult = q.recommended): GainSplit {
  const base = q.opportunities.reduce((acc, o) => acc + o.gainMin + o.gainMax, 0);
  const layers = { profit: 0, capacity: 0, finance: 0 };
  if (base > 0) {
    q.opportunities.forEach(o => {
      const share = (o.gainMin + o.gainMax) / base;
      if (o.key === 'stok') layers.finance += share;
      else if (o.key === 'iscilik') layers.capacity += share;
      else {
        const cap = q.capacityLines.find(cl => cl.key === o.key);
        const capFrac = cap && o.loss > 0 ? Math.min(1, cap.inPool / o.loss) : 0;
        layers.capacity += share * capFrac;
        layers.profit += share * (1 - capFrac);
      }
    });
  }
  const layer = (f: number): GainLayer => ({ min: r(pkg.gainMin * f), mid: r(pkg.gainMid * f), max: r(pkg.gainMax * f) });
  return {
    profit: layer(layers.profit),
    capacity: layer(layers.capacity),
    finance: layer(layers.finance),
    oneTimeCash: pkg.cashRelease,
    total: { min: pkg.gainMin, mid: pkg.gainMid, max: pkg.gainMax },
  };
}

/** 12 aylık kümülatif tasarruf eğrisi; ilk 4 ayda kademeli devreye alma. Başa baş 36 aya kadar aranır. */
export function breakEvenCurve(budget: number, annualGain: number) {
  const monthlyGain = annualGain / 12;
  const curve: { month: number; cumSavings: number; cumCost: number; netFlow: number }[] = [];
  let cum = 0;
  let month = 0;
  for (let m = 1; m <= 36; m++) {
    cum += monthlyGain * Math.min(1, m * 0.25);
    const netFlow = cum - budget;
    if (!month && netFlow >= 0 && budget > 0) month = m;
    if (m <= 12) curve.push({ month: m, cumSavings: Math.round(cum), cumCost: Math.round(budget), netFlow: Math.round(netFlow) });
  }
  return { curve, month };
}

/** Türkçe karakterleri sadeleştirerek küçük harfe çevirir (sektör eşleştirmesi için) */
export const normalizeTr = (s: string) =>
  (s || '').toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
