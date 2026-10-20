// Gemba QLA Relational Hybrid Local & Supabase Cloud Database
// Implements a normalized relational structure linked by CompanyID (Foreign Key)
import { getSupabase, isSupabaseConfigured, saveSupabaseCredentials, getSupabaseConfig } from './lib/supabase';

export interface Company {
  companyId: string; // UUID
  companyName: string;
  sector: string;
  location: string;
  consultant: string;
  visitDate: string;
  status: 'Draft' | 'Active' | 'Completed' | 'Archived';
  createdDate: string;
  updatedDate: string;
}

export interface Assessment {
  assessmentId: string;
  companyId: string;
  overallScore: number;
  potentialSaving: number;
  investmentNeed: number;
  paybackPeriod: number;
  notes: string;
  createdDate: string;
}

export interface OperationData {
  companyId: string;
  currency?: string;
  // Field values
  setupMachineCount: string;
  annualVolume: string;
  productionUnit: string;
  turnoverLira: string;
  plannedEfficiency: string;
  actualEfficiency: string;
  copqRate: string;
  scrapRate: string;
  reworkRate: string;
  overtimeRate: string;
  leadTime: string;
  stockUnits?: string;
  stockValue?: string;
  setupTimePct?: string;
  breakdownPct?: string;
  planRealizationPct?: string;
  sustainYears?: string;
  oee: string;
  coveredArea: string;
  operatorsCount: string;
  setupFrequency: string;
  setupDuration: string;
  affectedOpsSetup: string;
  grossLaborCost: string;

  // Wizard state
  wizardGrossSalary: string;
  wizardSgkRate: number;
  wizardYemek: string;
  wizardServis: string;
  wizardSeveranceRate: number;
  wizardLeaveRate: number;
  wizardSideBenefits: string;

  // Cost proportions
  costPropMaterial: string;
  costPropLabor: string;
  costPropEnergy: string;
  costPropMaintenance: string;
  costPropOverhead: string;
  costPropProfit: string;

  // Additional company metadata
  urunGrubu?: string;
  calisanSayisi?: string;
  vardiya?: string;
  gorusulen?: string;
  talepEdilenHizmet?: string;

  // Scores Record
  scores: Record<number, number>;
  // Chat messages
  chatMessages: { role: 'user' | 'assistant'; content: string }[];
}

export interface Observation {
  observationId: string;
  companyId: string;
  category: string;
  finding: string;
  improvement: string;
  photo?: string;
  priority: string; // 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik'
  impact: string; // 'Düşük' | 'Orta' | 'Yüksek'
  createdDate: string;
}

export interface SavingResult {
  savingId: string;
  companyId: string;
  savingType: string;
  currentCost: number;
  futureCost: number;
  annualSaving: number;
  roi: number;
  payback: number;
  createdDate: string;
}

// UUID Helper
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Memory-backed fallback for sandboxed environments (like sandboxed iframes) where localStorage is blocked
let memoryStorage: Record<string, string> = {};

// Helper to safely check if localStorage is available and functional
const isLocalStorageAvailable = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

const hasLocalStorage = isLocalStorageAvailable();

export const safeStorage = {
  getItem(key: string): string | null {
    if (hasLocalStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        return memoryStorage[key] || null;
      }
    }
    return memoryStorage[key] || null;
  },
  setItem(key: string, value: string): void {
    if (hasLocalStorage) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch (e) {}
    }
    memoryStorage[key] = value;
  },
  removeItem(key: string): void {
    if (hasLocalStorage) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch (e) {}
    }
    delete memoryStorage[key];
  },
  clear(): void {
    if (hasLocalStorage) {
      try {
        window.localStorage.clear();
        return;
      } catch (e) {}
    }
    memoryStorage = {};
  }
};

const localStorage = safeStorage;

const KEYS = {
  COMPANIES: 'gp_tbl_companies',
  ASSESSMENTS: 'gp_tbl_assessments',
  OPERATIONS: 'gp_tbl_operations',
  OBSERVATIONS: 'gp_tbl_observations',
  SAVINGS: 'gp_tbl_savings',
};

// Seed initial data if database is empty
export function seedInitialDatabase() {
  const companies = localStorage.getItem(KEYS.COMPANIES);
  if (!companies || JSON.parse(companies).length === 0) {
    const demoCompanyId = 'demo-company-id-1234';
    const visitDate = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    const demoCompany: Company = {
      companyId: demoCompanyId,
      companyName: 'Örnek Plastik ve Ambalaj A.Ş.',
      sector: 'Plastik Enjeksiyon',
      location: 'Kocaeli OSB',
      consultant: 'Ahmet Yılmaz',
      visitDate: visitDate,
      status: 'Active',
      createdDate: now,
      updatedDate: now,
    };

    const demoAssessment: Assessment = {
      assessmentId: generateUUID(),
      companyId: demoCompanyId,
      overallScore: 42,
      potentialSaving: 15000000,
      investmentNeed: 1200000,
      paybackPeriod: 3,
      notes: 'Plastik enjeksiyon üretiminde OEE arttırma ve SMED çalışması öncelikli geliştirme alanıdır.',
      createdDate: now,
    };

    const defaultScores: Record<number, number> = {};
    for (let i = 1; i <= 17; i++) {
      defaultScores[i] = i % 4 === 0 ? 3 : i % 3 === 0 ? 2 : i % 2 === 0 ? 1 : 0;
    }

    const demoOperation: OperationData = {
      companyId: demoCompanyId,
      setupMachineCount: '5',
      annualVolume: '500.000',
      productionUnit: 'Adet',
      turnoverLira: '150.000.000',
      plannedEfficiency: '85',
      actualEfficiency: '62',
      copqRate: '4.5',
      scrapRate: '1.8',
      reworkRate: '2.7',
      overtimeRate: '8.5',
      leadTime: '12',
      oee: '58',
      coveredArea: '4.500',
      operatorsCount: '120',
      setupFrequency: '5',
      setupDuration: '45',
      affectedOpsSetup: '3',
      grossLaborCost: '48.000',
      wizardGrossSalary: '30.000',
      wizardSgkRate: 17.5,
      wizardYemek: '4.500',
      wizardServis: '3.500',
      wizardSeveranceRate: 8.33,
      wizardLeaveRate: 5.0,
      wizardSideBenefits: '2.000',
      costPropMaterial: '50',
      costPropLabor: '20',
      costPropEnergy: '10',
      costPropMaintenance: '10',
      costPropOverhead: '10',
      costPropProfit: '10',
      scores: defaultScores,
      chatMessages: [
        {
          role: 'assistant',
          content: 'Merhaba! Ben Gemba Digital Yapay Zeka Baş Danışmanınızım. Sorularınızı bekliyorum!'
        }
      ],
    };

    const demoObservations: Observation[] = [
      {
        observationId: generateUUID(),
        companyId: demoCompanyId,
        category: 'SMED / Kalıp Kurulumu',
        finding: 'Model değişimlerinde kalıpların ön ısıtma yapılmadan makineye takıldığı ve bu yüzden ilk 5 baskının hurdaya çıktığı gözlemlendi.',
        improvement: 'Dış kurulum mantığıyla kalıpların ön ısıtma istasyonunda ısıtılması ve hızlı bağlantı elemanlarının (q-clamps) entegrasyonu.',
        priority: 'Yüksek',
        impact: 'Yüksek',
        createdDate: now,
      },
      {
        observationId: generateUUID(),
        companyId: demoCompanyId,
        category: '5S ve Görsel Yönetim',
        finding: 'Kalıp değişim el aletlerinin yerinde olmadığı, operatörlerin anahtar ararken zaman kaybettiği tespit edildi.',
        improvement: 'Gölge pano uygulaması ve el aletlerinin model değişim arabasına standart yerleşimi.',
        priority: 'Orta',
        impact: 'Orta',
        createdDate: now,
      }
    ];

    const demoSavings: SavingResult[] = [
      {
        savingId: generateUUID(),
        companyId: demoCompanyId,
        savingType: 'Downtime Setup Geri Kazanımı',
        currentCost: 1500000,
        futureCost: 750000,
        annualSaving: 750000,
        roi: 6.5,
        payback: 2,
        createdDate: now,
      }
    ];

    localStorage.setItem(KEYS.COMPANIES, JSON.stringify([demoCompany]));
    localStorage.setItem(KEYS.ASSESSMENTS, JSON.stringify([demoAssessment]));
    localStorage.setItem(KEYS.OPERATIONS, JSON.stringify([demoOperation]));
    localStorage.setItem(KEYS.OBSERVATIONS, JSON.stringify(demoObservations));
    localStorage.setItem(KEYS.SAVINGS, JSON.stringify(demoSavings));
  }
}

// Database Operations
export const GembaDB = {
  // Get all companies from local storage
  getCompanies(includeArchived: boolean = false): Company[] {
    seedInitialDatabase();
    try {
      const data = localStorage.getItem(KEYS.COMPANIES);
      if (!data) return [];
      const list: Company[] = JSON.parse(data);
      if (!includeArchived) {
        return list.filter(c => c.status !== 'Archived');
      }
      return list;
    } catch (e) {
      console.error('Error reading companies', e);
      return [];
    }
  },

  // ─── BI-DIRECTIONAL CLOUD SYNC METHODS FOR TABLET & PC ───
  // ─── BI-DIRECTIONAL CLOUD SYNC METHODS FOR TABLET & PC ───
  async syncCompaniesFromCloud(): Promise<Company[]> {
    seedInitialDatabase();
    const client = getSupabase();
    if (!client) return this.getCompanies(true);

    try {
      // 1. Fetch Companies
      const { data: cloudCompData, error: compErr } = await client
        .from('companies')
        .select('*')
        .order('updated_at', { ascending: false });

      if (compErr) {
        console.warn('[Supabase Cloud Sync Error]', compErr.message);
        return this.getCompanies(true);
      }

      if (cloudCompData && Array.isArray(cloudCompData) && cloudCompData.length > 0) {
        const localCompanies = this.getCompanies(true);
        const cloudCompanies: Company[] = cloudCompData.map((row: any) => ({
          companyId: row.company_id,
          companyName: row.company_name,
          sector: row.sector || 'Genel İmalat',
          location: row.location || '',
          consultant: row.consultant || '',
          visitDate: row.visit_date || new Date().toISOString().split('T')[0],
          status: row.status || 'Active',
          createdDate: row.created_at || new Date().toISOString(),
          updatedDate: row.updated_at || new Date().toISOString()
        }));

        const mergedMap = new Map<string, Company>();
        localCompanies.forEach(c => mergedMap.set(c.companyId, c));
        cloudCompanies.forEach(c => mergedMap.set(c.companyId, c));

        const mergedList = Array.from(mergedMap.values());
        localStorage.setItem(KEYS.COMPANIES, JSON.stringify(mergedList));

        // 2. Fetch All Operation Data (relational payload)
        const { data: allOps } = await client.from('operation_data').select('*');
        if (allOps && Array.isArray(allOps) && allOps.length > 0) {
          const localOps: OperationData[] = JSON.parse(localStorage.getItem(KEYS.OPERATIONS) || '[]');
          const opMap = new Map<string, OperationData>();
          localOps.forEach(o => opMap.set(o.companyId, o));
          allOps.forEach((row: any) => {
            if (row.company_id && row.data_json) {
              opMap.set(row.company_id, { ...row.data_json, companyId: row.company_id });
            }
          });
          localStorage.setItem(KEYS.OPERATIONS, JSON.stringify(Array.from(opMap.values())));
        }

        // 3. Fetch All Assessments
        const { data: allAssess } = await client.from('assessments').select('*');
        if (allAssess && Array.isArray(allAssess) && allAssess.length > 0) {
          const localAssess: Assessment[] = JSON.parse(localStorage.getItem(KEYS.ASSESSMENTS) || '[]');
          const asMap = new Map<string, Assessment>();
          localAssess.forEach(a => asMap.set(a.companyId, a));
          allAssess.forEach((row: any) => {
            if (row.company_id) {
              asMap.set(row.company_id, {
                assessmentId: row.assessment_id || generateUUID(),
                companyId: row.company_id,
                overallScore: row.overall_score || 0,
                potentialSaving: row.potential_saving || 0,
                investmentNeed: row.investment_need || 0,
                paybackPeriod: row.payback_period || 0,
                notes: row.notes || '',
                createdDate: row.created_at || new Date().toISOString()
              });
            }
          });
          localStorage.setItem(KEYS.ASSESSMENTS, JSON.stringify(Array.from(asMap.values())));
        }

        // 4. Fetch All Observations
        const { data: allObs } = await client.from('observations').select('*');
        if (allObs && Array.isArray(allObs) && allObs.length > 0) {
          const fetchedObs: Observation[] = allObs.map((row: any) => ({
            observationId: row.observation_id,
            companyId: row.company_id,
            category: row.category || 'Genel',
            finding: row.finding || '',
            improvement: row.improvement || '',
            priority: row.priority || 'Orta',
            impact: row.impact || 'Orta',
            photo: row.photo || undefined,
            createdDate: row.created_at || new Date().toISOString()
          }));
          localStorage.setItem(KEYS.OBSERVATIONS, JSON.stringify(fetchedObs));
        }

        return mergedList;
      }
    } catch (e) {
      console.warn('[Supabase Fetch Exception]', e);
    }

    return this.getCompanies(true);
  },

  async syncCompanyDetailsFromCloud(companyId: string): Promise<boolean> {
    const client = getSupabase();
    if (!client || !companyId) return false;

    try {
      // 1. Operation Data & JSON state
      const { data: opData } = await client
        .from('operation_data')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (opData && opData.data_json) {
        const operations: OperationData[] = JSON.parse(localStorage.getItem(KEYS.OPERATIONS) || '[]');
        const idx = operations.findIndex(o => o.companyId === companyId);
        const fullOp = { ...opData.data_json, companyId };
        if (idx > -1) {
          operations[idx] = fullOp;
        } else {
          operations.push(fullOp);
        }
        localStorage.setItem(KEYS.OPERATIONS, JSON.stringify(operations));
      }

      // 2. Assessments
      const { data: asData } = await client
        .from('assessments')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (asData) {
        const assessments: Assessment[] = JSON.parse(localStorage.getItem(KEYS.ASSESSMENTS) || '[]');
        const idx = assessments.findIndex(a => a.companyId === companyId);
        const mapped: Assessment = {
          assessmentId: asData.assessment_id || generateUUID(),
          companyId,
          overallScore: asData.overall_score || 0,
          potentialSaving: asData.potential_saving || 0,
          investmentNeed: asData.investment_need || 0,
          paybackPeriod: asData.payback_period || 0,
          notes: asData.notes || '',
          createdDate: asData.created_at || new Date().toISOString()
        };
        if (idx > -1) assessments[idx] = mapped;
        else assessments.push(mapped);
        localStorage.setItem(KEYS.ASSESSMENTS, JSON.stringify(assessments));
      }

      // 3. Observations
      const { data: obsData } = await client
        .from('observations')
        .select('*')
        .eq('company_id', companyId);

      if (obsData && Array.isArray(obsData)) {
        const allObs: Observation[] = JSON.parse(localStorage.getItem(KEYS.OBSERVATIONS) || '[]');
        const otherObs = allObs.filter(o => o.companyId !== companyId);
        const fetchedObs: Observation[] = obsData.map((row: any) => ({
          observationId: row.observation_id,
          companyId: row.company_id,
          category: row.category || 'Genel',
          finding: row.finding || '',
          improvement: row.improvement || '',
          priority: row.priority || 'Orta',
          impact: row.impact || 'Orta',
          photo: row.photo || undefined,
          createdDate: row.created_at || new Date().toISOString()
        }));
        otherObs.push(...fetchedObs);
        localStorage.setItem(KEYS.OBSERVATIONS, JSON.stringify(otherObs));
      }

      return true;
    } catch (e) {
      console.warn('[Cloud Sync Details Exception]', e);
      return false;
    }
  },

  // Save/Update a company record
  saveCompanyRecord(company: Company): void {
    try {
      const companies = this.getCompanies(true);
      const idx = companies.findIndex(c => c.companyId === company.companyId);
      if (idx > -1) {
        companies[idx] = { ...company, updatedDate: new Date().toISOString() };
      } else {
        companies.push(company);
      }
      localStorage.setItem(KEYS.COMPANIES, JSON.stringify(companies));

      const client = getSupabase();
      if (client) {
        client.from('companies').upsert({
          company_id: company.companyId,
          company_name: company.companyName,
          sector: company.sector,
          location: company.location,
          consultant: company.consultant,
          visit_date: company.visitDate,
          status: company.status,
          updated_at: new Date().toISOString()
        }).then(({ error }) => {
          if (error) console.warn('[Supabase Sync Company Error]', error.message);
        });
      }
    } catch (e) {
      console.error('Error saving company', e);
    }
  },

  // Get single company full payload
  getCompanyDetails(companyId: string): {
    company: Company;
    assessment: Assessment | null;
    operation: OperationData | null;
    observations: Observation[];
    savings: SavingResult[];
  } | null {
    try {
      const companies = this.getCompanies(true);
      const company = companies.find(c => c.companyId === companyId);
      if (!company) return null;

      const assessments: Assessment[] = JSON.parse(localStorage.getItem(KEYS.ASSESSMENTS) || '[]');
      const operations: OperationData[] = JSON.parse(localStorage.getItem(KEYS.OPERATIONS) || '[]');
      const observations: Observation[] = JSON.parse(localStorage.getItem(KEYS.OBSERVATIONS) || '[]');
      const savings: SavingResult[] = JSON.parse(localStorage.getItem(KEYS.SAVINGS) || '[]');

      const assessment = assessments.find(a => a.companyId === companyId) || null;
      const operation = operations.find(o => o.companyId === companyId) || null;
      const compObservations = observations.filter(o => o.companyId === companyId);
      const compSavings = savings.filter(s => s.companyId === companyId);

      return {
        company,
        assessment,
        operation,
        observations: compObservations,
        savings: compSavings
      };
    } catch (e) {
      console.error('Error loading company details', e);
      return null;
    }
  },

  // Create new company
  createCompany(companyName: string, sector: string = 'Genel İmalat', location: string = '', consultant: string = ''): Company {
    const companyId = generateUUID();
    const now = new Date().toISOString();
    const visitDate = now.split('T')[0];

    const newCompany: Company = {
      companyId,
      companyName: companyName || 'Yeni Saha Çalışması',
      sector: sector || 'Genel İmalat',
      location: location || '',
      consultant: consultant || 'Saha Danışmanı',
      visitDate: visitDate,
      status: 'Active',
      createdDate: now,
      updatedDate: now,
    };

    const newAssessment: Assessment = {
      assessmentId: generateUUID(),
      companyId,
      overallScore: 0,
      potentialSaving: 0,
      investmentNeed: 0,
      paybackPeriod: 0,
      notes: '',
      createdDate: now,
    };

    const defaultScores: Record<number, number> = {};
    for (let i = 1; i <= 17; i++) {
      defaultScores[i] = 0;
    }

    const newOperation: OperationData = {
      companyId,
      setupMachineCount: '',
      annualVolume: '',
      productionUnit: 'Adet',
      turnoverLira: '',
      plannedEfficiency: '',
      actualEfficiency: '',
      copqRate: '',
      scrapRate: '',
      reworkRate: '',
      overtimeRate: '',
      leadTime: '',
      oee: '',
      coveredArea: '',
      operatorsCount: '',
      setupFrequency: '',
      setupDuration: '',
      affectedOpsSetup: '',
      grossLaborCost: '',
      wizardGrossSalary: '30.000',
      wizardSgkRate: 17.5,
      wizardYemek: '4.500',
      wizardServis: '3.500',
      wizardSeveranceRate: 8.33,
      wizardLeaveRate: 5.0,
      wizardSideBenefits: '2.000',
      costPropMaterial: '',
      costPropLabor: '',
      costPropEnergy: '',
      costPropMaintenance: '',
      costPropOverhead: '',
      costPropProfit: '10',
      urunGrubu: sector || 'Genel İmalat',
      calisanSayisi: '150',
      vardiya: '3 Vardiya (24 Saat)',
      gorusulen: '',
      talepEdilenHizmet: 'Yalın Dönüşüm Proje Danışmanlığı',
      scores: defaultScores,
      chatMessages: [
        {
          role: 'assistant',
          content: 'Merhaba! Ben Gemba Digital Yapay Zeka Baş Danışmanınızım. Sorularınızı bekliyorum!'
        }
      ],
    };

    // Save locally
    this.saveCompanyRecord(newCompany);

    const assessments: Assessment[] = JSON.parse(localStorage.getItem(KEYS.ASSESSMENTS) || '[]');
    assessments.push(newAssessment);
    localStorage.setItem(KEYS.ASSESSMENTS, JSON.stringify(assessments));

    const operations: OperationData[] = JSON.parse(localStorage.getItem(KEYS.OPERATIONS) || '[]');
    operations.push(newOperation);
    localStorage.setItem(KEYS.OPERATIONS, JSON.stringify(operations));

    // Save to Cloud
    const client = getSupabase();
    if (client) {
      client.from('operation_data').upsert({
        company_id: companyId,
        turnover_lira: newOperation.turnoverLira,
        copq_rate: newOperation.copqRate,
        oee: newOperation.oee,
        scrap_rate: newOperation.scrapRate,
        rework_rate: newOperation.reworkRate,
        overtime_rate: newOperation.overtimeRate,
        lead_time: newOperation.leadTime,
        covered_area: newOperation.coveredArea,
        operators_count: newOperation.operatorsCount,
        data_json: newOperation,
        created_at: now
      }).then(({ error }) => {
        if (error) console.warn('[Supabase Create Company Error]', error.message);
      });
    }

    return newCompany;
  },

  // Save full state of loaded company (Local + Supabase Cloud)
  saveFullState(
    companyId: string,
    companyFields: Partial<Company>,
    operationFields: Partial<OperationData>,
    assessmentFields: Partial<Assessment>
  ) {
    try {
      const now = new Date().toISOString();

      // 1. Company
      const companies = this.getCompanies(true);
      const cIdx = companies.findIndex(c => c.companyId === companyId);
      if (cIdx > -1) {
        companies[cIdx] = {
          ...companies[cIdx],
          ...companyFields,
          updatedDate: now
        };
        localStorage.setItem(KEYS.COMPANIES, JSON.stringify(companies));
      }

      // 2. OperationData
      const operations: OperationData[] = JSON.parse(localStorage.getItem(KEYS.OPERATIONS) || '[]');
      const oIdx = operations.findIndex(o => o.companyId === companyId);
      const existingOp = oIdx > -1 ? operations[oIdx] : null;

      const updatedOp: OperationData = {
        companyId,
        setupMachineCount: operationFields.setupMachineCount ?? existingOp?.setupMachineCount ?? '',
        annualVolume: operationFields.annualVolume ?? existingOp?.annualVolume ?? '',
        productionUnit: operationFields.productionUnit || existingOp?.productionUnit || 'Adet',
        turnoverLira: operationFields.turnoverLira ?? existingOp?.turnoverLira ?? '',
        plannedEfficiency: operationFields.plannedEfficiency ?? existingOp?.plannedEfficiency ?? '',
        actualEfficiency: operationFields.actualEfficiency ?? existingOp?.actualEfficiency ?? '',
        copqRate: operationFields.copqRate ?? existingOp?.copqRate ?? '',
        scrapRate: operationFields.scrapRate ?? existingOp?.scrapRate ?? '',
        reworkRate: operationFields.reworkRate ?? existingOp?.reworkRate ?? '',
        overtimeRate: operationFields.overtimeRate ?? existingOp?.overtimeRate ?? '',
        leadTime: operationFields.leadTime ?? existingOp?.leadTime ?? '',
        stockUnits: operationFields.stockUnits ?? existingOp?.stockUnits ?? '',
        stockValue: operationFields.stockValue ?? existingOp?.stockValue ?? '',
        setupTimePct: operationFields.setupTimePct ?? existingOp?.setupTimePct ?? '',
        breakdownPct: operationFields.breakdownPct ?? existingOp?.breakdownPct ?? '',
        planRealizationPct: operationFields.planRealizationPct ?? existingOp?.planRealizationPct ?? '',
        sustainYears: operationFields.sustainYears ?? existingOp?.sustainYears ?? '3',
        oee: operationFields.oee ?? existingOp?.oee ?? '',
        coveredArea: operationFields.coveredArea ?? existingOp?.coveredArea ?? '',
        operatorsCount: operationFields.operatorsCount ?? existingOp?.operatorsCount ?? '',
        setupFrequency: operationFields.setupFrequency ?? existingOp?.setupFrequency ?? '',
        setupDuration: operationFields.setupDuration ?? existingOp?.setupDuration ?? '',
        affectedOpsSetup: operationFields.affectedOpsSetup ?? existingOp?.affectedOpsSetup ?? '',
        grossLaborCost: operationFields.grossLaborCost ?? existingOp?.grossLaborCost ?? '',
        wizardGrossSalary: operationFields.wizardGrossSalary || existingOp?.wizardGrossSalary || '30.000',
        wizardSgkRate: operationFields.wizardSgkRate ?? existingOp?.wizardSgkRate ?? 17.5,
        wizardYemek: operationFields.wizardYemek || existingOp?.wizardYemek || '4.500',
        wizardServis: operationFields.wizardServis || existingOp?.wizardServis || '3.500',
        wizardSeveranceRate: operationFields.wizardSeveranceRate ?? existingOp?.wizardSeveranceRate ?? 8.33,
        wizardLeaveRate: operationFields.wizardLeaveRate ?? existingOp?.wizardLeaveRate ?? 5.0,
        wizardSideBenefits: operationFields.wizardSideBenefits || existingOp?.wizardSideBenefits || '2.000',
        costPropMaterial: operationFields.costPropMaterial || existingOp?.costPropMaterial || '50',
        costPropLabor: operationFields.costPropLabor || existingOp?.costPropLabor || '20',
        costPropEnergy: operationFields.costPropEnergy || existingOp?.costPropEnergy || '10',
        costPropMaintenance: operationFields.costPropMaintenance || existingOp?.costPropMaintenance || '10',
        costPropOverhead: operationFields.costPropOverhead || existingOp?.costPropOverhead || '10',
        costPropProfit: operationFields.costPropProfit || existingOp?.costPropProfit || '10',
        currency: operationFields.currency || existingOp?.currency || 'TRY',
        urunGrubu: operationFields.urunGrubu || existingOp?.urunGrubu || '',
        calisanSayisi: operationFields.calisanSayisi || existingOp?.calisanSayisi || '',
        vardiya: operationFields.vardiya || existingOp?.vardiya || '',
        gorusulen: operationFields.gorusulen || existingOp?.gorusulen || '',
        talepEdilenHizmet: operationFields.talepEdilenHizmet || existingOp?.talepEdilenHizmet || 'Yalın Dönüşüm Proje Danışmanlığı',
        scores: (operationFields.scores && Object.keys(operationFields.scores).length > 0) ? operationFields.scores : (existingOp?.scores || {}),
        chatMessages: (operationFields.chatMessages && operationFields.chatMessages.length > 0) ? operationFields.chatMessages : (existingOp?.chatMessages || [])
      };

      if (oIdx > -1) {
        operations[oIdx] = updatedOp;
      } else {
        operations.push(updatedOp);
      }
      localStorage.setItem(KEYS.OPERATIONS, JSON.stringify(operations));

      // 3. Assessment
      const assessments: Assessment[] = JSON.parse(localStorage.getItem(KEYS.ASSESSMENTS) || '[]');
      const aIdx = assessments.findIndex(a => a.companyId === companyId);
      const existingAs = aIdx > -1 ? assessments[aIdx] : null;

      const updatedAs: Assessment = {
        assessmentId: aIdx > -1 ? assessments[aIdx].assessmentId : generateUUID(),
        companyId,
        overallScore: assessmentFields.overallScore || existingAs?.overallScore || 0,
        potentialSaving: assessmentFields.potentialSaving || existingAs?.potentialSaving || 0,
        investmentNeed: assessmentFields.investmentNeed || existingAs?.investmentNeed || 0,
        paybackPeriod: assessmentFields.paybackPeriod || existingAs?.paybackPeriod || 0,
        notes: assessmentFields.notes ?? existingAs?.notes ?? '',
        createdDate: aIdx > -1 ? assessments[aIdx].createdDate : now
      };

      if (aIdx > -1) {
        assessments[aIdx] = updatedAs;
      } else {
        assessments.push(updatedAs);
      }
      localStorage.setItem(KEYS.ASSESSMENTS, JSON.stringify(assessments));

      // 4. Cloud Sync to Supabase
      const client = getSupabase();
      if (client) {
        // Company
        client.from('companies').upsert({
          company_id: companyId,
          company_name: companyFields.companyName || (cIdx > -1 ? companies[cIdx].companyName : 'Saha Çalışması'),
          sector: companyFields.sector || (cIdx > -1 ? companies[cIdx].sector : 'Genel İmalat'),
          location: companyFields.location || (cIdx > -1 ? companies[cIdx].location : ''),
          consultant: companyFields.consultant || (cIdx > -1 ? companies[cIdx].consultant : ''),
          visit_date: companyFields.visitDate || (cIdx > -1 ? companies[cIdx].visitDate : now.split('T')[0]),
          status: companyFields.status || (cIdx > -1 ? companies[cIdx].status : 'Active'),
          updated_at: now
        }, { onConflict: 'company_id' }).then(({ error }) => {
          if (error) console.warn('[Supabase Sync FullState Company Error]', error.message);
        });

        // Operation Data
        client.from('operation_data').upsert({
          company_id: companyId,
          turnover_lira: updatedOp.turnoverLira,
          copq_rate: updatedOp.copqRate,
          oee: updatedOp.oee,
          scrap_rate: updatedOp.scrapRate,
          rework_rate: updatedOp.reworkRate,
          overtime_rate: updatedOp.overtimeRate,
          lead_time: updatedOp.leadTime,
          covered_area: updatedOp.coveredArea,
          operators_count: updatedOp.operatorsCount,
          data_json: updatedOp,
          created_at: now
        }, { onConflict: 'company_id' }).then(({ error }) => {
          if (error) console.warn('[Supabase Sync FullState Operation Error]', error.message);
        });

        // Assessment
        client.from('assessments').upsert({
          assessment_id: updatedAs.assessmentId,
          company_id: companyId,
          overall_score: updatedAs.overallScore,
          potential_saving: updatedAs.potentialSaving,
          investment_need: updatedAs.investmentNeed,
          payback_period: updatedAs.paybackPeriod,
          notes: updatedAs.notes,
          created_at: updatedAs.createdDate
        }, { onConflict: 'company_id' }).then(({ error }) => {
          if (error) console.warn('[Supabase Sync FullState Assessment Error]', error.message);
        });
      }

    } catch (e) {
      console.error('Error saving full state', e);
    }
  },

  // Delete company completely (Local + Cloud)
  deleteCompany(companyId: string): void {
    const companies = this.getCompanies(true).filter(c => c.companyId !== companyId);
    localStorage.setItem(KEYS.COMPANIES, JSON.stringify(companies));

    const assessments: Assessment[] = JSON.parse(localStorage.getItem(KEYS.ASSESSMENTS) || '[]');
    localStorage.setItem(KEYS.ASSESSMENTS, JSON.stringify(assessments.filter(a => a.companyId !== companyId)));

    const operations: OperationData[] = JSON.parse(localStorage.getItem(KEYS.OPERATIONS) || '[]');
    localStorage.setItem(KEYS.OPERATIONS, JSON.stringify(operations.filter(o => o.companyId !== companyId)));

    const observations: Observation[] = JSON.parse(localStorage.getItem(KEYS.OBSERVATIONS) || '[]');
    localStorage.setItem(KEYS.OBSERVATIONS, JSON.stringify(observations.filter(o => o.companyId !== companyId)));

    const client = getSupabase();
    if (client) {
      client.from('companies').delete().eq('company_id', companyId).then(({ error }) => {
        if (error) console.warn('[Supabase Delete Company Error]', error.message);
      });
    }
  },

  // Archive a company
  archiveCompany(companyId: string): void {
    const companies = this.getCompanies(true);
    const idx = companies.findIndex(c => c.companyId === companyId);
    if (idx > -1) {
      companies[idx].status = 'Archived';
      companies[idx].updatedDate = new Date().toISOString();
      this.saveCompanyRecord(companies[idx]);
    }
  },

  // Restore archived company
  restoreCompany(companyId: string): void {
    const companies = this.getCompanies(true);
    const idx = companies.findIndex(c => c.companyId === companyId);
    if (idx > -1) {
      companies[idx].status = 'Active';
      companies[idx].updatedDate = new Date().toISOString();
      this.saveCompanyRecord(companies[idx]);
    }
  },

  // Copy company as new
  copyCompanyAsNew(sourceCompanyId: string, newCompanyName?: string): Company | null {
    try {
      const sourceData = this.getCompanyDetails(sourceCompanyId);
      if (!sourceData) return null;

      const newId = generateUUID();
      const now = new Date().toISOString();
      const visitDate = now.split('T')[0];

      const newCompany: Company = {
        ...sourceData.company,
        companyId: newId,
        companyName: newCompanyName || `${sourceData.company.companyName} (Kopya)`,
        status: 'Draft',
        visitDate: visitDate,
        createdDate: now,
        updatedDate: now,
      };

      const newAssessment: Assessment = sourceData.assessment ? {
        ...sourceData.assessment,
        assessmentId: generateUUID(),
        companyId: newId,
        createdDate: now,
      } : {
        assessmentId: generateUUID(),
        companyId: newId,
        overallScore: 0,
        potentialSaving: 0,
        investmentNeed: 0,
        paybackPeriod: 0,
        notes: '',
        createdDate: now,
      };

      const newOperation: OperationData = sourceData.operation ? {
        ...sourceData.operation,
        companyId: newId,
      } : {
        companyId: newId,
        setupMachineCount: '',
        annualVolume: '',
        productionUnit: 'Adet',
        turnoverLira: '',
        plannedEfficiency: '',
        actualEfficiency: '',
        copqRate: '',
        scrapRate: '',
        reworkRate: '',
        overtimeRate: '',
        leadTime: '',
        oee: '',
        coveredArea: '',
        operatorsCount: '',
        setupFrequency: '',
        setupDuration: '',
        affectedOpsSetup: '',
        grossLaborCost: '',
        wizardGrossSalary: '30.000',
        wizardSgkRate: 17.5,
        wizardYemek: '4.500',
        wizardServis: '3.500',
        wizardSeveranceRate: 8.33,
        wizardLeaveRate: 5.0,
        wizardSideBenefits: '2.000',
        costPropMaterial: '50',
        costPropLabor: '20',
        costPropEnergy: '10',
        costPropMaintenance: '10',
        costPropOverhead: '10',
        costPropProfit: '10',
        scores: {},
        chatMessages: [],
      };

      const allObservations: Observation[] = JSON.parse(localStorage.getItem(KEYS.OBSERVATIONS) || '[]');
      const newObservations = sourceData.observations.map(obs => ({
        ...obs,
        observationId: generateUUID(),
        companyId: newId,
        createdDate: now,
      }));

      this.saveFullState(newId, newCompany, newOperation, newAssessment);

      allObservations.push(...newObservations);
      localStorage.setItem(KEYS.OBSERVATIONS, JSON.stringify(allObservations));

      return newCompany;
    } catch (e) {
      console.error('Error copying company', e);
      return null;
    }
  },

  // Observation CRUD operations
  getObservations(companyId: string): Observation[] {
    try {
      const observations: Observation[] = JSON.parse(localStorage.getItem(KEYS.OBSERVATIONS) || '[]');
      return observations.filter(o => o.companyId === companyId);
    } catch (e) {
      return [];
    }
  },

  addObservation(companyId: string, category: string, finding: string, improvement: string, priority: string, impact: string, photo?: string): Observation {
    const now = new Date().toISOString();
    const newObs: Observation = {
      observationId: generateUUID(),
      companyId,
      category,
      finding,
      improvement,
      priority,
      impact,
      photo,
      createdDate: now
    };

    const observations: Observation[] = JSON.parse(localStorage.getItem(KEYS.OBSERVATIONS) || '[]');
    observations.push(newObs);
    localStorage.setItem(KEYS.OBSERVATIONS, JSON.stringify(observations));

    const client = getSupabase();
    if (client) {
      client.from('observations').upsert({
        observation_id: newObs.observationId,
        company_id: companyId,
        category: newObs.category,
        finding: newObs.finding,
        improvement: newObs.improvement,
        priority: newObs.priority,
        impact: newObs.impact,
        created_at: now
      }).then(({ error }) => {
        if (error) console.warn('[Supabase Add Obs Error]', error.message);
      });
    }

    return newObs;
  },

  updateObservation(observation: Observation): void {
    const observations: Observation[] = JSON.parse(localStorage.getItem(KEYS.OBSERVATIONS) || '[]');
    const idx = observations.findIndex(o => o.observationId === observation.observationId);
    if (idx > -1) {
      observations[idx] = observation;
      localStorage.setItem(KEYS.OBSERVATIONS, JSON.stringify(observations));

      const client = getSupabase();
      if (client) {
        client.from('observations').upsert({
          observation_id: observation.observationId,
          company_id: observation.companyId,
          category: observation.category,
          finding: observation.finding,
          improvement: observation.improvement,
          priority: observation.priority,
          impact: observation.impact,
          created_at: observation.createdDate
        });
      }
    }
  },

  deleteObservation(observationId: string): void {
    const observations: Observation[] = JSON.parse(localStorage.getItem(KEYS.OBSERVATIONS) || '[]');
    const filtered = observations.filter(o => o.observationId !== observationId);
    localStorage.setItem(KEYS.OBSERVATIONS, JSON.stringify(filtered));

    const client = getSupabase();
    if (client) {
      client.from('observations').delete().eq('observation_id', observationId);
    }
  },

  // Savings CRUD operations
  getSavings(companyId: string): SavingResult[] {
    try {
      const savings: SavingResult[] = JSON.parse(localStorage.getItem(KEYS.SAVINGS) || '[]');
      return savings.filter(s => s.companyId === companyId);
    } catch (e) {
      return [];
    }
  },

  saveSavings(companyId: string, savingsList: SavingResult[]): void {
    try {
      const allSavings: SavingResult[] = JSON.parse(localStorage.getItem(KEYS.SAVINGS) || '[]');
      const filtered = allSavings.filter(s => s.companyId !== companyId);
      filtered.push(...savingsList);
      localStorage.setItem(KEYS.SAVINGS, JSON.stringify(filtered));

      const client = getSupabase();
      if (client && savingsList.length > 0) {
        client.from('proposals').upsert(savingsList.map(s => ({
          proposal_id: s.savingId,
          company_id: companyId,
          selected_option: s.savingType,
          budget_try: s.currentCost,
          annual_gain_min: s.annualSaving,
          annual_gain_max: s.futureCost,
          roi_min: s.roi,
          roi_max: s.payback,
          created_at: s.createdDate || new Date().toISOString()
        }))).then(({ error }) => {
          if (error) console.warn('[Supabase Sync Proposals Error]', error.message);
        });
      }
    } catch (e) {
      console.error('Error saving savings', e);
    }
  },

  // Dashboard Stats Calculations
  getDashboardStats(): {
    totalCompanies: number;
    totalVisits: number;
    totalPotentialSaving: number;
    averageLeanScore: number;
    thisMonthVisits: number;
    recentCompanies: Company[];
  } {
    const companies = this.getCompanies(true);
    const assessments: Assessment[] = JSON.parse(localStorage.getItem(KEYS.ASSESSMENTS) || '[]');

    const activeCompanies = companies.filter(c => c.status !== 'Archived');
    const totalVisits = activeCompanies.filter(c => c.visitDate).length;

    let totalPotentialSaving = 0;
    let scoreSum = 0;
    let scoredCount = 0;

    activeCompanies.forEach(c => {
      const as = assessments.find(a => a.companyId === c.companyId);
      if (as) {
        totalPotentialSaving += as.potentialSaving || 0;
        if (as.overallScore > 0) {
          scoreSum += as.overallScore;
          scoredCount++;
        }
      }
    });

    const averageLeanScore = scoredCount > 0 ? Math.round(scoreSum / scoredCount) : 0;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const thisMonthStr = startOfMonth.toISOString().slice(0, 7); // YYYY-MM

    const thisMonthVisits = activeCompanies.filter(c => c.visitDate && c.visitDate.startsWith(thisMonthStr)).length;

    const recentCompanies = [...companies]
      .sort((a, b) => new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime())
      .slice(0, 5);

    return {
      totalCompanies: activeCompanies.length,
      totalVisits,
      totalPotentialSaving,
      averageLeanScore,
      thisMonthVisits,
      recentCompanies
    };
  }
};
