import { GembaDB, Company, Assessment, OperationData, Observation, SavingResult } from '../../db';
import { ReportData, ReportMetrics } from './types';
import { buildAnalysisText } from './analysisText';

export class ReportBuilder {
  /**
   * Fetches all records from the relational tables for the given companyId.
   * Compiles them into a single, validated ReportData object.
   */
  public static buildReportData(companyId: string, metrics?: ReportMetrics): ReportData {
    const validationErrors: string[] = [];

    // 1. Fetch Company details from database layer
    const details = GembaDB.getCompanyDetails(companyId);
    
    if (!details) {
      throw new Error(`Firma bulunamadı: ID ${companyId}`);
    }

    const company: Company = details.company;
    
    // Check missing fields in Company
    if (!company.companyName || company.companyName.trim() === '') {
      validationErrors.push('Firma adı boş bırakılamaz.');
    }
    if (!company.sector || company.sector.trim() === '') {
      validationErrors.push('Sektör bilgisi eksik.');
    }
    if (!company.visitDate) {
      validationErrors.push('Ziyaret tarihi belirtilmemiş.');
    }

    // 2. Fetch Assessment or create fallback default
    let assessment: Assessment = details.assessment || {
      assessmentId: 'temp',
      companyId: companyId,
      overallScore: 0,
      potentialSaving: 0,
      investmentNeed: 0,
      paybackPeriod: 0,
      notes: 'Değerlendirme notu girilmemiştir.',
      createdDate: new Date().toISOString()
    };

    // 3. Fetch Operation Data or create fallback default
    let operation: OperationData = details.operation || {
      companyId: companyId,
      setupMachineCount: '0',
      annualVolume: '0',
      productionUnit: 'Adet',
      turnoverLira: '0',
      plannedEfficiency: '0',
      actualEfficiency: '0',
      copqRate: '0',
      scrapRate: '0',
      reworkRate: '0',
      overtimeRate: '0',
      leadTime: '0',
      oee: '0',
      coveredArea: '0',
      operatorsCount: '0',
      setupFrequency: '0',
      setupDuration: '0',
      affectedOpsSetup: '0',
      grossLaborCost: '0',
      wizardGrossSalary: '0',
      wizardSgkRate: 0,
      wizardYemek: '0',
      wizardServis: '0',
      wizardSeveranceRate: 0,
      wizardLeaveRate: 0,
      wizardSideBenefits: '0',
      costPropMaterial: '0',
      costPropLabor: '0',
      costPropEnergy: '0',
      costPropMaintenance: '0',
      costPropOverhead: '0',
      costPropProfit: '0',
      scores: {},
      chatMessages: []
    };

    // 4. Fetch Observations & Savings
    const observations: Observation[] = details.observations || [];
    const savings: SavingResult[] = details.savings || [];

    if (observations.length === 0) {
      validationErrors.push('Bilgilendirme: Sahaya ait görsel bulgu/gözlem girilmemiştir.');
    }
    if (savings.length === 0) {
      validationErrors.push('Bilgilendirme: Potansiyel finansal iyileştirme/kazanım kaydı bulunmamaktadır.');
    }

    // 5. Build/Extract AI Analysis
    const aiAnalysis = buildAnalysisText(operation, company, metrics);

    return {
      company,
      assessment,
      operation,
      observations,
      savings,
      aiAnalysis,
      metrics,
      validationErrors
    };
  }
}
