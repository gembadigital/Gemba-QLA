// 17 saha kriteri ve 6 grubu — uygulama ekranı ve PDF raporu aynı tanımı kullanır.

export interface Criterion {
  no: number;
  cat: string | null;
  text: string;
}

export interface CriterionGroup {
  group: string;
  desc: string;
  color: string;
  icon: string;
  items: Criterion[];
}

export const CRITERIA: CriterionGroup[] = [
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
