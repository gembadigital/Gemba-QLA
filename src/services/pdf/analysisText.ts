// Rapor metinleri (genel değerlendirme, riskler, fırsatlar, yol haritası) — yalnızca girilmiş veriden
// ve uygulamanın hesabından kurulur. Veritabanına bağımlı değildir; test edilebilir.
import type { Company, OperationData } from '../../db';
import { ReportData, ReportMetrics } from './types';
import { ACTION_BY_LOSS } from './reportConfig';
import { moneyShort, unitOf } from './draw';

/**
 * Tries to find an existing AI report in the chatMessages.
 * If none exists or is short, programmatically generates a professional,
 * detailed deterministic AI analysis based on their specific operational metrics.
 */
export function buildAnalysisText(op: OperationData, comp: Company, m?: ReportMetrics): ReportData['aiAnalysis'] {
  // Look for a markdown assessment report in chat history (Assistant message containing ## headers)
  const chatMsgs = op.chatMessages || [];
  let foundReportMsg = '';
  
  for (let i = chatMsgs.length - 1; i >= 0; i--) {
    const msg = chatMsgs[i];
    if (msg.role === 'assistant' && msg.content && (msg.content.includes('## 1.') || msg.content.includes('POTANSYEL KAYIP'))) {
      foundReportMsg = msg.content;
      break;
    }
  }

  // Default structure template
  const analysis: ReportData['aiAnalysis'] = {
    generalEvaluation: '',
    criticalRisks: [],
    opportunities: [],
    quickWins: [],
    mediumTermProjects: [],
    longTermProjects: [],
    rawMarkdown: foundReportMsg || undefined
  };

  // Metinler yalnızca girilmiş verilerden ve uygulamanın hesabından kurulur (demo rakam yok)
  const num = (v: any) => Number(String(v ?? '').replace(/\./g, '').replace(',', '.')) || 0;
  const oeeVal = num(op.oee);
  const actualEff = num(op.actualEfficiency);
  const plannedEff = num(op.plannedEfficiency);
  const unit = unitOf(m?.currency || 'TRY');
  const q = m?.qla;
  const sentences: string[] = [];
  sentences.push(`${comp.companyName || 'Firma'}${comp.sector ? `, ${comp.sector} sektöründe` : ''} gerçekleştirilen saha incelemesinde önemli iyileşme fırsatları tespit edilmiştir.`);
  if (q && q.totalLoss > 0) sentences.push(`Firmanın maliyet yapısı ve saha verileri üzerinden hesaplanan yıllık kayıp havuzu ${moneyShort(q.totalLoss, unit)} olup cironun %${q.lossPctOfTurnover.toLocaleString('tr-TR')}'ine karşılık gelmektedir.`);
  if (oeeVal > 0) sentences.push(`Beyan edilen OEE %${oeeVal} seviyesinde olup dünya standardı olan %85'in gerisindedir.`);
  if (plannedEff > 0 && actualEff > 0 && actualEff < plannedEff) sentences.push(`Planlanan verimlilik %${plannedEff} iken gerçekleşen verimliliğin %${actualEff} seviyesinde kalması, iş gücü planlama ve süreç standartlaştırmada iyileştirme alanına işaret etmektedir.`);
  analysis.generalEvaluation = sentences.join(' ');

  if (q) {
    const losses = [...q.losses].filter(l => l.amount > 0).sort((x, y) => y.amount - x.amount);
    analysis.criticalRisks = losses.slice(0, 4).map(l => `${l.label}: yıllık ${moneyShort(l.amount, unit)} kayıp.`);
    analysis.opportunities = [...q.opportunities].filter(o => o.gainMax > 0).sort((x, y) => y.gainMax - x.gainMax).slice(0, 4)
      .map(o => `${o.tool}: ${o.label.toLocaleLowerCase('tr-TR')} kaleminde yıllık ${moneyShort(o.gainMin, unit)} – ${moneyShort(o.gainMax, unit)} geri kazanım.`);
    const acts = losses.map(l => ACTION_BY_LOSS[l.key]).filter(Boolean);
    analysis.quickWins = acts.slice(0, 3).map(a => `${a.act}: ${a.desc}`);
    analysis.mediumTermProjects = [
      `${q.selected.def.name} (${q.selected.def.days} adam-gün) kapsamında pilot alanda ${q.selected.def.focus.toLocaleLowerCase('tr-TR')} çalışmaları.`,
      ...acts.slice(3, 5).map(a => `${a.act}: ${a.desc}`),
    ];
    analysis.longTermProjects = [
      'Kazanımların standart iş ve görsel yönetimle tüm hatlara yaygınlaştırılması.',
      'Aylık yönetim gözden geçirmesi ile kayıp kalemlerinin KPI olarak izlenmesi.',
      'Saha liderlerinin problem çözme yetkinliğinin geliştirilmesi (sürekli iyileştirme kültürü).',
    ];
  } else {
    analysis.criticalRisks = ['Kayıp hesabı için operasyonel veri girilmemiştir.'];
    analysis.opportunities = [];
    analysis.quickWins = [];
    analysis.mediumTermProjects = [];
    analysis.longTermProjects = [];
  }

  // If an existing Markdown report is found in chat logs, let's parse elements to enrich our structures!
  if (foundReportMsg) {
    // Small parser to extract headings and clean lines
    const lines = foundReportMsg.split('\n');
    let currentSection = '';
    let bulletBuffer: string[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('## 1.') || trimmed.includes('SAHA TESPİTİ')) {
        currentSection = 'general';
      } else if (trimmed.startsWith('## 2.') || trimmed.includes('YALIN ÇALIŞMA')) {
        currentSection = 'opportunities';
      } else if (trimmed.startsWith('## 3.') || trimmed.includes('BENCHMARK') || trimmed.includes('STRATEJİSİ')) {
        currentSection = 'benchmark';
      }

      // Parse list items
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const content = trimmed.substring(2).replace(/\*\*/g, '').trim();
        if (currentSection === 'opportunities' || currentSection === 'benchmark') {
          bulletBuffer.push(content);
        }
      }
    });

    // If we parsed some real bullet points from Gemini, merge them!
    if (bulletBuffer.length > 0) {
      analysis.opportunities = [...new Set([...bulletBuffer.slice(0, 5), ...analysis.opportunities])];
    }
  }

  return analysis;
}
