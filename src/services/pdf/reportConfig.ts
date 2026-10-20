// Yönetici raporu ayarları — her raporda aynı olan her şey burada (Gemba Tools yönetici raporuyla
// aynı tasarım dili). Firmaya özgü içerik (ad, tarih, skor, kayıp, bulgu) her zaman veriden gelir.

export const REPORT = {
  company: {
    legalName: 'GEMBA PARTNER MÜHENDİSLİK VE YAZILIM A.Ş.',
    website: 'www.gembapartner.com',
    email: 'info@gembapartner.com',
    addressLines: ['Esentepe Mh. Milangaz Cd. Monumento Plaza No:75/70', 'Kartal / İstanbul'],
    phones: ['+90 216 212 08 77', '+90 532 626 94 84'],
  },
  logo: { path: '/report/gemba-partner-logo.png', ratio: 571 / 144 },
  report: {
    kicker: 'SAHA ÖN DEĞERLENDİRME RAPORU',
    titleLines: ['Hızlı Kayıp', 'Analizi (QLA)'],
    subtitle: 'Yönetici Raporu',
    footerName: 'Saha Ön Değerlendirme Raporu',
    footerConfidential: 'GİZLİ — Yalnızca yönetim kullanımı içindir',
    confidentiality: 'GİZLİ — Yalnızca {firma} yönetimi ile paylaşılmak üzere hazırlanmıştır.',
    version: '1.0',
  },
};

// Renkler (Gemba Tools report.css ile aynı)
export const COLOR = {
  ink: '#1B2430',
  muted: '#66717E',
  line: '#E3E6EA',
  soft: '#F5F6F8',
  red: '#D7141A',
  good: '#2F6FA8',
  bad: '#C8373B',
  coverGrey: '#ECEDEF',
  white: '#FFFFFF',
  amber: '#D9822B',
  green: '#3A9A5B',
};

// QLA olgunluk seviyeleri (17 kriter × 0–3 = 51 puan; program önerisiyle aynı eşikler)
export const MATURITY_LEVELS = [
  { name: 'Başlangıç', min: 0, max: 12, color: '#C8373B' },
  { name: 'Gelişen', min: 13, max: 25, color: '#D9822B' },
  { name: 'Yapılanmış', min: 26, max: 40, color: '#E3C35A' },
  { name: 'İleri', min: 41, max: 51, color: '#3A9A5B' },
];
export const MATURITY_MAX = 51;

export const levelOf = (score: number) =>
  MATURITY_LEVELS.find(l => score >= l.min && score <= l.max) ?? MATURITY_LEVELS[0];

// Kayıp kalemine göre yönetici özetindeki öncelikli aksiyon metni
export const ACTION_BY_LOSS: Record<string, { act: string; desc: string }> = {
  hurda: { act: 'Hurda ve fire kök neden analizi', desc: 'Süreç kontrol ve Poka-Yoke ile hatalı parçanın kaynağında önlenmesi.' },
  kalite: { act: 'Tamir / rework azaltma programı', desc: 'Kök neden analizi ve standart iş ile yeniden işleme yükünün düşürülmesi.' },
  mesai: { act: 'Hat dengeleme ve kapasite planlama', desc: 'Fazla mesai ihtiyacını doğuran dengesizliklerin giderilmesi.' },
  iscilik: { act: 'Standart iş ve hat dengeleme', desc: 'Bekleme, taşıma ve arama kayıplarının 5S ve standart iş ile azaltılması.' },
  durus: { act: 'SMED ile model değişim süresinin kısaltılması', desc: 'İç/dış setup adımlarının ayrıştırılıp standartlaştırılması.' },
  ariza: { act: 'Otonom ve planlı bakım (TPM)', desc: 'Arıza duruşlarının günlük bakım listeleri ve MTBF takibiyle azaltılması.' },
  kapasite: { act: 'OEE takibi ve darboğaz yönetimi', desc: 'Darboğaz ekipmanda kayıpların vardiya bazında ölçülüp giderilmesi.' },
  stok: { act: 'Akış ve stok azaltma (Kanban)', desc: 'Bekleyen mamul ve ara stoğun düşürülerek nakdin serbest bırakılması.' },
};
