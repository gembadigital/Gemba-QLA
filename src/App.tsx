import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  ClipboardCheck, 
  Sparkles, 
  Coins, 
  Printer, 
  RotateCcw, 
  Info, 
  Check, 
  FileText, 
  TrendingUp, 
  Copy, 
  Briefcase, 
  RefreshCw, 
  Save,
  ArrowRight,
  ArrowLeft,
  TrendingDown,
  Percent,
  CheckCircle2,
  AlertCircle,
  Award,
  Activity,
  Layers,
  Sparkle,
  Gauge,
  HelpCircle,
  MapPin,
  Calendar,
  Users,
  Pocket,
  BadgeAlert,
  Sliders,
  DollarSign,
  Cpu,
  Clock,
  FileSpreadsheet,
  Maximize2,
  X,
  FileDown,
  Settings,
  LogOut,
  UserCheck
} from 'lucide-react';

import { RoiAnalyzer } from './components/RoiAnalyzer';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { GembaDB, safeStorage } from './db';
const localStorage = safeStorage;
import Dashboard from './components/Dashboard';
import SahaBulgulariPanel from './components/SahaBulgulariPanel';
import { ExportService } from './services/pdf';
import LoginPage from './components/LoginPage';
import { computeQla, LossKey, QlaInput, normalizeTr } from './engine/qla';

const appLogo = "/gemba_digital_logo.png";

// ─── BRAND LOGO COMPONENT ──────────────────────────────────────────────────
interface BrandLogoProps {
  collapsed?: boolean;
  className?: string;
}

function BrandLogo({ collapsed = false, className = "" }: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-2 select-none bg-transparent ${className}`}>
      <img 
        src={appLogo} 
        style={{ height: "40px", width: "auto", objectFit: "contain", verticalAlign: "middle" }} 
        alt="Gemba Digital Logo" 
      />
    </div>
  );
}

// ─── TYPES ─────────────────────────────────────────────────────────────────
interface Criterion {
  no: number;
  cat: string | null;
  text: string;
}

interface CriterionGroup {
  group: string;
  desc: string;
  color: string;
  icon: string;
  items: Criterion[];
}

interface ProgramOption {
  name: string;
  ag: number;
}

interface ProgramConfig {
  min: number;
  max: number;
  op1: ProgramOption;
  op2: ProgramOption;
}

// ─── CONSTANTS ─────────────────────────────────────────────────────────────
const CRITERIA: CriterionGroup[] = [
  { 
    group: "Yönetim & Strateji", 
    desc: "Hedef yayılımı, metrik yönetim ve kurumsal takip mekanizmaları",
    color: "rose",
    icon: "🎯",
    items: [
      { no: 1, cat: "Yönetim Süreçlerinin İzlenebilirliği", text: "Hedef yönetimi ve takip sistemi kurulmuştur. Yönetim süreçleri ölçülebilir şekilde izlenmektedir." },
      { no: 2, cat: "Operasyonel Faaliyet Raporlama", text: "Operasyonel süreçlerin takibi için bir birim kurulmuş, faaliyetler raporlarla takip edilmektedir." }
    ]
  },
  { 
    group: "Üretim & Akış", 
    desc: "Darboğaz yönetimi, OEE verimlilik takipleri ve operasyonel kayıplar",
    color: "amber",
    icon: "⚙️",
    items: [
      { no: 3, cat: "Değer Akışının Yönetimi", text: "Darboğazlar tespit edilip yönetilmektedir. Güncel akış iyileştirme çalışmaları yürütülmektedir." },
      { no: 4, cat: "Problem Çözme Takip", text: "Üretim verimliliğini etkileyen en büyük problemler takip edilip iyileştirilmektedir." },
      { no: 5, cat: "Operasyonel Maliyetlerin Takibi", text: "OEE ve alt kırılımları takip edilmekte, verimlilik problemleri iyileştirme programlarıyla çözülmektedir." },
      { no: 6, cat: "Maliyet Metrikleri Kontrolü", text: "Hurda, hata, fazla mesai, enerji, makine duruşları gibi maliyet unsurları metriklerle kontrol altındadır." }
    ]
  },
  { 
    group: "Görsel Fabrika & 5S", 
    desc: "Saha düzeni, görsel kontrol enstrümanları ve iş güvenliği kültürü",
    color: "sky",
    icon: "👁️",
    items: [
      { no: 7, cat: "Görsel Fabrika Kurulumu", text: "Görsel yönetim enstrümanları devreye alınmış, görsel ve işitsel kontrol sistemleri uygulanmaktadır." },
      { no: 8, cat: "5S Standartları", text: "5S adımları devreye alınmış, malzeme akışları ve alan tanımları belirli, hücre/hat içleri düzenlidir." },
      { no: 9, cat: "İş Sağlığı ve Güvenliği", text: "İş güvenliği faaliyetleri organizasyonla yönetilmektedir. Hedefler belirlenmiş, riskler takip edilmektedir." }
    ]
  },
  { 
    group: "Standart İş & WIP", 
    desc: "Hat denkleme süreçleri, çevrim süreleri ve ara stok hassasiyeti",
    color: "violet",
    icon: "📊",
    items: [
      { no: 10, cat: "Standart İş Uygulamaları", text: "Proseslerde standart iş uygulamaları görünmektedir, hat denge çalışmaları yapılmaktadır." },
      { no: 11, cat: "Kapasite & Çevrim Analizi", text: "Çevrim süreleri belirli, saatlik kapasite bazında üretim kayıp analizleri yapılabilmektedir." },
      { no: 12, cat: "Akış & WIP Yönetimi", text: "Üretim akışı belirli, tek parça akışına uygun yapı vardır. Tüm ara stoklar takip edilmektedir." }
    ]
  },
  { 
    group: "Saha Liderliği & Sürekli Gelişim", 
    desc: "Takım lideri gelişimleri, Kaizen fikir havuzu ve problem giderme",
    color: "emerald",
    icon: "🌱",
    items: [
      { no: 13, cat: "Saha Örgüt Yapısı", text: "Saha yönetimi için organizasyon kurulmuş, liderlerle birlikte mikro yönetim sağlanmaktadır." },
      { no: 14, cat: "Sürekli Gelişim Yaklaşımı", text: "Kaizen ve öneri sistemi uygulamaları mevcuttur. Önerilerin değerlendirildiği bir sistem kurulmuştur." },
      { no: 15, cat: "İleri İyileştirme Araçları", text: "Problem çözme çalışmaları ve 6 Sigma gibi temel iyileştirme araçları kullanılmaktadır." }
    ]
  },
  { 
    group: "Bakım Yönetimi", 
    desc: "Üretim hattı otonom bakım adımları, duruşlar ve MTTR / MTBF hedefleri",
    color: "indigo",
    icon: "🔧",
    items: [
      { no: 16, cat: "Planlı Bakım Yönetimi", text: "Bakım süreçleri tanımlanmış, MTTR/MTBF hedefleriyle yönetilmektedir. Organizasyon yapısı kurulmuştur." },
      { no: 17, cat: "Otonom Bakım Çalışmaları", text: "Otonom bakım uygulamaları devreye alınmış, çalışanlar tarafından ekipman iyileştirme çalışmaları yapılmaktadır." }
    ]
  }
];

const PROGRAMS: ProgramConfig[] = [
  { min: 0,  max: 12, op1: { name: "Dönüşüm Liderliği Programı", ag: 156 }, op2: { name: "Hızlandırılmış Program", ag: 104 } }, // Level 1
  { min: 13, max: 25, op1: { name: "Hızlandırılmış Program", ag: 104 }, op2: { name: "Standart Gelişim Programı", ag: 52 } }, // Level 2
  { min: 26, max: 40, op1: { name: "Standart Gelişim Programı", ag: 52 }, op2: { name: "Mevcut Değil", ag: 0 } },          // Level 3
  { min: 41, max: 51, op1: { name: "Eğitim ve Koçluk Programı", ag: 24 }, op2: { name: "Mevcut Değil", ag: 0 } }           // Level 4
];

const DESCS: Record<string, string> = {
  "Standart Gelişim Programı": "Darboğaz alanlar üzerinde temel yalın tekniklerin uygulanması ile pilot projeler öncelikli olarak devre alınır. İsraf kaynaklarını kurutup ilk büyük verimlilik ve hız kazanımlarını sahada somutlaştırmaya odaklanır. [Ziyaret Frekansı: 1 adam gün / hafta - 52 Adam gün / yıl]",
  "Hızlandırılmış Program": "Değer Akış Haritalama (VSM), SMED Hızlı Kalıp Değişim Metotları, Hücresel İmalat Akış Tasarımları, Hat Dengeleme Analizleri öncelikli olarak devreye alınır. Temel saha yönetim çalışmalarına ağırlık verilir. Akış hızını katlayarak teslim sürelerini ve israfları radikal seviyede aşağı çeker. [Ziyaret Frekansı: 2 adam gün / hafta - 104 Adam gün / yıl]",
  "Dönüşüm Liderliği Programı": "Akış Çalışmaları ve Darboğaz yönetimi ile birlikte sürecin tüm alanlara yaygınlaştırılması sağlanır. Saha yöneticilerinin Liderliği Ön plana alınır. Kurumsal sahiplenmeyi geliştirerek kazanımların kalıcı ve sürdürülebilir bir kültüre dönüşmesini garanti altına alır. [Ziyaret Frekansı: 3 adam gün / hafta - 156 Adam gün / yıl]",
  "Operasyonel Mükemmellik Programı": "Operasyon sahası öncelikli olmak üzere, operasyona etki eden direk ve endirek süreçlerin tamamını kapsayan, üst yönetim ile birlikte mükemmel süreçler oluşturmaya odaklanılır. Uçtan uca tüm değer zincirini kusursuzlaştırarak küresel düzeyde yüksek rekabetçi standartlar kurar. [Ziyaret Frekansı: 4 adam gün / hafta - 208 Adam gün / yıl]",
  "Eğitim ve Koçluk Programı": "Gelişmiş operasyonel performansın sürdürülebilirliği, liderlik yetkinlikleri ve sürekli gelişim (Kaizen) kültürü için özel mentorluk, hedeflere göre yönetim ve koçluk programları. [Ziyaret Frekansı: Esnek / Danışan Odaklı - 24 Adam gün / yıl]",
  "Mevcut Değil": "Bu düzeydeki operasyonel olgunluk seviyesi için alternatif bir çalışma planlanmamıştır."
};

const HIZMET_OPTIONS = [
  "Yalın Dönüşüm Proje Danışmanlığı",
  "TPM Uygulamalı Danışmanlık",
  "Yalın Lojistik",
  "Fabrika Yerleşim / Layout Kurulum",
  "Yalın Ofis Uygulamaları",
  "VSM Uygulama Projesi",
  "Süreç Değerlendirme ve Raporlama",
  "Lider Gelişim Programı",
  "5S Uygulamaları ve Yönetimi"
];

const SERVICE_HINTS: Record<string, string> = {
  "Yalın Dönüşüm Proje Danışmanlığı": "Tüm değer akışını kapsayan, israfları sıfırlayan ve sürekli iyileştirme kültürü yeşerten kapsamlı şirket dönüşüm yolculuğu.",
  "TPM Uygulamalı Danışmanlık": "Ekipman verimliliğini (OEE) yükselten, beklenmedik arızaları ve kalıp değişim sürelerini (SMED) minimize eden ekipman disiplini.",
  "Yalın Lojistik": "Fabrika içi malzeme besleme döngüleri (Kanban, Milk-run), ara stok düşürme, depo verimliliği ve akış hızı artırımı.",
  "Fabrika Yerleşim / Layout Kurulum": "Spagetti diyagramları ile gereksiz taşımaları sıfırlayan, alan tasarrufu ve güvenli akış sunan hücresel yerleşim tasarımı.",
  "Yalın Ofis Uygulamaları": "Beyaz yaka, mühendislik ve idari süreçlerdeki bürokratik israfların elenmesi, bilgi akış süreçlerinin standartlaşması.",
  "VSM Uygulama Projesi": "Mevcut Durum Değer Akışı Haritalama analizleri ile israfların net tespiti ve stratejik bir gelecek durum iyileştirme planı.",
  "Süreç Değerlendirme ve Raporlama": "Darboğazları keşfetmek, operasyonel kayıpları ölçmek ve yol haritası çıkartmak üzere kurgulanan 1-2 günlük derinlemesine saha incelemesi.",
  "Lider Gelişim Programı": "Vardiya amirleri, posta başları ve takım liderlerinin problem çözme, geri bildirim ve yalın liderlik yetilerini geliştiren eğitim akademisi.",
  "5S Uygulamaları ve Yönetimi": "Saha düzeni, temizliği, iş güvenliği gereksinimleri ve kurumsal disiplini görsel denetim sistemleri ile entegre kılan temel odak."
};

const getBarChart = (ratio: number, totalChars: number = 20): string => {
  const filledCount = Math.min(totalChars, Math.max(0, Math.round(totalChars * ratio)));
  const emptyCount = Math.max(0, totalChars - filledCount);
  return "█".repeat(filledCount) + "░".repeat(emptyCount);
};

const formatNumberWithDots = (value: string | number): string => {
  if (value === undefined || value === null || value === "") return "";
  const clean = value.toString().replace(/\D/g, "");
  if (!clean) return "";
  return Number(clean).toLocaleString("tr-TR");
};

const getSectorCostStructure = (sectorStr: string, productStr: string) => {
  const sec = normalizeTr(sectorStr);
  const prod = normalizeTr(productStr);
  
  if (sec.includes("oto") || sec.includes("tasit") || sec.includes("parca") || prod.includes("oto") || prod.includes("yedek")) {
    return {
      title: "Otomotiv Yan Sanayi & Yedek Parça",
      malzeme: 55,
      iscilik: 15,
      enerji: 8,
      bakim: 7,
      genel: 15
    };
  } else if (sec.includes("gida") || sec.includes("icecek") || sec.includes("unlu") || prod.includes("gida") || prod.includes("ambalaj")) {
    return {
      title: "Gıda, İçecek & Ambalaj",
      malzeme: 60,
      iscilik: 12,
      enerji: 10,
      bakim: 6,
      genel: 12
    };
  } else if (sec.includes("mobilya") || sec.includes("ahsap") || prod.includes("mobilya") || prod.includes("kabin") || prod.includes("panel")) {
    return {
      title: "Mobilya & Ahşap İşleme",
      malzeme: 50,
      iscilik: 20,
      enerji: 6,
      bakim: 5,
      genel: 19
    };
  } else if (sec.includes("plastik") || sec.includes("enjeksiyon") || prod.includes("plastik") || prod.includes("kalip")) {
    return {
      title: "Plastik Enjeksiyon ve Kalıplama",
      malzeme: 45,
      iscilik: 15,
      enerji: 20,
      bakim: 8,
      genel: 12
    };
  } else if (sec.includes("tekstil") || sec.includes("konfeksiyon") || prod.includes("kumas") || prod.includes("dikim")) {
    return {
      title: "Tekstil & Hazır Giyim Sanayi",
      malzeme: 40,
      iscilik: 30,
      enerji: 10,
      bakim: 4,
      genel: 16
    };
  } else if (sec.includes("maden") || sec.includes("mermer") || sec.includes("tas") || sec.includes("quarry") || sec.includes("kaya") || prod.includes("maden") || prod.includes("mermer") || prod.includes("blok")) {
    return {
      title: "Madencilik, Mermer & Taş Ocakçılığı",
      malzeme: 20,
      iscilik: 18,
      enerji: 32, // High energy cost in mining as requested!
      bakim: 18, // High machinery maintenance
      genel: 12
    };
  } else if (sec.includes("cimento") || sec.includes("cam") || sec.includes("seramik") || sec.includes("tugla") || prod.includes("cimento") || prod.includes("cam") || prod.includes("seramik")) {
    return {
      title: "Çimento, Cam & Seramik Sanayi",
      malzeme: 30,
      iscilik: 15,
      enerji: 35, // High thermal & electrical energy
      bakim: 12,
      genel: 8
    };
  } else if (sec.includes("kimya") || sec.includes("boya") || sec.includes("petrol") || sec.includes("ilac") || prod.includes("kimya") || prod.includes("boya") || prod.includes("rezy") || prod.includes("plastik hammadde")) {
    return {
      title: "Kimya, Boya & Petrol Ürünleri",
      malzeme: 65, // High material feedstock
      iscilik: 10,
      enerji: 12,
      bakim: 5,
      genel: 8
    };
  } else {
    return {
      title: "Metal, Makine ve Genel Endüstriyel İmalat",
      malzeme: 50,
      iscilik: 18,
      enerji: 10,
      bakim: 7,
      genel: 15
    };
  }
};

/** Günlük danışmanlık ücreti (€) — bulutta ortak ayar yoksa kullanılır */
const DEFAULT_DAILY_RATE_EUR = 700;

// ─── PUANLAMA: -1 = puan verilmedi, 0 = İzlenmedi, 1-3 = puan ───────────────
const UNSCORED = -1;
/** Eski kayıtlarda "verilmedi" de 0 olarak tutuluyordu: hiç -1 yoksa 0'lar "verilmedi" sayılır */
const normalizeScores = (raw: Record<number, number> | undefined | null): Record<number, number> => {
  const src = raw || {};
  const isLegacy = !Object.values(src).some(v => v === UNSCORED);
  const out: Record<number, number> = {};
  for (let i = 1; i <= 17; i++) {
    const v = src[i];
    out[i] = typeof v === 'number' && v >= 0 && !(isLegacy && v === 0) ? v : UNSCORED;
  }
  return out;
};
const scoreValue = (v: number | undefined) => (typeof v === 'number' && v > 0 ? v : 0);

export default function App() {
  // ─── PLATFORM VIEW AND MULTI-COMPANY STATE ───────────────────────────────
  const [currentCompanyId, setCurrentCompanyId] = useState<string>(() => {
    // Seed initial DB if empty
    GembaDB.getCompanies(true);
    const savedId = localStorage.getItem('gp_currentCompanyId');
    if (savedId) return savedId;
    const comps = GembaDB.getCompanies(false);
    return comps[0]?.companyId || 'demo-company-id-1234';
  });

  const [currentView, setCurrentView] = useState<'dashboard' | 'assessment'>('dashboard');
  const [consultant, setConsultant] = useState(() => localStorage.getItem('gp_consultant') || 'Saha Danışmanı');

  // ─── STATE ────────────────────────────────────────────────────────────────
  const [firmaAdi, setFirmaAdi] = useState(() => localStorage.getItem('gp_firmaAdi') || '');
  const [sektor, setSektor] = useState(() => localStorage.getItem('gp_sektor') || '');
  const [adres, setAdres] = useState(() => localStorage.getItem('gp_adres') || '');
  const [urunGrubu, setUrunGrubu] = useState(() => localStorage.getItem('gp_urunGrubu') || '');
  const [calisanSayisi, setCalisanSayisi] = useState(() => localStorage.getItem('gp_calisanSayisi') || '');
  const [vardiya, setVardiya] = useState(() => localStorage.getItem('gp_vardiya') || '');
  const [gorusulen, setGorusulen] = useState(() => localStorage.getItem('gp_gorusulen') || '');
  const [tarih, setTarih] = useState(() => localStorage.getItem('gp_tarih') || new Date().toISOString().split('T')[0]);
  const [talepEdilenHizmet, setTalepEdilenHizmet] = useState(() => localStorage.getItem('gp_talepEdilenHizmet') || 'Yalın Dönüşüm Proje Danışmanlığı');
  const [notlar, setNotlar] = useState(() => localStorage.getItem('gp_notlar') || '');
  const [activeTab, setActiveTab] = useState<'scoring' | 'financial' | 'roi'>(() => (localStorage.getItem('gp_activeTab') as 'scoring' | 'financial' | 'roi') || 'scoring');
  
  // Açılışta true: firma verisi buluttan/yerelden yüklenene kadar otomatik kaydetme ÇALIŞMAZ.
  // (Aksi halde ilk render'daki boş state, son açık firmanın kaydının üzerine yazılıyordu.)
  const isSwappingCompany = useRef(true);

  // Load Company from database function with Cloud Sync
  const loadCompany = async (companyId: string) => {
    isSwappingCompany.current = true;
    try {
      await GembaDB.syncCompanyDetailsFromCloud(companyId);
    } catch (e) {}

    const details = GembaDB.getCompanyDetails(companyId);
    if (!details) {
      isSwappingCompany.current = false;
      return;
    }

    setCurrentCompanyId(companyId);
    setFirmaAdi(details.company.companyName);
    setSektor(details.company.sector);
    setAdres(details.company.location || '');
    setConsultant(details.company.consultant || 'Saha Danışmanı');
    setTarih(details.company.visitDate);
    
    if (details.operation) {
      if (details.operation.currency) {
        setCurrency(details.operation.currency);
      }
      setUrunGrubu(details.operation.urunGrubu || details.company.sector);
      setCalisanSayisi(details.operation.calisanSayisi || '150');
      setVardiya(details.operation.vardiya || '3 Vardiya (24 Saat)');
      setGorusulen(details.operation.gorusulen || '');
      setTalepEdilenHizmet(details.operation.talepEdilenHizmet || 'Yalın Dönüşüm Proje Danışmanlığı');
      
      setSetupMachineCount(details.operation.setupMachineCount ?? '');
      setAnnualVolume(details.operation.annualVolume ?? '');
      setProductionUnit(details.operation.productionUnit || 'Adet');
      setTurnoverLira(details.operation.turnoverLira ?? '');
      setPlannedEfficiency(details.operation.plannedEfficiency ?? '');
      setActualEfficiency(details.operation.actualEfficiency ?? '');
      setCopqRate(details.operation.copqRate ?? '');
      setScrapRate(details.operation.scrapRate ?? '');
      setReworkRate(details.operation.reworkRate ?? '');
      setOvertimeRate(details.operation.overtimeRate ?? '');
      setLeadTime(details.operation.leadTime ?? '');
      setStockUnits(details.operation.stockUnits || '');
      setStockValue(details.operation.stockValue || '');
      setSetupTimePct(details.operation.setupTimePct || '');
      setBreakdownPct(details.operation.breakdownPct || '');
      setPlanRealizationPct(details.operation.planRealizationPct || '');
      setSustainYears(Number(details.operation.sustainYears) || 3);
      setOee(details.operation.oee ?? '');
      setCoveredArea(details.operation.coveredArea ?? '');
      setOperatorsCount(details.operation.operatorsCount ?? '');
      setSetupFrequency(details.operation.setupFrequency ?? '');
      setSetupDuration(details.operation.setupDuration ?? '');
      setAffectedOpsSetup(details.operation.affectedOpsSetup ?? '');
      setGrossLaborCost(details.operation.grossLaborCost ?? '');

      setWizardGrossSalary(details.operation.wizardGrossSalary || '30.000');
      setWizardSgkRate(details.operation.wizardSgkRate ?? 17.5);
      setWizardYemek(details.operation.wizardYemek || '4.500');
      setWizardServis(details.operation.wizardServis || '3.500');
      setWizardSeveranceRate(details.operation.wizardSeveranceRate ?? 8.33);
      setWizardLeaveRate(details.operation.wizardLeaveRate ?? 5.0);
      setWizardSideBenefits(details.operation.wizardSideBenefits || '2.000');

      setCostPropMaterial(details.operation.costPropMaterial || '50');
      setCostPropLabor(details.operation.costPropLabor || '20');
      setCostPropEnergy(details.operation.costPropEnergy || '10');
      setCostPropMaintenance(details.operation.costPropMaintenance || '10');
      setCostPropOverhead(details.operation.costPropOverhead || '10');
      setCostPropProfit(details.operation.costPropProfit || '10');

      setScores(normalizeScores(details.operation.scores));
      setChatMessages(details.operation.chatMessages || []);
    } else {
      setUrunGrubu(details.company.sector);
      setCalisanSayisi('');
      setVardiya('');
      setGorusulen('');
      setTalepEdilenHizmet('Yalın Dönüşüm Proje Danışmanlığı');
      setScores({});
      setChatMessages([]);
    }
    
    if (details.assessment) {
      setNotlar(details.assessment.notes || '');
    }

    setCurrentCompanyId(companyId);
    localStorage.setItem('gp_currentCompanyId', companyId);

    setTimeout(() => {
      isSwappingCompany.current = false;
    }, 400);
  };

  // Initialize company on mount with full cloud database sync
  useEffect(() => {
    const initApp = async () => {
      try {
        const syncedComps = await GembaDB.syncCompaniesFromCloud();
        const savedId = localStorage.getItem('gp_currentCompanyId');
        const targetId = savedId || syncedComps[0]?.companyId || 'demo-company-id-1234';
        await loadCompany(targetId);
      } catch (e) {
        console.warn('[App Init Error]', e);
      }
    };
    initApp();
  }, []);

  // Modern OpEx Industrial Financial Analysis variables
  const [currency, setCurrency] = useState(() => localStorage.getItem('gp_currency') || 'TRY');
  const [setupMachineCount, setSetupMachineCount] = useState(() => localStorage.getItem('gp_setupMachineCount') ?? '');
  const [annualVolume, setAnnualVolume] = useState(() => localStorage.getItem('gp_annualVolume') ?? '');
  const [productionUnit, setProductionUnit] = useState(() => localStorage.getItem('gp_productionUnit') || 'Adet');
  const [authUser, setAuthUser] = useState<string | null>(() => localStorage.getItem('gp_auth_user'));

  const handleLogout = () => {
    localStorage.removeItem('gp_auth_user');
    setAuthUser(null);
  };

  const [turnoverLira, setTurnoverLira] = useState(() => localStorage.getItem('gp_turnoverLira') ?? '');
  const [plannedEfficiency, setPlannedEfficiency] = useState(() => localStorage.getItem('gp_plannedEfficiency') ?? '');
  const [actualEfficiency, setActualEfficiency] = useState(() => localStorage.getItem('gp_actualEfficiency') ?? '');
  const [copqRate, setCopqRate] = useState(() => localStorage.getItem('gp_copqRate') ?? '');
  const [scrapRate, setScrapRate] = useState(() => localStorage.getItem('gp_scrapRate') ?? '');
  const [reworkRate, setReworkRate] = useState(() => localStorage.getItem('gp_reworkRate') ?? '');
  const [overtimeRate, setOvertimeRate] = useState(() => localStorage.getItem('gp_overtimeRate') ?? '');
  const [leadTime, setLeadTime] = useState(() => localStorage.getItem('gp_leadTime') ?? '');
  const [oee, setOee] = useState(() => localStorage.getItem('gp_oee') ?? '');
  const [stockUnits, setStockUnits] = useState(() => localStorage.getItem('gp_stockUnits') || '');
  const [stockValue, setStockValue] = useState(() => localStorage.getItem('gp_stockValue') || '');
  useEffect(() => { localStorage.setItem('gp_stockValue', stockValue); }, [stockValue]);
  const [setupTimePct, setSetupTimePct] = useState(() => localStorage.getItem('gp_setupTimePct') || '');
  const [breakdownPct, setBreakdownPct] = useState(() => localStorage.getItem('gp_breakdownPct') || '');
  const [planRealizationPct, setPlanRealizationPct] = useState(() => localStorage.getItem('gp_planRealizationPct') || '');
  useEffect(() => { localStorage.setItem('gp_planRealizationPct', planRealizationPct); }, [planRealizationPct]);
  useEffect(() => { localStorage.setItem('gp_setupTimePct', setupTimePct); localStorage.setItem('gp_breakdownPct', breakdownPct); }, [setupTimePct, breakdownPct]);
  const [sustainYears, setSustainYears] = useState<number>(() => Number(localStorage.getItem('gp_sustainYears')) || 3);
  useEffect(() => { localStorage.setItem('gp_stockUnits', stockUnits); }, [stockUnits]);
  useEffect(() => { localStorage.setItem('gp_sustainYears', String(sustainYears)); }, [sustainYears]);
  const [coveredArea, setCoveredArea] = useState(() => localStorage.getItem('gp_coveredArea') ?? '');
  const [operatorsCount, setOperatorsCount] = useState(() => localStorage.getItem('gp_operatorsCount') ?? '');
  const [setupFrequency, setSetupFrequency] = useState(() => localStorage.getItem('gp_setupFrequency') ?? '');
  const [setupDuration, setSetupDuration] = useState(() => localStorage.getItem('gp_setupDuration') ?? '');
  const [affectedOpsSetup, setAffectedOpsSetup] = useState(() => localStorage.getItem('gp_affectedOpsSetup') ?? '');
  const [grossLaborCost, setGrossLaborCost] = useState(() => localStorage.getItem('gp_grossLaborCost') ?? '');
  const [isCostWizardOpen, setIsCostWizardOpen] = useState(false);
  const [wizardGrossSalary, setWizardGrossSalary] = useState(() => localStorage.getItem('gp_wiz_gross') || '30.000');
  const [wizardSgkRate, setWizardSgkRate] = useState(() => Number(localStorage.getItem('gp_wiz_sgk_rate') || '17.5'));
  const [wizardYemek, setWizardYemek] = useState(() => localStorage.getItem('gp_wiz_yemek') || '4.500');
  const [wizardServis, setWizardServis] = useState(() => localStorage.getItem('gp_wiz_servis') || '3.500');
  const [wizardSeveranceRate, setWizardSeveranceRate] = useState(() => Number(localStorage.getItem('gp_wiz_severance_rate') || '8.33'));
  const [wizardLeaveRate, setWizardLeaveRate] = useState(() => Number(localStorage.getItem('gp_wiz_leave_rate') || '5.0'));
  const [wizardSideBenefits, setWizardSideBenefits] = useState(() => localStorage.getItem('gp_wiz_side_benefits') || '2.000');
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>(undefined);
  const isNotionMode = false;
  const [showIframePrintToast, setShowIframePrintToast] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [costPropMaterial, setCostPropMaterial] = useState(() => localStorage.getItem('gp_costPropMaterial') || '');
  const [costPropLabor, setCostPropLabor] = useState(() => localStorage.getItem('gp_costPropLabor') || '');
  const [costPropEnergy, setCostPropEnergy] = useState(() => localStorage.getItem('gp_costPropEnergy') || '');
  const [costPropMaintenance, setCostPropMaintenance] = useState(() => localStorage.getItem('gp_costPropMaintenance') || '');
  const [costPropOverhead, setCostPropOverhead] = useState(() => localStorage.getItem('gp_costPropOverhead') || '');
  const [costPropProfit, setCostPropProfit] = useState(() => localStorage.getItem('gp_costPropProfit') || '10');

  // ─── SEKTÖR MALİYET YAPISI ÖNERİSİ (web araştırması, danışman onayıyla uygulanır) ───
  type CostRange = { min: number; max: number; ort: number };
  type CostSuggestion = {
    sektor: string; malzeme: CostRange; iscilik: CostRange; enerji: CostRange; bakim: CostRange; genel: CostRange; kar: CostRange;
    aciklama: string; kaynaklar: { title: string; url: string }[]; fromWeb: boolean;
  };
  const [costSuggestion, setCostSuggestion] = useState<CostSuggestion | null>(null);
  // Oranlar sistem tarafından (sektör tablosu / web önerisi) doldurulduysa ve danışman değiştirmediyse "tahmini" sayılır
  const [costAutoSnapshot, setCostAutoSnapshot] = useState<string | null>(() => localStorage.getItem('gp_costAutoSnapshot'));
  useEffect(() => { if (costAutoSnapshot) localStorage.setItem('gp_costAutoSnapshot', costAutoSnapshot); else localStorage.removeItem('gp_costAutoSnapshot'); }, [costAutoSnapshot]);
  const costSnapshotOf = (vals: string[]) => vals.map(v => String(Number(v) || 0)).join('|');
  const [costSuggestLoading, setCostSuggestLoading] = useState(false);
  const fetchCostSuggestion = async (force = false) => {
    if (!sektor || sektor.trim().length < 3) return;
    const cacheKey = 'gp_costSuggest_' + normalizeTr(`${sektor}|${urunGrubu}`);
    if (!force) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) { setCostSuggestion(JSON.parse(cached)); return; }
      } catch (e) {}
    }
    setCostSuggestLoading(true);
    try {
      const res = await fetch('/api/cost-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector: sektor, product: urunGrubu }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const sug: CostSuggestion = { ...data, fromWeb: true };
      setCostSuggestion(sug);
      try { localStorage.setItem(cacheKey, JSON.stringify(sug)); } catch (e) {}
    } catch (err: any) {
      // Web araştırması yapılamazsa dahili sektör tablosu öneri olarak gösterilir
      const t = getSectorCostStructure(sektor, urunGrubu);
      const rng = (v: number): CostRange => ({ min: Math.round(v * 0.8), max: Math.round(v * 1.2), ort: v });
      setCostSuggestion({
        sektor: t.title,
        malzeme: rng(t.malzeme * 0.9), iscilik: rng(t.iscilik * 0.9), enerji: rng(t.enerji * 0.9),
        bakim: rng(t.bakim * 0.9), genel: rng(t.genel * 0.9), kar: rng(10),
        aciklama: `Web araştırması yapılamadı (${err?.message || 'bağlantı hatası'}). Dahili sektör tablosu gösteriliyor.`,
        kaynaklar: [], fromWeb: false,
      });
    } finally {
      setCostSuggestLoading(false);
    }
  };
  // Sektör / ürün grubu yazıldıktan 1,5 sn sonra öneri otomatik getirilir (önbellekte varsa oradan)
  useEffect(() => {
    setCostSuggestion(null);
    const t = setTimeout(() => { fetchCostSuggestion(false); }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sektor, urunGrubu]);

  const applyCostSuggestion = () => {
    if (!costSuggestion) return;
    const f = (v: number) => (Math.round(v * 10) / 10).toString();
    setCostPropMaterial(f(costSuggestion.malzeme.ort));
    setCostPropLabor(f(costSuggestion.iscilik.ort));
    setCostPropEnergy(f(costSuggestion.enerji.ort));
    setCostPropMaintenance(f(costSuggestion.bakim.ort));
    setCostPropOverhead(f(costSuggestion.genel.ort));
    setCostPropProfit(f(costSuggestion.kar.ort));
    setCostAutoSnapshot(costSnapshotOf([costSuggestion.malzeme.ort, costSuggestion.iscilik.ort, costSuggestion.enerji.ort, costSuggestion.bakim.ort, costSuggestion.genel.ort, costSuggestion.kar.ort].map(f)));
  };

  const [urunGrubuEnCok, setUrunGrubuEnCok] = useState(() => localStorage.getItem('gp_urunGrubuEnCok') || '95 kW Motor');
  const [urunGrubuAdet, setUrunGrubuAdet] = useState(() => localStorage.getItem('gp_urunGrubuAdet') || '25.000');
  const [urunGrubuOran, setUrunGrubuOran] = useState(() => localStorage.getItem('gp_urunGrubuOran') || '35');
  const [useProductFamilyCost, setUseProductFamilyCost] = useState(() => localStorage.getItem('gp_useProductFamilyCost') === 'true');
  const [useProductFamilyRecovery, setUseProductFamilyRecovery] = useState(() => localStorage.getItem('gp_useProductFamilyRecovery') === 'true');

  const prevSectorRef = useRef(sektor);
  const prevProdRef = useRef(urunGrubu);

  // Scores state: Key is item no (1-17), value is 0 (unselected), 1, 2, or 3
  const [scores, setScores] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem('gp_scores');
      if (saved) {
        return normalizeScores(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
    return normalizeScores({});
  });

  const [eurTry, setEurTry] = useState<number>(37.65);
  const [usdTry, setUsdTry] = useState<number>(34.80);
  const [isRateLoading, setIsRateLoading] = useState<boolean>(true);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('Tümü');
  const [isMaturityExpanded, setIsMaturityExpanded] = useState<boolean>(false);

  const [adminEuroRate, setAdminEuroRate] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('gp_adminEuroRate');
      return saved ? Number(saved) : DEFAULT_DAILY_RATE_EUR;
    } catch (e) {
      return DEFAULT_DAILY_RATE_EUR;
    }
  });
  // Günlük € ücret ortak ayardır: açılışta buluttan okunur (cihazdaki değer yalnızca çevrimdışı yedek)
  useEffect(() => {
    GembaDB.getSetting<number>('daily_rate_eur').then(v => {
      if (typeof v === 'number' && v > 0) setAdminEuroRate(v);
    });
  }, []);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [tempEuroRate, setTempEuroRate] = useState<string>(adminEuroRate.toString());

  useEffect(() => {
    if (isAdminOpen) {
      setTempEuroRate(adminEuroRate.toString());
    }
  }, [isAdminOpen, adminEuroRate]);

  useEffect(() => {
    localStorage.setItem('gp_adminEuroRate', adminEuroRate.toString());
  }, [adminEuroRate]);

  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>(() => {
    try {
      const saved = localStorage.getItem('gp_chatMessages');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        role: 'assistant',
        content: `Merhaba! Ben Gemba Digital Yapay Zeka Baş Danışmanınızım. 

İmalat sahanıza özel OEE verimlilik artışları, SMED hızlı kalıp değişim metotları, 5S saha temizliği/düzeni ve TPM otonom bakım faaliyetlerinden ne kadar kazanım elde edebileceğinizi detaylandırmak için bana sorular sorabilirsiniz.

Eğer belirtilen sektöre özel yeterli ve doğrulanabilir bilgiye sahip değilsem, sizi yanıltmamak adına "yorum yok" diye cevap vereceğim. Sorularınızı bekliyorum!`
      }
    ];
  });
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // PWA State & Installation Handling
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showPwaPrompt, setShowPwaPrompt] = useState<boolean>(() => {
    return localStorage.getItem('gp_hidePwaPrompt') !== 'true';
  });

  useEffect(() => {
    // Detect standalone display mode (e.g. Installed on iPad, Macbook, or phones)
    const checkStandaloneMode = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMedia || isIOSStandalone);
    };
    checkStandaloneMode();

    // Listen for beforeinstallprompt event for chrome / dynamic prompt
    const handleBeforePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforePrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
    };
  }, []);

  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const triggerPwaInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted PWA installation');
        }
        setDeferredPrompt(null);
      });
    } else {
      setIsPwaModalOpen(true);
    }
  };

  const dismissPwaPrompt = () => {
    setShowPwaPrompt(false);
    localStorage.setItem('gp_hidePwaPrompt', 'true');
  };

  // Dynamically reset wizard values on currency change to provide realistic local numbers
  useEffect(() => {
    if (currency === 'TRY') {
      setWizardGrossSalary('30.000');
      setWizardYemek('4.500');
      setWizardServis('3.500');
      setWizardSideBenefits('2.000');
    } else if (currency === 'EUR') {
      setWizardGrossSalary('1.200');
      setWizardYemek('180');
      setWizardServis('120');
      setWizardSideBenefits('100');
    } else {
      setWizardGrossSalary('1.300');
      setWizardYemek('200');
      setWizardServis('130');
      setWizardSideBenefits('110');
    }
  }, [currency]);

  // Sync copqRate from scrapRate and reworkRate changes
  useEffect(() => {
    const s = Number(scrapRate) || 0;
    const r = Number(reworkRate) || 0;
    const total = Math.round((s + r) * 100) / 100;
    setCopqRate(total.toString());
  }, [scrapRate, reworkRate]);

  // Dynamically reset/recalculate cost structure when sector/product group changes
  useEffect(() => {
    if (prevSectorRef.current !== sektor || prevProdRef.current !== urunGrubu || !costPropMaterial) {
      const structure = getSectorCostStructure(sektor, urunGrubu);
      setCostPropMaterial((structure.malzeme * 0.9).toFixed(1).replace('.0', ''));
      setCostPropLabor((structure.iscilik * 0.9).toFixed(1).replace('.0', ''));
      setCostPropEnergy((structure.enerji * 0.9).toFixed(1).replace('.0', ''));
      setCostPropMaintenance((structure.bakim * 0.9).toFixed(1).replace('.0', ''));
      setCostPropOverhead((structure.genel * 0.9).toFixed(1).replace('.0', ''));
      setCostPropProfit('10');
      setCostAutoSnapshot(costSnapshotOf([structure.malzeme, structure.iscilik, structure.enerji, structure.bakim, structure.genel].map(v => (v * 0.9).toFixed(1).replace('.0', '')).concat('10')));
      
      prevSectorRef.current = sektor;
      prevProdRef.current = urunGrubu;
    }
  }, [sektor, urunGrubu, costPropMaterial]);

  // Auto-calculate total loaded cost (all-inclusive employer cost)
  useEffect(() => {
    const grossNum = Number(wizardGrossSalary.toString().replace(/\./g, '')) || 0;
    const sgkCost = Math.round(grossNum * (wizardSgkRate / 100));
    const severanceCost = Math.round(grossNum * (wizardSeveranceRate / 100));
    const leaveCost = Math.round(grossNum * (wizardLeaveRate / 100));
    const yemekCost = Number(wizardYemek.toString().replace(/\./g, '')) || 0;
    const servisCost = Number(wizardServis.toString().replace(/\./g, '')) || 0;
    const sideCost = Number(wizardSideBenefits.toString().replace(/\./g, '')) || 0;
    
    const totalLoaded = grossNum + sgkCost + severanceCost + leaveCost + yemekCost + servisCost + sideCost;
    if (totalLoaded > 0) {
      setGrossLaborCost(formatNumberWithDots(totalLoaded));
    }
  }, [wizardGrossSalary, wizardSgkRate, wizardYemek, wizardServis, wizardSeveranceRate, wizardLeaveRate, wizardSideBenefits]);

  useEffect(() => {
    localStorage.setItem('gp_scores', JSON.stringify(scores));
  }, [scores]);

  useEffect(() => {
    localStorage.setItem('gp_chatMessages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Fetch Exchange Rates on Mount
  useEffect(() => {
    async function fetchRate() {
      setIsRateLoading(true);
      try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
        if (res.ok) {
          const data = await res.json();
          if (data && data.rates) {
            if (data.rates.TRY) setEurTry(data.rates.TRY);
            if (data.rates.USD) {
              setUsdTry(data.rates.TRY / data.rates.USD);
            }
          }
        }
      } catch (err) {
        console.warn('Primary exchange API limit or failure, using backup rate...', err);
        try {
          const res2 = await fetch('https://open.er-api.com/v6/latest/EUR');
          if (res2.ok) {
            const data2 = await res2.json();
            if (data2 && data2.rates) {
              if (data2.rates.TRY) setEurTry(data2.rates.TRY);
              if (data2.rates.USD) {
                setUsdTry(data2.rates.TRY / data2.rates.USD);
              }
            }
          }
        } catch (err2) {
          console.error('Fallback exchange rate failed as well: ', err2);
        }
      } finally {
        setIsRateLoading(false);
      }
    }
    fetchRate();
    const interval = setInterval(fetchRate, 300000); // 5 min interval refresh
    return () => clearInterval(interval);
  }, []);

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMsg = chatInput.trim();
    setChatInput('');
    
    const updatedMessages = [...chatMessages, { role: 'user', content: userMsg } as const];
    setChatMessages(updatedMessages);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          sector: sektor,
          urunGrubu: urunGrubu,
          turnoverLira: turnoverLira,
          copqRate: copqRate,
          oee: oee,
          currency: currency,
          currencySymbol: currencySymbol
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.response) {
          setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } else if (data && data.error) {
          setChatMessages(prev => [...prev, { role: 'assistant', content: `Bir hata oluştu: ${data.error}` }]);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setChatMessages(prev => [...prev, { role: 'assistant', content: `Hata: Sunucu ${response.status} kodunu döndürdü. ${errData.error || ""}` }]);
      }
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Bağlantı hatası: AI asistanına ulaşılamadı. Lütfen internet bağlantısını ve sunucu durumunu kontrol edin.` }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearChat = () => {
    const initial = [
      {
        role: 'assistant' as const,
        content: `Merhaba! Ben Gemba Digital Yapay Zeka Baş Danışmanınızım. 
        
İmalat sahanıza özel OEE verimlilik artışları, SMED hızlı kalıp değişim metotları, 5S saha temizliği/düzeni ve TPM otonom bakım faaliyetlerinden ne kadar kazanım elde edebileceğinizi detaylandırmak için bana sorular sorabilirsiniz.

Eğer belirtilen sektöre özel yeterli ve doğrulanabilir bilgiye sahip değilsem, sizi yanıltmamak adına "yorum yok" diye cevap vereceğim. Sorularınızı bekliyorum!`
      }
    ];
    setChatMessages(initial);
    localStorage.setItem('gp_chatMessages', JSON.stringify(initial));
  };

  // ─── CALCULATIONS & LOGIC ──────────────────────────────────────────────────
  const currencySymbol = currency === 'TRY' ? '₺' : currency === 'EUR' ? '€' : '$';
  // Seçili para biriminden TL'ye çevrim kuru (görüntüleme)
  const activeRate = currency === 'EUR' ? (eurTry || 37.65) : currency === 'USD' ? (usdTry || 34.80) : 1;
  const scoresArray = Object.values(scores) as number[];
  const totalScore = scoresArray.reduce((sum, val) => sum + scoreValue(val), 0);
  const answeredCount = scoresArray.filter(val => val >= 0).length;

  // Find recommended programs based on current sum
  const getProgram = (score: number): ProgramConfig => {
    return PROGRAMS.find(p => score >= p.min && score <= p.max) || PROGRAMS[PROGRAMS.length - 1];
  };

  const currentProgram = getProgram(totalScore);

  const eurUsdRate = eurTry / usdTry || 1.09;

  let baseUnitRate = 0;
  if (currency === 'TRY') {
    const rawDailyRate = adminEuroRate * eurTry;
    baseUnitRate = Math.ceil(rawDailyRate / 500) * 500;
  } else if (currency === 'EUR') {
    baseUnitRate = adminEuroRate;
  } else { // USD
    const rawDailyUsd = adminEuroRate * eurUsdRate;
    baseUnitRate = Math.round(rawDailyUsd / 10) * 10;
  }

  // Totals in selected currency
  const getProgramRateInfo = (programName: string, ag: number) => {
    if (programName === "Mevcut Değil" || ag === 0) {
      return {
        rate: 0,
        preDiscount: baseUnitRate,
        hasDiscount: false,
        discountPercent: 0
      };
    }

    // Durations:
    // - 105 ile 156 gün arasında %10 indirim
    // - 157 adam üstüne çıktığında %5 daha ilave et (total %15)
    let discountPercent = 0;
    if (ag >= 105 && ag <= 156) {
      discountPercent = 10;
    } else if (ag >= 157) {
      discountPercent = 15;
    }

    let hasDiscount = discountPercent > 0;
    let rate = baseUnitRate;

    if (hasDiscount) {
      const rawDiscountedPrice = baseUnitRate * (1 - discountPercent / 100);

      // "Eğer rakam 30.000 Tl altına düşerse daha indirim yapma dip rakam 30.000 TL olmalı."
      const tryFloor = 30000;
      let currencyFloor = tryFloor;
      if (currency === 'EUR') {
        currencyFloor = tryFloor / eurTry;
      } else if (currency === 'USD') {
        currencyFloor = tryFloor / usdTry;
      }

      // Check if price is under the floor
      if (rawDiscountedPrice < currencyFloor) {
        if (baseUnitRate <= currencyFloor) {
          rate = baseUnitRate;
          discountPercent = 0;
          hasDiscount = false;
        } else {
          rate = currency === 'TRY' ? tryFloor : currencyFloor;
          discountPercent = Math.round((1 - rate / baseUnitRate) * 100);
          if (discountPercent <= 0) {
            hasDiscount = false;
            discountPercent = 0;
          }
        }
      } else {
        rate = currency === 'TRY' ? Math.round(rawDiscountedPrice / 500) * 500 : rawDiscountedPrice;
      }
    }

    return {
      rate: currency === 'TRY' ? Math.round(rate / 500) * 500 : Math.round(rate),
      preDiscount: baseUnitRate,
      hasDiscount,
      discountPercent
    };
  };

  const op1RateInfo = getProgramRateInfo(currentProgram.op1.name, currentProgram.op1.ag);
  const op2RateInfo = getProgramRateInfo(currentProgram.op2.name, currentProgram.op2.ag);

  let dailyRateOp1 = op1RateInfo.rate;
  let dailyRateOp2 = op2RateInfo.rate;
  let dailyRateOp2PreDiscount = baseUnitRate;

  const totalOp1Lira = op1RateInfo.rate * currentProgram.op1.ag;
  const totalOp2Lira = op2RateInfo.rate * currentProgram.op2.ag;

  const totalOp1Eur = currency === 'EUR' ? Math.round(totalOp1Lira) : currency === 'USD' ? Math.round(totalOp1Lira / eurUsdRate) : Math.round(totalOp1Lira / eurTry);
  const totalOp2Eur = currency === 'EUR' ? Math.round(totalOp2Lira) : currency === 'USD' ? Math.round(totalOp2Lira / eurUsdRate) : Math.round(totalOp2Lira / eurTry);

  // ─── INDUSTRIAL FINANCIAL CALCULATIONS (tek kaynak: src/engine/qla.ts) ─────
  const volNum = Number(annualVolume.toString().replace(/\./g, '')) || 0;
  const turnoverNum = Number(turnoverLira.toString().replace(/\./g, '')) || 0;
  const plannedEffNum = Number(plannedEfficiency) || 0;
  const actualEffNum = Number(actualEfficiency) || 0;
  const copqRateNum = Number(copqRate) || 0;
  const scrapRateNum = Number(scrapRate) || 0;
  const reworkRateNum = Number(reworkRate) || 0;
  const overtimeRateNum = Number(overtimeRate) || 0;
  const leadTimeNum = Number(leadTime) || 0;
  const oeeNum = Number(oee) || 0;
  const opsNum = Number(operatorsCount) || 0;
  const setupMachineCountNum = Number(setupMachineCount.toString().replace(/\./g, '')) || 0;
  const setupFrequencyNum = Number(setupFrequency) || 0;
  const setupDurationNum = Number(setupDuration) || 0;
  const affectedOpsSetupNum = Number(affectedOpsSetup) || 0;
  const grossLaborCostNum = Number(grossLaborCost.toString().replace(/\./g, '')) || 0;

  const laborProductivity = opsNum > 0 ? Math.round(volNum / opsNum) : 0;

  // Maliyet yapısı: boş bırakılan oranlar sektör varsayılanından tamamlanır
  const sectorCostStr = getSectorCostStructure(sektor, urunGrubu);
  const urunGrubuOranNum = Number(urunGrubuOran) || 35;
  const productFamilyTurnover = turnoverNum * (urunGrubuOranNum / 100);
  const currentCostTurnoverBase = useProductFamilyCost ? productFamilyTurnover : turnoverNum;
  const costOr = (val: string, fallback: number) => (val === '' || val === undefined || isNaN(Number(val)) ? fallback : Number(val));
  const costPctInput = {
    malzeme: costOr(costPropMaterial, sectorCostStr.malzeme * 0.9),
    iscilik: costOr(costPropLabor, sectorCostStr.iscilik * 0.9),
    enerji: costOr(costPropEnergy, sectorCostStr.enerji * 0.9),
    bakim: costOr(costPropMaintenance, sectorCostStr.bakim * 0.9),
    genel: costOr(costPropOverhead, sectorCostStr.genel * 0.9),
  };
  const costFromSector = [costPropMaterial, costPropLabor, costPropEnergy, costPropMaintenance, costPropOverhead].some(v => v === '')
    || costAutoSnapshot === costSnapshotOf([costPropMaterial, costPropLabor, costPropEnergy, costPropMaintenance, costPropOverhead, costPropProfit]);

  const recommendedDays = currentProgram.op1.ag;
  // Olgunluk skoru değişip yeni paket önerildiğinde seçim önerilene döner
  useEffect(() => { setSelectedPackageId(undefined); }, [recommendedDays]);
  const qlaInput: QlaInput = {
    turnover: currentCostTurnoverBase,
    costPct: costPctInput,
    costFromSector,
    scrapPct: scrapRateNum,
    reworkPct: reworkRateNum,
    overtimePct: overtimeRateNum,
    plannedEffPct: plannedEffNum,
    actualEffPct: actualEffNum,
    oeePct: oeeNum,
    setupPerWeek: setupFrequencyNum,
    setupMinutes: setupDurationNum,
    setupMachines: setupMachineCountNum,
    setupOperators: affectedOpsSetupNum,
    setupTimePct: Number(setupTimePct) || 0,
    breakdownPct: Number(breakdownPct) || 0,
    planRealizationPct: Number(planRealizationPct) || 0,
    laborCostMonthly: grossLaborCostNum,
    operators: opsNum,
    leadTimeDays: leadTimeNum,
    annualVolume: volNum,
    stockValue: Number(stockValue.toString().replace(/\./g, '')) || 0,
    stockUnits: Number(stockUnits.toString().replace(/\./g, '')) || 0,
    currency,
    sustainYears,
    recommendedDays,
    maturityScore: totalScore,
    budgetOf: (days: number) => getProgramRateInfo('paket', days).rate * days,
    selectedPackageId,
  };
  const qla = computeQla(qlaInput);

  // Maliyet tabanları (görüntüleme)
  const operatingProfitVal = currentCostTurnoverBase * ((Number(costPropProfit) || 0) / 100);
  const m_base = qla.bases.malzeme;
  const i_base = qla.bases.iscilik;
  const e_base = qla.bases.enerji;
  const b_base = qla.bases.bakim;
  const g_base = qla.bases.genel;

  // Kayıp havuzu
  const loss_durus = qla.lossByKey.durus;
  const loss_kalite = qla.lossByKey.kalite;
  const loss_mesai = qla.lossByKey.mesai;
  const loss_hurda = qla.lossByKey.hurda;
  const loss_iscilik = qla.lossByKey.iscilik;
  const loss_kapasite = qla.lossByKey.kapasite;
  const totalLossExpected = qla.totalLoss;
  const totalLossConservative = qla.totalLossMin;
  const totalLossHigh = qla.totalLossMax;
  const totalLossAvg = totalLossExpected;
  const totalCopqPool = totalLossExpected;

  // Eski ekranlarla uyumlu ara değerler
  const copqLossMin = loss_hurda + loss_kalite;
  const annualSetupsCount = qla.setup.annualSetups;
  const annualSetupHours = qla.setup.annualHours;
  const setupLaborLoss = qla.setup.laborPart;
  const setupOpportunityLoss = qla.setup.fixedPart;
  const hourlyTurnoverRate = setupMachineCountNum > 0 ? turnoverNum / setupMachineCountNum / 4000 : 0;
  const efficiencyGap = Math.max(0, plannedEffNum - actualEffNum);
  const annualOperatorHoursPaid = opsNum * 180 * 12;
  const inefficiencyLaborLoss = loss_iscilik;
  const inefficiencyOverheadLoss = 0;

  // Seçili paket (varsayılan: olgunluk skoruna göre önerilen)
  const selPkg = qla.selected;
  const leadTimeSavingsPercent = selPkg.def.kpi.leadTime;
  const targetLeadTimeRatio = (100 - leadTimeSavingsPercent) / 100;
  const targetLeadTime = Math.round(leadTimeNum * targetLeadTimeRatio * 10) / 10;
  const targetProductivityRatio = 1 + selPkg.def.kpi.productivity / 100;
  const targetProductivity = Math.round(laborProductivity * targetProductivityRatio);
  const prodImprovementPercent = selPkg.def.kpi.productivity;
  const netFinancialGain = selPkg.gainMid;
  const lossReductionPercent = totalLossAvg > 0 ? Math.round(netFinancialGain / totalLossAvg * 100) : 0;
  const targetLossRatio = 1 - lossReductionPercent / 100;
  const targetLossCost = Math.round(totalLossAvg - netFinancialGain);

  // Fırsat matrisi: seçili paketin kazancı kategorilere dağıtılmış hali
  const opp = (k: LossKey) => qla.opportunities.find(o => o.key === k)!;
  const range = (k: LossKey) => ({ minPct: opp(k).pctMin, maxPct: opp(k).pctMax });
  const oppScR = range('hurda');
  const oppFmR = range('hurda');
  const oppMesR = range('mesai');
  const oppYiR = range('kalite');
  const oppOvR = range('iscilik');
  const oppSetupR = range('durus');
  const oppPdR = range('ariza');
  const oppOeeR = range('kapasite');
  const oppOpvR = range('iscilik');
  const oppLtR = { minPct: 0, maxPct: 0 };
  const oppWipR = range('stok');
  const oppSpR = { minPct: 0, maxPct: 0 };
  const opp_sc_min = opp('hurda').gainMin, opp_sc_max = opp('hurda').gainMax;
  const opp_fm_min = 0, opp_fm_max = 0;
  const opp_mes_min = opp('mesai').gainMin, opp_mes_max = opp('mesai').gainMax;
  const opp_yi_min = opp('kalite').gainMin, opp_yi_max = opp('kalite').gainMax;
  const opp_ov_min = opp('iscilik').gainMin, opp_ov_max = opp('iscilik').gainMax;
  const opp_opv_min = 0, opp_opv_max = 0;
  const opp_setup_min = opp('durus').gainMin, opp_setup_max = opp('durus').gainMax;
  const opp_oee_min = opp('kapasite').gainMin, opp_oee_max = opp('kapasite').gainMax;
  const opp_pd_min = opp('ariza').gainMin, opp_pd_max = opp('ariza').gainMax;
  const opp_lt_min = 0, opp_lt_max = 0;
  const opp_wip_min = opp('stok').gainMin, opp_wip_max = opp('stok').gainMax;
  const opp_sp_min = 0, opp_sp_max = 0;

  const total_dma_min = opp_sc_min + opp_mes_min + opp_yi_min + opp_ov_min;
  const total_dma_max = opp_sc_max + opp_mes_max + opp_yi_max + opp_ov_max;
  const total_ky_min = opp_setup_min + opp_oee_min + opp_pd_min;
  const total_ky_max = opp_setup_max + opp_oee_max + opp_pd_max;
  const total_sok_min = opp_wip_min;
  const total_sok_max = opp_wip_max;
  const total_economic_min = selPkg.gainMin;
  const total_economic_max = selPkg.gainMax;
  // Ciroya oran
  const minEconomicLossPct = turnoverNum > 0 ? Math.round(total_economic_min / turnoverNum * 1000) / 10 : 0;
  const maxEconomicLossPct = turnoverNum > 0 ? Math.round(total_economic_max / turnoverNum * 1000) / 10 : 0;

  // Paket kartları (52 / 104 / 156 / 208 adam-gün)
  const pkgOf = (id: string) => qla.packages.find(p => p.def.id === id)!;
  const op1_min = pkgOf('standart').gainMin, op1_max = pkgOf('standart').gainMax;
  const op2_min = pkgOf('hizli').gainMin, op2_max = pkgOf('hizli').gainMax;
  const op3_min = pkgOf('donusum').gainMin, op3_max = pkgOf('donusum').gainMax;
  const op4_min = pkgOf('opmuk').gainMin, op4_max = pkgOf('opmuk').gainMax;

  const getDynamicGembaFindings = () => {
    const findingsDatabase: Record<number, {
      title: string;
      obs: string;
      evidence: string;
      opImpact: string;
      finImpact: string;
      leanTool: string;
    }> = {
      1: {
        title: "Yönetim Süreçlerinin İzlenebilirliği",
        obs: "Tesis genelinde üst stratejik hedefler ile saha operasyonel hedefleri (KPI) arasında dikey hizalama eksikliği saptandı.",
        evidence: "Yönetim hedeflerinin panolarda güncel olmaması, vardiya amirlerinin ve operatörlerin tesis hedeflerini ezbere bilmemesi.",
        opImpact: "Çalışanların hedeflerden bağımsız, sadece günlük işi tamamlama odaklı çalışması ve metodolojik takip yetersizliği.",
        finImpact: "Hizalanmamış operasyonların yarattığı zaman kaybı ve plansız duruş maliyetleri ile kaçırılan ciro fırsatları.",
        leanTool: "Saha Günlük Yönetim Sistemi (Asakai Panoları) ve Hoshin Kanri (Stratejik Hedef Yayılımı)"
      },
      2: {
        title: "Operasyonel Faaliyet Raporlama",
        obs: "Saha operasyonel süreçlerinde veri saydamlığı ve standardize edilmiş anlık sorun çözme disiplini yetersiz.",
        evidence: "Raporların geçmişe dönük ve statik olması, kök neden analizi yapılmadan kapanan aksiyon dosyaları.",
        opImpact: "Tekrarlanan kronik problemler, operatör yorgunluğu ve arıza müdahale süreçlerinde gecikmeler.",
        finImpact: "Gecikmeli düzeltici faaliyetlerin yol açtığı verimsiz çalışma saatleri ve ilave işçilik kayıpları.",
        leanTool: "Olay Yeri Yönetimi (Shopfloor Management) ve KPI Panoları"
      },
      3: {
        title: "Değer Akışının Yönetimi (Akış Tasarımı)",
        obs: "Üretim süreçlerinde tek parça akış yerine yüksek partili üretim ve dengesiz hat yerleşimi.",
        evidence: "Prosesler arası kontrolsüz ara stok yığılmaları, yoğun forklift trafiği, malzemelerin fabrika içi mükerrer taşınması.",
        opImpact: "Ara stokların (WIP) birikmesi, darboğazların maskelenmesi ve sipariş tedarik sürelerinin (Lead Time) uzaması.",
        finImpact: "İşletme sermayesinin yarı mamule bağlanması, teslimat gecikmeleri ve sönümlenmiş sevkiyat hızı.",
        leanTool: "VSM (Değer Akış Haritalama), Hücresel Hat Tasarımı ve Malzeme Akışı Çekme Sistemi"
      },
      5: {
        title: "Operasyonel Maliyetler ve OEE İzleme",
        obs: "Kritik ekipmanların ve hatların gerçek zamanlı ve şeffaf OEE (Toplam Ekipman Etkinliği) takibinin bulunmaması.",
        evidence: "Duruş nedenlerinin operatörlerin subjektif beyanlarına dayanması, mikro duruşların ve hız kayıplarının izlenmemesi.",
        opImpact: "Ekipman kayıplarında kök neden analizlerinin sığ kalması, plansız duruşların bakım programlarını sabote etmesi.",
        finImpact: "Düşük OEE nedeniyle tesis genelinde sönümlenemeyen yüksek sabit giderler ve birim maliyet artışları.",
        leanTool: "Dijital OEE Takip Altyapısı, Kaizen Ekipleri ve 5-Neden Analizi"
      },
      8: {
        title: "Saha Düzeni ve 5S Standartları",
        obs: "Saha düzeni, arama ve taşıma israflarının sahada yaygın olması, görsel standartların zayıflığı.",
        evidence: "Kalıp aparatlarının makinelerin dibinde düzensiz konumlanması, temizlik standartlarının olmayışı, yer çizgilerinin silikliği.",
        opImpact: "Operatörlerin vardiya başlarında ve kalıp değişimlerinde alet/kalıp arayarak efektif çalışma süresinden saniyeler kaybetmesi.",
        finImpact: "Arama kayıpları nedeniyle azalan efektif çalışma süresi, yıllık toplamda ciddi görünmez mavi yaka zaman maliyeti.",
        leanTool: "5S Saha Düzeni, Renk Kodlamaları ve Görsel Kontrol Kontrolleri"
      },
      10: {
        title: "Standart İş Uygulamaları",
        obs: "Aynı iş istasyonlarında operatörler arasında çalışma metod varyasyonlarının belirgin düzeyde yüksek olması.",
        evidence: "Aynı ürünün farklı operatörlerce farklı sürelerde ve farklı kalitede üretilmesi, Standart İş Talimatlarının sahada bulunmaması.",
        opImpact: "Proses kararsızlığı, çevrim sürelerinde yüksek sapma, standart dışı uygulamalardan kaynaklı yüksek kalite kayıpları.",
        finImpact: "Metot varyasyonlarının doğurduğu kalite ıskartaları, tamir (rework) maliyetleri ve verimsiz fazla mesailer.",
        leanTool: "Standart İş (Yamazumi), Hat Dengeleme ve Görsel SOP Standartları"
      },
      11: {
        title: "Kapasite & Çevrim Analizi (Setup)",
        obs: "Kalıp ve model değişim (Setup/Changeover) sürelerinin uzun sürmesi, hatların atıl kalması.",
        evidence: "İki ürün geçişi arasında makinenin duruş süresinin 60 dakikayı aşması, operatörlerin hazırlıkları hat dururken yapması.",
        opImpact: "Müşterinin esnek sipariş taleplerine hızlı yanıt verememe, darboğaz makinelerde duruş nedeniyle üretkenliğin tıkanması.",
        finImpact: "Yıllık fırsat ciro kayıpları ve duruş anındaki atıl mavi-yaka maliyet yıpranması.",
        leanTool: "SMED (Tek Dakikalarda Hızlı Kalıp Değişimi Metodu)"
      },
      17: {
        title: "Otonom Bakım Çalışmaları (TPM)",
        obs: "Ekipmanlarda operatör seviyesinde günlük bakım, temizlik ve kontrol disiplininin yerleşmemiş olması.",
        evidence: "Saha ekipmanlarında yağ sızıntıları, toz birikimleri, küçük aşınmaların ve gevşemelerin vaktinde fark edilmemesi.",
        opImpact: "Makine yıpranmalarının hızlanması, kronik arıza sıklığının artarak planlama sistemini aksatması.",
        finImpact: "Plansız büyük bakım masrafları ve duruş anlarında kaçan yüksek karlı ciro dilimleri.",
        leanTool: "TPM Otonom Bakım Standardı, Temizlik-Kontrol Çizelgeleri ve Küçük Otonom Kaizenler"
      }
    };

    const lowScores = Object.entries(scores)
      .map(([no, val]) => ({ no: Number(no), score: val as number }))
      .filter(x => x.score >= 0 && x.score < 3 && findingsDatabase[x.no])
      .sort((a, b) => a.score - b.score);

    if (lowScores.length > 0) {
      return lowScores.slice(0, 5).map(ls => ({
        no: ls.no,
        score: ls.score,
        ...findingsDatabase[ls.no]
      }));
    } else {
      return [3, 8, 10, 17].map(no => ({
        no,
        score: 1,
        ...findingsDatabase[no]
      }));
    }
  };

  // Styling Helpers
  const getScoreColorClass = (score: number) => {
    if (score <= 12) return 'bg-[#E53E3E]'; // SEVİYE 1: SAHA KÜLTÜRÜ ZAYIF (Koyu Kırmızı)
    if (score <= 25) return 'bg-[#D69E2E]'; // SEVİYE 2: TEMEL SEVİYE (Koyu Sarı)
    if (score <= 40) return 'bg-[#3182CE]'; // SEVİYE 3: GELİŞTİRİLEBİLİR (Koyu Mavi)
    return 'bg-[#38A169]'; // SEVİYE 4: SÜRDÜRÜLEBİLİR (Koyu Yeşil)
  };

  const getScoreTextClass = (score: number) => {
    if (score <= 12) return 'text-[#9B1C1C] bg-red-50 border-red-300';
    if (score <= 25) return 'text-[#92400E] bg-amber-50 border-amber-300';
    if (score <= 40) return 'text-[#075985] bg-sky-50 border-sky-300';
    return 'text-[#065F46] bg-emerald-50 border-emerald-300';
  };

  const getScoreLabel = (score: number) => {
    if (score <= 12) {
      return 'SEVİYE 1 – SAHA GÖZLEMİ (SAHA KÜLTÜRÜ ZAYIF): İşletmede temel saha yönetim sistemleri yeterince oluşturulmamıştır. Standart çalışma, görsel yönetim, problem çözme ve sürekli iyileştirme uygulamalarında önemli gelişim alanları bulunmaktadır.';
    }
    if (score <= 25) {
      return 'SEVİYE 2 – TEMEL SEVİYE: İşletmede belirli uygulamalar bulunmaktadır ancak sistematik yapı ve sürdürülebilirlik açısından gelişim ihtiyacı vardır. Operasyonel performansın artırılması için yapılandırılmış iyileştirme çalışmaları önerilir.';
    }
    if (score <= 40) {
      return 'SEVİYE 3 – GELİŞTİRİLEBİLİR: İşletmede operasyonel yönetim altyapısı büyük ölçüde oluşturulmuştur. Verimlilik, liderlik sistemi ve sürekli iyileştirme kültürünün güçlendirilmesiyle önemli kazanımlar elde edilebilir.';
    }
    return 'SEVİYE 4 – SÜRDÜRÜLEBİLİR: İşletme operasyonel olgunluk açısından güçlü bir seviyededir. Bu aşamada kapsamlı danışmanlık projelerinden ziyade belirli konulara odaklanan eğitim, mentorluk ve koçluk çalışmaları daha yüksek katma değer ve sürdürülebilir kazanım sağlayacaktır.';
  };

  const getSectorBenchmark = (sectorStr: string, productStr: string) => {
    const sec = (sectorStr || "").toLowerCase();
    const prod = (productStr || "").toLowerCase();

    // Default values matching Turkish manufacturing context
    const benchmark = {
      title: "Metal, Makine ve Genel Endüstriyel İmalat Benchmarkı",
      problems: "Yüksek model değişim süreleri (Setup/SMED), plansız duruşlar, hatlarda biriken yarı mamul (WIP) yığınları ve düzensiz malzeme lojistiği.",
      standards: "Dünya Klasında Üretim (WCM) standartlarında OEE hedefi %85+, hurda oranları %1'in altında, SMED süreleri tek haneli dakikalardadır.",
      gap: "Gözlemlenen veriler doğrultusunda, model değişim kayıpları ve durma israflarında azaltım yapılabilir. SMED ile %50 potansiyel kapasite artışı mümkündür."
    };

    if (sec.includes("oto") || sec.includes("tasit") || sec.includes("parca") || prod.includes("oto") || prod.includes("yedek")) {
      benchmark.title = "Otomotiv Yan Sanayi & Yedek Parça Benchmarkı";
      benchmark.problems = "Sıkı OEM sevkiyat takvimleri, tam zamanında üretim (JIT) zorunluluğu, yüksek değişkenlikte kalıp ve model değişim (Setup) süreleri.";
      benchmark.standards = "Otomotiv sektörü OEE dünya standardı %82 - %90 seviyesindedir. Kalitesizlik ve PPM oranları milyonda seviyelerle ölçülür.";
      benchmark.gap = "Mevcut duruş ve setup sürelerinizin SMED (Hızlı Model Değişimi) çalışmalarıyla saniyeler mertebesine indirilmesi, OEM denetim skoralrınızı ve kapasitenizi %30+ iyileştirecektir.";
    } else if (sec.includes("gida") || sec.includes("icecek") || sec.includes("unlu") || prod.includes("gida") || prod.includes("ambalaj")) {
      benchmark.title = "Gıda, İçecek & Ambalaj Hızlı Tüketim Benchmarkı";
      benchmark.problems = "Yüksek temizlik (CIP) / hijyen kaynaklı duruşlar, hammadde fireleri, mevsimsel talep dalgalanmaları ve ambalaj hatlarında mikro duruşlar.";
      benchmark.standards = "FMCG / Gıda hatlarında OEE hedefi %85-%92 arasındadır. Sıfır kontaminasyon ve anlık fire takibi kritik önceliktir.";
      benchmark.gap = "Hat sonu ambalaj süreçlerinde ve ürün değişim süreçlerinde TPM (Toplam Verimli Bakım) otonom bakım felsefesiyle duruşlar %40 azaltılabilir.";
    } else if (sec.includes("mobilya") || sec.includes("ahsap") || prod.includes("mobilya") || prod.includes("kabin") || prod.includes("panel")) {
      benchmark.title = "Mobilya & Ahşap İşleme Sektör Benchmarkı";
      benchmark.problems = "Kesim ve delik hatlarında yoğun yarı-mamul (WIP) yığılması, yüksek ebatlama fire oranları, el montaj hatlarında istasyonsal dengesizlikler.";
      benchmark.standards = "Mobilya imalatında standart verimlilik %75-%80 bandındadır. Hurda ve ıskarta oranları %1.5 seviyelerinde hedeflenir.";
      benchmark.gap = "VSM (Değer Akış Şeması) analiziyle darboğaz tespiti yapılarak üretim hatlarında tek-parça akışı (One-Piece-Flow) kurulması, teslim sürenizi %50 kısaltacaktır.";
    } else if (sec.includes("plastik") || sec.includes("enjeksiyon") || prod.includes("plastik") || prod.includes("kalip")) {
      benchmark.title = "Plastik Enjeksiyon ve Kalıplama Benchmarkı";
      benchmark.problems = "Kalıp değişimlerinde uzun mekanik ısınma/soğuma süreleri, yolluk fireleri, hammadde kurutma gecikmeleri ve yüksek enerji tüketimi.";
      benchmark.standards = "Plastik enjeksiyonda OEE standardı %80 üzeridir. Kalıp değişim süreleri (SMED) kalıp tonajına göre 10-15 dakikayı aşmamalıdır.";
      benchmark.gap = "Enjeksiyon kalıplarınızda uygulayacağımız SMED metotları ve TPM otonom bakım planı ile duruş sürelerinizde %60 azalma ve her kalıpta enerji tasarrufu hedeflenir.";
    } else if (sec.includes("tekstil") || sec.includes("konfeksiyon") || prod.includes("kumas") || prod.includes("dikim")) {
      benchmark.title = "Tekstil & Hazır Giyim Sanayi Benchmarkı";
      benchmark.problems = "Yüksek dikim/kesim operasyonel değişkenlikleri, operatör el becerisi farkları, parti bazlı (lot) hatalar ve dikim hatlarında aşırı yarı mamul.";
      benchmark.standards = "Tekstil hazır giyim hatlarında operasyonel verim %70-%75 bandındadır. Kalitesizlik oranı %2'lerin altında hedeflenir.";
      benchmark.gap = "Hatlarda uygulanacak standart süre (Etüt) analizleri, u-tipi montaj hücresel tasarımları ve hat dengeleme çalışmaları ile kişi başı üretim verimi %25 artırılabilir.";
    }

    return benchmark;
  };

  const handleScoreChange = (itemNo: number, value: number) => {
    setScores(prev => ({
      ...prev,
      [itemNo]: prev[itemNo] === value ? UNSCORED : value
    }));
  };

  const setAllScoresTo = (value: number) => {
    const updated: Record<number, number> = {};
    for (let i = 1; i <= 17; i++) {
      updated[i] = value;
    }
    setScores(updated);
  };

  const runDemoFill = () => {
    // Demo veriler açık firmanın kaydının üzerine yazılır — gerçek firmada yanlışlıkla basılmasın
    if (!window.confirm(`Örnek (demo) veriler "${firmaAdi || 'bu firma'}" kaydının üzerine yazılacak: ciro, OEE, hurda, puanlar vb. değişir. Devam edilsin mi?`)) return;
    setFirmaAdi("Akar Otomotiv A.Ş.");
    setSektor("Otomotiv Yan Sanayi");
    setAdres("Bursa / NOSAB");
    setUrunGrubu("Plastik Enjeksiyon ve Trim Parçaları");
    setCalisanSayisi("150-200");
    setVardiya("3");
    setGorusulen("Ahmet Yılmaz — Fabrika Müdürü");
    setTalepEdilenHizmet("Yalın Dönüşüm Proje Danışmanlığı");
    setNotlar(`• OEE oranları plastik enjeksiyon grubunda %58 civarında gözlemlendi. Hedef %75 ve üzeri.
• 5S seviyesi koridorlarda fena değil ancak tezgah içleri ve kalıp değişim alanlarında ciddi düzensizlik mevcut. SMED çalışması ihtiyacı var.
• Ara stok seviyeleri (WIP) yüksek, malzeme akışında gereksiz taşımalar yapılıyor.
• Vardiya liderleri problem çözme araçları (A3, 5 Neden Süreci vb.) konusunda eğitime ihtiyaç duyuyor.`);

    // Set high fidelity industrial default simulation numbers for "Akar Otomotiv"
    setAnnualVolume('650000');
    setTurnoverLira('180000050');
    setPlannedEfficiency('85');
    setActualEfficiency('58');
    setCopqRate('4.2');
    setLeadTime('14');
    setOee('58');
    setCoveredArea('5000');
    setOperatorsCount('140');
    setSetupFrequency('12');
    setSetupDuration('50');
    setAffectedOpsSetup('3');
    setGrossLaborCost('35000');

    const trialScores: Record<number, number> = {
      1: 2, 2: 1, 3: 2, 4: 1, 5: 1, 6: 2, 7: 2, 8: 1, 9: 3, 10: 1, 11: 2, 12: 1, 13: 2, 14: 1, 15: 1, 16: 2, 17: 1
    };
    setScores(trialScores);
  };

  const handleReset = () => {
    if (window.confirm('Verilen tüm puanları ve firma bilgilerini sıfırlamak istediğinize emin misiniz?')) {
      setFirmaAdi('');
      setSektor('');
      setAdres('');
      setUrunGrubu('');
      setCalisanSayisi('');
      setVardiya('');
      setGorusulen('');
      setTalepEdilenHizmet('Yalın Dönüşüm Proje Danışmanlığı');
      setNotlar('');
      
      // Sıfırla: demo rakam yerine boş alanlar (boş alan = "veri yok", hesaba katılmaz)
      [setAnnualVolume, setTurnoverLira, setPlannedEfficiency, setActualEfficiency, setCopqRate, setLeadTime, setOee,
       setCoveredArea, setOperatorsCount, setSetupFrequency, setSetupDuration, setAffectedOpsSetup, setGrossLaborCost,
       setScrapRate, setReworkRate, setOvertimeRate, setStockValue, setSetupTimePct, setBreakdownPct, setPlanRealizationPct,
       setSetupMachineCount].forEach(set => set(''));

      setScores(normalizeScores({}));
    }
  };

  const [saveToast, setSaveToast] = useState<string | null>(null);

  // ─── RELATIONAL DATABASE AUTOSAVE & MANUAL SAVE HOOK ─────────────────────
  const performSave = async () => {
    if (!currentCompanyId || isSwappingCompany.current) return;
    // Firma adı boşsa veri henüz yüklenmemiştir — boş ekran mevcut kaydın üzerine yazılmasın
    if (!firmaAdi.trim()) return;

    const activeRate = currency === 'EUR' ? (eurTry || 37.65) : currency === 'USD' ? (usdTry || 34.80) : 1;
    // Kayıtlar önerilen paket üzerinden, TL karşılığıyla tutulur
    const potentialSavingTL = Math.round((qla.recommended.gainMax || 0) * activeRate);

    // Save relational state to GembaDB
    await GembaDB.saveFullState(
      currentCompanyId,
      {
        companyName: firmaAdi,
        sector: sektor,
        location: adres,
        consultant: consultant,
        visitDate: tarih,
      },
      {
        currency,
        urunGrubu,
        calisanSayisi,
        vardiya,
        gorusulen,
        talepEdilenHizmet,
        setupMachineCount,
        annualVolume,
        productionUnit,
        turnoverLira,
        plannedEfficiency,
        actualEfficiency,
        copqRate,
        scrapRate,
        reworkRate,
        overtimeRate,
        leadTime,
        stockUnits,
        stockValue,
        setupTimePct,
        breakdownPct,
        planRealizationPct,
        sustainYears: String(sustainYears),
        oee,
        coveredArea,
        operatorsCount,
        setupFrequency,
        setupDuration,
        affectedOpsSetup,
        grossLaborCost,
        wizardGrossSalary,
        wizardSgkRate,
        wizardYemek,
        wizardServis,
        wizardSeveranceRate,
        wizardLeaveRate,
        wizardSideBenefits,
        costPropMaterial,
        costPropLabor,
        costPropEnergy,
        costPropMaintenance,
        costPropOverhead,
        costPropProfit,
        scores,
        chatMessages,
      },
      {
        overallScore: totalScore,
        potentialSaving: potentialSavingTL,
        investmentNeed: Math.round((qla.recommended.budget || 0) * activeRate),
        paybackPeriod: qla.recommended.paybackExpMonths,
        notes: notlar,
      }
    );

    // Save calculated savings list dynamically (converted to TL for reporting)
    const recOpps = computeQla({ ...qlaInput, selectedPackageId: qla.recommended.def.id }).opportunities;
    const savingsList = recOpps.filter(o => o.loss > 0).map(o => {
      const annualSaving = Math.round(((o.gainMin + o.gainMax) / 2) * activeRate);
      return {
        savingId: `s-${o.key}-${currentCompanyId}`,
        companyId: currentCompanyId,
        savingType: `${o.label} (${o.tool})`,
        currentCost: Math.round(o.loss * activeRate),
        futureCost: Math.round(o.loss * activeRate) - annualSaving,
        annualSaving,
        roi: qla.recommended.budget > 0 ? Math.round(qla.recommended.gainMid / qla.recommended.budget * 10) / 10 : 0,
        payback: qla.recommended.paybackExpMonths,
        createdDate: new Date().toISOString()
      };
    });
    GembaDB.saveSavings(currentCompanyId, savingsList);
    localStorage.setItem('gp_activeTab', activeTab);
    localStorage.setItem('gp_currency', currency);
  };

  const handleManualSave = async () => {
    await performSave();
    setSaveToast('✅ Tüm Finansal Veriler ve Kayıp Analizi Buluta Kaydedildi!');
    setTimeout(() => setSaveToast(null), 3500);
  };

  useEffect(() => {
    performSave();
  }, [
    currentCompanyId, firmaAdi, sektor, adres, urunGrubu, calisanSayisi, vardiya, gorusulen, tarih, talepEdilenHizmet, notlar,
    activeTab, currency, setupMachineCount, annualVolume, productionUnit, turnoverLira, plannedEfficiency, actualEfficiency, copqRate, scrapRate, reworkRate, overtimeRate, leadTime, stockUnits, stockValue, setupTimePct, breakdownPct, planRealizationPct, sustainYears, oee,
    coveredArea, operatorsCount, setupFrequency, setupDuration, affectedOpsSetup, grossLaborCost,
    wizardGrossSalary, wizardSgkRate, wizardYemek, wizardServis, wizardSeveranceRate, wizardLeaveRate, wizardSideBenefits,
    costPropMaterial, costPropLabor, costPropEnergy, costPropMaintenance, costPropOverhead, costPropProfit,
    consultant, scores, chatMessages, totalScore, total_economic_max, totalOp1Lira, setupLaborLoss, inefficiencyLaborLoss, totalLossExpected, eurTry, usdTry
  ]);

  const copyToClipboard = () => {
    const textObj = `
========================================================================
             GEMBA PARTNER — SAHA ÖN İNCELEME & DEĞERLENDİRME TEKLİFİ
========================================================================
TARİH: ${tarih}
MÜŞTERİ FİRMA: ${firmaAdi || "Belirtilmedi"}
SEKTÖR / ŞEHİR: ${sektor || "-"} / ${adres || "-"}
ÜRÜN GRUBU: ${urunGrubu || "-"}
ÇALIŞAN SAYISI: ${calisanSayisi || "-"} çalışan | Vardiya Yapısı: ${vardiya || "-"}
GÖRÜŞÜLEN YETKİLİ: ${gorusulen || "-"}
TALEP EDİLEN HİZMET: ${talepEdilenHizmet}
HİZMET TANIMI: ${SERVICE_HINTS[talepEdilenHizmet] || ""}

------------------------------------------------------------------------
1. DEĞERLENDİRME SONUÇLARI
------------------------------------------------------------------------
Toplam Olgunluk Puanı: ${totalScore} / 51 
Cevaplanan Kriter: ${answeredCount} / 17
Mevcut Durum Analizi: ${getScoreLabel(totalScore)}

------------------------------------------------------------------------
2. TEKLİF & DANIŞMANLIK PROGRAMI ÖNERİLERİ
------------------------------------------------------------------------

[OPSİYON 1: ${currentProgram.op1.name}${op1RateInfo.hasDiscount ? ` (%${op1RateInfo.discountPercent} ÖZEL PAKET İNDİRİMİ)` : ''}]
- Açıklama: ${DESCS[currentProgram.op1.name]}
- Danışmanlık Süresi: ${currentProgram.op1.ag} Adam Gün
- Günlük Birim Bedeli: ${currencySymbol}${op1RateInfo.rate.toLocaleString('tr-TR')}${op1RateInfo.hasDiscount ? ` (Önceki: ${currencySymbol}${op1RateInfo.preDiscount?.toLocaleString('tr-TR')} / %${op1RateInfo.discountPercent} indirim uygulandı)` : ''}
- Toplam Proje Bütçesi: ${currencySymbol}${totalOp1Lira.toLocaleString('tr-TR')} (Yaklaşık ${totalOp1Eur.toLocaleString('tr-TR')} EUR)

${currentProgram.op2.name === "Mevcut Değil" && currentProgram.op1.name === "Standart Gelişim Programı" ? `[OPSİYON 2: YALIN ÜRETİM VE OPEX EĞİTİM PAKETLERİ (Alternatif Öneri)]
- Açıklama: Saha danışmanlığı yerine, kurum içi insan kaynağı yetkinliğini artırmaya yönelik sınıf eğitim ve pratik atölye programları önerilmektedir.
- Toplam Proje Bütçesi: Özel Bütçelendirilir (Fiyat ve toplam bütçe belirtilmemiştir)` : `[OPSİYON 2: ${currentProgram.op2.name}${op2RateInfo.hasDiscount ? ` (%${op2RateInfo.discountPercent} ÖZEL PAKET İNDİRİMİ)` : ''}]
- Açıklama: ${DESCS[currentProgram.op2.name]}
- Danışmanlık Süresi: ${currentProgram.op2.ag} Adam Gün
- Günlük Birim Bedeli: ${currencySymbol}${op2RateInfo.rate.toLocaleString('tr-TR')}${op2RateInfo.hasDiscount ? ` (Önceki: ${currencySymbol}${op2RateInfo.preDiscount?.toLocaleString('tr-TR')} / %${op2RateInfo.discountPercent} indirim uygulandı)` : ''}
- Toplam Proje Bütçesi: ${currencySymbol}${totalOp2Lira.toLocaleString('tr-TR')} (Yaklaşık ${totalOp2Eur.toLocaleString('tr-TR')} EUR)${currentProgram.op2.name === "Standart Gelişim Programı" ? '\n- Alternatif Öneri: Paket 2 için Yalın Üretim ve OpEx Eğitim Paketleri de önerilir. (Fiyat ve bütçe bilgisi belirtilmemiştir)' : ''}`}

------------------------------------------------------------------------
3. SAHA TESPİTLERİ VE YORUMLAR
------------------------------------------------------------------------
${notlar || "Ek saha tespiti girilmedi."}

------------------------------------------------------------------------
AÇIKLAMALAR & SÖZLEŞME NOTLARI:
- Bu ön teklif, saha olgunluk tespit algoritmasına göre otomatik oluşturulmuştur.
- Fiyatlandırmada baz alınan döviz kuru: 1 EUR = ${eurTry.toFixed(4)} ₺
- Teklife yol ve konaklama giderleri dahil değildir.
========================================================================
    `;
    
    navigator.clipboard.writeText(textObj.trim()).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 4000);
    }).catch(err => {
      console.error('Kopyalama başarısız:', err);
    });
  };

  const handlePrint = async () => {
    if (!currentCompanyId) {
      alert('Lütfen önce bir firma seçin veya kaydedin.');
      return;
    }
    setIsGeneratingPdf(true);
    try {
      await ExportService.exportCompanyReport(currentCompanyId);
    } catch (err) {
      console.error(err);
      alert('Rapor indirilirken teknik bir hata oluştu.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const exportToExcel = () => {
    const BOM = "\uFEFF";
    let content = "";

    // 1. Baslik ve Firma Bilgileri
    content += "GEMBA SAHA OLGUNLUK RAPORU & TEKLİF DETAYLARI\n\n";
    content += `Firma Adı:\t${firmaAdi || "-"}\n`;
    content += `Sektör:\t${sektor || "-"}\n`;
    content += `Ürün Grubu:\t${urunGrubu || "-"}\n`;
    content += `Adres:\t${adres || "-"}\n`;
    content += `Değerlendirme Tarihi:\t${tarih || "-"}\n`;
    content += `Toplam Net Puan:\t${totalScore} / 51\n`;
    content += `Bağıl Olgunluk Seviyesi:\t%${Math.round((totalScore / 51) * 100)}\n`;
    content += `Önerilen Gelişim Programı:\t${currentProgram.op1.name} / ${currentProgram.op2.name}\n\n`;

    // 2. Tablo Kolon Basliklari
    content += "No\tKriter Grubu\tKriter Başlığı\tAçıklama\tDeğerlendirme Puanı (0-3)\tAçıklama / Durum\n";

    // 3. Kriterler
    CRITERIA.forEach((g) => {
      g.items.forEach((item) => {
        const scoreVal = scoreValue(scores[item.no]);
        let scoreLabel = "";
        if (scoreVal === 0) scoreLabel = "0 - Başlangıç Seviyesi / Tanımsız";
        else if (scoreVal === 1) scoreLabel = "1 - Temel Seviye / Kısmen Uygulanıyor";
        else if (scoreVal === 2) scoreLabel = "2 - Olgun Seviye / Planlı ve Ölçülebilir";
        else if (scoreVal === 3) scoreLabel = "3 - Mükemmel Seviye / Kültür Haline Gelmiş";

        content += `${item.no}\t${g.group}\t${item.cat}\t${item.text}\t${scoreVal}\t${scoreLabel}\n`;
      });
    });

    const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${(firmaAdi || "Gemba").replace(/[^a-zA-Z0-9İıŞşĞğÇçÖöÜü\s]/g, "_")}_Saha_Olgunluk_Karnesi.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Saha Olgunluk Karnesi Excel/CSV olarak başarıyla indirildi!');
  };

  const getGroupScoreSum = (groupName: string) => {
    const group = CRITERIA.find(g => g.group === groupName);
    if (!group) return { sum: 0, answered: 0, max: 0 };
    let sum = 0;
    let answered = 0;
    group.items.forEach(item => {
      if (scores[item.no] > 0) {
        sum += scores[item.no];
        answered += 1;
      }
    });
    return { sum, answered, max: group.items.length * 3 };
  };

  const notionStyles = `
    /* Notion Theme Overrides */
    body {
      background-color: #fbfbfa !important;
      color: #37352f !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif !important;
    }
    #root, .min-h-screen {
      background-color: #fbfbfa !important;
    }
    nav {
      background-color: #ffffff !important;
      border-bottom: 1px solid #e1e1e0 !important;
      box-shadow: none !important;
    }
  `;

  if (!authUser) {
    return <LoginPage onLoginSuccess={(email) => setAuthUser(email)} />;
  }

  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased font-sans pb-20 overflow-x-hidden">
        <nav className="bg-white/90 backdrop-blur-md text-slate-900 shadow-sm sticky top-0 z-50 border-b border-slate-200/80 no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-4">
                <BrandLogo />
                <div className="hidden sm:block h-8 w-px bg-slate-200"></div>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-display font-black text-xs sm:text-base text-slate-900 tracking-tight">Gemba QLA</span>
                    <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest">PRO</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Quick Loss Analyzer</span>
                </div>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="hidden lg:flex flex-col items-end text-right pr-2">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">SAHA KURU</span>
                  <div className="flex items-center space-x-2 mt-0.5 bg-slate-50 border border-slate-200/60 px-3 py-1 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-mono font-bold text-slate-700">1 EUR = {eurTry.toFixed(4)} ₺</span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 bg-slate-100/80 border border-slate-200/80 px-3 py-1.5 rounded-xl">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-mono font-bold text-slate-700 truncate max-w-[160px]">{authUser}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center border border-red-200/60"
                  title="Oturumu Kapat"
                >
                  <LogOut className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsAdminOpen(true)}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center border border-slate-200/60"
                  title="Parametrik Yönetici Ayarları"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <Dashboard 
            onOpenCompany={(companyId) => {
              loadCompany(companyId);
              setCurrentView('assessment');
            }} 
            onNewCompanyCreated={(companyId) => {
              loadCompany(companyId);
              setCurrentView('assessment');
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased font-sans pb-20 overflow-x-hidden">
      {isNotionMode && <style dangerouslySetInnerHTML={{ __html: notionStyles }} />}
      
      {/* ─── PREMIUM MODERN EXECUTIVE NAVBAR (NO-PRINT) ─── */}
      <nav className="bg-white/90 backdrop-blur-md text-slate-900 shadow-sm sticky top-0 z-50 border-b border-slate-200/80 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo Emblem & Brand Info */}
            <div 
              className="flex items-center gap-4 cursor-pointer hover:opacity-85 transition-all duration-150 active:scale-[0.98]"
              onClick={() => setCurrentView('dashboard')}
              title="Firma Portalı'na Dön"
            >
              <BrandLogo />
              <div className="hidden sm:block h-8 w-px bg-slate-200"></div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="font-display font-black text-xs sm:text-base text-slate-900 tracking-tight">Gemba QLA</span>
                  <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest">PRO</span>
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Quick Loss Analyzer</span>
              </div>
            </div>

            {/* Live Exchange Rate & Demo Trigger Actions */}
            <div className="flex items-center space-x-3 sm:space-x-4">

              <div className="hidden lg:flex flex-col items-end text-right pr-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">CANLI DÖVİZ BAZ ALIMI</span>
                <div className="flex items-center space-x-2 mt-0.5 bg-slate-50 border border-slate-200/60 px-3 py-1 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-mono font-bold text-slate-700">1 EUR = {eurTry.toFixed(4)} ₺</span>
                </div>
              </div>
              
              <button 
                onClick={handleManualSave} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-none px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md border border-emerald-500/50"
                title="Tüm operasyonel verileri ve hesaplanan finansal kayıp matrisini buluta kaydeder."
              >
                <Save className="w-4 h-4 text-emerald-100" />
                <span className="hidden sm:inline">BULUTA KAYDET</span>
                <span className="sm:hidden">Kaydet</span>
              </button>

              <button 
                onClick={runDemoFill} 
                className="bg-slate-900 hover:bg-slate-800 text-white border-none px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm"
                title="Sistem özelliklerini denemek için örnek otomotiv fabrikası verilerini yükler."
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300 animate-spin-slow" />
                <span className="hidden sm:inline">Örnek Veri Doldur</span>
                <span className="sm:hidden">Örnek Doldur</span>
              </button>

              <div className="hidden sm:flex items-center gap-2 bg-slate-100/80 border border-slate-200/80 px-3 py-1.5 rounded-xl">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-xs font-mono font-bold text-slate-700 truncate max-w-[140px]">{authUser}</span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center border border-red-200/60"
                title="Oturumu Kapat"
              >
                <LogOut className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsAdminOpen(true)}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center border border-slate-200/60"
                title="Parametrik Yönetici Ayarları"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* Toast Notification Banner */}
      {saveToast && (
        <div className="fixed top-24 right-5 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl font-black text-xs z-[999999] flex items-center gap-2.5 animate-bounce border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* ─── STANDALONE MASTERFUL PRINT HEADER (PRINT-ONLY) ─── */}
      <div className="hidden print:block bg-white p-6 border-b-4 border-red-700 mb-8 font-sans">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center space-x-4">
              <img src={appLogo} style={{ height: "45px", width: "auto", objectFit: "contain", verticalAlign: "middle" }} alt="Gemba Digital Logo" />
              <div className="h-8 w-px bg-slate-300"></div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 font-display uppercase">SAHA TESPİT RAPORU</h1>
            </div>
            <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">ENDÜSTRİYEL VERİMLİLİK VE DIŞ DANIŞMANLIK HİZMETLERİ</p>
            <p className="text-[13px] text-slate-700 font-semibold"></p>
          </div>
          <div className="text-right space-y-1.5">
            <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 border border-slate-300 px-3 py-1.5 rounded inline-block">
              1 EUR = {eurTry.toFixed(4)} TRY (Saha Kuru)
            </span>
            <p className="text-xs text-slate-500 font-medium">Telif Tarihi: {tarih}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 font-display uppercase tracking-tight text-center">
            Saha Ön İnceleme ve Tesis Olgunluk Seviyesine Göre Yaklaşık Bütçe Hizmet Teklifi
          </h2>
        </div>
      </div>

      {/* ─── MAIN APP CONTENT CONTAINER ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* ─── REQUIRED BRANDING HEADER (NO-PRINT) ─── */}
        <div 
          className="app-header no-print cursor-pointer bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4 transition-all duration-200 hover:bg-slate-50/40 active:scale-[0.995] group mb-6" 
          onClick={() => setCurrentView('dashboard')}
          title="Firma Listesine Dön"
        >
          <div className="flex items-center gap-4">
            <div className="app-title text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Saha Tespit &amp; ROI Analizörü
            </div>
          </div>
          
          <span className="text-xs text-slate-500 font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-xl group-hover:text-slate-900 group-hover:bg-slate-100 group-hover:border-slate-300 transition-all flex items-center gap-1.5 no-print select-none shrink-0 shadow-sm cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Firma Listesine Dön</span>
            <span className="sm:hidden">Geri</span>
          </span>
        </div>
        
        {/* Intro Premium Banner (No-print) */}
        <div className="mb-8 bg-white text-slate-800 rounded-3xl p-7 shadow-sm border border-slate-250/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-5 no-print relative overflow-hidden">
          {/* Decorative Background Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
          
          <div className="space-y-1.5 max-w-3xl relative z-10">
            <span className="bg-slate-100 text-slate-705 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200/80 uppercase tracking-widest text-slate-600">GEMBA ADVISOR ENGINE</span>
            <h2 className="text-xl sm:text-2xl font-display font-black tracking-tight text-slate-900 flex items-center gap-2.5 mt-1">
              <Briefcase className="w-6 h-6 text-slate-750" />
              Saha İzleme, Olgunluk Analizi ve Bütçe Formülasyon Modülü
            </h2>
            <p className="text-slate-550 text-xs sm:text-sm leading-relaxed font-semibold text-slate-550">
              Saha inceleme turlarınızda gözlemlediğiniz 17 kritik yalın kriterin durumunu derecelendirin. Sistem, saha durumuna göre planlama bütçesini, danışman adam-gün kotalarını ve opsiyon bütçelerini otomatik hazırlar.
            </p>
          </div>
          
          {/* Quick Stats Block */}
          <div className="bg-slate-50/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 text-slate-800 self-stretch md:self-auto flex md:flex-col justify-between items-center md:items-start gap-3 relative z-10 min-w-[160px] shadow-sm">
            <div>
              <span className="font-bold text-[9px] text-slate-450 tracking-widest block uppercase text-slate-500">DEĞERLENDİRME</span>
              <div className="text-base font-bold text-slate-900 mt-1">
                <span className="text-slate-900 font-extrabold">{answeredCount}</span> <span className="text-xs text-slate-500">/ 17 Kriter</span>
              </div>
            </div>
            <div className="text-right md:text-left">
              <span className="font-bold text-[9px] text-slate-450 tracking-widest block uppercase text-slate-500">TAMAMLANMA</span>
              <span className="font-mono text-xs font-bold text-emerald-600">%{Math.round((answeredCount / 17) * 100)}</span>
            </div>
          </div>
        </div>

        {/* PWA Promotion & Installation Banner (Macbook & iPad Friendly) */}
        {!isStandalone && showPwaPrompt && (
          <div className="mb-8 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden transition-all duration-300 no-print animate-fade-in">
            <div className="absolute top-0 right-0 p-2 opacity-5">
              <Sparkles className="w-24 h-24 text-slate-800 animate-pulse" />
            </div>
            
            <div className="flex items-center space-x-4 relative z-10 w-full md:w-auto">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0 border border-slate-200">
                <Cpu className="w-7 h-7 text-slate-700" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-display font-extrabold text-sm sm:text-base text-slate-900">iPad & MacBook Masaüstü Sürümü</span>
                  <span className="bg-emerald-50 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-widest">Çevrimdışı Modu Aktif</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl font-semibold">
                  Gemba Digital uygulamasını cihazınıza yükleyerek tam ekran, bağımsız bir program (PWA) olarak çalıştırın. İnternet kesintilerinde dahi fabrika sahalarında çevrimdışı ön analiz yapmaya ve teklif kurgulamaya devam edebilirsiniz!
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 shrink-0 relative z-10 w-full md:w-auto justify-end">
              <button 
                onClick={dismissPwaPrompt}
                className="text-slate-600 hover:text-slate-800 text-xs font-bold px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/60 transition cursor-pointer"
              >
                Bildirimi Gizle
              </button>
              
              <button 
                onClick={triggerPwaInstall}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
              >
                <Sparkle className="w-4 h-4 text-emerald-300 animate-pulse fill-emerald-300" />
                Masaüstü / iPad'e Yükle
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs (No-Print) */}
        <div className="flex border-b border-slate-200 mb-8 gap-2 no-print overflow-x-auto">
          <button
            onClick={() => setActiveTab('scoring')}
            className={`cursor-pointer px-5 py-4 text-xs sm:text-sm font-black uppercase tracking-wider border-b-4 transition-all flex items-center gap-2.5 shrink-0 ${
              activeTab === 'scoring'
                ? 'border-red-600 text-slate-900 bg-white'
                : 'border-transparent text-slate-450 hover:text-slate-800'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-red-650" />
            📋 Saha Olgunluk Karnesi
          </button>
          
          <button
            onClick={() => setActiveTab('financial')}
            className={`cursor-pointer px-5 py-4 text-xs sm:text-sm font-black uppercase tracking-wider border-b-4 transition-all flex items-center gap-2.5 shrink-0 ${
              activeTab === 'financial'
                ? 'border-red-600 text-slate-900 bg-white'
                : 'border-transparent text-slate-450 hover:text-slate-800'
            }`}
          >
            <Gauge className="w-4 h-4 text-red-650" />
            📉 Finansal Kayıp (Bölüm 1-3)
          </button>

          <button
            onClick={() => setActiveTab('roi')}
            className={`cursor-pointer px-5 py-4 text-xs sm:text-sm font-black uppercase tracking-wider border-b-4 transition-all flex items-center gap-2.5 shrink-0 ${
              activeTab === 'roi'
                ? 'border-red-600 text-slate-900 bg-white'
                : 'border-transparent text-slate-450 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-red-650" />
            📊 ROI Analizatörü
          </button>
        </div>

        {activeTab === 'scoring' && (
        /* ─── DESSIGN IDEA: SPLIT LAYOUT WORKBENCH ─── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: VISUAL METHODICAL CHECKLIST & DETAILS (COL SPAN 7) */}
          <div className="lg:col-span-12 xl:col-span-7 space-y-8">
            
            {/* A. CLIENT PROFILE BLOCK */}
            <section className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden relative print-card">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-red-600"></div>
              
              <div className="px-6 py-5 bg-slate-50 border-b border-slate-200/60 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-red-50 text-red-650 rounded-xl">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-base text-slate-900">1. Firma &amp; Saha İnceleme Karnesi</h3>
                    <p className="text-xs text-slate-500">Müşteri firmasının operasyonel künyesi ve ziyaret parametreleri</p>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-200/80 text-slate-600 font-bold px-2 py-0.5 rounded uppercase tracking-wider hidden sm:inline-block">KÜNYE</span>
              </div>
              
              <div className="p-6 space-y-6">
                
                {/* 2x4 Modern Industrial Form Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1">
                      Firma Ticari Unvanı
                    </label>
                    <input 
                      type="text" 
                      value={firmaAdi}
                      onChange={e => setFirmaAdi(e.target.value)}
                      placeholder="Müşteri firmasının resmi adı" 
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all bg-stone-50/40"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      Faaliyet Gösterilen Sektör
                    </label>
                    <input 
                      type="text" 
                      value={sektor}
                      onChange={e => setSektor(e.target.value)}
                      placeholder="Örn: Ağır Sanayi, Beyaz Eşya vb." 
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all bg-stone-50/40"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      Lokasyon / Şehir
                    </label>
                    <input 
                      type="text" 
                      value={adres}
                      onChange={e => setAdres(e.target.value)}
                      placeholder="Örn: Bursa, Manisa / OSB" 
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all bg-stone-50/40"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      Üretilen Ürün / Proses Grubu
                    </label>
                    <input 
                      type="text" 
                      value={urunGrubu}
                      onChange={e => setUrunGrubu(e.target.value)}
                      placeholder="Kalıp Üretimi, Montaj Hatları vb." 
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all bg-stone-50/40"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      Çalışan Sayısı Bandı
                    </label>
                    <select 
                      value={calisanSayisi}
                      onChange={e => setCalisanSayisi(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-3.5 text-sm text-slate-850 bg-stone-50/40 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all cursor-pointer"
                    >
                      <option value="">Seçiniz...</option>
                      <option value="1-50">1 – 50 Çalışan (Mikro Saha)</option>
                      <option value="50-100">50 – 100 Çalışan (Kobisel Tesis)</option>
                      <option value="100-150">100 – 150 Çalışan (Gelişmiş Tesis)</option>
                      <option value="150-200">150 – 200 Çalışan (Büyük Tesis - Tip 1)</option>
                      <option value="200-300">200 – 300 Çalışan (Büyük Tesis - Tip 2)</option>
                      <option value="300-400">305 – 400 Çalışan (Geniş Tesis)</option>
                      <option value="400-500">400 – 500 Çalışan (Dev Tesis - Tip 1)</option>
                      <option value="500+">500+ Üzeri Çalışan (Entegre Tesis)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      Çalışılan Vardiya Modeli
                    </label>
                    <select 
                      value={vardiya}
                      onChange={e => setVardiya(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-3.5 text-sm text-slate-850 bg-stone-50/40 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all cursor-pointer"
                    >
                      <option value="">Seçiniz...</option>
                      <option value="1">1 Vardiya (Gündüz Düzeni)</option>
                      <option value="2">2 Vardiya (Çift Operasyon)</option>
                      <option value="3">3 Vardiya (Kesintisiz Saha)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      Görüşülen Karar Verici &amp; Rolü
                    </label>
                    <input 
                      type="text" 
                      value={gorusulen}
                      onChange={e => setGorusulen(e.target.value)}
                      placeholder="Ad Soyad — Unvan" 
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all bg-stone-50/40"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      Ziyaret ve Analiz Tarihi
                    </label>
                    <input 
                      type="date" 
                      value={tarih}
                      onChange={e => setTarih(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all bg-stone-50/40 cursor-pointer"
                    />
                  </div>

                </div>

                {/* ─── ENHANCED USER DIRECTIVE: SELECT BOX "TALEP EDİLEN HİZMET" ─── */}
                <div className="mt-4 pt-5 border-t border-slate-200 bg-stone-50/50 -mx-6 px-6 pb-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-extrabold text-slate-900 tracking-wider uppercase flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-red-600" />
                      • HEDEFLENEN YALIN HİZMET BAŞLIĞI
                    </label>
                    
                    <div className="relative">
                      <select 
                        value={talepEdilenHizmet}
                        onChange={e => setTalepEdilenHizmet(e.target.value)}
                        className="w-full border-2 border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:border-red-650 focus:ring-2 focus:ring-red-100 transition-all cursor-pointer shadow-sm appearance-none"
                      >
                        {HIZMET_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-4 pointer-events-none flex items-center">
                        <Check className="w-5 h-5 text-red-650 stroke-[3]" />
                      </div>
                    </div>
                    
                    <div className="mt-2 bg-rose-50 border border-rose-100/70 rounded-xl p-3.5 flex items-start space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-red-800 block uppercase tracking-wider">HİZMET KAPSAMI DANIŞMAN NOTU</span>
                        <p className="text-xs text-rose-950 font-medium leading-relaxed">
                          {SERVICE_HINTS[talepEdilenHizmet] || "Özel yalın danışmanlık hizmet kalemi."}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </section>

            {/* B. DYNAMIC PRESET NAVIGATION / STATISTICS GRID (Design Idea No. 2) */}
            <div className="space-y-3 no-print">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-[11px] font-extrabold text-slate-400 tracking-widest uppercase">
                  GELİŞİM GRUBU İLERLEME RASYOLARI
                </h4>
                <span className="text-[10px] font-bold text-red-650 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                  Kritik Süreçler
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CRITERIA.map((group, idx) => {
                  const stats = getGroupScoreSum(group.group);
                  const isFiltered = activeCategoryFilter === group.group;
                  const ratio = stats.max > 0 ? stats.sum / stats.max : 0;
                  
                  // Color for progress indicators based on ratio
                  const barColor = ratio <= 0.4 ? 'bg-[#EF4444]' : ratio <= 0.7 ? 'bg-[#F59E0B]' : 'bg-[#10B981]';
                  const textColorClass = ratio <= 0.4 ? 'text-[#EF4444]' : ratio <= 0.7 ? 'text-[#F59E0B]' : 'text-[#10B981]';
                  
                  return (
                    <button
                      key={group.group}
                      onClick={() => setActiveCategoryFilter(activeCategoryFilter === group.group ? 'Tümü' : group.group)}
                      className={`text-left p-4 rounded-xl border transition-all duration-150 cursor-pointer relative overflow-hidden group ${
                        isFiltered 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]' 
                        : 'bg-white hover:bg-slate-50 border-slate-100/90 text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.01),0_3px_10px_rgba(0,0,0,0.015)] hover:border-slate-300/60'
                      }`}
                    >
                      {/* Segment header */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl filter drop-shadow-sm transition-transform duration-150 group-hover:scale-105">{group.icon}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isFiltered ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-500 border border-slate-100'
                        }`}>
                          {stats.answered}/{group.items.length} Kry
                        </span>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-bold block truncate tracking-tight">{group.group}</span>
                        
                        {/* Interactive dynamic visual indicator */}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[9px] font-mono opacity-60">Puan:</span>
                          <span className={`text-[10px] font-extrabold ${isFiltered ? 'text-white' : textColorClass}`}>
                            {stats.sum} / {stats.max} P
                          </span>
                        </div>

                        {/* Inline custom bar */}
                        <div className="w-full bg-slate-150/60 h-1.5 rounded-full overflow-hidden mt-1 pb-[0.5px]">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${isFiltered ? 'bg-white' : barColor}`} 
                            style={{ width: `${ratio * 100}%` }}
                          ></div>
                        </div>

                      </div>
                    </button>
                  );
                })}
              </div>

              {activeCategoryFilter !== 'Tümü' && (
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200/70 text-amber-900 px-4 py-2.5 rounded-xl no-print shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-905">Şu an yalnız <strong>{activeCategoryFilter}</strong> grubuna ait kriterler elenerek filtrelenmiştir.</span>
                  </div>
                  <button 
                    onClick={() => setActiveCategoryFilter('Tümü')}
                    className="text-[10px] uppercase font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded cursor-pointer transition border border-amber-300/40"
                  >
                    Filtreyi Kaldır
                  </button>
                </div>
              )}
            </div>

            {/* C. METHODICALLY STYLE SAHA GÖZLEM KRİTERLERİ LIST */}
            <section className="space-y-4">
              
              <div className="flex items-center justify-between px-1">
                <div className="space-y-0.5">
                  <h3 className="font-display font-black text-lg text-slate-900 flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-red-650" />
                    2. Saha Durum Analiz Soru Listesi
                  </h3>
                  <p className="text-xs text-slate-500">Mevcut sahanın reel durumunu ve gözlemlerinizi puanlayın</p>
                </div>
                
                {/* Advanced Quick Setter */}
                <div className="hidden md:flex items-center gap-1.5 bg-slate-200/40 p-1 rounded-xl">
                  <button 
                    onClick={() => setAllScoresTo(1)} 
                    className="px-2.5 py-1.5 text-[9px] uppercase font-bold text-slate-650 hover:bg-white rounded-lg hover:text-red-700 transition cursor-pointer"
                    title="Pratik deneme için tümüne 1 verir"
                  >
                    Tümüne 1 (Zayıf)
                  </button>
                  <span className="text-slate-300">|</span>
                  <button 
                    onClick={() => setAllScoresTo(2)} 
                    className="px-2.5 py-1.5 text-[9px] uppercase font-bold text-slate-650 hover:bg-white rounded-lg hover:text-amber-700 transition cursor-pointer"
                    title="Pratik deneme için tümüne 2 verir"
                  >
                    Tümüne 2 (Orta)
                  </button>
                  <span className="text-slate-300">|</span>
                  <button 
                    onClick={() => setAllScoresTo(3)} 
                    className="px-2.5 py-1.5 text-[9px] uppercase font-bold text-slate-650 hover:bg-white rounded-lg hover:text-emerald-700 transition cursor-pointer"
                    title="Tümüne 3 verir"
                  >
                    Tümüne 3 (İdeal)
                  </button>
                </div>
              </div>

              {CRITERIA.map((group, groupIdx) => {
                if (activeCategoryFilter !== 'Tümü' && activeCategoryFilter !== group.group) {
                  return null;
                }

                const groupStats = getGroupScoreSum(group.group);

                return (
                  <div 
                    key={group.group} 
                    className="bg-white rounded-2xl border border-slate-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_8px_20px_rgba(18,18,23,0.02)] overflow-hidden transition-all duration-200 hover:border-slate-200/70 hover:shadow-[0_2px_8px_rgba(18,18,23,0.03),0_12px_28px_rgba(18,18,23,0.025)] print-card"
                  >
                    {/* Collapsible header styling */}
                    <div className="px-5 py-4 bg-slate-50/40 border-b border-slate-100/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                       <div className="flex items-center space-x-3">
                        <span className="text-2xl">{group.icon}</span>
                        <div>
                          <h4 className="font-display font-bold text-[14px] text-slate-900 tracking-tight">{group.group}</h4>
                          <span className="text-[10px] text-slate-500 font-medium block leading-tight">{group.desc}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0 mt-2 sm:mt-0">
                        <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Durum:</span>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                          (groupStats.sum / groupStats.max) <= 0.4 
                            ? 'bg-red-50/75 text-[#EF4444] border-red-100/50' 
                            : (groupStats.sum / groupStats.max) <= 0.7 
                            ? 'bg-amber-50/75 text-[#F59E0B] border-amber-100/55' 
                            : 'bg-emerald-50/75 text-[#10B981] border-emerald-100/60'
                        }`}>
                          {groupStats.sum} / {groupStats.max} Puan ({groupStats.answered} / {group.items.length} Puanlandı)
                        </span>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {group.items.map((item) => {
                        const score = scores[item.no] ?? UNSCORED;
                        return (
                          <div 
                            key={item.no} 
                            className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:bg-[#FAF9F7]/30 transition-colors duration-150"
                          >
                            
                            {/* Left Text Detail */}
                            <div className="space-y-1.5 flex-1 pr-3">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-[9px] font-black text-slate-500 bg-slate-100 border border-slate-250/55 px-2 py-0.5 rounded-md">
                                  K-NO: {item.no}
                                </span>
                                {item.cat && (
                                  <span className="text-[10px] font-black text-slate-800 tracking-wider uppercase">
                                    {item.cat}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold">
                                {item.text}
                              </p>
                            </div>

                             {/* Right Choice Buttons - Segmented control inspired native design */}
                            <div className="w-full md:w-auto shrink-0">
                              <div className="bg-slate-100/80 p-1.5 rounded-[18px] grid grid-cols-4 md:flex items-center gap-1.5 border border-slate-200/45 w-full md:w-auto">
                                
                                <button
                                  onClick={() => handleScoreChange(item.no, 0)}
                                  className={`px-2 py-2 rounded-xl text-xs font-bold transition-all duration-150 border cursor-pointer text-center md:min-w-[84px] flex flex-col items-center justify-center gap-0.5 ${
                                    score === 0
                                    ? 'bg-red-700 border-red-700/15 text-white shadow-[0_4px_12px_rgba(185,28,28,0.25)] ring-2 ring-red-100/20 scale-[1.03]'
                                    : 'border-transparent bg-transparent hover:bg-white/90 text-slate-500 hover:text-slate-800'
                                  }`}
                                >
                                  <span className="font-display font-black text-sm">0</span>
                                  <span className="text-[8px] sm:text-[8.5px] uppercase font-extrabold tracking-wider truncate max-w-full">İzlenmedi</span>
                                </button>

                                <button
                                  onClick={() => handleScoreChange(item.no, 1)}
                                  className={`px-2 py-2 rounded-xl text-xs font-bold transition-all duration-150 border cursor-pointer text-center md:min-w-[84px] flex flex-col items-center justify-center gap-0.5 ${
                                    score === 1
                                    ? 'bg-[#EF4444] border-[#EF4444]/15 text-white shadow-[0_4px_12px_rgba(239,68,68,0.25)] ring-2 ring-red-100/20 scale-[1.03]'
                                    : 'border-transparent bg-transparent hover:bg-white/90 text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  <span className="font-display font-black text-sm">1</span>
                                  <span className="text-[8px] sm:text-[8.5px] uppercase font-extrabold tracking-wider truncate max-w-full">Zayıf</span>
                                </button>

                                <button
                                  onClick={() => handleScoreChange(item.no, 2)}
                                  className={`px-2 py-2 rounded-xl text-xs font-bold transition-all duration-150 border cursor-pointer text-center md:min-w-[84px] flex flex-col items-center justify-center gap-0.5 ${
                                    score === 2
                                    ? 'bg-[#F59E0B] border-[#F59E0B]/15 text-white shadow-[0_4px_12px_rgba(245,158,11,0.25)] ring-2 ring-amber-100/20 scale-[1.03]'
                                    : 'border-transparent bg-transparent hover:bg-white/90 text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  <span className="font-display font-black text-sm">2</span>
                                  <span className="text-[8px] sm:text-[8.5px] uppercase font-extrabold tracking-wider truncate max-w-full">Faaliyet Var</span>
                                </button>

                                <button
                                  onClick={() => handleScoreChange(item.no, 3)}
                                  className={`px-2 py-2 rounded-xl text-xs font-bold transition-all duration-150 border cursor-pointer text-center md:min-w-[84px] flex flex-col items-center justify-center gap-0.5 ${
                                    score === 3
                                    ? 'bg-[#10B981] border-[#10B981]/15 text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)] ring-2 ring-emerald-100/20 scale-[1.03]'
                                    : 'border-transparent bg-transparent hover:bg-white/90 text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  <span className="font-display font-black text-sm">3</span>
                                  <span className="text-[8px] sm:text-[8.5px] uppercase font-extrabold tracking-wider truncate max-w-full">Geliştirilebilir</span>
                                </button>

                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            </section>

          </div>

          {/* RIGHT COLUMN: LIVELY QUOTE ENGINE & METRICS (COL SPAN 5) sticky desk */}
          <div className="lg:col-span-12 xl:col-span-5 space-y-8 lg:sticky lg:top-24">
            
            {/* ACCORDION SCORE TALLY CARD WITH GAUGING LEVEL */}
            <div className="bg-white rounded-2xl border border-slate-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_10px_30px_rgba(18,18,23,0.02)] overflow-hidden p-6 relative print-card">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full filter blur-xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <Gauge className="text-slate-700 w-4 h-4" />
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-500">TESİS OLGUNLUK GRADYANI</h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="btn-expand-maturity-view"
                    onClick={() => setIsMaturityExpanded(true)}
                    className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg border border-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    title="Ekranı Genişlet"
                  >
                    <Maximize2 className="w-3 h-3 text-slate-500" />
                    <span>Ekranı Genişlet</span>
                  </button>
                  <div className="bg-slate-50 text-slate-600 text-[10px] font-bold px-2.5 py-1.5 rounded inline-block border border-slate-100">
                    Otomatik Teşhis
                  </div>
                </div>
              </div>

              {/* Huge circular/gradient progress metrics */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">TOPLAM NET PUAN</span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-4xl font-display font-black text-slate-900 tracking-tight">
                      {totalScore}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">/ 51 Puan</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">BAĞIL OLGUNLUK</span>
                  <span className="text-lg font-mono font-black text-slate-800">
                    %{Math.round((totalScore / 51) * 100)}
                  </span>
                </div>
              </div>

              {/* Premium Progress Bar Track */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-[1.5px] border border-slate-200/30 mb-5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${getScoreColorClass(totalScore)}`}
                  style={{ width: `${Math.max(6, (totalScore / 51) * 100)}%` }}
                ></div>
              </div>

              {/* Gauge Ranges */}
              <div className="grid grid-cols-4 text-[9.5px] font-bold text-center mt-3 pt-4 border-t border-slate-200 gap-1.5 font-sans">
                <div className={`p-2 rounded-xl border-2 text-left space-y-1 ${totalScore <= 12 ? 'bg-red-100/80 text-[#9B1C1C] border-[#DC2626] shadow-sm' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                  <span className="block font-black truncate text-[11px] uppercase">Seviye 1</span>
                  <span className="font-extrabold block text-[10px]">0 - 12 P</span>
                  <span className="block text-[8px] text-slate-900 font-extrabold truncate">Saha Kültürü Zayıf</span>
                </div>
                <div className={`p-2 rounded-xl border-2 text-center space-y-1 ${totalScore >= 13 && totalScore <= 25 ? 'bg-amber-100/80 text-[#92400E] border-[#D97706] shadow-sm' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                  <span className="block font-black truncate text-[11px] uppercase">Seviye 2</span>
                  <span className="font-extrabold block text-[10px]">13 - 25 P</span>
                  <span className="block text-[8px] text-slate-900 font-extrabold truncate">Temel Seviye</span>
                </div>
                <div className={`p-2 rounded-xl border-2 text-center space-y-1 ${totalScore >= 26 && totalScore <= 40 ? 'bg-sky-100/80 text-[#075985] border-[#0284C7] shadow-sm' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                  <span className="block font-black truncate text-[11px] uppercase">Seviye 3</span>
                  <span className="font-extrabold block text-[10px]">26 - 40 P</span>
                  <span className="block text-[8px] text-slate-900 font-extrabold truncate">Geliştirilebilir</span>
                </div>
                <div className={`p-2 rounded-xl border-2 text-right space-y-1 ${totalScore >= 41 ? 'bg-emerald-100/80 text-[#065F46] border-[#059669] shadow-sm' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                  <span className="block font-black truncate text-[11px] uppercase">Seviye 4</span>
                  <span className="font-extrabold block text-[10px]">41 - 51 P</span>
                  <span className="block text-[8px] text-slate-900 font-extrabold truncate">Sürdürülebilir</span>
                </div>
              </div>

              {/* Dynamic expert advisor text */}
              <div className={`p-4 rounded-xl border text-xs leading-relaxed font-semibold flex items-start gap-3 mt-4 transition-colors duration-150 ${getScoreTextClass(totalScore)}`}>
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold uppercase text-[9px] tracking-wide block">Gözlem Teşhis Analizi</span>
                  <p className="font-medium text-[11px] leading-relaxed">{getScoreLabel(totalScore)}</p>
                </div>
              </div>

            </div>

            {/* AUTOMATIC DIPLOMATIC PACKAGES */}
            <div className="space-y-5">
              
              <div className="flex items-center justify-between px-1">
                <h4 className="text-[10px] font-black text-slate-400 tracking-widest uppercase flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-rose-550" />
                  ÖNERİLEN TEKLİF SEÇENEKLERİ
                </h4>
                
                <span className="text-[9px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-mono font-bold border border-slate-300">
                  Kur: 1 EUR = ₺{eurTry.toFixed(2)}
                </span>
              </div>

              {/* OPTION 01 PANEL */}
              <div className="bg-white rounded-2xl border-2 border-[#EF4444] shadow-[0_4px_16px_rgba(239,68,68,0.06),0_20px_40px_rgba(239,68,68,0.04)] overflow-hidden relative group transition-all duration-300 print-card">
                
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full border border-red-200 bg-red-50 text-red-650 uppercase tracking-wider flex items-center gap-1">
                      ⭐ PAKET 01 (ÖNCELİKLİ ÖNERİ)
                    </span>
                    {op1RateInfo.hasDiscount ? (
                      <span className="text-[10px] font-bold text-[#EF4444] font-mono flex items-center gap-1 bg-[#EF4444]/10 px-2.5 py-0.5 rounded-full">
                        <Percent className="w-3 h-3 text-[#EF4444]" />
                        Kampanya (%{op1RateInfo.discountPercent})
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-red-650 bg-red-50/50 border border-red-100 px-2 py-0.5 rounded-full font-mono">
                        Aşamalı Dönüşüm
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h5 className={`font-display font-black text-base text-slate-900 ${op1RateInfo.hasDiscount ? 'group-hover:text-red-900' : 'group-hover:text-slate-800'} transition-colors uppercase tracking-tight`}>
                      {currentProgram.op1.name}
                    </h5>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
                      {DESCS[currentProgram.op1.name]}
                    </p>
                  </div>

                  {/* Core parameters metrics block */}
                  <div className={`grid grid-cols-2 gap-3 border-t border-b ${op1RateInfo.hasDiscount ? 'border-[#EF4444]/10 bg-[#EF4444]/[0.015]' : 'border-slate-100/80 bg-slate-50/40'} py-4 my-2 -mx-6 px-6`}>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider mb-0.5">Hizmet Süresi</span>
                      <strong className="text-sm font-bold text-slate-800 font-display">{currentProgram.op1.ag} Adam Gün</strong>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider mb-0.5">Günlük Birim</span>
                      {op1RateInfo.hasDiscount ? (
                        <div className="flex flex-col">
                          <strong className="text-sm font-bold text-[#EF4444] font-display">
                            {currencySymbol}{op1RateInfo.rate.toLocaleString('tr-TR')} <span className="text-[10px] text-slate-400 font-normal">/gün</span>
                          </strong>
                          <span className="text-[9px] text-slate-400 line-through">
                            {currencySymbol}{op1RateInfo.preDiscount?.toLocaleString('tr-TR')}
                          </span>
                        </div>
                      ) : (
                        <strong className="text-sm font-bold text-slate-800 font-display">
                          {currencySymbol}{op1RateInfo.rate.toLocaleString('tr-TR')} <span className="text-[10px] text-slate-400 font-normal">/gün</span>
                        </strong>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-[9px] font-bold text-slate-450 uppercase block mb-1">Toplam Proje Bütçesi</span>
                    <div className="flex items-baseline justify-between">
                      <span className={`text-2xl font-display font-black ${op1RateInfo.hasDiscount ? 'text-[#EF4444]' : 'text-slate-900'}`}>
                        {currencySymbol}{totalOp1Lira.toLocaleString('tr-TR')}
                      </span>
                      <span className={op1RateInfo.hasDiscount ? `text-sm font-semibold text-[#EF4444]/80 font-mono` : `text-xs font-semibold text-slate-450 font-mono`}>
                        ≈ €{totalOp1Eur.toLocaleString('tr-TR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* OPTION 02 SPECIAL CAMPAIGN PANEL */}
              {currentProgram.op2.name === "Mevcut Değil" && currentProgram.op1.name === "Standart Gelişim Programı" ? (
                <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-[0_4px_20px_rgba(79,70,229,0.05)] overflow-hidden relative group transition-all duration-300 hover:border-indigo-400 print-card">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black px-2.5 py-1 rounded-full border border-indigo-150 bg-indigo-50 text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                        💡 ALTERNATİF PROGRAM ÖNERİSİ
                      </span>
                      <span className="text-[10px] font-bold text-indigo-500 font-sans">Eğitim &amp; Gelişim</span>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-display font-black text-base text-slate-900 group-hover:text-indigo-900 transition-colors uppercase tracking-tight">
                        YALIN ÜRETİM VE OPEX EĞİTİM PAKETLERİ
                      </h5>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-semibold">
                        Saha danışmanlığına alternatif olarak, kurum içi insan kaynağı yetkinliklerini en üst seviyeye çıkarmak, sürekli iyileştirme prensiplerini ve metodolojilerini benimsetmek amacıyla tasarlanmış özel sınıf eğitimleri ve pratik atölye programlarıdır.
                      </p>
                    </div>

                    <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/80 space-y-1 text-slate-800 leading-normal">
                      <div className="flex justify-between items-center text-xs pb-1.5 border-b border-indigo-100/50 font-sans font-semibold">
                        <span className="text-[9.5px] font-bold text-slate-405 uppercase">Hizmet Türü</span>
                        <span className="font-bold text-slate-850 text-[10.5px]">Sınıf İçi ve Pratik Atölye</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1.5 font-sans font-semibold">
                        <span className="text-[9.5px] font-bold text-slate-405 uppercase">Katılımcı Kapsamı</span>
                        <span className="font-bold text-slate-850 text-[10.5px]">Firmaya Özel Esnek Tasarım</span>
                      </div>
                    </div>

                    <div className="bg-amber-50/55 border-2 border-amber-200 rounded-xl p-3 text-center space-y-1.5 mt-2">
                      <span className="text-[10px] font-black text-[#92400E] uppercase tracking-wider block font-sans">ÖZEL BÜTÇELENDİRME MODELİ</span>
                      <p className="text-[10px] leading-relaxed text-slate-700 font-bold">
                        Bu paket için fiyat ve toplam bütçe verilmemiştir. Eğitim konu başlıkları ve katılımcı sayısına göre işletmenize özel teklif kurgulanmaktadır.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`bg-white rounded-2xl border ${op2RateInfo.hasDiscount ? 'border-[#EF4444]/15 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_10px_30px_rgba(239,68,68,0.02)] overflow-hidden relative group transition-all duration-300 hover:shadow-[0_4px_16px_rgba(239,68,68,0.04),0_20px_40px_rgba(239,68,68,0.035)] hover:border-[#EF4444]/30 print-card' : 'border-slate-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.01),0_8px_20px_rgba(18,18,23,0.012)] hover:shadow-[0_2px_12px_rgba(18,18,23,0.03),0_16px_36px_rgba(18,18,23,0.02)] hover:border-slate-200/80 print-card'}`}>
                  
                  <div className="p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${op2RateInfo.hasDiscount ? 'bg-[#EF4444]/5 text-[#EF4444] border-[#EF4444]/15' : 'bg-slate-550/5 text-slate-700 border-slate-100'}`}>
                        PAKET 02 — {op2RateInfo.hasDiscount ? `Kampanyalı Model (%${op2RateInfo.discountPercent} İndirimli)` : 'Standart Model'}
                      </span>
                      {op2RateInfo.hasDiscount ? (
                        <span className="text-[10px] font-bold text-[#EF4444] font-mono flex items-center gap-1 bg-[#EF4444]/10 px-2.5 py-0.5 rounded-full">
                          <Percent className="w-3 h-3 text-[#EF4444]" />
                          Kampanya (%{op2RateInfo.discountPercent})
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">Yoğunlaştırılmış Dönüşüm</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h5 className={`font-display font-black text-base text-slate-900 ${op2RateInfo.hasDiscount ? 'group-hover:text-red-900' : 'group-hover:text-slate-800'} transition-colors uppercase tracking-tight`}>
                        {currentProgram.op2.name}
                      </h5>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
                        {DESCS[currentProgram.op2.name]}
                      </p>
                    </div>

                    {/* Core metric parameters */}
                    <div className={`grid grid-cols-2 gap-3 border-t border-b ${op2RateInfo.hasDiscount ? 'border-[#EF4444]/10 bg-[#EF4444]/[0.015]' : 'border-slate-100/80 bg-slate-50/40'} py-4 my-2 -mx-6 px-6`}>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider mb-0.5">Hizmet Süresi</span>
                        <strong className="text-sm font-bold text-slate-800 font-display">{currentProgram.op2.ag} Adam Gün</strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider mb-0.5">Günlük Birim</span>
                        {op2RateInfo.hasDiscount ? (
                          <div className="flex flex-col">
                            <strong className="text-sm font-bold text-[#EF4444] font-display">
                              {currencySymbol}{op2RateInfo.rate.toLocaleString('tr-TR')} <span className="text-[10px] text-slate-400 font-normal">/gün</span>
                            </strong>
                            <span className="text-[9px] text-slate-400 line-through">
                              {currencySymbol}{op2RateInfo.preDiscount?.toLocaleString('tr-TR')}
                            </span>
                          </div>
                        ) : (
                          <strong className="text-sm font-bold text-slate-800 font-display">
                            {currencySymbol}{op2RateInfo.rate.toLocaleString('tr-TR')} <span className="text-[10px] text-slate-400 font-normal">/gün</span>
                          </strong>
                        )}
                      </div>
                    </div>

                    <div className="pt-2">
                      <span className="text-[9px] font-bold text-slate-450 uppercase block mb-1">Toplam Proje Bütçesi</span>
                      <div className="flex items-baseline justify-between">
                        <span className={`text-2xl font-display font-black ${op2RateInfo.hasDiscount ? 'text-[#EF4444]' : 'text-slate-900'}`}>
                          {currencySymbol}{totalOp2Lira.toLocaleString('tr-TR')}
                        </span>
                        <span className={op2RateInfo.hasDiscount ? `text-sm font-semibold text-[#EF4444]/80 font-mono` : `text-xs font-semibold text-slate-450 font-mono`}>
                          ≈ €{totalOp2Eur.toLocaleString('tr-TR')}
                        </span>
                      </div>
                    </div>

                    {/* Inline alternative recommendation for Level 2 when Paket 2 is Standart Gelişim Programı */}
                    {currentProgram.op2.name === "Standart Gelişim Programı" && (
                      <div className="mt-4 p-3 bg-indigo-50/50 border border-indigo-200/60 rounded-xl space-y-1.5 text-left">
                        <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest block font-sans">💡 ALTERNATİF PROGRAM ÖNERİSİ</span>
                        <p className="text-[11px] font-bold text-slate-800 leading-normal">
                          Paket 2 için alternatif olarak <strong className="text-indigo-900">Yalın Üretim ve OpEx Eğitim Paketleri</strong> önerilir.
                        </p>
                        <p className="text-[9.5px] text-slate-500 font-semibold leading-relaxed">
                          Saha eşlik süreçleri yerine, kurum içi ekibinize sınıf içi entegre eğitim ve atölye kurguları da hazırlanabilmektedir.
                        </p>
                        <span className="text-[9.5px] text-slate-400 block italic font-bold">
                          * Özel eğitim bütçesi ayrıca çalışılmaktadır (Fiyat ve toplam bütçe belirtilmemiştir).
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* ADVISOR TESPIT NOTES HIGHLIGHTS FIELD */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-5 space-y-3 print-card">
              <label htmlFor="comments" className="text-xs font-black text-slate-500 tracking-wider uppercase block">
                3. Danışman Saha Teşhis Notları &amp; Kritik Öncelikler
              </label>
              
              <textarea
                id="comments"
                value={notlar}
                onChange={e => setNotlar(e.target.value)}
                placeholder="Örn: Plastik Kalıplama hattında SMED kurulumu yapılarak duruşlar %20 azaltılmalı, 5S saha disiplini kurulmalı..."
                className="w-full text-xs text-slate-700 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-650 bg-stone-50/40 font-medium min-h-[120px] leading-relaxed"
              />
              <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                * Bu alanlara ekleyeceğiniz tüm notlar bütçe takibinin hemen altına otomatik eklenerek resmi PDF çıktıda yer alır.
              </p>
            </div>

            {/* QUICK ACTIONS PANEL (No print) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-5 space-y-3.5 no-print">
              <span className="text-xs font-black text-slate-500 tracking-wider uppercase block">Teklif Aksiyon Merkezi</span>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handlePrint}
                  className="bg-white hover:bg-[#EF4444] hover:text-white border border-zinc-200 hover:border-[#EF4444] text-zinc-600 font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm group"
                >
                  <FileDown className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                  PDF Raporu İndir
                </button>

                <button
                  onClick={copyToClipboard}
                  className="bg-zinc-950 hover:bg-zinc-100 text-white hover:text-zinc-950 font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm border border-transparent hover:border-zinc-200 group"
                >
                  <Copy className="w-4 h-4 text-zinc-350 group-hover:text-zinc-950 transition-colors" />
                  {copySuccess ? "Başarıyla Kopyalandı!" : "Teklifi Panoya Kopyala"}
                </button>
              </div>

              {copySuccess && (
                <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs p-3 rounded-xl text-center font-bold animate-fade-in flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  Teklif metni panoya kopyalandı! E-Posta, Slack veya WhatsApp ile hemen paylaşabilirsiniz.
                </div>
              )}

              <button
                onClick={handleReset}
                className="w-full bg-stone-50 border border-stone-200 hover:bg-stone-100 hover:text-red-700 text-slate-500 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Sıfırla &amp; Temiz Form
              </button>
            </div>

          </div>

          {/* Saha Bulguları ve Gözlemler Paneli */}
          <div className="lg:col-span-12 mt-8 no-print">
            <SahaBulgulariPanel companyId={currentCompanyId} />
          </div>

        </div>
        )}

        {activeTab === 'financial' && (
          /* ─── DYNAMIC INDUSTRIAL OPEX FINANCIAL CALCULATOR ─── */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ÜST BÖLÜM: FİNANSAL VERİ GİRİŞİ (1-2-3) — tam genişlik */}
            <div className="lg:col-span-12 space-y-8">
              
              <section className="bg-white rounded-3xl border border-slate-200/85 shadow-md overflow-hidden relative">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-red-655"></div>
                
                <div className="px-6 py-5 bg-slate-50 border-b border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-red-50 text-red-650 rounded-xl">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-base text-slate-900">1. Temel Tesis Kapasite &amp; Ciro Matrisi</h3>
                      <p className="text-xs text-slate-500">Tesisinizin genel üretim hacmi, çalışanları ve asgari finansal büyüklüğü</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-200/80 text-slate-600 font-bold px-2 py-0.5 rounded uppercase tracking-wider hidden sm:inline-block">KAPASİTE</span>
                </div>
                
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2 flex items-center justify-between bg-slate-100 p-2.5 rounded-2xl border border-slate-200/60">
                    <span className="text-xs font-black text-slate-700 pl-2">Raporlama ve Analiz Para Birimi:</span>
                    <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                      {(['TRY', 'EUR', 'USD'] as const).map(curr => (
                        <button
                          key={curr}
                          type="button"
                          onClick={() => setCurrency(curr)}
                          className={`cursor-pointer px-4 py-1.5 text-xs font-black rounded-lg transition-all ${
                            currency === curr
                              ? 'bg-slate-900 text-white shadow shadow-slate-950/20'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {curr === 'TRY' ? '₺ TL (TRY)' : curr === 'EUR' ? '€ EUR (€)' : '$ USD ($)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Yıllık Ciro / Toplam Üretim Değeri ({currencySymbol})</label>
                    <input 
                      type="text" 
                      value={turnoverLira}
                      onChange={e => setTurnoverLira(formatNumberWithDots(e.target.value))}
                      className="border border-slate-200 rounded-xl px-3.5 py-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-650 bg-stone-50/20 font-semibold text-slate-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                        Yıllık Üretim Hacmi ({productionUnit || 'Birim'})
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={annualVolume}
                        onChange={e => setAnnualVolume(formatNumberWithDots(e.target.value))}
                        placeholder="Miktar"
                        className="flex-1 border border-slate-200 rounded-xl px-3.5 py-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-650 bg-stone-50/20 font-semibold text-slate-800"
                        id="annual-volume-quantity-input"
                      />
                      <select
                        value={['Adet', 'Ton', 'Litre', 'Metre'].includes(productionUnit) ? productionUnit : 'Diğer'}
                        onChange={e => {
                          const val = e.target.value;
                          if (val !== 'Diğer') {
                            setProductionUnit(val);
                          } else {
                            setProductionUnit('');
                          }
                        }}
                        className="border border-slate-200 rounded-xl px-2.5 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-650 bg-stone-50/40 font-semibold text-slate-700 cursor-pointer min-w-[95px]"
                        id="annual-volume-unit-select"
                      >
                        <option value="Adet">Adet</option>
                        <option value="Ton">Ton</option>
                        <option value="Litre">Litre</option>
                        <option value="Metre">Metre</option>
                        <option value="Diğer">Diğer...</option>
                      </select>
                    </div>
                    {!['Adet', 'Ton', 'Litre', 'Metre'].includes(productionUnit) && (
                      <input
                        type="text"
                        value={productionUnit}
                        onChange={e => setProductionUnit(e.target.value)}
                        placeholder="Özel Birim Giriniz (Örn: m3, kg, Kutu)"
                        className="border border-slate-200 rounded-xl px-3 py-2 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-650 bg-stone-50/20 font-semibold text-slate-700 placeholder-slate-400 animate-fade-in"
                        id="annual-volume-custom-unit-input"
                      />
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Toplam Operatör Sayısı</label>
                    <input 
                      type="number" 
                      value={operatorsCount}
                      onChange={e => setOperatorsCount(e.target.value)}
                      className="border border-slate-200 rounded-xl px-3.5 py-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-650 bg-stone-50/20 font-semibold text-slate-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Toplam Kapalı Alan (m2)</label>
                    <input 
                      type="text" 
                      value={coveredArea}
                      onChange={e => setCoveredArea(formatNumberWithDots(e.target.value))}
                      className="border border-slate-200 rounded-xl px-3.5 py-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-650 bg-stone-50/20 font-semibold text-slate-800"
                    />
                  </div>

                  <div className="flex flex-col gap-2.5 sm:col-span-2 bg-rose-50/10 border border-slate-200/60 p-4 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-500 tracking-wider uppercase">
                        Operatör Başına Aylık Giydirilmiş Toplam Gider ({currencySymbol})
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCostWizardOpen(!isCostWizardOpen)}
                        className="cursor-pointer text-[10.5px] font-black text-red-650 hover:text-red-800 transition-colors flex items-center gap-1.5 bg-red-50 hover:bg-red-100 pr-3 pl-2.5 py-1 rounded-lg border border-red-200"
                        id="cost-wizard-toggle-btn"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        {isCostWizardOpen ? 'Sihirbazı Kapat' : 'Giydirilmiş Gider Sihirbazı'}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      Bu değer, mavi yakalı bir çalışanın işletmeye olan <strong>gerçek aylık tüm maliyetidir</strong> (Brüt ücret, SGK, yemek, servis, izin v.b yan haklar dahil).
                    </p>

                    <div className="relative">
                      <input 
                        type="text" 
                        value={grossLaborCost}
                        onChange={e => setGrossLaborCost(formatNumberWithDots(e.target.value))}
                        disabled={isCostWizardOpen}
                        className={`w-full border-2 border-red-200 rounded-xl px-3.5 py-3 text-sm text-red-950 font-bold ${
                          isCostWizardOpen ? 'bg-slate-50/80 cursor-not-allowed border-slate-200' : 'bg-rose-50/5 focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-600'
                        }`}
                        id="target-gross-labor-cost-input"
                        placeholder={`Örn: ${currency === 'TRY' ? '48.000' : currency === 'EUR' ? '2.000' : '2.100'}`}
                      />
                      {isCostWizardOpen && (
                        <span className="absolute right-3.5 top-3.5 text-[10px] bg-indigo-100 text-indigo-950 font-black px-2 py-0.5 rounded-md self-center">
                          Sihirbazdan Hesaplanıyor
                        </span>
                      )}
                    </div>

                    {isCostWizardOpen && (
                      <div className="mt-2.5 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 animate-fade-in" id="cost-wizard-container">
                        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200">
                          <Sliders className="w-4 h-4 text-slate-500" />
                          <h4 className="font-extrabold text-xs text-slate-800">Mavi Yaka Gerçek Görünmez Giderler Hesaplayıcı</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                          {/* 1. Brüt Ücret */}
                          <div className="flex flex-col gap-1 bg-white p-2.5 rounded-lg border border-slate-200">
                            <span className="text-[10px] font-black text-slate-500 uppercase">Aylık Brüt Temel Ücret ({currencySymbol})</span>
                            <input 
                              type="text"
                              value={wizardGrossSalary}
                              onChange={e => setWizardGrossSalary(formatNumberWithDots(e.target.value))}
                              className="mt-1 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-red-500"
                              id="wiz-gross-salary-input"
                            />
                            <span className="text-[9.5px] text-slate-400 font-semibold italic">Merkez bankası ve sektör ortalaması referanstır.</span>
                          </div>

                          {/* 2. SGK ve İşsizlik */}
                          <div className="flex flex-col gap-1 bg-white p-2.5 rounded-lg border border-slate-200">
                            <span className="text-[10px] font-black text-slate-500 uppercase">SGK &amp; İşsizlik Payı (% Oranı)</span>
                            <div className="flex gap-1.5 mt-1">
                              <input 
                                type="number"
                                step="0.5"
                                value={wizardSgkRate}
                                onChange={e => setWizardSgkRate(Number(e.target.value))}
                                className="border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-slate-800 w-full focus:outline-none focus:border-red-500"
                                id="wiz-sgk-rate-input"
                              />
                              <div className="flex gap-1">
                                {[17.5, 22.5].map(val => (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => setWizardSgkRate(val)}
                                    className={`px-2 py-1 text-[9.5px] font-black rounded border cursor-pointer border-slate-200 ${
                                      wizardSgkRate === val ? 'bg-slate-800 text-white font-extrabold' : 'bg-slate-50 text-slate-650 hover:bg-slate-100'
                                    }`}
                                  >
                                    %{val}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <span className="text-[9.5px] text-slate-400 font-semibold italic">5 puan teşvikli %17.5 / teşviksiz %22.5</span>
                          </div>

                          {/* 3. Yemek */}
                          <div className="flex flex-col gap-1 bg-white p-2.5 rounded-lg border border-slate-200">
                            <span className="text-[10px] font-black text-slate-500 uppercase">Aylık Yemek Maliyeti ({currencySymbol})</span>
                            <input 
                              type="text"
                              value={wizardYemek}
                              onChange={e => setWizardYemek(formatNumberWithDots(e.target.value))}
                              className="mt-1 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-red-500"
                              id="wiz-yemek-input"
                            />
                            <span className="text-[9.5px] text-slate-400 font-semibold italic">Aylık ortalama yemek / yemek çeki maliyeti.</span>
                          </div>

                          {/* 4. Servis */}
                          <div className="flex flex-col gap-1 bg-white p-2.5 rounded-lg border border-slate-200">
                            <span className="text-[10px] font-black text-slate-500 uppercase">Aylık Servis &amp; Ulaşım ({currencySymbol})</span>
                            <input 
                              type="text"
                              value={wizardServis}
                              onChange={e => setWizardServis(formatNumberWithDots(e.target.value))}
                              className="mt-1 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-red-500"
                              id="wiz-servis-input"
                            />
                            <span className="text-[9.5px] text-slate-400 font-semibold italic">Personel servis ve ulaşım payı.</span>
                          </div>

                          {/* 5. İzin Karşılığı */}
                          <div className="flex flex-col gap-1 bg-white p-2.5 rounded-lg border border-slate-200">
                            <span className="text-[10px] font-black text-slate-500 uppercase">Aylık İzin Karşılığı Payı (%)</span>
                            <input 
                              type="number"
                              step="0.5"
                              value={wizardLeaveRate}
                              onChange={e => setWizardLeaveRate(Number(e.target.value))}
                              className="mt-1 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-red-500"
                              id="wiz-leave-rate-input"
                            />
                            <span className="text-[9.5px] text-slate-400 font-semibold italic">Yıllık izin birikim yükünün aylık maliyete yansıması (%5).</span>
                          </div>

                          {/* 6. Kıdem Tazminatı karşılığı */}
                          <div className="flex flex-col gap-1 bg-white p-2.5 rounded-lg border border-slate-200">
                            <span className="text-[10px] font-black text-slate-500 uppercase">Yıllık Kıdem Tazminatı Provizyonu (%)</span>
                            <input 
                              type="number"
                              step="0.1"
                              value={wizardSeveranceRate}
                              onChange={e => setWizardSeveranceRate(Number(e.target.value))}
                              className="mt-1 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-red-500"
                              id="wiz-severance-rate-input"
                            />
                            <span className="text-[9.5px] text-slate-400 font-semibold italic">Yasal asgari yıpranma payı (%8.33 = yıllık 1 tam maaş).</span>
                          </div>

                          {/* 7. Yan Haklar */}
                          <div className="flex flex-col gap-1 bg-white p-2.5 rounded-lg border border-slate-200 sm:col-span-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase">Bayram Gıda Yardımı, Özel Sağlık, Yakacak &amp; Yan Haklar ({currencySymbol} / Aylık)</span>
                            <input 
                              type="text"
                              value={wizardSideBenefits}
                              onChange={e => setWizardSideBenefits(formatNumberWithDots(e.target.value))}
                              className="mt-1 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-red-500"
                              id="wiz-side-benefits-input"
                            />
                            <span className="text-[9.5px] text-slate-400 font-semibold italic">Yıllık sosyal yardım paketlerinin operatör başı aylık ortalaması.</span>
                          </div>
                        </div>

                        {/* Toplam Formül Özeti */}
                        <div className="bg-emerald-50 text-emerald-950 p-3.5 border border-emerald-150 rounded-xl space-y-1">
                          <div className="flex justify-between items-center pb-1.5 border-b border-emerald-250">
                            <span className="text-xs font-black uppercase text-emerald-900">Giydirilmiş Hesap Özeti (Formülasyon):</span>
                            <span className="text-sm font-black text-emerald-800">{currencySymbol}{grossLaborCost} / Ay</span>
                          </div>
                          <div className="text-[10.5px] list-none space-y-1 pt-1 font-semibold leading-relaxed">
                            <p>• <strong className="text-emerald-900">Brüt Ücret:</strong> {currencySymbol}{wizardGrossSalary}</p>
                            <p>• <strong className="text-emerald-900">Provizyonlar &amp; Vergiler:</strong> SGK (%{wizardSgkRate}): {currencySymbol}{Math.round((Number(wizardGrossSalary.replace(/\./g, '')) || 0) * (wizardSgkRate/100)).toLocaleString('tr-TR')} | Kıdem (%{wizardSeveranceRate}): {currencySymbol}{Math.round((Number(wizardGrossSalary.replace(/\./g, '')) || 0) * (wizardSeveranceRate/100)).toLocaleString('tr-TR')} | İzin (%{wizardLeaveRate}): {currencySymbol}{Math.round((Number(wizardGrossSalary.replace(/\./g, '')) || 0) * (wizardLeaveRate/100)).toLocaleString('tr-TR')}</p>
                            <p>• <strong className="text-emerald-900">Yan Haklar &amp; Sosyal Harcamalar:</strong> Yemek: {currencySymbol}{wizardYemek} | Yol/Servis: {currencySymbol}{wizardServis} | Diğer Haklar: {currencySymbol}{wizardSideBenefits}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-3xl border border-slate-200/85 shadow-md overflow-hidden relative">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-red-655"></div>
                
                <div className="px-6 py-5 bg-slate-50 border-b border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                      <Percent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-base text-slate-900">2. Operasyonel Verimlilik &amp; İsraf Seviyeleri</h3>
                      <p className="text-xs text-slate-500">Tesis içi kayıpları ve verimlilik hedefleri</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-200/80 text-slate-600 font-bold px-2 py-0.5 rounded uppercase tracking-wider hidden sm:inline-block">İSRAFLAR</span>
                </div>
                
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Planlanan / Hedeflenen Verimlilik (%)</label>
                    <input 
                      type="number" 
                      value={plannedEfficiency}
                      onChange={e => setPlannedEfficiency(e.target.value)}
                      className="border border-slate-200 rounded-xl px-3.5 py-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-650 bg-stone-50/20 font-semibold text-slate-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Gerçekleşen Verimlilik (%)</label>
                    <input 
                      type="number" 
                      value={actualEfficiency}
                      onChange={e => setActualEfficiency(e.target.value)}
                      className="border border-slate-200 rounded-xl px-3.5 py-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-650 bg-stone-50/20 font-semibold text-slate-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2 bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-500 tracking-wider uppercase">Kalitesizlik Oranı (COPQ) (%)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            disabled
                            value={copqRate}
                            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs bg-slate-100 font-bold text-slate-600 cursor-not-allowed"
                            title="Hurda ve Rework oranlarının dinamik toplamıdır."
                          />
                          <span className="absolute right-2 top-2 text-[8px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                            Otomatik
                          </span>
                        </div>
                        <p className="text-[9.5px] text-slate-400 font-semibold italic">* Hurda + Tamir toplamı</p>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-600 tracking-wider uppercase">Toplam Hurda Oranı (%)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={scrapRate}
                          onChange={e => setScrapRate(e.target.value)}
                          className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold bg-white text-slate-800 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-650"
                        />
                        <p className="text-[9.5px] text-slate-400 font-semibold italic">Malzeme ve çöpe giden fire payı</p>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-600 tracking-wider uppercase">Tamir / Rework Oranı (%)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={reworkRate}
                          onChange={e => setReworkRate(e.target.value)}
                          className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold bg-white text-slate-800 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-650"
                        />
                        <p className="text-[9.5px] text-slate-400 font-semibold italic">Yeniden işleme ve düzeltme payı</p>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-600 tracking-wider uppercase">Fazla Mesai Oranı (%)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={overtimeRate}
                          onChange={e => setOvertimeRate(e.target.value)}
                          className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold bg-white text-slate-800 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-650"
                        />
                        <p className="text-[9.5px] text-slate-400 font-semibold italic">İşçilikteki fazla mesai yükü</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Toplam Ekipman Etkinliği (OEE) (%)</label>
                    <input 
                      type="number" 
                      value={oee}
                      onChange={e => setOee(e.target.value)}
                      className="border border-slate-200 rounded-xl px-3.5 py-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-650 bg-stone-50/20 font-semibold text-slate-800"
                    />
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <label className="flex flex-col gap-1 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                        Setup Kaybı (% süre)
                        <input type="number" step="0.1" value={setupTimePct} onChange={e => setSetupTimePct(e.target.value)} placeholder="Opsiyonel"
                          className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 normal-case tracking-normal" />
                      </label>
                      <label className="flex flex-col gap-1 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                        Arıza Kaybı (% süre)
                        <input type="number" step="0.1" value={breakdownPct} onChange={e => setBreakdownPct(e.target.value)} placeholder="Opsiyonel"
                          className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 normal-case tracking-normal" />
                      </label>
                    </div>
                    <label className="flex flex-col gap-1 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                      Plana Göre Gerçekleşen Üretim (%)
                      <input type="number" step="0.1" value={planRealizationPct} onChange={e => setPlanRealizationPct(e.target.value)} placeholder="Opsiyonel — %100 altıysa talep var sayılır"
                        className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 normal-case tracking-normal" />
                    </label>
                    {qla.oeeBreakdown && (
                      <span className="text-[10px] text-slate-500 font-semibold">
                        OEE ayrıştırması: Kullanılabilirlik %{qla.oeeBreakdown.availability} × Performans %{qla.oeeBreakdown.performance} × Kalite %{qla.oeeBreakdown.quality}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2 bg-amber-500/5 p-4 rounded-2xl border border-amber-200/20 mt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <label className="text-[10px] font-extrabold text-amber-900 tracking-wider uppercase">Mevcut Teslim Süresi (Lead Time - Gün)</label>
                    </div>
                    <input 
                      type="number" 
                      value={leadTime}
                      onChange={e => setLeadTime(e.target.value)}
                      className="border border-amber-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-amber-950 bg-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                      placeholder="Örn: 12"
                    />
                    <span className="text-[10px] text-amber-800/80 font-semibold mt-1 italic">
                      * Sipariş alımından sevkiyata kadar geçen toplam takvim günü. Stok değeri bu süreden tahmin edilir (Little Kanunu): günlük üretim maliyeti × lead time.
                    </span>
                    <label className="text-[10px] font-extrabold text-amber-900 tracking-wider uppercase mt-2">Toplam Stok Değeri ({currencySymbol}) — Opsiyonel</label>
                    <input
                      type="text"
                      value={formatNumberWithDots(stockValue)}
                      onChange={e => { setStockValue(e.target.value.replace(/\D/g, '')); if (stockUnits) setStockUnits(''); }}
                      className="border border-amber-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-amber-950 bg-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                      placeholder="Biliniyorsa: hammadde + yarı mamul + mamul stoğunun parasal değeri"
                    />
                    <span className="text-[10px] text-amber-800/80 font-semibold italic">
                      {qla.inventory.value > 0
                        ? <>Tahmini stok değeri: <strong>{currencySymbol}{qla.inventory.value.toLocaleString('tr-TR')}</strong> ({qla.inventory.source === 'stok değeri' ? 'girilen stok değeri' : qla.inventory.source === 'stok adedi' ? `eski kayıt: stok adedi × birim maliyet ${currencySymbol}${qla.inventory.unitCost.toLocaleString('tr-TR')}` : 'lead time ile tahmin'}) · yıllık taşıma maliyeti %{Math.round(qla.inventory.carryingRate * 100)}</>
                        : 'Lead time veya stok miktarı girilirse stok taşıma maliyeti hesaplanır.'}
                    </span>
                  </div>

                  {/* En Çok Üretilen Ürün Grubu Bilgileri */}
                  <div className="flex flex-col gap-2.5 sm:col-span-2 bg-indigo-50/10 border border-indigo-100/60 p-4 rounded-2xl">
                    <div className="flex items-center gap-1.5 border-b border-indigo-100/60 pb-1.5">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      <label className="text-[10.5px] font-extrabold text-indigo-950 tracking-wider uppercase">En Çok Üretilen Ürün Ailesi &amp; Ciro Hacmi</label>
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      İlk sene gerçekleştirilen iyileştirmelerin odaklanacağı en çok koşan ürün grubunun bilgilerini giriniz:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-1">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-650 uppercase">Ürün Ailesi Adı</label>
                        <input 
                          type="text" 
                          value={urunGrubuEnCok}
                          onChange={e => setUrunGrubuEnCok(e.target.value)}
                          className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white text-slate-850 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-550"
                          placeholder="Örn: 95 kW Motor"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-650 uppercase">Yıllık Üretim Adedi ({productionUnit || 'Birim'})</label>
                        <input 
                          type="text" 
                          value={urunGrubuAdet}
                          onChange={e => setUrunGrubuAdet(formatNumberWithDots(e.target.value))}
                          className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white text-slate-850 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-550"
                          placeholder="Örn: 25.000"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-650 uppercase">Cirodaki Payı (%)</label>
                        <input 
                          type="number" 
                          value={urunGrubuOran}
                          onChange={e => setUrunGrubuOran(e.target.value)}
                          className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white text-slate-850 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-550"
                          placeholder="Örn: 35"
                          min="1"
                          max="100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-3xl border border-slate-200/85 shadow-md overflow-hidden relative">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-red-655"></div>
                
                <div className="px-6 py-5 bg-slate-50 border-b border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-base text-slate-900">3. Model Değişim (Setup / SMED) Parametreleri</h3>
                      <p className="text-xs text-slate-500">Mevcut model dönüşümlerindeki duruş süresi ve sıklığı</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-200/80 text-slate-600 font-bold px-2 py-0.5 rounded uppercase tracking-wider hidden sm:inline-block">SETUP</span>
                </div>
                
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Makine Sayısı</label>
                    <input 
                      type="text" 
                      value={setupMachineCount}
                      onChange={e => setSetupMachineCount(formatNumberWithDots(e.target.value))}
                      className="border border-slate-200 rounded-xl px-3.5 py-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-650 bg-stone-50/20 font-semibold text-slate-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Setup Sıklığı / Hafta (Makine Bşk.)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={setupFrequency}
                      onChange={e => setSetupFrequency(e.target.value)}
                      className="border border-slate-200 rounded-xl px-3.5 py-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-650 bg-stone-50/20 font-semibold text-slate-800"
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {[
                        { label: "2 hf/1", val: "0.5" },
                        { label: "1/hf", val: "1" },
                        { label: "3/hf", val: "3" },
                        { label: "Günde 1", val: "5" },
                        { label: "Günde 2", val: "10" }
                      ].map(preset => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => setSetupFrequency(preset.val)}
                          className={`cursor-pointer text-[9px] font-black px-1.5 py-0.5 rounded border border-slate-200 ${
                            setupFrequency === preset.val ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Setup Başına Süre (Dakika)</label>
                    <input 
                      type="number" 
                      value={setupDuration}
                      onChange={e => setSetupDuration(e.target.value)}
                      className="border border-slate-200 rounded-xl px-3.5 py-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-650 bg-stone-50/20 font-semibold text-slate-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Süreçte Etkilenen Mavi Yaka</label>
                    <input 
                      type="number" 
                      value={affectedOpsSetup}
                      onChange={e => setAffectedOpsSetup(e.target.value)}
                      className="border border-slate-200 rounded-xl px-3.5 py-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-650 bg-stone-50/20 font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </section>

            </div>

            {/* ALT BÖLÜM: YÖNETİCİ KARAR DESTEK RAPORU — 3. bölümün altında, tam genişlik */}
            <div className="lg:col-span-12 space-y-8">
              
              {/* ─── SECTION 1: EXECUTIVE SUMMARY (YÖNETİCİ ÖZETİ) ─── */}
              <div className="bg-white rounded-3xl border border-slate-200/95 shadow-sm p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full filter blur-xl pointer-events-none"></div>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-amber-50 text-amber-800 text-[9px] font-bold px-2.5 py-1 rounded border border-amber-200 uppercase tracking-widest">
                    C-LEVEL RAPORU
                  </span>
                  <span className="text-slate-500 text-[10px] font-bold font-mono">GP-DECISION-SUPPORT</span>
                </div>

                <h4 className="font-display font-black text-sm uppercase tracking-wide text-slate-900 mb-2 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-600" />
                  I. YÖNETİCİ ÖZETİ (EXECUTIVE SUMMARY)
                </h4>
                
                <p className="text-xs text-slate-500 leading-relaxed font-semibold mb-5">
                  Tesis genelindeki gemba incelemeleri, süreç liderleriyle yapılan mülakatlar ve mevcut operasyonel veriler ışığında hazırlanmıştır. Bu rapor, finansal kayıpların görünmeyen kök nedenlerini ve yatırım dönüş senaryolarını bir arada sunar.
                </p>

                <div className="space-y-4">
                  {/* Critical Site Findings */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-2.5">
                    <span className="text-[10px] font-black tracking-wider text-amber-800 uppercase block">En Kritik Saha Bulguları:</span>
                    <ul className="text-xs text-slate-650 space-y-2 leading-relaxed font-semibold">
                      {getDynamicGembaFindings().slice(0, 3).map((f, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-amber-650 font-bold">•</span>
                          <span><strong className="text-slate-900">{f.title}:</strong> {f.obs}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Operational Risks */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-2.5">
                    <span className="text-[10px] font-black tracking-wider text-[#DC2626] uppercase block">En Büyük Operasyonel Riskler:</span>
                    <div className="text-xs text-slate-650 space-y-2 leading-relaxed font-semibold">
                      <p>• <strong className="text-slate-900">Kapasite & Teslimat Sapması Riskleri:</strong> Setup ve model değişim duruşlarının öngörülememesi nedeniyle kritik teslimatların aksaması ve esnek ürün geçiş kısıtları.</p>
                      <p>• <strong className="text-slate-900">Ürün Güvencesi & Kayıp Erimesi:</strong> Yüksek kalitesizlik oranlarının doğrudan hammadde girdi ve yeniden işleme (rework) maliyetleriyle ciro marjını eritmesi.</p>
                      <p>• <strong className="text-slate-900">Ekipman Yaşlanması & Plansız Bakım:</strong> Otonom bakım zafiyeti nedeniyle kilit hatlarda kronikleşen duruş og plansız yüksek yedek parça masrafları.</p>
                    </div>
                  </div>


                </div>
              </div>

              {/* ─── SPECIAL SECTION: SEKTÖREL BENCHMARK TABANLI OPERASYONEL FIRSAT POTANSİYELİ ANALİZİ ─── */}
              <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-lg p-6 space-y-8">
                <div className="border-b pb-4 border-slate-200 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <span className="bg-indigo-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                      Yönetici Karar Destek Raporu
                    </span>
                    <h3 className="font-display font-black text-lg text-slate-900 mt-2 flex items-center gap-2">
                      <Briefcase className="w-6 h-6 text-indigo-600" />
                      Sektörel Benchmark Tabanlı Operasyonel Fırsat Potansiyeli Analizi
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      Saha ziyareti ön verileri ve sektör kıyaslamaları (benchmarks) üzerinden kurgulanan yüksek seviyeli fırsat tahminlemesi.
                    </p>
                  </div>
                  <div className="flex-shrink-0 self-end md:self-start">
                    <button
                      onClick={exportToExcel}
                      className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white font-black text-[11px] px-3.5 py-2 rounded-xl border border-emerald-200/80 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm group"
                      title="Saha Olgunluk Karnesi Excel Raporu"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-650 group-hover:text-emerald-50 transition-colors" />
                      <span>XLS İndir (Rapor &amp; Karne)</span>
                    </button>
                  </div>
                </div>

                {/* AŞAMA 1 - MALİYET YAPISINI OLUŞTUR */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-indigo-50/20 border border-indigo-100/50 p-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                       <span className="bg-indigo-100 text-indigo-900 text-xs font-black px-2.5 py-1 rounded">AŞAMA 1</span>
                       <h4 className="font-bold text-slate-800 text-sm">Finansal Maliyet Yapısı Modellemesi</h4>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Ürün ailesine göre hesapla Checkbox */}
                      <label className="flex items-center gap-2 cursor-pointer bg-white border border-slate-200 rounded-xl px-3 py-1.5 hover:bg-slate-50 transition-colors shadow-sm">
                        <input 
                          type="checkbox"
                          checked={useProductFamilyCost}
                          onChange={e => setUseProductFamilyCost(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="text-[11px] font-extrabold text-slate-700">Ürün ailesine göre hesapla ({urunGrubuEnCok || 'Odak Ürün'})</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          const structure = getSectorCostStructure(sektor, urunGrubu);
                          setCostPropMaterial((structure.malzeme * 0.9).toFixed(1).replace('.0', ''));
                          setCostPropLabor((structure.iscilik * 0.9).toFixed(1).replace('.0', ''));
                          setCostPropEnergy((structure.enerji * 0.9).toFixed(1).replace('.0', ''));
                          setCostPropMaintenance((structure.bakim * 0.9).toFixed(1).replace('.0', ''));
                          setCostPropOverhead((structure.genel * 0.9).toFixed(1).replace('.0', ''));
                          setCostPropProfit('10');
                          setCostAutoSnapshot(costSnapshotOf([structure.malzeme, structure.iscilik, structure.enerji, structure.bakim, structure.genel].map(v => (v * 0.9).toFixed(1).replace('.0', '')).concat('10')));
                        }}
                        className="text-[11px] font-bold text-indigo-750 hover:text-indigo-900 flex items-center justify-center gap-1.5 border border-indigo-200 bg-white hover:bg-indigo-50/50 px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Sektör Varsayılanlarına Sıfırla
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    Seçilen <strong className="text-slate-900">{sectorCostStr.title}</strong> sektörel kırılımı benchmark parametrelerine dayanarak, {useProductFamilyCost ? (
                      <>en çok koşan ürün ailesi olan <strong className="text-slate-900">{urunGrubuEnCok}</strong> grubuna ait ciro payı (yıllık <strong className="text-slate-900">{currencySymbol}{Math.round(productFamilyTurnover).toLocaleString('tr-TR')} {currency}</strong> - %{urunGrubuOranNum})</>
                    ) : (
                      <>yıllık <strong className="text-slate-900">{currencySymbol}{turnoverNum.toLocaleString('tr-TR')} {currency}</strong> toplam ciro girdiniz</>
                    )} üzerinden tesise ait tipik maliyet yapısı kırılımı ve tahmini parasal karşılıkları aşağıda verilmiştir. Oranları firmanızın gerçek bütçe dağılımına göre dilediğiniz gibi düzenleyebilirsiniz:
                  </p>
                  

                  {/* 🌐 Sektör ortalaması önerisi (web) */}
                  <div className="border border-sky-200 bg-sky-50/40 rounded-2xl p-4 space-y-3" id="cost-suggestion-panel">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-extrabold text-sky-900 uppercase tracking-wider block">🌐 Sektör Ortalaması Önerisi {costSuggestion && !costSuggestion.fromWeb ? '(Dahili Tablo)' : '(Web Araştırması)'}</span>
                        <span className="text-[10.5px] text-sky-800/80 font-semibold">Müşteri maliyet yapısını vermezse fikir edinmek için. Onaylamadan uygulanmaz.</span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button type="button" onClick={() => fetchCostSuggestion(true)} disabled={costSuggestLoading || !sektor}
                          className="text-[11px] font-bold text-sky-800 border border-sky-200 bg-white hover:bg-sky-50 px-3 py-1.5 rounded-xl cursor-pointer disabled:opacity-50">
                          {costSuggestLoading ? 'Araştırılıyor…' : 'Yeniden Araştır'}
                        </button>
                        <button type="button" onClick={applyCostSuggestion} disabled={!costSuggestion}
                          className="text-[11px] font-bold text-white bg-sky-700 hover:bg-sky-800 px-3 py-1.5 rounded-xl cursor-pointer disabled:opacity-50">
                          Önerilenleri Uygula
                        </button>
                      </div>
                    </div>
                    {!sektor && <p className="text-[11px] text-slate-500 font-semibold">Öneri için önce sektörü girin.</p>}
                    {costSuggestLoading && !costSuggestion && <p className="text-[11px] text-slate-500 font-semibold">Sektör raporları ve şirket verileri taranıyor…</p>}
                    {costSuggestion && (
                      <>
                        <table className="w-full text-[11px] border-collapse">
                          <thead>
                            <tr className="text-sky-900 border-b border-sky-200">
                              <th className="text-left py-1.5">Kalem</th>
                              <th className="text-center py-1.5">Sektör Aralığı</th>
                              <th className="text-center py-1.5">Önerilen</th>
                              <th className="text-center py-1.5">Mevcut Girdi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-sky-100 font-semibold text-slate-700">
                            {([
                              ['Malzeme', costSuggestion.malzeme, costPropMaterial],
                              ['İşçilik', costSuggestion.iscilik, costPropLabor],
                              ['Enerji', costSuggestion.enerji, costPropEnergy],
                              ['Bakım', costSuggestion.bakim, costPropMaintenance],
                              ['Genel Üretim Gideri', costSuggestion.genel, costPropOverhead],
                              ['Faaliyet Kârı', costSuggestion.kar, costPropProfit],
                            ] as [string, CostRange, string][]).map(([label, r, cur]) => (
                              <tr key={label}>
                                <td className="py-1.5">{label}</td>
                                <td className="py-1.5 text-center font-mono">%{r.min} – %{r.max}</td>
                                <td className="py-1.5 text-center font-mono font-bold text-sky-900">%{r.ort}</td>
                                <td className={`py-1.5 text-center font-mono ${Number(cur) < r.min || Number(cur) > r.max ? 'text-amber-700 font-bold' : ''}`}>%{cur || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="text-[10.5px] text-slate-600 font-medium">{costSuggestion.aciklama}</p>
                        {costSuggestion.kaynaklar.length > 0 && (
                          <div className="text-[10px] text-slate-500 font-medium space-y-0.5">
                            <span className="font-bold text-slate-600">Kaynaklar:</span>
                            {costSuggestion.kaynaklar.map((k, i) => (
                              <a key={i} href={k.url} target="_blank" rel="noreferrer" className="block truncate text-sky-700 hover:underline">{k.title}</a>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {(() => {
                    const totalSum = Math.round(((Number(costPropMaterial) || 0) + (Number(costPropLabor) || 0) + (Number(costPropEnergy) || 0) + (Number(costPropMaintenance) || 0) + (Number(costPropOverhead) || 0) + (Number(costPropProfit) || 0)) * 10) / 10;
                    return (
                      <>
                        {totalSum !== 100 && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-semibold flex items-center gap-2 mb-3">
                            <AlertCircle className="w-4.5 h-4.5 text-amber-600 flex-shrink-0" />
                            <span>Uyum Uyarısı: Girdiğiniz maliyet oranlarının toplamı <strong>%{totalSum}</strong> olarak hesaplandı. Tam bütçe doğruluğu için bu toplamın <strong>%100</strong> olmasını öneririz.</span>
                          </div>
                        )}
                        
                        <div className="overflow-hidden border border-slate-200 rounded-xl">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-3 font-extrabold text-slate-700">Maliyet Kalemi</th>
                                <th className="p-3 font-extrabold text-slate-700 text-center">Oran (%)</th>
                                <th className="p-3 font-extrabold text-slate-700 text-right">Parasal Karşılık ({currency})</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                              <tr>
                                <td className="p-3 text-slate-900 font-bold">Direkt Malzeme Giderleri</td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="text-slate-400 font-bold">%</span>
                                    <input 
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={costPropMaterial}
                                      onChange={e => setCostPropMaterial(e.target.value)}
                                      className="w-16 text-center border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-550 rounded-lg py-1 font-bold text-slate-800 bg-white"
                                    />
                                  </div>
                                </td>
                                <td className="p-3 text-right text-slate-700 hover:text-slate-900 font-black">
                                  {currencySymbol}{Math.round(m_base).toLocaleString('tr-TR')}
                                  {currency !== 'TRY' && (
                                    <span className="block text-[10px] text-slate-500 font-mono">~₺{Math.round(m_base * activeRate).toLocaleString('tr-TR')} TL</span>
                                  )}
                                </td>
                              </tr>
                              <tr>
                                <td className="p-3 text-slate-900 font-bold">
                                  <div>Direkt İşçilik Giderleri</div>
                                  <div className="text-[10px] text-slate-400 font-semibold italic mt-0.5">
                                    Dahili Fazla Mesai Yükü (%{overtimeRate}): {currencySymbol}{Math.round(i_base * (overtimeRateNum / 100)).toLocaleString('tr-TR')} · kayıp sayılan prim: {currencySymbol}{loss_mesai.toLocaleString('tr-TR')}
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="text-slate-400 font-bold">%</span>
                                    <input 
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={costPropLabor}
                                      onChange={e => setCostPropLabor(e.target.value)}
                                      className="w-16 text-center border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-550 rounded-lg py-1 font-bold text-slate-800 bg-white"
                                    />
                                  </div>
                                </td>
                                <td className="p-3 text-right text-slate-700 hover:text-slate-900 font-black">
                                  {currencySymbol}{Math.round(i_base).toLocaleString('tr-TR')}
                                  {currency !== 'TRY' && (
                                    <span className="block text-[10px] text-slate-500 font-mono">~₺{Math.round(i_base * activeRate).toLocaleString('tr-TR')} TL</span>
                                  )}
                                </td>
                              </tr>
                              <tr>
                                <td className="p-3 text-slate-900 font-bold">Enerji Giderleri</td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="text-slate-400 font-bold">%</span>
                                    <input 
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={costPropEnergy}
                                      onChange={e => setCostPropEnergy(e.target.value)}
                                      className="w-16 text-center border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-550 rounded-lg py-1 font-bold text-slate-800 bg-white"
                                    />
                                  </div>
                                </td>
                                <td className="p-3 text-right text-slate-700 hover:text-slate-900 font-black">
                                  {currencySymbol}{Math.round(e_base).toLocaleString('tr-TR')}
                                  {currency !== 'TRY' && (
                                    <span className="block text-[10px] text-slate-500 font-mono">~₺{Math.round(e_base * activeRate).toLocaleString('tr-TR')} TL</span>
                                  )}
                                </td>
                              </tr>
                              <tr>
                                <td className="p-3 text-slate-900 font-bold">Bakım Giderleri</td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="text-slate-400 font-bold">%</span>
                                    <input 
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={costPropMaintenance}
                                      onChange={e => setCostPropMaintenance(e.target.value)}
                                      className="w-16 text-center border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-550 rounded-lg py-1 font-bold text-slate-800 bg-white"
                                    />
                                  </div>
                                </td>
                                <td className="p-3 text-right text-slate-700 hover:text-slate-900 font-black">
                                  {currencySymbol}{Math.round(b_base).toLocaleString('tr-TR')}
                                  {currency !== 'TRY' && (
                                    <span className="block text-[10px] text-slate-500 font-mono">~₺{Math.round(b_base * activeRate).toLocaleString('tr-TR')} TL</span>
                                  )}
                                </td>
                              </tr>
                              <tr>
                                <td className="p-3 text-slate-900 font-bold">Genel Üretim Giderleri (Overhead)</td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="text-slate-400 font-bold">%</span>
                                    <input 
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={costPropOverhead}
                                      onChange={e => setCostPropOverhead(e.target.value)}
                                      className="w-16 text-center border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-550 rounded-lg py-1 font-bold text-slate-800 bg-white"
                                    />
                                  </div>
                                </td>
                                <td className="p-3 text-right text-slate-700 hover:text-slate-900 font-black">
                                  {currencySymbol}{Math.round(g_base).toLocaleString('tr-TR')}
                                  {currency !== 'TRY' && (
                                    <span className="block text-[10px] text-slate-500 font-mono">~₺{Math.round(g_base * activeRate).toLocaleString('tr-TR')} TL</span>
                                  )}
                                </td>
                              </tr>
                              <tr className="bg-emerald-50/40 text-emerald-950 font-bold">
                                <td className="p-3">Faaliyet Karı (Tahmini)</td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="text-slate-400 font-bold">%</span>
                                    <input 
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={costPropProfit}
                                      onChange={e => setCostPropProfit(e.target.value)}
                                      className="w-16 text-center border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-550 rounded-lg py-1 font-bold text-emerald-950 bg-white"
                                    />
                                  </div>
                                </td>
                                <td className="p-3 text-right text-emerald-900 font-black">
                                  {currencySymbol}{Math.round(operatingProfitVal).toLocaleString('tr-TR')}
                                  {currency !== 'TRY' && (
                                    <span className="block text-[10px] text-emerald-700 font-mono">~₺{Math.round(operatingProfitVal * activeRate).toLocaleString('tr-TR')} TL</span>
                                  )}
                                </td>
                              </tr>
                              <tr className="bg-slate-50 font-black text-slate-950 border-t border-slate-200">
                                <td className="p-3">TOPLAM MAHSUL DEĞERİ (CİRO)</td>
                                <td className="p-3 text-center">
                                  <span className={totalSum === 100 ? "text-slate-950" : "text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-bold inline-block"}>
                                    %{totalSum}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  {currencySymbol}{turnoverNum.toLocaleString('tr-TR')}
                                  {currency !== 'TRY' && (
                                    <span className="block text-[10px] text-slate-500 font-mono font-bold">~₺{Math.round(turnoverNum * activeRate).toLocaleString('tr-TR')} TL (Kur)</span>
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* AŞAMA 2 - OPERASYONEL FIRSAT ANALİZİ */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-900 text-xs font-black px-2.5 py-1 rounded">AŞAMA 2 &amp; 3 &amp; 4</span>
                    <h4 className="font-bold text-slate-800 text-sm">Yıllık Operasyonel Kayıp ve İsraf Özet Beyanı</h4>
                  </div>
                  <div className="bg-rose-500/5 border border-rose-200/50 rounded-2xl p-4 space-y-2 text-xs text-rose-950 font-semibold leading-relaxed">
                    <p>
                      Mevcut gemba gözlem parametreleriniz, ciro büyüklüğünüz ve operasyonel verileriniz (OEE: {oeeNum ? `%${oeeNum}` : 'ölçülmüyor'}, hurda: {scrapRateNum ? `%${scrapRateNum}` : 'veri yok'}) doğrultusunda saptanan yıllık gizli ve açık toplam israf havuzu:
                    </p>
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-rose-150 shadow-sm">
                      <span className="font-extrabold text-rose-900 uppercase tracking-wider">TOPLAM YILLIK KAYIP HAVUZU:</span>
                      <div className="flex flex-col text-right">
                        <strong className="text-sm sm:text-base font-black text-rose-700">
                          {currencySymbol}{Math.round(totalCopqPool).toLocaleString('tr-TR')} {currency} / yıl
                        </strong>
                        {currency !== 'TRY' && (
                          <span className="text-[10.5px] font-mono font-bold text-rose-900">
                            (~₺{Math.round(totalCopqPool * activeRate).toLocaleString('tr-TR')} TL / yıl)
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 italic mt-1 font-medium">
                      * Bu kayıp havuzu, direkt malzeme firelerini, düzeltme/rework işçiliklerini, fazla mesai yüklerini ve duruş kaynaklı kapasite kayıplarını içerir. Detaylı analizler ve grafikler ROI modülünde sunulmuştur.
                    </p>
                    {qla.warnings.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {qla.warnings.map((w, i) => (
                          <p key={i} className={`text-[11px] font-semibold rounded-lg px-2.5 py-1.5 border ${w.startsWith('UYARI') || w.includes('giriş hatası') || w.startsWith('İşçilik tabanı') ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                            {w}
                          </p>
                        ))}
                      </div>
                    )}
                    <div className="mt-2.5 pt-3 border-t border-rose-200/50 text-[10.5px] text-slate-600 space-y-1 bg-white/40 p-2.5 rounded-xl border border-rose-100">
                      <p className="font-extrabold uppercase tracking-widest text-rose-950 text-[9px] mb-1">DEĞERLENDİRME VERİ TABANI VE HEDEF PARAMETRELERİ:</p>
                      <p>
                        • <strong>Mevcut Durum Girdileri:</strong> Saha görüşmesinde alınan veriler: OEE <strong>{oeeNum ? `%${oeeNum}` : 'ölçülmüyor'}</strong>, hurda <strong>{scrapRateNum ? `%${scrapRateNum}` : 'veri yok'}</strong>, rework/tamir <strong>{reworkRateNum ? `%${reworkRateNum}` : 'veri yok'}</strong>.
                      </p>
                      <p>
                        • <strong>Modelleme Hedef Değerleri:</strong> Olgunluk skoruna göre önerilen <strong>{qla.recommended.def.name} ({qla.recommended.def.days} adam-gün)</strong> ile kayıp havuzunun <strong>%{Math.round(qla.recommended.def.recovery[0] * 100)}-{Math.round(qla.recommended.def.recovery[1] * 100)}</strong>'i geri kazanılır. Hedefler: {oeeNum > 0 ? <>OEE %{oeeNum} → <strong>%{Math.min(90, oeeNum + qla.recommended.def.kpi.oeePoints)}</strong>, </> : null}kalitesizlik oranında <strong>-%{qla.recommended.def.kpi.copq}</strong>, setup süresinde <strong>-%{qla.recommended.def.kpi.setup}</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* AŞAMA 5 - FIRSAT TÜRÜ AÇIKLAMALARI */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-900 text-xs font-black px-2.5 py-1 rounded">AŞAMA 5</span>
                    <h4 className="font-bold text-slate-800 text-sm">Fırsat Türü Gerekçelendirme ve Açıklamaları</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* DMA Card */}
                    <div className="bg-rose-50 border border-rose-250 p-4.5 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-rose-950 font-black text-xs uppercase tracking-wider border-b border-rose-200 pb-1.5">
                        <TrendingDown className="w-4 h-4 shrink-0 text-rose-700" />
                        Doğrudan Maliyet Azaltma
                      </div>
                      <div className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                        <ul className="list-disc pl-4 space-y-1">
                          <li><strong>Hurda:</strong> Hammadde &amp; Gecikmiş Efor</li>
                          <li><strong>Fire:</strong> Malzeme firesi</li>
                          <li><strong>Fazla Mesai:</strong> Gereksiz ek çalışma payı</li>
                          <li><strong>Rework:</strong> Tamir &amp; tekrarlı işçilik</li>
                          <li><strong>Verimsizlik:</strong> Akış zayiatları</li>
                        </ul>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-rose-100 text-[11px] text-rose-950 font-bold leading-normal italic">
                        Yönetici Açıklaması: Bu fırsatlar doğrudan kârlılığı etkiler ve gerçekleştiğinde nakit olarak işletmede kalır.
                      </div>
                    </div>

                    {/* KY Card */}
                    <div className="bg-indigo-50 border border-indigo-250 p-4.5 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-indigo-950 font-black text-xs uppercase tracking-wider border-b border-indigo-200 pb-1.5">
                        <Activity className="w-4 h-4 shrink-0 text-indigo-700" />
                        Kapasite Yaratma
                      </div>
                      <div className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                        <ul className="list-disc pl-4 space-y-1">
                          <li><strong>Setup Süreleri:</strong> Kalıp/Model Değişim</li>
                          <li><strong>OEE İyileşmesi:</strong> Ekipman verimliliği</li>
                          <li><strong>Plansız Duruşlar:</strong> Arızlar ve önleme</li>
                          <li><strong>Operatör Verimliliği:</strong> Standart İş</li>
                        </ul>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-indigo-100 text-[11px] text-indigo-950 font-bold leading-normal italic">
                        Yönetici Açıklaması: Bu fırsatlar mevcut yatırım ile daha fazla üretim yapılmasını sağlar ve ek kapasite oluşturur.
                      </div>
                    </div>

                    {/* SOK Card */}
                    <div className="bg-emerald-50 border border-emerald-250 p-4.5 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-emerald-950 font-black text-xs uppercase tracking-wider border-b border-emerald-200 pb-1.5">
                        <TrendingUp className="w-4 h-4 shrink-0 text-emerald-700" />
                        Stratejik Operasyonel Kazanç
                      </div>
                      <div className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                        <ul className="list-disc pl-4 space-y-1">
                          <li><strong>Lead Time:</strong> Müşteri termin süresi</li>
                          <li><strong>WIP Azaltımı:</strong> Sermaye birikim azaltımı</li>
                          <li><strong>Teslimat Performansı:</strong> Güven endeksi</li>
                        </ul>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-emerald-100 text-[11px] text-emerald-950 font-bold leading-normal italic">
                        Yönetici Açıklaması: Bu fırsatlar işletmenin çevikliğini, müşteri memnuniyetini ve büyüme kapasitesini artırır.
                      </div>
                    </div>
                  </div>
                </div>

                {/* AŞAMA 6 - YÖNETİCİ ÖZETİ */}
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-900 text-white text-xs font-black px-2.5 py-1 rounded">AŞAMA 6</span>
                    <h4 className="font-bold text-slate-950 text-sm">Finansal Konsolidasyon ve Yönetici Özeti</h4>
                  </div>
                  
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    Seçilen iyileştirme başlıklarının direkt maliyet azaltma, kapasite yaratma ve stratejik operasyonel kazanç bileşenleri üzerinden oluşturduğu konsolide kümülatif fırsat potansiyeli özet olarak aşağıda verilmiştir:
                  </p>

                  {/* Totals Display Box */}
                  <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3.5 shadow-md">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <span className="text-xs font-black uppercase tracking-wider text-amber-400">Yıllık Toplam Ekonomik Fırsat Potansiyeli</span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Min Potansiyel (Asgari Çeviklik):</span>
                        <div className="flex flex-col">
                          <strong className="text-xl sm:text-2xl font-black text-slate-200">
                            {currencySymbol}{Math.round(total_economic_min).toLocaleString('tr-TR')} {currency}
                          </strong>
                          {currency !== 'TRY' && (
                            <span className="text-xs font-mono font-bold text-emerald-300">
                              ~₺{Math.round(total_economic_min * activeRate).toLocaleString('tr-TR')} TL
                            </span>
                          )}
                          <span className="text-[10px] text-red-400 font-black mt-0.5 uppercase tracking-wider">
                            Maliyet Azaltma Oranı: %{minEconomicLossPct}
                          </span>
                        </div>
                      </div>
                      
                      <div className="hidden sm:block text-slate-600 text-lg">➔</div>

                      <div>
                        <span className="text-[10px] text-emerald-400 font-bold block uppercase">Max Potansiyel (Tam İsrafsızlık):</span>
                        <div className="flex flex-col">
                          <strong className="text-xl sm:text-3xl font-black text-emerald-400">
                            {currencySymbol}{Math.round(total_economic_max).toLocaleString('tr-TR')} {currency}
                          </strong>
                          {currency !== 'TRY' && (
                            <span className="text-xs font-mono font-bold text-emerald-300">
                              ~₺{Math.round(total_economic_max * activeRate).toLocaleString('tr-TR')} TL (Kur)
                            </span>
                          )}
                          <span className="text-[10px] text-emerald-400 font-black mt-0.5 uppercase tracking-wider">
                            Maliyet Azaltma Oranı: %{maxEconomicLossPct}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* IMPORTANT METODOLOGY DISCLAIMER CARD */}
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900 space-y-1.5 font-medium">
                    <span className="text-[10px] uppercase font-black text-amber-800 tracking-wider block">⚠️ ÖNEMLİ METODOLOJİK AÇIKLAMA:</span>
                    <p className="text-[11px] leading-relaxed font-semibold italic">
                      Bu çalışma detaylı maliyet muhasebesi incelemesi değildir. Sonuçlar sektör benchmarkları, saha gözlemleri ve sınırlı operasyonel veriler kullanılarak oluşturulmuş fırsat potansiyeli tahminleridir. Nihai doğrulama detaylı veri analizi sonrasında yapılmalıdır.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'roi' && (
          <RoiAnalyzer
            currency={currency}
            currencySymbol={currencySymbol}
            copqLossMin={copqLossMin}
            setupLaborLoss={setupLaborLoss}
            setupOpportunityLoss={setupOpportunityLoss}
            inefficiencyLaborLoss={inefficiencyLaborLoss}
            inefficiencyOverheadLoss={inefficiencyOverheadLoss}
            totalLossConservative={totalLossConservative}
            totalLossExpected={totalLossExpected}
            totalLossHigh={totalLossHigh}
            turnoverNum={turnoverNum}
            copqRateNum={copqRateNum}
            scrapRateNum={scrapRateNum}
            reworkRateNum={reworkRateNum}
            overtimeRateNum={overtimeRateNum}
            setupFrequencyNum={setupFrequencyNum}
            setupMachineCountNum={setupMachineCountNum}
            annualSetupsCount={annualSetupsCount}
            annualSetupHours={annualSetupHours}
            affectedOpsSetupNum={affectedOpsSetupNum}
            grossLaborCostNum={grossLaborCostNum}
            hourlyTurnoverRate={hourlyTurnoverRate}
            opsNum={opsNum}
            plannedEffNum={plannedEffNum}
            actualEffNum={actualEffNum}
            efficiencyGap={efficiencyGap}
            annualOperatorHoursPaid={annualOperatorHoursPaid}
            totalOp1Lira={totalOp1Lira}
            totalOp2Lira={totalOp2Lira}
            dailyRateOp1={dailyRateOp1}
            dailyRateOp2={dailyRateOp2}
            baseUnitRate={baseUnitRate}
            eurTry={eurTry}
            usdTry={usdTry}
            op1_min={op1_min}
            op1_max={op1_max}
            op2_min={op2_min}
            op2_max={op2_max}
            op3_min={op3_min}
            op3_max={op3_max}
            op4_min={op4_min}
            op4_max={op4_max}
            qla={qla}
            setSelectedPackageId={setSelectedPackageId}
            sustainYears={sustainYears}
            setSustainYears={setSustainYears}
            pitchFindings={getDynamicGembaFindings().slice(0, 3)}
            maturityScore={totalScore}
            answeredCount={answeredCount}
            pitchInputs={{ scrapPct: scrapRateNum, reworkPct: reworkRateNum, overtimePct: overtimeRateNum, plannedEffPct: plannedEffNum, actualEffPct: actualEffNum, oeePct: oeeNum, leadTimeDays: leadTimeNum }}
            costFromSector={costFromSector}
            leadTimeNum={leadTimeNum}
            setupDurationNum={setupDurationNum}
            oeeNum={oeeNum}
            targetLeadTime={targetLeadTime}
            targetLeadTimeRatio={targetLeadTimeRatio}
            leadTimeSavingsPercent={leadTimeSavingsPercent}
            laborProductivity={laborProductivity}
            targetProductivity={targetProductivity}
            targetProductivityRatio={targetProductivityRatio}
            prodImprovementPercent={prodImprovementPercent}
            totalLossAvg={totalLossAvg}
            targetLossCost={targetLossCost}
            lossReductionPercent={lossReductionPercent}
            targetLossRatio={targetLossRatio}
            netFinancialGain={netFinancialGain}
            tarih={tarih}
            firmaAdi={firmaAdi}
            sektor={sektor}
            adres={adres}
            urunGrubu={urunGrubu}
            chatMessages={chatMessages}
            isChatLoading={isChatLoading}
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleSendChatMessage={handleSendChatMessage}
            handleClearChat={handleClearChat}
            handlePrint={handlePrint}
            handleReset={handleReset}
            getSectorBenchmark={getSectorBenchmark}
            oppSetupR={oppSetupR}
            oppPdR={oppPdR}
            oppOeeR={oppOeeR}
            oppOpvR={oppOpvR}
            oppLtR={oppLtR}
            oppWipR={oppWipR}
            oppSpR={oppSpR}
            oppScR={oppScR}
            oppFmR={oppFmR}
            oppMesR={oppMesR}
            oppYiR={oppYiR}
            oppOvR={oppOvR}
            opp_setup_min={opp_setup_min}
            opp_setup_max={opp_setup_max}
            opp_pd_min={opp_pd_min}
            opp_pd_max={opp_pd_max}
            opp_oee_min={opp_oee_min}
            opp_oee_max={opp_oee_max}
            opp_opv_min={opp_opv_min}
            opp_opv_max={opp_opv_max}
            opp_lt_min={opp_lt_min}
            opp_lt_max={opp_lt_max}
            opp_wip_min={opp_wip_min}
            opp_wip_max={opp_wip_max}
            opp_sp_min={opp_sp_min}
            opp_sp_max={opp_sp_max}
            opp_sc_min={opp_sc_min}
            opp_sc_max={opp_sc_max}
            opp_fm_min={opp_fm_min}
            opp_fm_max={opp_fm_max}
            opp_mes_min={opp_mes_min}
            opp_mes_max={opp_mes_max}
            opp_yi_min={opp_yi_min}
            opp_yi_max={opp_yi_max}
            opp_ov_min={opp_ov_min}
            opp_ov_max={opp_ov_max}
            total_dma_min={total_dma_min}
            total_dma_max={total_dma_max}
            total_ky_min={total_ky_min}
            total_ky_max={total_ky_max}
            total_sok_min={total_sok_min}
            total_sok_max={total_sok_max}
            total_economic_min={total_economic_min}
            total_economic_max={total_economic_max}
            minEconomicLossPct={minEconomicLossPct}
            maxEconomicLossPct={maxEconomicLossPct}
            loss_durus={loss_durus}
            loss_kalite={loss_kalite}
            loss_mesai={loss_mesai}
            loss_hurda={loss_hurda}
            loss_iscilik={loss_iscilik}
            loss_kapasite={loss_kapasite}
            productionUnit={productionUnit}
            urunGrubuEnCok={urunGrubuEnCok}
            urunGrubuAdet={urunGrubuAdet}
            urunGrubuOran={urunGrubuOran}
            useProductFamilyCost={useProductFamilyCost}
            setUseProductFamilyCost={setUseProductFamilyCost}
            useProductFamilyRecovery={useProductFamilyRecovery}
            setUseProductFamilyRecovery={setUseProductFamilyRecovery}
          />
        )}

        {/* ─── PROFESSIONAL HIGH-FIDELITY PRINT-ONLY SUMMARY PAGE AT BOTTOM ─── */}
        <div className="hidden print:block mt-12 bg-white p-8 border border-slate-300 text-slate-900 rounded font-sans leading-relaxed page-break-before-always">
          <h3 className="font-extrabold text-lg font-display uppercase border-b-2 border-slate-900 pb-2 text-slate-950 flex items-center justify-between">
            <span>SAHA DETAY RAPORU &amp; TEKNİK ANALİZ KARNESİ</span>
            <span className="text-xs font-mono font-medium lowercase">Rapor No: GP-{tarih.replace(/-/g,'')}</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-6 mt-4 text-xs border-b border-slate-200 pb-4">
            <div className="space-y-1.5">
              <p><strong>Müşteri Firma Ünvanı:</strong> {firmaAdi || "————————"}</p>
              <p><strong>Faaliyet Sektörü:</strong> {sektor || "————————"}</p>
              <p><strong>Ziyaret Şehir / Lokasyon:</strong> {adres || "————————"}</p>
              <p><strong>İmal Edilen Ürün Grubu:</strong> {urunGrubu || "————————"}</p>
            </div>
            <div className="space-y-1.5 pl-6 border-l">
              <p><strong>Toplam Personel Sayısı:</strong> {calisanSayisi || "————————"}</p>
              <p><strong>Alt Vardiya Yapısı:</strong> {vardiya || "————————"} Vardiya</p>
              <p><strong>Mülakat Yapılan Yetkili:</strong> {gorusulen || "————————"}</p>
              <p><strong>Talep Edilen Hizmet Kalemi:</strong> <span className="underline font-bold text-slate-950">{talepEdilenHizmet}</span></p>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-bold text-xs bg-slate-100 p-2 border tracking-wider uppercase text-slate-900">
              Kriter Derecelendirme ve Saha Gözlem Detay Tablosu
            </h4>
            <table className="w-full text-left text-[11px] border-collapse mt-2">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="p-2 border text-center w-12">No</th>
                  <th className="p-2 border">Kategori / Başlık</th>
                  <th className="p-2 border">Gözlemlenen Saha Tanımı</th>
                  <th className="p-2 border text-center w-28">Puan (0 - 3)</th>
                </tr>
              </thead>
              <tbody>
                {CRITERIA.map(g => g.items.map(i => (
                  <tr key={i.no} className="border-b even:bg-slate-50/50">
                    <td className="p-1.5 border font-mono text-center font-bold text-slate-650">{i.no}</td>
                    <td className="p-1.5 border font-bold text-slate-900">{i.cat || g.group}</td>
                    <td className="p-1.5 border text-slate-600 text-xs">{i.text}</td>
                    <td className="p-1.5 border text-center font-black text-slate-950">
                      <span className="inline-block bg-slate-100 px-2.5 py-0.5 rounded border font-mono">
                        {scoreValue(scores[i.no])} ({scores[i.no] === 3 ? "Geliştirilebilir" : scores[i.no] === 2 ? "Faaliyet Var" : scores[i.no] === 1 ? "Zayıf" : scores[i.no] === 0 ? "İzlenmedi" : "Puan verilmedi"})
                      </span>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>

          {/* Results Summary Segment */}
          <div className="grid grid-cols-2 gap-6 mt-6 page-break-inside-avoid">
            <div className="bg-slate-50 p-4 border rounded">
              <h5 className="font-extrabold text-xs uppercase border-b pb-1.5 text-slate-950">OLGUNLUK VE RİSK ANALİZİ</h5>
              <div className="text-3xl font-black font-display text-slate-900 mt-2">{totalScore} / 51 Puan</div>
              <p className="text-xs text-slate-700 mt-1.5 font-semibold leading-relaxed shrink-0">
                Resmi Teşhis: {getScoreLabel(totalScore)}
              </p>
            </div>

            <div className="bg-slate-50 p-4 border rounded">
              <h5 className="font-extrabold text-xs uppercase border-b pb-1.5 text-slate-950">YETKİLİ DANIŞMAN RAPORU TESPİTLERİ</h5>
              <p className="text-xs text-slate-800 mt-2 leading-relaxed whitespace-pre-wrap font-medium">
                {notlar || "Sahadan ek not bildirilmemiştir."}
              </p>
            </div>
          </div>

          {/* BUDGET SUMMARY SEGMENT PRINT */}
          <div className="mt-8 border-t-2 border-slate-900 pt-6 page-break-inside-avoid">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-950 mb-3">Yaklaşık Yatırım Bütçe Matrisi</h4>
            
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div className="border-2 border-red-500 bg-red-50/10 p-4 rounded space-y-1.5 relative">
                <span className="font-bold text-[10px] uppercase block tracking-wider text-red-600">⭐ OPSİYON 01 — {currentProgram.op1.name} (ÖNCELİKLİ ÖNERİ){op1RateInfo.hasDiscount ? ` (%${op1RateInfo.discountPercent} İNDİRİMLİ)` : ''}</span>
                <p><strong>Adam-Gün Süresi:</strong> {currentProgram.op1.ag} Adam Gün</p>
                <p><strong>Birim Günlük Bedel:</strong> {currencySymbol}{op1RateInfo.rate.toLocaleString('tr-TR')}</p>
                <p className="text-sm pt-1 border-t text-red-750"><strong>Toplam Yatırım:</strong> <span className="font-bold">{currencySymbol}{totalOp1Lira.toLocaleString('tr-TR')} {currency}</span> (≈ {totalOp1Eur.toLocaleString('tr-TR')} EUR)</p>
              </div>

              {currentProgram.op2.name === "Mevcut Değil" && currentProgram.op1.name === "Standart Gelişim Programı" ? (
                <div className="border-2 border-indigo-300 bg-indigo-50/5 p-4 rounded space-y-1 relative">
                  <span className="font-bold text-[10px] uppercase block tracking-wider text-indigo-700">💡 OPSİYON 02 — Alternatif Program Önerisi</span>
                  <p className="font-bold text-[11px] text-slate-800">Yalın Üretim ve OpEx Eğitim Paketleri</p>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    Saha danışmanlığına alternatif olarak, kurum içi insan kaynağı yetkinliklerini artırmaya yönelik özel sınıf içi eğitim ve pratik atölye programları önerilmektedir.
                  </p>
                  <p className="text-xs pt-1 border-t border-dashed border-indigo-200 font-extrabold text-indigo-900 italic">
                    <strong>Toplam Yatırım:</strong> Özel Bütçelendirilir (Bütçe Belirtilmemiştir)
                  </p>
                </div>
              ) : (
                <div className={`border p-4 rounded space-y-1.5 ${op2RateInfo.hasDiscount ? 'border-red-500 bg-red-50/5' : ''}`}>
                  <span className={`font-bold text-[10px] uppercase block tracking-wider ${op2RateInfo.hasDiscount ? 'text-red-600' : 'text-slate-400'}`}>OPSİYON 02 — {currentProgram.op2.name}{op2RateInfo.hasDiscount ? ` (%${op2RateInfo.discountPercent} İNDİRİMLİ)` : ''}</span>
                  <p><strong>Adam-Gün Süresi:</strong> {currentProgram.op2.ag} Adam Gün</p>
                  <p><strong>Birim Günlük Bedel:</strong> {currencySymbol}{op2RateInfo.rate.toLocaleString('tr-TR')}</p>
                  <p className={`text-sm pt-1 border-t ${op2RateInfo.hasDiscount ? 'text-red-750' : ''}`}><strong>Toplam Yatırım:</strong> <span className="font-bold">{currencySymbol}{totalOp2Lira.toLocaleString('tr-TR')} {currency}</span> (≈ {totalOp2Eur.toLocaleString('tr-TR')} EUR)</p>
                  
                  {currentProgram.op2.name === "Standart Gelişim Programı" && (
                    <div className="mt-2 pt-1.5 border-t border-dashed border-slate-200 text-[10px] text-indigo-900 font-semibold leading-normal">
                      <strong>Alternatif Öneri:</strong> Paket 2 için <em>Yalın Üretim ve OpEx Eğitim Paketleri</em> önerilir. (Bütçe belirtilmemiştir)
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SIGNATURE FIELDS */}
          <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-2 text-center text-xs page-break-inside-avoid">
            <div>
              <p className="font-bold text-slate-600 uppercase">TEKLİFİ HAZIRLAYAN</p>
              <p className="mt-8 font-black text-slate-900">Gemba Digital Süreç Liderliği</p>
              <p className="text-[10px] text-slate-400 mt-1">İmza Tarihi: {tarih}</p>
            </div>
            <div>
              <p className="font-bold text-slate-600 uppercase">MÜŞTERİ ONAYI</p>
              <p className="mt-8 font-black text-slate-900">{firmaAdi || "Firma Unvan Kaşesi"}</p>
              <p className="text-[10px] text-slate-400 mt-1">Yetkili İmza / Kaşe</p>
            </div>
          </div>
        </div>

        {/* ─── MODAL: TESİS OLGUNLUK GRADYANI EKRAN GENİŞLETME (MODERN OVERLAY) ─── */}
        {isMaturityExpanded && (
          <div 
            id="maturity-expansion-backdrop"
            className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fade-in"
            onClick={() => setIsMaturityExpanded(false)}
          >
            <div 
              id="maturity-expansion-dialog"
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col p-6 sm:p-8 relative transition-all duration-300 scale-100"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Absolute Top-Right Close Button */}
              <button
                id="close-maturity-modal-btn-top"
                onClick={() => setIsMaturityExpanded(false)}
                className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-full transition-all duration-150 cursor-pointer border border-slate-200"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title Header */}
              <div className="border-b pb-4 mb-6 border-slate-100 flex flex-col md:flex-row md:items-start justify-between gap-2 pr-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <Gauge className="w-5 h-5" />
                    </span>
                    <h3 className="font-display font-black text-lg sm:text-xl text-slate-900 uppercase tracking-tight">
                      TESİS OLGUNLUK GRADYANI GENİŞ PORTAL GÖRÜNÜMÜ
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold pl-1">
                    Firma: <strong className="text-slate-800">{firmaAdi || "-"}</strong> &nbsp;|&nbsp; Sektör: <strong className="text-slate-800">{sektor || "-"}</strong> &nbsp;|&nbsp; Tarih: <strong className="text-slate-800">{tarih || "-"}</strong>
                  </p>
                </div>
              </div>

              {/* Main Scrollable Content Pane */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-8 scrollbar-thin">
                
                {/* 2-Column Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* LEFT PANE: GIANT CIRCULAR GAUGE CHART (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-50/70 p-6 sm:p-8 rounded-3xl border border-slate-100/80 text-center space-y-6">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block font-display">TOPLAM OLGUNLUK SEVİYESİ</span>
                    
                    {/* SVG Progress Circle Gauge */}
                    <div className="relative w-48 h-48 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        {/* Background Ring */}
                        <circle
                          cx="96"
                          cy="96"
                          r="80"
                          stroke="#E2E8F0"
                          strokeWidth="12"
                          fill="transparent"
                        />
                        {/* Colored Active Indicator Ring */}
                        <circle
                          cx="96"
                          cy="96"
                          r="80"
                          stroke={totalScore <= 12 ? "#E53E3E" : totalScore <= 25 ? "#D69E2E" : totalScore <= 40 ? "#3182CE" : "#38A169"}
                          strokeWidth="12"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 80}
                          strokeDashoffset={2 * Math.PI * 80 - ((totalScore / 51) * (2 * Math.PI * 80))}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      
                      {/* Inside details */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-display font-black text-slate-900 tracking-tight">{totalScore}</span>
                        <span className="text-[10.5px] uppercase font-bold text-slate-455 tracking-wider mt-0.5">/ 51 PUAN</span>
                        <span className="text-xs font-mono font-black text-slate-700 bg-white/90 border border-slate-100/80 px-2.5 py-0.5 rounded-full mt-2 shadow-xs">
                          %{Math.round((totalScore / 51) * 100)} Olgunluk
                        </span>
                      </div>
                    </div>

                    {/* Gauge range badges */}
                    <div className="grid grid-cols-4 text-[9.5px] font-bold text-center gap-1.5 w-full pt-4 border-t border-slate-200/50">
                      <div className={`p-2 rounded-xl border-2 text-left space-y-1 ${totalScore <= 12 ? 'bg-red-100/80 text-[#9B1C1C] border-[#DC2626] shadow-sm' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                        <span className="block font-black truncate text-[11px] uppercase">Seviye 1</span>
                        <span className="font-extrabold block text-[10px]">0 - 12 P</span>
                        <span className="block text-[8px] text-slate-900 font-extrabold truncate">Saha Kültürü Zayıf</span>
                      </div>
                      <div className={`p-2 rounded-xl border-2 text-center space-y-1 ${totalScore >= 13 && totalScore <= 25 ? 'bg-amber-100/80 text-[#92400E] border-[#D97706] shadow-sm' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                        <span className="block font-black truncate text-[11px] uppercase">Seviye 2</span>
                        <span className="font-extrabold block text-[10px]">13 - 25 P</span>
                        <span className="block text-[8px] text-slate-900 font-extrabold truncate">Temel Seviye</span>
                      </div>
                      <div className={`p-2 rounded-xl border-2 text-center space-y-1 ${totalScore >= 26 && totalScore <= 40 ? 'bg-sky-100/80 text-[#075985] border-[#0284C7] shadow-sm' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                        <span className="block font-black truncate text-[11px] uppercase">Seviye 3</span>
                        <span className="font-extrabold block text-[10px]">26 - 40 P</span>
                        <span className="block text-[8px] text-slate-900 font-extrabold truncate">Geliştirilebilir</span>
                      </div>
                      <div className={`p-2 rounded-xl border-2 text-right space-y-1 ${totalScore >= 41 ? 'bg-emerald-100/80 text-[#065F46] border-[#059669] shadow-sm' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                        <span className="block font-black truncate text-[11px] uppercase">Seviye 4</span>
                        <span className="font-extrabold block text-[10px]">41 - 51 P</span>
                        <span className="block text-[8px] text-slate-900 font-extrabold truncate">Sürdürülebilir</span>
                      </div>
                    </div>

                    {/* Dynamic expert advisor box */}
                    <div className={`p-5 rounded-2xl border text-xs leading-relaxed font-semibold text-left transition-colors duration-150 w-full ${getScoreTextClass(totalScore)}`}>
                      <div className="flex items-start gap-2.5">
                        <Info className="w-4.5 h-4.5 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                          <span className="font-bold uppercase text-[9.5px] tracking-widest block">SAHA GÖZLEMLEME SENTEZİ</span>
                          <p className="font-medium text-[11.5px] leading-relaxed select-none">{getScoreLabel(totalScore)}</p>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* RIGHT PANE: DETAILED PROGRESS GAUGE OF ALL 6 SECTORS (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2">6 ANA KATEGORİ DETAYLI ANALİZ GÖSTERGELERİ</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {CRITERIA.map((g, idx) => {
                        const { sum, max } = getGroupScoreSum(g.group);
                        const pct = max > 0 ? (sum / max) * 100 : 0;
                        
                        let barBg = "bg-rose-500";
                        if (g.color === "amber") barBg = "bg-amber-500";
                        if (g.color === "sky") barBg = "bg-sky-500";
                        if (g.color === "violet") barBg = "bg-violet-500";
                        if (g.color === "emerald") barBg = "bg-emerald-500";
                        if (g.color === "indigo") barBg = "bg-indigo-500";

                        return (
                          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow group">
                            
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-base select-none">{g.icon}</span>
                                <span className="font-mono text-[9px] font-black text-slate-500 bg-slate-100/80 border border-slate-200 px-2 py-0.5 rounded">
                                  {sum} / {max} PUAN
                                </span>
                              </div>
                              <h5 className="font-display font-black text-xs uppercase tracking-wider text-slate-800">{g.group}</h5>
                              <p className="text-[10px] text-slate-405 leading-relaxed line-clamp-2">{g.desc}</p>
                            </div>

                            {/* Category progress bar */}
                            <div className="space-y-1">
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-[1px] border border-slate-200/50">
                                <div 
                                  className={`h-full rounded-full ${barBg} transition-all duration-300`}
                                  style={{ width: `${Math.max(6, pct)}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 font-mono">
                                <span>MEVCUT: {sum} P</span>
                                <span className={pct >= 70 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-500' : 'text-red-500'}>%{Math.round(pct)}</span>
                              </div>
                            </div>

                            {/* Scoring elements breakdown lists */}
                            <div className="pt-2 border-t border-slate-105 grid grid-cols-2 gap-1.5 text-[9px] font-bold">
                              {g.items.map((item) => {
                                const sc = scoreValue(scores[item.no]);
                                let badgeColorClass = "bg-slate-50 text-slate-400 border-slate-200/60";
                                if (sc === 1) badgeColorClass = "bg-red-50 text-red-700 border-red-200/40";
                                else if (sc === 2) badgeColorClass = "bg-amber-50 text-amber-700 border-amber-200/40";
                                else if (sc === 3) badgeColorClass = "bg-emerald-50 text-emerald-700 border-emerald-200/40";

                                return (
                                  <div key={item.no} className={`flex items-center justify-between p-1 rounded-md border ${badgeColorClass}`} title={item.text}>
                                    <span className="truncate max-w-[70%]">{item.cat || `Kriter ${item.no}`}</span>
                                    <span className="font-mono font-black">{sc}P</span>
                                  </div>
                                );
                              })}
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>

                </div>

              </div>

              {/* Bottom footer button for supreme usability */}
              <div className="border-t pt-4 mt-6 flex justify-end gap-3 border-slate-100">
                <button
                  id="close-maturity-modal-btn-bottom"
                  onClick={() => setIsMaturityExpanded(false)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Kapat &amp; Gözleme Dön
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ─── MODAL: PARAMETRİK YÖNETİCİ AYARLARI (ADMIN OVERLAY) ─── */}
        {isAdminOpen && (
          <div 
            id="admin-settings-backdrop"
            className="fixed inset-0 z-[110] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in no-print"
            onClick={() => setIsAdminOpen(false)}
          >
            <div 
              id="admin-settings-dialog"
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col p-6 sm:p-8 relative transition-all duration-300 scale-100"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Close Button */}
              <button
                onClick={() => setIsAdminOpen(false)}
                className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-full transition-all duration-150 cursor-pointer border border-slate-200"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="border-b pb-4 mb-6 border-slate-100 flex items-center gap-2.5">
                <span className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                  <Settings className="w-5 h-5 animate-spin-slow" />
                </span>
                <div>
                  <h3 className="font-display font-black text-base text-slate-900 uppercase tracking-tight">
                    YÖNETİCİ AYARLARI (ADMIN)
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-semibold uppercase tracking-wider">
                    Saha Bütçe Formülü & Referans Değerleri
                  </p>
                </div>
              </div>

              {/* Content Form */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Birim Fiyat Euro Bedeli (€)
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-slate-400 font-bold text-sm">€</span>
                    </div>
                    <input
                      type="number"
                      value={tempEuroRate}
                      onChange={(e) => setTempEuroRate(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl pl-8 pr-16 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-100 transition-all"
                      placeholder="700"
                      min="1"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs font-bold text-slate-400 uppercase">EUR / GÜN</span>
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
                    Bu bedel, Yalın Gelişim ve Dijitalleşme programı paket bütçelerini oluştururken baz alınacak referans Euro bedelidir. Girilen değere bağlı olarak TL'ye çevirme ve yuvarlama koşulları arka planda otomatik olarak yürütülür.
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hızlı Referans Değerler</span>
                  <div className="flex flex-wrap gap-2">
                    {[500, 600, 650, 700, 750, 800].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setTempEuroRate(preset.toString())}
                        className={`text-[11.5px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          tempEuroRate === preset.toString()
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset} €
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="border-t pt-4 mt-6 flex justify-end gap-3 border-slate-100">
                <button
                  onClick={() => setIsAdminOpen(false)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer border border-slate-200"
                >
                  İptal
                </button>
                <button
                  onClick={() => {
                    const parsed = Number(tempEuroRate);
                    if (parsed && parsed > 0) {
                      setAdminEuroRate(parsed);
                      // Tüm cihazlar aynı ücretle hesaplasın diye buluta da yazılır
                      GembaDB.saveSetting('daily_rate_eur', parsed).then(ok => {
                        if (!ok) alert('Ücret bu cihazda güncellendi ancak buluta kaydedilemedi; diğer cihazlar eski ücretle hesaplar.');
                      });
                      setIsAdminOpen(false);
                    } else {
                      alert('Lütfen geçerli bir Euro bedeli giriniz.');
                    }
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>

            </div>
          </div>
        )}

      {isGeneratingPdf && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center animate-fade-in no-print" id="pdf-generating-loader">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#EF4444] border-t-transparent rounded-full animate-spin"></div>
            <div className="space-y-1.5">
              <h4 className="font-display font-black text-slate-900 text-base">PDF Raporu Hazırlanıyor</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Saha analiz verileriniz, bütçe formülleri ve ROI grafikleriniz yüksek çözünürlüklü PDF formatına dönüştürülüyor. Lütfen bekleyiniz...
              </p>
            </div>
          </div>
        </div>
      )}

      {showIframePrintToast && (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-[480px] bg-slate-900 text-white rounded-2xl shadow-2xl p-5 border border-red-500/40 z-[9999] animate-fade-in no-print">
          <div className="flex gap-3">
            <span className="text-xl shrink-0 mt-0.5">⚠️</span>
            <div className="space-y-2 flex-grow">
              <div className="flex justify-between items-start">
                <h5 className="font-bold text-xs uppercase tracking-wider text-red-400">PDF ÇIKTISI ALMA BİLDİRİMİ</h5>
                <button 
                  onClick={() => setShowIframePrintToast(false)} 
                  className="text-slate-400 hover:text-white font-bold ml-2 cursor-pointer transition-colors text-xs"
                  title="Kapat"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-200">
                Tarayıcı güvenlik kuralları (iframe kısıtlamaları) gereği, önizleme penceresinde <strong>"PDF Çıktısı Al"</strong> butonu engellenebilir veya tüm sayfayı doğru biçimde yazdırmayabilir.
              </p>
              <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700/60 text-[10.5px] font-semibold text-amber-300">
                Lütfen ekranın sağ üstündeki <span className="underline">"Yeni Sekmede Aç"</span> (ok simgeli kare) butonuna tıklayıp, açılan yeni sayfada "PDF Çıktısı Al" butonuna basın. Sayfanız eksiksiz, pürüzsüz ve dikey formatta yazdırılacaktır!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PWA INSTALLATION REHBERİ MODAL ─── */}
      {isPwaModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 relative space-y-5">
            <button 
              onClick={() => setIsPwaModalOpen(false)}
              className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-black text-slate-900 text-base">Gemba Digital PWA Kurulumu</h4>
                <p className="text-xs text-slate-500 font-semibold">Masaüstü &amp; Tablet Tam Ekran Sürüm Rehberi</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs text-slate-700 font-medium leading-relaxed">
              <p className="font-bold text-slate-900">MacBook, iPad veya Safari Üzerinde Tam Ekran Çalışmak İçin:</p>
              <ol className="list-decimal list-inside space-y-2 text-slate-600">
                <li>Safari üst menüsündeki <strong className="text-slate-900">"Paylaş" (Share)</strong> simgesine tıklayın.</li>
                <li>Menüden <strong className="text-slate-900">"Ana Ekrana Ekle"</strong> veya <strong className="text-slate-900">"Dock'a Ekle"</strong> seçeneğini belirleyin.</li>
                <li>İsim verip onaylayarak tam ekran masaüstü deneyiminin keyfini çıkarın.</li>
              </ol>
            </div>

            <button
              onClick={() => setIsPwaModalOpen(false)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md cursor-pointer text-center"
            >
              ANLADIM, TEŞEKKÜRLER
            </button>
          </div>
        </div>
      )}

      {/* ─── TOAST NOTIFICATION ─── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-slate-900 text-white border border-slate-700 font-semibold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in no-print">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      </main>
    </div>
  );
}
