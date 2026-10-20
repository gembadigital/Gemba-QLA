import { jsPDF } from 'jspdf';
import { ReportData } from './types';
import { SectionRenderer, TocMap } from './SectionRenderer';
import { loadUnicodeFonts } from './fontLoader';
import { Ctx, pageFooter } from './draw';
import { REPORT } from './reportConfig';

/** Logo dosyasını data URI olarak yükler (yüklenemezse metin logo kullanılır) */
async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch(REPORT.logo.path);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise(resolve => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export class ReportGenerator {
  /**
   * Yönetici raporu — A4 yatay, Gemba Tools yönetici raporu tasarım dili.
   * Sayfa sırası eski raporla aynı; saha bulguları ve aksiyon planı uzunsa devam sayfası açılır.
   */
  public static async generateReport(data: ReportData): Promise<jsPDF> {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', putOnlyUsedFonts: true, floatPrecision: 16 });
    const fontsLoaded = await loadUnicodeFonts(doc);
    const c: Ctx = { doc, font: fontsLoaded ? 'Roboto' : 'helvetica', logo: await loadLogo() };
    doc.setFont(c.font, 'normal');

    const reportNo = `QLA-${(data.company.visitDate || new Date().toISOString()).slice(2, 10).replace(/-/g, '')}`;
    const toc: TocMap = {};
    const page = () => doc.getNumberOfPages();
    const next = () => doc.addPage('a4', 'landscape');
    const section = (key: string, draw: () => void) => {
      next();
      toc[key] = page();
      try {
        draw();
      } catch (e) {
        console.error(`Rapor bölümü çizilemedi: ${key}`, e);
      }
    };

    SectionRenderer.cover(c, data, reportNo);
    next(); // içindekiler — sayfa numaraları belli olunca çizilir
    section('exec', () => SectionRenderer.executive(c, data));
    section('profile', () => SectionRenderer.profile(c, data));
    section('ops', () => SectionRenderer.operations(c, data));
    section('lean', () => SectionRenderer.lean(c, data));
    section('obs', () => SectionRenderer.observations(c, data, next));
    section('savings', () => SectionRenderer.savings(c, data));
    section('ai', () => SectionRenderer.strategy(c, data));
    section('plan', () => SectionRenderer.actionPlan(c, data, next));
    section('end', () => SectionRenderer.conclusion(c, data));

    doc.setPage(2);
    SectionRenderer.toc(c, toc);

    const footerLeft = `${data.company.companyName || 'Firma'} · ${REPORT.report.footerName} · No ${reportNo}`;
    const total = doc.getNumberOfPages();
    for (let i = 2; i <= total; i++) {
      doc.setPage(i);
      pageFooter(c, footerLeft, i);
    }
    return doc;
  }
}
