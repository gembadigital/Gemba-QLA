import { jsPDF } from 'jspdf';
import { ReportData } from './types';
import { ChartRenderer } from './ChartRenderer';
import { TableRenderer, TableColumn } from './TableRenderer';

export class SectionRenderer {
  private static themePrimary = '#0F172A'; // Deep Slate
  private static themeSecondary = '#475569'; // Muted Slate
  private static themeAccent = '#10B981'; // Emerald
  private static themeDanger = '#E11D48'; // Rose
  
  /**
   * Helper to draw Section Heading
   */
  private static drawSectionHeader(doc: jsPDF, title: string, subtitle?: string, yPos: number = 25, fontName: string = 'Roboto'): number {
    doc.setFont(fontName, 'bold');
    doc.setFontSize(14);
    doc.setTextColor(this.themePrimary);
    doc.text(title, 15, yPos);

    doc.setDrawColor(this.themeAccent);
    doc.setLineWidth(1);
    doc.line(15, yPos + 3, 60, yPos + 3);

    if (subtitle) {
      doc.setFont(fontName, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(this.themeSecondary);
      doc.text(subtitle, 15, yPos + 8);
      return yPos + 12;
    }

    return yPos + 7;
  }

  /**
   * Helper to draw a fallback error notice inside a section if it fails
   */
  private static drawErrorFallback(doc: jsPDF, sectionName: string, error: any, yPos: number, fontName: string = 'Roboto'): number {
    console.error(`Error rendering section ${sectionName}:`, error);
    doc.setFillColor('#FEF2F2');
    doc.setDrawColor('#FCA5A5');
    doc.setLineWidth(0.5);
    doc.rect(15, yPos, 180, 20, 'FD');

    doc.setFont(fontName, 'bold');
    doc.setFontSize(10);
    doc.setTextColor('#991B1B');
    doc.text(`[Hata] ${sectionName} render edilemedi`, 20, yPos + 8);

    doc.setFont(fontName, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor('#7F1D1D');
    doc.text('Bu bolumde veri bulunamadi veya PDF olusturulurken teknik bir hata olustu.', 20, yPos + 14);

    return yPos + 25;
  }

  /**
   * 1. COVER PAGE
   */
  public static drawCoverPage(doc: jsPDF, data: ReportData, fontName: string = 'Roboto') {
    try {
      // Background geometric accents
      doc.setFillColor('#F8FAFC');
      doc.rect(0, 0, 210, 297, 'F');

      // Top dark banner
      doc.setFillColor(this.themePrimary);
      doc.rect(0, 0, 210, 110, 'F');

      // Accent colored line
      doc.setFillColor(this.themeAccent);
      doc.rect(0, 110, 210, 6, 'F');

      // Header Text
      doc.setFont(fontName, 'bold');
      doc.setFontSize(26);
      doc.setTextColor('#FFFFFF');
      doc.text('GEMBA QLA', 20, 50);
      doc.text('QUICK LOSS ANALYZER REPORT', 20, 63);

      doc.setFont(fontName, 'normal');
      doc.setFontSize(11);
      doc.setTextColor('#94A3B8');
      doc.text('Saha Analizi, Operational KPI Tanımlama ve ROI Simülatörü', 20, 75);

      // Diamond shape abstract logo/artwork
      doc.setDrawColor('#38BDF8');
      doc.setLineWidth(1.5);
      doc.line(160, 40, 180, 60);
      doc.line(180, 60, 160, 80);
      doc.line(160, 80, 140, 60);
      doc.line(140, 60, 160, 40);

      doc.setDrawColor('#10B981');
      doc.line(160, 45, 175, 60);
      doc.line(175, 60, 160, 75);
      doc.line(160, 75, 145, 60);
      doc.line(145, 60, 160, 45);

      // Company info frame
      const frameY = 140;
      doc.setFillColor('#FFFFFF');
      doc.setDrawColor('#E2E8F0');
      doc.setLineWidth(0.5);
      doc.rect(15, frameY, 180, 120, 'FD');

      // Double borders
      doc.rect(17, frameY + 2, 176, 116, 'D');

      doc.setFont(fontName, 'bold');
      doc.setFontSize(18);
      doc.setTextColor(this.themePrimary);
      
      // Limit company name length
      let cName = data.company.companyName || 'Aktif Firma';
      if (cName.length > 35) cName = cName.substring(0, 32) + '...';
      doc.text(cName, 25, frameY + 18);

      doc.setFont(fontName, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(this.themeSecondary);
      doc.text('SAHA VE DEĞERLENDİRME DETAYLARI', 25, frameY + 32);
      
      // Separator line
      doc.setDrawColor('#F1F5F9');
      doc.setLineWidth(1);
      doc.line(25, frameY + 35, 170, frameY + 35);

      // Meta grid
      const meta = [
        { label: 'Sektör:', val: data.company.sector || 'Belirtilmedi' },
        { label: 'Konum / Saha:', val: data.company.location || 'Belirtilmedi' },
        { label: 'Baş Danışman:', val: data.company.consultant || 'Gemba Digital Danışmanlık' },
        { label: 'Ziyaret Tarihi:', val: data.company.visitDate || '-' },
        { label: 'Rapor Tarihi:', val: new Date().toLocaleDateString('tr-TR') },
        { label: 'Çalışma Durumu:', val: data.company.status === 'Completed' ? 'Tamamlandı' : 'Aktif Analiz' }
      ];

      doc.setFont(fontName, 'normal');
      doc.setFontSize(10);
      meta.forEach((item, index) => {
        const x = index % 2 === 0 ? 25 : 100;
        const y = frameY + 47 + Math.floor(index / 2) * 18;
        
        doc.setFont(fontName, 'bold');
        doc.setTextColor(this.themeSecondary);
        doc.text(item.label, x, y);
        
        doc.setFont(fontName, 'normal');
        doc.setTextColor(this.themePrimary);
        doc.text(String(item.val), x, y + 5);
      });

      // Bottom footer decoration
      doc.setFont(fontName, 'bold');
      doc.setFontSize(8);
      doc.setTextColor('#94A3B8');
      doc.text('GEMBA DIGITAL® CONSULTING ENGINE  •  WWW.GEMBADIGITAL.COM', 105, 282, { align: 'center' });

    } catch (e) {
      this.drawErrorFallback(doc, 'Kapak Sayfasi', e, 50, fontName);
    }
  }

  /**
   * 2. TABLE OF CONTENTS
   */
  public static drawTableOfContents(doc: jsPDF, fontName: string = 'Roboto') {
    try {
      this.drawSectionHeader(doc, 'İÇİNDEKİLER', 'Rapor içeriği ve sayfa dizini', 25, fontName);

      const indexItems = [
        { name: '1. Yönetici Özeti ve Performans İndeksi', page: '3' },
        { name: '2. Firma Profili ve Üretim Bilgileri', page: '4' },
        { name: '3. Operasyonel KPI Gözlem Verileri', page: '5' },
        { name: '4. Yalın Olgunluk (Lean Assessment) Değerlendirmesi', page: '6' },
        { name: '5. Detaylı Saha Bulguları ve Gözlem Matrisi', page: '7' },
        { name: '6. Finansal Potansiyel Geri Kazanım ve ROI Simülasyonu', page: '8' },
        { name: '7. Yapay Zeka (AI Partner) Analiz ve Stratejik Öneriler', page: '9' },
        { name: '8. Önceliklendirilmiş Yalın Aksiyon Planı', page: '10' },
        { name: '9. Sonuç ve Yatırım Dönüş Değerlendirmesi', page: '11' }
      ];

      let y = 60;
      doc.setFont(fontName, 'normal');
      doc.setFontSize(10.5);
      
      indexItems.forEach((item) => {
        doc.setTextColor(this.themePrimary);
        doc.text(item.name, 15, y);

        // Dot leaders
        doc.setTextColor('#94A3B8');
        const dots = '.'.repeat(75 - Math.round(item.name.length * 0.9));
        doc.text(dots, 15 + doc.getTextWidth(item.name) + 2, y);

        doc.setTextColor(this.themeAccent);
        doc.setFont(fontName, 'bold');
        doc.text(`Sayfa ${item.page}`, 178, y);
        doc.setFont(fontName, 'normal');

        y += 18;
      });

      // Graphic frame box for aesthetic appeal
      doc.setFillColor('#F8FAFC');
      doc.setDrawColor('#E2E8F0');
      doc.rect(15, 215, 180, 45, 'FD');

      doc.setFont(fontName, 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(this.themePrimary);
      doc.text('KULLANIM VE GİZLİLİK NOTU', 22, 227);
      
      doc.setFont(fontName, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(this.themeSecondary);
      doc.text('Bu rapor Gemba Digital tarafindan firmaya ozel olarak uretilmistir. Rapor icerisindeki', 22, 234);
      doc.text('finansal projeksiyonlar, kayip verileri ve iyilesme oranlari saha tespiti ve isletme beyanlarina', 22, 239);
      doc.text('dayanmaktadir. Ucuncu sahislarla paylasilamaz, kopyalanamaz veya yetkisiz yayinlanamaz.', 22, 244);

    } catch (e) {
      this.drawErrorFallback(doc, 'Icindekiler', e, 50, fontName);
    }
  }

  /**
   * 3. EXECUTIVE SUMMARY
   */
  public static drawExecutiveSummary(doc: jsPDF, data: ReportData, fontName: string = 'Roboto') {
    try {
      this.drawSectionHeader(doc, '1. YÖNETİCİ ÖZETİ', 'Üst düzey performans analizi ve finansal bulgular', 25, fontName);

      const turnoverText = data.operation.turnoverLira || '150.000.000';
      const turnoverVal = Number(turnoverText.replace(/\./g, '')) || 150000000;
      const copqPool = Math.round(turnoverVal * 0.10);
      const overallScore = data.assessment.overallScore || 0;

      // Draw 4 bento KPI cards
      const cards = [
        { title: 'YALIN SCORE', val: `${overallScore} / 100`, color: this.themePrimary, textCol: '#FFFFFF', desc: 'Olgunluk Seviyesi' },
        { title: 'POTANSİYEL KAYIP (COPQ)', val: `${copqPool.toLocaleString('tr-TR')} ₺`, color: this.themeDanger, textCol: '#FFFFFF', desc: 'Yıllık Kaçan Bütçe' },
        { title: 'ROI ORANI', val: `${data.assessment.paybackPeriod > 0 ? (12 / data.assessment.paybackPeriod).toFixed(1) : '6.5'}x`, color: this.themeAccent, textCol: '#FFFFFF', desc: 'Tahmini Yatırım Çarpanı' },
        { title: 'GERİ ÖDEME (PAYBACK)', val: `${data.assessment.paybackPeriod || '3-6'} Ay`, color: '#4F46E5', textCol: '#FFFFFF', desc: 'Amortisman Süresi' }
      ];

      cards.forEach((card, idx) => {
        const x = 15 + (idx % 2) * 92;
        const y = 50 + Math.floor(idx / 2) * 35;

        doc.setFillColor(card.color);
        doc.rect(x, y, 88, 30, 'F');
        
        // Slight bottom border to cards
        doc.setFillColor('#0F172A');
        doc.rect(x, y + 28, 88, 2, 'F');

        doc.setFont(fontName, 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(card.textCol);
        doc.text(card.title, x + 6, y + 8);

        doc.setFont(fontName, 'bold');
        doc.setFontSize(16);
        doc.text(card.val, x + 6, y + 19);

        doc.setFont(fontName, 'normal');
        doc.setFontSize(7.5);
        doc.text(card.desc, x + 6, y + 25);
      });

      // Executive evaluation text
      let yPos = 130;
      doc.setFont(fontName, 'bold');
      doc.setFontSize(11);
      doc.setTextColor(this.themePrimary);
      doc.text('GENEL DEĞERLENDİRME VE İLERLEME YOLU', 15, yPos);
      
      doc.setDrawColor('#E2E8F0');
      doc.line(15, yPos + 2, 195, yPos + 2);
      yPos += 8;

      doc.setFont(fontName, 'normal');
      doc.setFontSize(9);
      doc.setTextColor('#334155');
      
      const evalText = `Yapılan saha analizleri doğrultusunda tesisin genel yalın üretim olgunluk skoru 100 üzerinden ${overallScore} olarak hesaplanmıştır. Bu skor, tesiste henüz standartlaştırılmamış bir operasyonel akışın ve yüksek miktarda israfın bulunduğunu teyit etmektedir. Cironun tam %10'u seviyesinde olan Kalitesizlik Maliyeti (COPQ) havuzu (${copqPool.toLocaleString('tr-TR')} ₺/Yıl) firmanın kârlılığını ciddi oranda törpülemektedir.

Yalın dönüşüm araçlarının (SMED, 5S, TPM Otonom Bakım ve Poka-Yoke) entegre edilmesiyle bu kayıp havuzunun minimum %20'si ila %30'unun çok kısa vadede geri kazandırılması mümkündür. Önerilen ilk 5 öncelikli aksiyon aşağıda özetlenmiştir:`;

      const splitEval = doc.splitTextToSize(evalText, 180);
      doc.text(splitEval, 15, yPos);
      yPos += splitEval.length * 4.5 + 4;

      // Proposed Initial Actions
      doc.setFont(fontName, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(this.themePrimary);
      doc.text('ÖNERİLEN İLK 5 ÖNCELİKLİ YALIN AKSİYON', 15, yPos);
      yPos += 5;

      const actions = [
        { act: 'Kalıp Değişim Sürelerinde SMED Metodolojisi', desc: 'Setup sürelerinin video analizleri ile %50 azaltılması.' },
        { act: 'Pilot Alanda 5S ve Görsel Yönetim standardizasyonu', desc: 'Arama kayıplarının önlenmesi ve İSG risklerinin azaltılması.' },
        { act: 'Operatörler İçin Otonom Bakım (TPM) Başlangıcı', desc: 'Günlük temizlik, yağlama ve sıkma listelerinin oluşturulması.' },
        { act: 'Hata Önleyici Poka-Yoke Mekanizmaları', desc: 'Kalite hatalarının bir sonraki istasyona geçmesini önleme.' },
        { act: 'Canlı OEE ve Duruş Analizi Takip Panosu', desc: 'Vardiya bazlı veri disiplini ve kayıp kök neden tespiti.' }
      ];

      actions.forEach((item, idx) => {
        // Bullet marker
        doc.setFillColor(this.themeAccent);
        doc.circle(18, yPos + 2, 1.5, 'F');

        doc.setFont(fontName, 'bold');
        doc.setFontSize(9);
        doc.setTextColor(this.themePrimary);
        doc.text(`${idx + 1}. ${item.act}`, 22, yPos + 3);

        doc.setFont(fontName, 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(this.themeSecondary);
        doc.text(`: ${item.desc}`, 22 + doc.getTextWidth(`${idx + 1}. ${item.act}`), yPos + 3);

        yPos += 7;
      });

    } catch (e) {
      this.drawErrorFallback(doc, 'Yonetici Ozeti', e, 50, fontName);
    }
  }

  /**
   * 4. COMPANY PROFILE
   */
  public static drawCompanyInfo(doc: jsPDF, data: ReportData, fontName: string = 'Roboto') {
    try {
      this.drawSectionHeader(doc, '2. FİRMA PROFİLİ VE ÜRETİM ALTYAPISI', 'Tesisin fiziksel ve organizasyonel kapasitesi', 25, fontName);

      const cols: TableColumn[] = [
        { header: 'Operasyonel Altyapı Parametresi', width: 110 },
        { header: 'Beyan Edilen Değer', width: 70, align: 'center' }
      ];

      // Safe parse
      const mCount = data.operation.setupMachineCount || '0';
      const oCount = data.operation.operatorsCount || '0';
      const aVolume = data.operation.annualVolume || '0';
      const pUnit = data.operation.productionUnit || 'Adet';
      const cArea = data.operation.coveredArea || '0';
      const tLira = data.operation.turnoverLira || '0';

      const rows = [
        ['Sektörel Faaliyet Alanı', data.company.sector || 'Genel İmalat'],
        ['Makine / Hat Sayısı (Setup Etkili)', `${mCount} Adet`],
        ['Saha Çalışan Sayısı (Mavi Yaka)', `${oCount} Operatör`],
        ['Yıllık Üretim Hacmi', `${aVolume} ${pUnit}`],
        ['Saha Kapalı Alanı', `${cArea} m²`],
        ['Yıllık Toplam Ciro Projeksiyonu', `${tLira} ₺`],
        ['Danışman / Değerlendirmeyi Yapan', data.company.consultant || '-'],
        ['Analiz Durumu', data.company.status === 'Completed' ? 'Analiz Tamamlandı' : 'Taslak Veri Girişi']
      ];

      TableRenderer.drawTable(doc, cols, rows, 15, 50, () => {}, this.themePrimary, '#1E293B', '#F8FAFC');

      // Add a nice visual diagram box of the production cost proportions
      const yBox = 145;
      doc.setFillColor('#F8FAFC');
      doc.setDrawColor('#E2E8F0');
      doc.rect(15, yBox, 180, 85, 'FD');

      doc.setFont(fontName, 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(this.themePrimary);
      doc.text('MALİYET KIRIILIMI VE PROPORSIYONU', 25, yBox + 12);

      // Separator
      doc.setDrawColor('#E2E8F0');
      doc.line(25, yBox + 15, 185, yBox + 15);

      const costs = [
        { label: 'Hammadde / Malzeme Maliyeti:', val: `${data.operation.costPropMaterial || '50'}%`, col: '#4F46E5' },
        { label: 'Direkt İşçilik Maliyeti:', val: `${data.operation.costPropLabor || '20'}%`, col: '#10B981' },
        { label: 'Enerji Giderleri:', val: `${data.operation.costPropEnergy || '10'}%`, col: '#F59E0B' },
        { label: 'Bakım ve Yedek Parça Maliyeti:', val: `${data.operation.costPropMaintenance || '10'}%`, col: '#EF4444' },
        { label: 'Genel Giderler / Overhead:', val: `${data.operation.costPropOverhead || '10'}%`, col: '#8B5CF6' }
      ];

      // Draw cost share percentages with elegant visual bars
      costs.forEach((cost, idx) => {
        const y = yBox + 26 + idx * 11;
        doc.setFont(fontName, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(this.themeSecondary);
        doc.text(cost.label, 25, y);

        doc.setFont(fontName, 'bold');
        doc.setTextColor(this.themePrimary);
        doc.text(cost.val, 115, y);

        // Draw progress bar
        const pct = parseInt(cost.val.replace('%', '')) || 0;
        doc.setFillColor('#E2E8F0');
        doc.rect(130, y - 3, 45, 4, 'F');

        doc.setFillColor(cost.col);
        doc.rect(130, y - 3, (pct / 100) * 45, 4, 'F');
      });

    } catch (e) {
      this.drawErrorFallback(doc, 'Firma Profili', e, 50, fontName);
    }
  }

  /**
   * 5. OPERATIONAL DATA
   */
  public static drawOperationalData(doc: jsPDF, data: ReportData, fontName: string = 'Roboto') {
    try {
      this.drawSectionHeader(doc, '3. OPERASYONEL VERİLER VE ANAHTAR PARAMETRELER', 'Süreç performans göstergeleri ve kalitesizlik havuzu', 25, fontName);

      const cols: TableColumn[] = [
        { header: 'Operasyonel Gösterge (KPI)', width: 85 },
        { header: 'Planlanan / Hedef', width: 45, align: 'center' },
        { header: 'Gerçekleşen (Fiili)', width: 50, align: 'center' }
      ];

      // Girilmemiş veri demo rakamla doldurulmaz: "Veri yok" yazılır
      const op = data.operation;
      const has = (v: any) => v !== undefined && v !== null && String(v).trim() !== '' && Number(String(v).replace(',', '.')) !== 0;
      const pct = (v: any) => has(v) ? `%${v}` : 'Veri yok';
      const unit = (v: any, u: string) => has(v) ? `${v} ${u}` : 'Veri yok';

      const rows = [
        ['Toplam Ekipman Etkinliği (OEE)', '%85.0 (Dünya Klası)', has(op.oee) ? `%${op.oee}` : 'Ölçülmüyor'],
        ['Hat / Proses Verimliliği', has(op.plannedEfficiency) ? `%${op.plannedEfficiency}` : '-', pct(op.actualEfficiency)],
        ['Kalitesizlik Maliyet Oranı (COPQ)', '%2.5', pct(op.copqRate)],
        ['Iskarta / Hurda Oranı', '%0.5', pct(op.scrapRate)],
        ['Tamir / Rework Oranı', '%1.0', pct(op.reworkRate)],
        ['Fazla Mesai Çalışma Oranı', '%3.0', pct(op.overtimeRate)],
        ['Üretim Çevrim ve Akış Süresi (Lead Time)', '7 Gün', unit(op.leadTime, 'Gün')],
        ['Vardiya Başına Model Değişim (Setup) Sıklığı', '1-2 Değişim', unit(op.setupFrequency, 'Setup')],
        ['Ortalama Setup Duruş Süresi', '15 Dakika', unit(op.setupDuration, 'Dakika')],
        ['Aylık Brüt Operatör Maliyeti', '40.000 ₺', `${data.operation.grossLaborCost || '48.000'} ₺`]
      ];

      TableRenderer.drawTable(doc, cols, rows, 15, 50, () => {}, this.themePrimary, '#1E293B', '#F8FAFC');

      // KPI interpretation alert box
      const alertY = 155;
      doc.setFillColor('#FEF3C7');
      doc.setDrawColor('#F59E0B');
      doc.setLineWidth(0.4);
      doc.rect(15, alertY, 180, 25, 'FD');

      doc.setFont(fontName, 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor('#78350F');
      doc.text('KRİTİK KPI EŞİKLERİ VE DARBOĞAZ ALARMI', 20, alertY + 7);

      doc.setFont(fontName, 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor('#92400E');
      
      // Yorum yalnızca girilmiş verilerden kurulur
      const parts: string[] = [];
      if (has(op.oee)) parts.push(`%${op.oee} OEE`);
      if (has(op.copqRate)) parts.push(`%${op.copqRate} kalitesizlik maliyeti (COPQ)`);
      const interpret = (parts.length
        ? `Mevcut ${parts.join(' ve ')} değerleri, operasyonel kayıpların ciddi bir finansal israfa yol açtığını göstermektedir. `
        : 'Operasyonel veriler kısmen ölçülebildiğinden yorum saha gözlemlerine dayanmaktadır. ')
        + (has(op.setupDuration) ? `Kurulum (setup) sürelerinin ${op.setupDuration} dakika seviyesinde olması planlama esnekliğini sınırlamaktadır.` : '');
      
      const splitInterpret = doc.splitTextToSize(interpret, 170);
      doc.text(splitInterpret, 20, alertY + 12);

    } catch (e) {
      this.drawErrorFallback(doc, 'Operasyonel Veriler', e, 50, fontName);
    }
  }

  /**
   * 6. LEAN ASSESSMENT RESULTS (WITH RADAR CHART)
   */
  public static drawLeanAssessment(doc: jsPDF, data: ReportData, fontName: string = 'Roboto') {
    try {
      this.drawSectionHeader(doc, '4. YALIN OLGUNLUK (LEAN ASSESSMENT) SEVİYESİ', '17 Temel yalın kategoriye göre olgunluk analizi', 25, fontName);

      // Compute aggregated scores for categories to render clean radar & bar chart
      const categories = [
        '5S & Düzen', 'Standart İş', 'SMED (Kurulum)', 'Otonom Bakım',
        'Planlı Bakım', 'Poka-Yoke', 'VSM (Akış)', 'Kazan / İsraf'
      ];
      
      // Programmatic values
      const scores = data.operation.scores || {};
      const aggScores = [3, 2, 1, 2, 2, 1, 2, 3]; // Fallback if empty
      
      // Calculate real scores if scores record exists
      if (Object.keys(scores).length > 0) {
        categories.forEach((cat, idx) => {
          // Average some scores mapping
          const start = idx * 2 + 1;
          const s1 = Math.max(0, Number(scores[start]) || 0);
          const s2 = Math.max(0, Number(scores[start + 1]) || 0);
          aggScores[idx] = Math.round((s1 + s2) / 2);
        });
      }

      // 1. Draw Category Scores Table
      const cols: TableColumn[] = [
        { header: 'Değerlendirilen Yalın Kategori', width: 110 },
        { header: 'Skor (0-4)', width: 35, align: 'center' },
        { header: 'Olgunluk Durumu', width: 35, align: 'center' }
      ];

      const getOlgunluk = (s: number) => {
        if (s >= 3.5) return 'Mükemmel';
        if (s >= 2.5) return 'İyi';
        if (s >= 1.5) return 'Orta Seviye';
        return 'Başlangıç / Kritik';
      };

      const rows = categories.map((cat, idx) => {
        const val = aggScores[idx];
        return [cat, `${val} / 4`, getOlgunluk(val)];
      });

      let currentY = TableRenderer.drawTable(doc, cols, rows, 15, 50, () => {}, this.themePrimary, '#1E293B', '#F8FAFC');

      // 2. Render and Add Radar Chart dynamically!
      currentY += 8;
      
      if (currentY + 80 > 270) {
        doc.addPage();
        currentY = 25;
      }

      doc.setFont(fontName, 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(this.themePrimary);
      doc.text('YALIN OLGUNLUK RADAR DAĞILIMI', 15, currentY);

      // Generate offscreen radar chart
      const radarBase64 = ChartRenderer.renderRadarChart(categories, aggScores, 'Süreç Olgunluk Endeksi (World Class Target: 4)', 4);
      
      if (radarBase64) {
        // Add chart image to PDF
        doc.addImage(radarBase64, 'PNG', 15, currentY + 3, 180, 80);
      } else {
        doc.setFont(fontName, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(this.themeSecondary);
        doc.text('Grafik olusturulamadi.', 20, currentY + 15);
      }

    } catch (e) {
      this.drawErrorFallback(doc, 'Yalin Degerlendirme', e, 50, fontName);
    }
  }

  /**
   * 7. DETAILED OBSERVATIONS WITH PHOTOS
   */
  public static drawObservations(doc: jsPDF, data: ReportData, fontName: string = 'Roboto') {
    try {
      this.drawSectionHeader(doc, '5. SAHA BULGULARI VE GÖZLEM MATRİSİ', 'Saha turu sırasında fotoğraflanan problemler ve önerilen çözümler', 25, fontName);

      const obsList = data.observations || [];

      if (obsList.length === 0) {
        doc.setFillColor('#F8FAFC');
        doc.setDrawColor('#E2E8F0');
        doc.rect(15, 50, 180, 25, 'FD');
        doc.setFont(fontName, 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(this.themeSecondary);
        doc.text('Henüz girilmiş bir saha gözlemi bulunmamaktadır.', 22, 65);
        return;
      }

      let yPos = 50;
      doc.setFontSize(9);

      obsList.forEach((obs, index) => {
        const rowHeight = obs.photo ? 52 : 38;

        // Page break check
        if (yPos + rowHeight > 275) {
          doc.addPage();
          yPos = 25;
        }

        // Draw card background
        doc.setFillColor('#FFFFFF');
        doc.setDrawColor('#E2E8F0');
        doc.setLineWidth(0.4);
        doc.rect(15, yPos, 180, rowHeight, 'FD');

        // Colored vertical edge band based on priority
        let edgeColor = this.themeSecondary;
        if (obs.priority === 'Kritik') edgeColor = this.themeDanger;
        else if (obs.priority === 'Yüksek') edgeColor = '#F59E0B';
        else if (obs.priority === 'Orta') edgeColor = '#4F46E5';

        doc.setFillColor(edgeColor);
        doc.rect(15, yPos, 3, rowHeight, 'F');

        // Draw fields inside card
        doc.setFont(fontName, 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(this.themePrimary);
        doc.text(`${index + 1}. BULGU: ${obs.category.toUpperCase()}`, 22, yPos + 7);

        // Priority Badge
        doc.setFillColor(edgeColor);
        doc.rect(142, yPos + 3, 45, 5, 'F');
        doc.setFont(fontName, 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor('#FFFFFF');
        doc.text(`ÖNCELİK: ${obs.priority.toUpperCase()}`, 144, yPos + 6.5);

        // Divider
        doc.setDrawColor('#F1F5F9');
        doc.line(22, yPos + 10, 185, yPos + 10);

        // Details
        let textXLimit = 180;
        let detailsX = 22;

        if (obs.photo) {
          try {
            // Render the photo on the right of the text
            doc.addImage(obs.photo, 'JPEG', 22, yPos + 13, 30, 30);
            detailsX = 57;
            textXLimit = 135;
          } catch (imgError) {
            console.warn('Could not render observation image:', imgError);
          }
        }

        doc.setFont(fontName, 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(this.themePrimary);
        doc.text('Tespit Edilen Problem (Finding):', detailsX, yPos + 16);
        
        doc.setFont(fontName, 'normal');
        doc.setTextColor('#475569');
        const splitFinding = doc.splitTextToSize(obs.finding || '', textXLimit - detailsX);
        doc.text(splitFinding, detailsX, yPos + 20);

        const findingHeight = splitFinding.length * 4;

        doc.setFont(fontName, 'bold');
        doc.setTextColor(this.themeAccent);
        doc.text('Önerilen İyileştirme (Improvement):', detailsX, yPos + 22 + findingHeight);
        
        doc.setFont(fontName, 'normal');
        doc.setTextColor('#334155');
        const splitImprovement = doc.splitTextToSize(obs.improvement || '', textXLimit - detailsX);
        doc.text(splitImprovement, detailsX, yPos + 26 + findingHeight);

        yPos += rowHeight + 6;
      });

    } catch (e) {
      this.drawErrorFallback(doc, 'Saha Bulgulari', e, 50, fontName);
    }
  }

  /**
   * 8. FINANCIAL SAVINGS AND ROI
   */
  public static drawPotentialSavings(doc: jsPDF, data: ReportData, fontName: string = 'Roboto') {
    try {
      this.drawSectionHeader(doc, '6. POTANSİYEL KAZANIMLAR VE ROI SİMÜLASYONU', 'Hesaplanan yıllık bütçe geri kazanımları ve yatırım analizi', 25, fontName);

      const savingsList = data.savings || [];

      if (savingsList.length === 0) {
        doc.setFillColor('#F8FAFC');
        doc.setDrawColor('#E2E8F0');
        doc.rect(15, 50, 180, 25, 'FD');
        doc.setFont(fontName, 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(this.themeSecondary);
        doc.text('Henüz hesaplanmış potansiyel finansal kazanım bulunmamaktadır.', 22, 65);
        return;
      }

      // Render savings table
      const cols: TableColumn[] = [
        { header: 'Kazanım / İyileştirme Türü', width: 60 },
        { header: 'Mevcut Maliyet (₺)', width: 30, align: 'right' },
        { header: 'Gelecek Maliyet (₺)', width: 30, align: 'right' },
        { header: 'Yıllık Tasarruf (₺)', width: 32, align: 'right' },
        { header: 'ROI (x)', width: 13, align: 'center' },
        { header: 'Geri Ödeme (Ay)', width: 15, align: 'center' }
      ];

      const rows = savingsList.map(s => [
        s.savingType || 'Lean İyileştirme',
        Math.round(s.currentCost).toLocaleString('tr-TR'),
        Math.round(s.futureCost).toLocaleString('tr-TR'),
        Math.round(s.annualSaving).toLocaleString('tr-TR'),
        s.roi ? `${s.roi}x` : '-',
        s.payback ? String(s.payback) : '-'
      ]);

      // Calculate totals
      const totalCurrent = savingsList.reduce((sum, s) => sum + (s.currentCost || 0), 0);
      const totalFuture = savingsList.reduce((sum, s) => sum + (s.futureCost || 0), 0);
      const totalSavingVal = savingsList.reduce((sum, s) => sum + (s.annualSaving || 0), 0);
      // Satırlar aynı paketin kategorileridir: ROI ve geri ödeme paket geneli için ortaktır
      const avgRoi = savingsList.length > 0 ? String(savingsList[0].roi || 0) : '0';
      const packagePayback = savingsList.length > 0 ? String(savingsList[0].payback || '-') : '-';

      rows.push([
        'TOPLAM FİNANSAL GERİ KAZANIM',
        Math.round(totalCurrent).toLocaleString('tr-TR'),
        Math.round(totalFuture).toLocaleString('tr-TR'),
        Math.round(totalSavingVal).toLocaleString('tr-TR'),
        `${avgRoi}x`,
        packagePayback
      ]);

      let currentY = TableRenderer.drawTable(doc, cols, rows, 15, 50, () => {}, this.themePrimary, '#111827', '#F8FAFC');

      // Add COPQ Breakdown Pie Chart below the table
      currentY += 8;
      
      if (currentY + 80 > 275) {
        doc.addPage();
        currentY = 25;
      }

      doc.setFont(fontName, 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(this.themePrimary);
      doc.text('KALİTESİZLİK MALİYETİ (COPQ) KAYIP PAYLAŞIMI', 15, currentY);

      // Programmatic values for the pie chart
      const chartLabels = ['Duruş & Setup', 'Kalite Defekt', 'Fazla Mesai', 'Hurda Fire', 'İşçilik', 'Kapasite'];
      const chartValues = [
        Math.round(totalSavingVal * 0.25) || 1200000,
        Math.round(totalSavingVal * 0.20) || 1000000,
        Math.round(totalSavingVal * 0.15) || 750000,
        Math.round(totalSavingVal * 0.15) || 750000,
        Math.round(totalSavingVal * 0.15) || 750000,
        Math.round(totalSavingVal * 0.10) || 500000
      ];

      const pieBase64 = ChartRenderer.renderPieChart(chartLabels, chartValues, 'Toplam COPQ Dağılım Kırılımı (% / ₺)');
      
      if (pieBase64) {
        doc.addImage(pieBase64, 'PNG', 15, currentY + 3, 180, 80);
      } else {
        doc.setFont(fontName, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(this.themeSecondary);
        doc.text('Kayıp dağılım grafiği oluşturulamadı.', 20, currentY + 15);
      }

    } catch (e) {
      this.drawErrorFallback(doc, 'Potansiyel Kazanimlar', e, 50, fontName);
    }
  }

  /**
   * 9. AI ANALYSIS (STRATEGIC ROADMAP)
   */
  public static drawAiAnalysis(doc: jsPDF, data: ReportData, fontName: string = 'Roboto') {
    try {
      this.drawSectionHeader(doc, '7. YAPAY ZEKA (AI PARTNER) STRATEJİK DEĞERLENDİRMESİ', 'Gemba Partner AI tarafından oluşturulan derinlemesine gelişim rehberi', 25, fontName);

      const ai = data.aiAnalysis;

      let yPos = 50;

      // 1. General Evaluation
      doc.setFont(fontName, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(this.themePrimary);
      doc.text('A. GENEL DEĞERLENDİRME VE SEKTÖREL BAKIŞ', 15, yPos);
      yPos += 5;

      doc.setFont(fontName, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor('#334155');
      const splitEval = doc.splitTextToSize(ai.generalEvaluation, 180);
      doc.text(splitEval, 15, yPos);
      yPos += splitEval.length * 4.2 + 8;

      // 2. Risks and Opportunities (2 Column side-by-side)
      doc.setFont(fontName, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(this.themePrimary);
      doc.text('B. KRİTİK OPERASYONEL RİSKLER VE GELECEK FIRSATLARI', 15, yPos);
      yPos += 5;

      // Left Column - Risks
      doc.setFillColor('#FEF2F2');
      doc.setDrawColor('#FEE2E2');
      doc.rect(15, yPos, 88, 55, 'FD');
      
      doc.setFont(fontName, 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(this.themeDanger);
      doc.text('KRİTİK RİSK VE TEHDİTLER', 20, yPos + 6);
      
      doc.setFont(fontName, 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor('#7F1D1D');
      let rY = yPos + 12;
      ai.criticalRisks.slice(0, 4).forEach(risk => {
        const splitR = doc.splitTextToSize(`• ${risk}`, 78);
        doc.text(splitR, 20, rY);
        rY += splitR.length * 3.8;
      });

      // Right Column - Opportunities
      doc.setFillColor('#ECFDF5');
      doc.setDrawColor('#D1FAE5');
      doc.rect(107, yPos, 88, 55, 'FD');

      doc.setFont(fontName, 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(this.themeAccent);
      doc.text('STRATEJİK YALIN FIRSATLAR', 112, yPos + 6);

      doc.setFont(fontName, 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor('#065F46');
      let oY = yPos + 12;
      ai.opportunities.slice(0, 4).forEach(opp => {
        const splitO = doc.splitTextToSize(`• ${opp}`, 78);
        doc.text(splitO, 112, oY);
        oY += splitO.length * 3.8;
      });

      yPos += 63;

      // 3. Roadmap Projects (Short, Medium, Long term)
      doc.setFont(fontName, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(this.themePrimary);
      doc.text('C. KRONOLOJİK YALIN DÖNÜŞÜM YOL HARİTASI (ROADMAP)', 15, yPos);
      yPos += 5;

      const terms = [
        { label: 'HIZLI KAZANIMLAR (0-3 Ay) / Quick-Wins', list: ai.quickWins, bg: '#F8FAFC', border: '#E2E8F0', text: this.themePrimary },
        { label: 'ORTA VADELİ PROJELER (3-9 Ay) / Core Kaizen', list: ai.mediumTermProjects, bg: '#F1F5F9', border: '#CBD5E1', text: this.themeSecondary },
        { label: 'UZUN VADELİ SÜRDÜRÜLEBİLİRLİK (9+ Ay) / TPM', list: ai.longTermProjects, bg: '#E2E8F0', border: '#94A3B8', text: '#1E293B' }
      ];

      terms.forEach(term => {
        doc.setFillColor(term.bg);
        doc.setDrawColor(term.border);
        doc.rect(15, yPos, 180, 22, 'FD');

        doc.setFont(fontName, 'bold');
        doc.setFontSize(8);
        doc.setTextColor(term.text);
        doc.text(term.label, 18, yPos + 5);

        doc.setFont(fontName, 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor('#334155');
        
        let bulletText = '';
        term.list.slice(0, 3).forEach((item, idx) => {
          bulletText += `${idx + 1}. ${item}   `;
        });
        
        const splitBullet = doc.splitTextToSize(bulletText, 172);
        doc.text(splitBullet, 18, yPos + 11);

        yPos += 26;
      });

    } catch (e) {
      this.drawErrorFallback(doc, 'AI Analizi', e, 50, fontName);
    }
  }

  /**
   * 10. ACTION PLAN
   */
  public static drawActionPlan(doc: jsPDF, data: ReportData, fontName: string = 'Roboto') {
    try {
      this.drawSectionHeader(doc, '8. ÖNCELİKLENDİRİLMİŞ YALIN AKSİYON PLANI', 'Uygulanacak iyileştirme adımları ve sorumluluk tablosu', 25, fontName);

      const obsList = data.observations || [];

      // Auto-generate the Action Plan Rows from physical observations list
      const cols: TableColumn[] = [
        { header: 'Yapılacak Yalın İş / İyileştirme', width: 75 },
        { header: 'Sorumlu', width: 35, align: 'center' },
        { header: 'Termin', width: 25, align: 'center' },
        { header: 'Öncelik', width: 25, align: 'center' },
        { header: 'Durum', width: 20, align: 'center' }
      ];

      const getSorumlu = (cat: string) => {
        const c = cat.toLowerCase();
        if (c.includes('smed') || c.includes('kurulum')) return 'Üretim ve Metot Mühendisi';
        if (c.includes('5s') || c.includes('görsel')) return '5S Pilot Alan Sorumlusu';
        if (c.includes('bakım') || c.includes('tpm')) return 'Bakım ve TPM Departmanı';
        if (c.includes('kalite') || c.includes('hata') || c.includes('poka')) return 'Kalite Güvence Müdürü';
        if (c.includes('lojistik') || c.includes('malzeme')) return 'Lojistik ve Planlama Sorumlusu';
        return 'Saha Operasyon Ekibi';
      };

      const getTermin = (p: string) => {
        if (p === 'Kritik') return '15 Gün';
        if (p === 'Yüksek') return '30 Gün';
        if (p === 'Orta') return '60 Gün';
        return '90 Gün';
      };

      let rows = obsList.map(obs => [
        obs.improvement || obs.finding || 'İyileştirme Aksiyonu',
        getSorumlu(obs.category),
        getTermin(obs.priority),
        obs.priority || 'Orta',
        'Planlandı'
      ]);

      // Fallback row if empty
      if (rows.length === 0) {
        rows = [
          ['5S ve Görsel Yönetim Gölge Pano Uygulaması', '5S Alan Sorumlusu', '30 Gün', 'Yüksek', 'Planlandı'],
          ['SMED Hızlı Kalıp Değişim Ön Isıtma Entegrasyonu', 'Üretim Mühendisi', '45 Gün', 'Yüksek', 'Beklemede'],
          ['Günlük Otonom Bakım Temizlik Listeleri', 'Bakım Teknikeri', '30 Gün', 'Orta', 'Planlandı']
        ];
      }

      TableRenderer.drawTable(doc, cols, rows, 15, 50, () => {}, this.themePrimary, '#1E293B', '#F8FAFC');

      // Notes block
      const noteY = 165;
      doc.setFillColor('#F1F5F9');
      doc.setDrawColor('#E2E8F0');
      doc.rect(15, noteY, 180, 20, 'FD');

      doc.setFont(fontName, 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(this.themePrimary);
      doc.text('AKSİYON PLANI YÖNETİM METODU:', 20, noteY + 6);
      
      doc.setFont(fontName, 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(this.themeSecondary);
      doc.text('Tüm aksiyonlar PDCA (Plan-Do-Check-Act) döngüsü çerçevesinde haftalık gözden geçirmelerde denetlenmelidir.', 20, noteY + 11);
      doc.text('Öncelik değeri "Kritik" ve "Yüksek" olan işler gecikme durumunda doğrudan üst yönetime raporlanır.', 20, noteY + 15);

    } catch (e) {
      this.drawErrorFallback(doc, 'Aksiyon Plani', e, 50, fontName);
    }
  }

  /**
   * 11. CONCLUSION & SIGN-OFF
   */
  public static drawConclusion(doc: jsPDF, data: ReportData, fontName: string = 'Roboto') {
    try {
      this.drawSectionHeader(doc, '9. SONUÇ VE YATIRIM DÖNÜŞ DEĞERLENDİRMESİ', 'Rapor nihai değerlendirmesi ve onay imzaları', 25, fontName);

      const turnoverText = data.operation.turnoverLira || '150.000.000';
      const turnoverVal = Number(turnoverText.replace(/\./g, '')) || 150000000;
      const copqPool = Math.round(turnoverVal * 0.10);
      const overallScore = data.assessment.overallScore || 0;

      // Big outcome dashboard card
      doc.setFillColor(this.themePrimary);
      doc.rect(15, 50, 180, 50, 'F');
      
      // Teal border accent inside card
      doc.setDrawColor(this.themeAccent);
      doc.setLineWidth(1);
      doc.rect(18, 53, 174, 44, 'D');

      doc.setFont(fontName, 'bold');
      doc.setFontSize(13);
      doc.setTextColor('#FFFFFF');
      doc.text('SİMÜLASYON NİHAİ KAZANIM ANALİZİ', 25, 63);

      doc.setFont(fontName, 'normal');
      doc.setFontSize(9);
      doc.setTextColor('#CBD5E1');
      doc.text('Hesaplanan toplam israf havuzu ve yalın iyileşme potansiyeli:', 25, 71);

      // Value metrics inside big card
      doc.setFont(fontName, 'bold');
      doc.setFontSize(10);
      doc.setTextColor('#FFFFFF');
      doc.text('Toplam COPQ Kaybı:', 25, 83);
      doc.text('Beklenen Yıllık Kazanç (op3):', 25, 91);

      doc.setFont(fontName, 'bold');
      doc.setFontSize(13);
      doc.setTextColor('#FDA4AF'); // soft red/rose
      doc.text(`${copqPool.toLocaleString('tr-TR')} ₺/Yıl`, 85, 83);
      
      doc.setTextColor('#6EE7B7'); // soft light emerald
      const estSaving = Math.round(copqPool * 0.22);
      doc.text(`${estSaving.toLocaleString('tr-TR')} ₺/Yıl`, 85, 91);

      // Closing text
      let yPos = 115;
      doc.setFont(fontName, 'bold');
      doc.setFontSize(11);
      doc.setTextColor(this.themePrimary);
      doc.text('BAŞ DANIŞMAN NİHAİ SÖZÜ', 15, yPos);
      
      doc.setDrawColor('#E2E8F0');
      doc.line(15, yPos + 2, 195, yPos + 2);
      yPos += 8;

      doc.setFont(fontName, 'normal');
      doc.setFontSize(8.8);
      doc.setTextColor('#334155');

      const closingText = `Yapılan 1 günlük detaylı Gemba saha turu ve operasyonel veriler ışığında, ${data.company.companyName} bünyesinde gizli kalmış yüksek bir kârlılık potansiyeli tescillenmiştir. Mevcut %${overallScore} yalın skor, operasyonlardaki iyileşme iştahını göstermekte olup, planlı adımlarla ciro kârlılığını doğrudan artırabilecek enstrümanlar mevcuttur.

Gemba Digital olarak, sahada tespit edilen SMED ve 5S fırsatlarının hayata geçirilmesi sürecini yakından izlemeyi ve her aşamada üst düzey danışmanlık hizmetlerimizle işletmenizin kârlılığını taahhüt edilen ROI oranlarına taşımayı hedefliyoruz. Bu rapor, sürdürülebilir büyüme yolculuğunuzda önemli bir mihenk taşıdır.`;

      const splitClose = doc.splitTextToSize(closingText, 180);
      doc.text(splitClose, 15, yPos);
      yPos += splitClose.length * 4.5 + 22;

      // Sign-off signature fields
      if (yPos + 40 > 280) {
        doc.addPage();
        yPos = 40;
      }

      doc.setFont(fontName, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(this.themePrimary);
      doc.text('RAPOR ONAY VE İMZA MERKEZİ', 15, yPos);
      yPos += 5;

      doc.setDrawColor('#CBD5E1');
      doc.setLineWidth(0.5);
      doc.line(15, yPos, 195, yPos);
      yPos += 15;

      // Draw three signature lines
      const sigs = [
        { role: 'HAZIRLAYAN / BAŞ DANIŞMAN', name: data.company.consultant || 'Gemba Digital Danışmanı' },
        { role: 'ÜRETİM / OPERASYON DİREKTÖRÜ', name: 'Saha Yetkilisi / Müdür' },
        { role: 'GENEL MÜDÜR / ONAY', name: 'Şirket Temsilcisi / GM' }
      ];

      sigs.forEach((sig, idx) => {
        const x = 15 + idx * 62;
        doc.setDrawColor('#94A3B8');
        doc.setLineWidth(0.5);
        doc.line(x, yPos, x + 50, yPos);

        doc.setFont(fontName, 'bold');
        doc.setFontSize(8);
        doc.setTextColor(this.themePrimary);
        doc.text(sig.role, x, yPos + 4);

        doc.setFont(fontName, 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(this.themeSecondary);
        doc.text(sig.name, x, yPos + 8);
      });

    } catch (e) {
      this.drawErrorFallback(doc, 'Sonuc Sayfasi', e, 50, fontName);
    }
  }
}
