import { Company, Assessment, OperationData, Observation, SavingResult } from '../../db';
import type { QlaResult } from '../../engine/qla';

/** Uygulamanın o an ekranda gösterdiği hesap sonuçları — rapordaki tüm rakamlar buradan gelir */
export interface ReportMetrics {
  qla: QlaResult;
  currency: string;
  turnover: number;
  /** Maliyet yapısındaki kâr payı (% ciro); 0 = bilinmiyor */
  profitPct?: number;
  maturityScore: number;
  answeredCount: number;
  /** Olgunluk değerlendirmesinden çıkan, en zayıf kriterlere ait bulgular */
  findings: { no: number; score: number; title: string; obs: string; finImpact: string; leanTool: string }[];
}

export interface ReportData {
  company: Company;
  assessment: Assessment;
  operation: OperationData;
  observations: Observation[];
  savings: SavingResult[];
  aiAnalysis: {
    generalEvaluation: string;
    criticalRisks: string[];
    opportunities: string[];
    quickWins: string[];
    mediumTermProjects: string[];
    longTermProjects: string[];
    rawMarkdown?: string;
  };
  metrics?: ReportMetrics;
  validationErrors: string[];
}
