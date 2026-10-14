import React from 'react';
import { ChevronLeft, ChevronRight, Eye, EyeOff, MessageSquareQuote, HelpCircle, ShieldAlert, Monitor } from 'lucide-react';
import { QlaResult, ASSUMPTIONS } from '../engine/qla';

export interface PitchFinding {
  title: string;
  obs: string;
  finImpact: string;
  leanTool: string;
}

interface Props {
  qla: QlaResult;
  firmaAdi: string;
  sektor: string;
  currencySymbol: string;
  maturityScore: number;
  answeredCount: number;
  findings: PitchFinding[];
  inputs: { scrapPct: number; reworkPct: number; overtimePct: number; plannedEffPct: number; actualEffPct: number; oeePct: number; leadTimeDays: number };
  costFromSector: boolean;
  successRatePct: number;
}

interface Step {
  title: string;
  goal: string;
  show: { label: string; value: string; tone?: 'red' | 'green' | 'amber' | 'sky' }[];
  say: string[];
  ask: string[];
  objections: { q: string; a: string }[];
}

const fmt = (n: number) => Math.round(n).toLocaleString('tr-TR');

const maturityLevel = (score: number) =>
  score <= 12 ? 'Başlangıç (Seviye 1)' : score <= 25 ? 'Gelişen (Seviye 2)' : score <= 40 ? 'Yapılanmış (Seviye 3)' : 'İleri (Seviye 4)';

/** C-Level toplantısında danışmanı 6 adımda yönlendiren sunum akışı; tüm metinler hesap motorundan beslenir */
export const ExecutivePitchGuide: React.FC<Props> = ({
  qla, firmaAdi, sektor, currencySymbol: c, maturityScore, answeredCount, findings, inputs, costFromSector, successRatePct,
}) => {
  const [step, setStep] = React.useState(0);
  const [showNotes, setShowNotes] = React.useState(true);

  const rec = qla.recommended;
  const sel = qla.selected;
  const firma = firmaAdi || 'firmanız';
  const monthlyLoss = qla.totalLoss / 12;
  const topLosses = [...qla.losses].filter(l => l.amount > 0).sort((a, b) => b.amount - a.amount).slice(0, 3);
  const missing = qla.losses.filter(l => !l.hasData);
  const success = successRatePct / 100;

  const assumptions: string[] = [];
  if (inputs.scrapPct) assumptions.push(`hurda oranı %${inputs.scrapPct}`);
  if (inputs.reworkPct) assumptions.push(`rework oranı %${inputs.reworkPct}`);
  if (inputs.plannedEffPct && inputs.actualEffPct) assumptions.push(`verimlilik %${inputs.actualEffPct} (hedef %${inputs.plannedEffPct})`);
  if (inputs.oeePct) assumptions.push(`OEE %${inputs.oeePct}`);
  if (inputs.overtimePct) assumptions.push(`fazla mesai %${inputs.overtimePct}`);
  if (inputs.leadTimeDays) assumptions.push(`lead time ${inputs.leadTimeDays} gün`);

  const steps: Step[] = [
    {
      title: 'Açılış — Saha Gözlemi',
      goal: 'Rakam vermeden önce müşterinin problemi kendi ağzından onaylamasını sağla.',
      show: [
        { label: 'Olgunluk Skoru', value: `${maturityScore} / 51`, tone: 'amber' },
        { label: 'Seviye', value: maturityLevel(maturityScore) },
        { label: 'Değerlendirilen Kriter', value: `${answeredCount} / 17` },
      ],
      say: [
        `"Bugün sahanızda 17 kriteri birlikte değerlendirdik. ${firma} için olgunluk skorunu ${maturityScore}/51 bulduk; bu ${maturityLevel(maturityScore)} seviyesi."`,
        ...findings.slice(0, 3).map((f, i) => `${i + 1}. ${f.title}: ${f.obs}`),
      ],
      ask: [
        'Bu gözlemler sizin günlük deneyiminizle örtüşüyor mu?',
        'Bunlardan hangisi bugün sizi en çok rahatsız ediyor / en çok paraya mal oluyor?',
        'Daha önce bu konularda bir çalışma yaptınız mı? Neden sürdürülemedi?',
      ],
      objections: [
        { q: '"Bizde bu sorunlar o kadar büyük değil."', a: 'Hangi metrikle izlediklerini sorun. İzlenmiyorsa: "Ölçülmeyen kayıp görünmez; ilk adım bunu ölçülebilir kılmak."' },
      ],
    },
    {
      title: 'Kayıp Havuzu — Ne Kadar Kaybediyorsunuz?',
      goal: 'Kaybı müşterinin kendi verisine dayandır; varsayımları onaylat. Aralık olarak sun.',
      show: [
        { label: 'Yıllık Kayıp Havuzu', value: `${c}${fmt(qla.totalLoss)}`, tone: 'red' },
        { label: 'Cironun', value: `%${qla.lossPctOfTurnover}` },
        { label: '±%20 Aralık', value: `${c}${fmt(qla.totalLossMin)} – ${c}${fmt(qla.totalLossMax)}` },
        { label: 'Aylık Kayıp', value: `${c}${fmt(monthlyLoss)}`, tone: 'red' },
      ],
      say: [
        `"Sizin verdiğiniz ${assumptions.join(', ') || 'operasyonel veriler'} ile yıllık kaybınız ${c}${fmt(qla.totalLossMin)} – ${c}${fmt(qla.totalLossMax)} aralığında; ortalama ${c}${fmt(qla.totalLoss)}, yani cironuzun %${qla.lossPctOfTurnover}'i."`,
        `"Bu her ay yaklaşık ${c}${fmt(monthlyLoss)} demek. Sahada gördüğümüz benzer firmalarda kayıp cironun %${ASSUMPTIONS.typicalLossPctOfTurnover[0]}–${ASSUMPTIONS.typicalLossPctOfTurnover[1]}'i arasında çıkıyor."`,
        costFromSector ? '(Not: maliyet yapısı sektör ortalamasından alındı — bunu açıkça söyle ve müşterinin oranlarını iste.)' : '',
      ].filter(Boolean),
      ask: [
        `${assumptions.length ? `Aldığımız değerler (${assumptions.join(', ')}) doğru mu? Düzeltmek istediğiniz var mı?` : 'Bu oranları sizin kayıtlarınızdan teyit edebilir miyiz?'}`,
        'Ürün maliyetinizin ne kadarı malzeme, ne kadarı işçilik? (Sektör ortalamasıyla kıyaslayalım.)',
        ...(missing.length ? [`${missing.map(m => m.missing).join(', ')} verisi elinizde var mı? Hesaba eklemediğimiz için havuz bundan büyük olabilir.`] : []),
      ],
      objections: [
        { q: '"Bu rakam çok yüksek."', a: `"Bu bir ön tahmin ve en muhafazakâr değer ${c}${fmt(qla.totalLossMin)}. Hesabı sizin oranlarınızla birlikte yapalım." Formül ekranını aç.` },
        { q: '"Bu rakamlar nereden çıktı?"', a: 'Formülleri tek tek göster: hurda = hurda % × malzeme maliyeti… Her satır müşteri verisinden.' },
      ],
    },
    {
      title: 'Kayıp Nerede? — Öncelikler',
      goal: 'En büyük 2-3 kalemi somutlaştır; her birine yalın aracı eşle.',
      show: topLosses.map(l => ({ label: l.label, value: `${c}${fmt(l.amount)}`, tone: 'red' as const })),
      say: topLosses.map(l => {
        const o = qla.opportunities.find(x => x.key === l.key);
        return `"${l.label}: yılda ${c}${fmt(l.amount)}. ${o?.tool || ''} ile bu kalemde ${c}${fmt(o?.gainMin || 0)} – ${c}${fmt(o?.gainMax || 0)} geri kazanım hedefliyoruz."`;
      }),
      ask: [
        'Bu kalemlerden hangisinde hızlı bir sonuç görmek sizin için en değerli olur?',
        'Bu alanların sorumlusu kim? Projede kimlerle çalışacağız?',
      ],
      objections: [
        { q: '"Biz bunları kendi ekibimizle de yapabiliriz."', a: '"Kesinlikle — amacımız ekibinizi bu yetkinliğe taşımak. Fark, metodun ve hızın; ilk yıl kazancının gecikmesi ayda ' + `${c}${fmt(sel.gainMid / 12)}` + ' fırsat maliyeti demek."' },
      ],
    },
    {
      title: 'Çözüm — Önerilen Program',
      goal: 'Paketi olgunluk skoruna bağla: neden bu kadar adam-gün?',
      show: [
        { label: 'Önerilen Program', value: rec.def.name, tone: 'sky' },
        { label: 'Kapsam', value: `${rec.def.days} adam-gün / yıl` },
        { label: 'Geri Kazanım Hedefi', value: `Havuzun %${Math.round(rec.def.recovery[0] * 100)}–${Math.round(rec.def.recovery[1] * 100)}'i`, tone: 'green' },
        { label: 'Odak', value: rec.def.focus },
      ],
      say: [
        `"Olgunluk seviyeniz ${maturityLevel(maturityScore)} olduğu için ${rec.def.name} öneriyoruz: yılda ${rec.def.days} adam-gün, odak: ${rec.def.focus}."`,
        `"Bu kaybın tamamını değil, ilk aşamada %${Math.round(rec.def.recovery[0] * 100)}–${Math.round(rec.def.recovery[1] * 100)}'ini hedefliyoruz: yılda ${c}${fmt(rec.gainMin)} – ${c}${fmt(rec.gainMax)}."`,
        `"Hedeflerimiz: setup süresinde -%${rec.def.kpi.setup}, kalitesizlikte -%${rec.def.kpi.copq}, verimlilikte +%${rec.def.kpi.productivity}${inputs.oeePct ? `, OEE'de +${rec.def.kpi.oeePoints} puan` : ''}${inputs.leadTimeDays ? `, lead time'da -%${rec.def.kpi.leadTime}` : ''}."`,
      ],
      ask: [
        'Bu hedefler sizin bu yılki hedeflerinizle örtüşüyor mu?',
        'Projeye hangi hat / ürün grubuyla başlamak istersiniz?',
      ],
      objections: [
        { q: '"Daha az adam-günle olmaz mı?"', a: qla.packages.find(p => p.def.days < rec.def.days && p.def.id !== 'kocluk')
          ? `"Olur; ${qla.packages.filter(p => p.def.days < rec.def.days && p.def.id !== 'kocluk').slice(-1)[0].def.name} ile başlayabiliriz ama geri kazanım havuzun %${Math.round(qla.packages.filter(p => p.def.days < rec.def.days && p.def.id !== 'kocluk').slice(-1)[0].def.recovery[1] * 100)}'iyle sınırlı kalır." Paketleri karşılaştırma kartlarında göster.`
          : '"Bu en kompakt programımız; ölçek ürün grubu bazında daraltılabilir."' },
      ],
    },
    {
      title: 'Yatırım ve Geri Dönüş',
      goal: 'Bütçeyi aylık kayıpla kıyasla; kazancın sürdürülebilir olduğunu vurgula.',
      show: [
        { label: 'Proje Bütçesi', value: `${c}${fmt(sel.budget)}`, tone: 'amber' },
        { label: 'Beklenen Geri Ödeme', value: `${sel.paybackExpMonths} ay`, tone: 'green' },
        { label: 'Benzer Projelerde Ortalama', value: `${sel.def.avgPayback[0]}–${sel.def.avgPayback[1]} ay` },
        { label: '1. Yıl Kazancı', value: `${c}${fmt(sel.year1Gain * success)}`, tone: 'green' },
        { label: `${qla.sustainYears} Yıllık Kazanç`, value: `${c}${fmt(sel.cumulativeGain * success)} (${sel.roiMultiple}x)`, tone: 'green' },
        ...(sel.cashRelease > 0 ? [{ label: 'Serbest Kalan Stok (tek sefer)', value: `${c}${fmt(sel.cashRelease)}`, tone: 'sky' as const }] : []),
      ],
      say: [
        `"Proje bütçesi ${c}${fmt(sel.budget)}; bu, yaklaşık ${monthlyLoss > 0 ? Math.round(sel.budget / monthlyLoss * 10) / 10 : '-'} aylık kaybınıza eşit."`,
        `"İlk yıl ${c}${fmt(sel.year1Gain * success)} geri kazanım bekliyoruz; yatırım ${sel.paybackExpMonths} ayda kendini öder."`,
        `"Referans olarak: bu ölçekteki projelerimizde geri ödeme ortalama ${sel.def.avgPayback[0]}–${sel.def.avgPayback[1]} ay gerçekleşti; sektöre ve ürün yapısına göre daha kısa da olabiliyor, daha uzun da."`,
        `"Bu kazanç tek seferlik değil: ürün grubunuz üretimde kaldıkça sürer. ${qla.sustainYears} yılda toplam ${c}${fmt(sel.cumulativeGain * success)} — yatırımın ${sel.roiMultiple} katı."`,
        ...(sel.cashRelease > 0 ? [`"Ayrıca lead time kısalmasıyla stokta bağlı ${c}${fmt(sel.cashRelease)} nakit serbest kalır."`] : []),
        ...(qla.capacityUpside.inPool > 0 ? [`"Setup ve arıza kayıplarını azaltınca %${qla.capacityUpside.freedPct} ilave kapasite açılıyor. Planın gerisinde kaldığınız için bu kapasitenin ${c}${fmt(qla.capacityUpside.inPool)} katkı payı karşılığını hesaba kattık."`] : []),
        ...(qla.capacityUpside.hasData ? [`"Bunun ötesinde${qla.capacityUpside.demandEvidence ? '' : ', talep olursa'} ${c}${fmt(qla.capacityUpside.extraContribution)} ek katkı payı fırsatı var — hesaba katmadık."`] : []),
      ],
      ask: [
        'Bu tür bir yatırım için şirket içinde beklenen geri ödeme süresi nedir?',
        'Bütçe onayı hangi süreçten geçiyor?',
      ],
      objections: [
        { q: '"Pahalı."', a: `"Her ay ${c}${fmt(monthlyLoss)} kaybediyorsunuz; projeyi 3 ay ertelemek ${c}${fmt(sel.gainMid / 4)} geri kazanımı kaçırmak demek."` },
        { q: '"Bu kazancı garanti ediyor musunuz?"', a: '"İlk 4 hafta Faz 0\'da rakamları sizin verilerinizle doğruluyoruz; sapmayı açıkça raporluyoruz. İsterseniz kazanca bağlı (başarı primi) bir model de kurabiliriz."' },
        ...(qla.affordableAlternative ? [{ q: '(Hesaplanan geri ödeme uzun)', a: `Önce kayıp havuzunu müşteriyle doğrula — veriler eksikse havuz küçük görünür. Gerekirse giriş teklifi: ${qla.affordableAlternative.def.name} (${qla.affordableAlternative.paybackExpMonths} ay).` }] : []),
      ],
    },
    {
      title: 'Kapanış — Sonraki Adım',
      goal: 'Toplantıdan somut bir tarih ve karar verici listesiyle çık.',
      show: [
        { label: 'Önerilen Başlangıç', value: 'Faz 0: 4 hafta veri doğrulama', tone: 'sky' },
        { label: 'Program', value: `${rec.def.name} · ${rec.def.days} adam-gün` },
      ],
      say: [
        `"Önerimiz: ilk 4 haftada verileri birlikte doğrulayalım ve ${topLosses[0]?.label.toLowerCase() || 'en büyük kayıp'} kaleminde pilot başlatalım. İlk somut sonucu 8–12 hafta içinde görmeyi hedefliyoruz."`,
      ],
      ask: [
        'Karar sürecinde kimler yer alıyor? Teklifi kime sunmalıyız?',
        'Başlangıç için hangi tarih uygun?',
        'Faz 0 için hangi verileri (hurda kayıtları, OEE, maliyet kırılımı) paylaşabilirsiniz?',
      ],
      objections: [
        { q: '"Düşünmemiz lazım."', a: '"Elbette. Neyi netleştirmemiz gerekiyor? Eksik bilgi varsa 1 hafta içinde tamamlayıp tekrar görüşelim — tarih koyalım mı?"' },
      ],
    },
  ];

  const s = steps[step];
  const toneCls = (t?: string) =>
    t === 'red' ? 'text-red-400' : t === 'green' ? 'text-emerald-400' : t === 'amber' ? 'text-amber-400' : t === 'sky' ? 'text-sky-400' : 'text-slate-100';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5" id="executive-pitch-guide">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {steps.map((st, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${i === step ? 'bg-red-600 border-red-500 text-white' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-100'}`}
            >
              {i + 1}. {st.title.split(' — ')[0]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowNotes(v => !v)}
          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 border border-slate-700 bg-slate-950/60 px-3 py-1.5 rounded-xl cursor-pointer shrink-0"
          title="Müşteriye ekran paylaşırken danışman notlarını gizleyin"
        >
          {showNotes ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showNotes ? 'Danışman Notlarını Gizle' : 'Danışman Notlarını Göster'}
        </button>
      </div>

      <div>
        <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Adım {step + 1} / {steps.length}</span>
        <h3 className="text-xl font-display font-black text-slate-100 mt-0.5">{s.title}</h3>
        {showNotes && <p className="text-xs text-amber-300/90 font-semibold mt-1">🎯 Amaç: {s.goal}</p>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {s.show.map((m, i) => (
          <div key={i} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1"><Monitor className="w-3 h-3" />{m.label}</span>
            <strong className={`block text-base font-black mt-1 ${toneCls(m.tone)}`}>{m.value}</strong>
          </div>
        ))}
      </div>

      {showNotes && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-[12px] leading-relaxed">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5"><MessageSquareQuote className="w-3.5 h-3.5" />Danışman Söyler</span>
            {s.say.map((t, i) => <p key={i} className="text-slate-200 font-medium">{t}</p>)}
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" />Müşteriye Sor</span>
            {s.ask.map((t, i) => <p key={i} className="text-slate-200 font-medium">• {t}</p>)}
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" />İtiraz Gelirse</span>
            {s.objections.map((o, i) => (
              <div key={i}>
                <p className="text-amber-200 font-bold">{o.q}</p>
                <p className="text-slate-300 font-medium">{o.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button type="button" disabled={step === 0} onClick={() => setStep(v => v - 1)}
          className="flex items-center gap-1 text-xs font-bold text-slate-300 border border-slate-700 px-4 py-2 rounded-xl cursor-pointer disabled:opacity-30">
          <ChevronLeft className="w-4 h-4" /> Önceki
        </button>
        <span className="text-[10px] text-slate-500 font-semibold self-center hidden sm:block">{sektor ? `${sektor} · ` : ''}Tüm rakamlar hesap motorundan canlı gelir</span>
        <button type="button" disabled={step === steps.length - 1} onClick={() => setStep(v => v + 1)}
          className="flex items-center gap-1 text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl cursor-pointer disabled:opacity-30">
          Sonraki <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
