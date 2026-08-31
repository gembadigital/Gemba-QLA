import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, TrendingUp, BarChart3, Search, Filter, 
  Plus, Copy, FolderArchive, FolderOpen, Trash2, Calendar, MapPin, 
  Briefcase, CheckCircle2, ChevronRight, Sparkles, RefreshCw, X,
  Cloud, CloudOff, Database, Settings
} from 'lucide-react';
import { Company, GembaDB } from '../db';
import { getSupabaseConfig, saveSupabaseCredentials } from '../lib/supabase';

interface DashboardProps {
  onOpenCompany: (companyId: string) => void;
  onNewCompanyCreated: (companyId: string) => void;
}

export default function Dashboard({ onOpenCompany, onNewCompanyCreated }: DashboardProps) {
  // Stats state
  const [stats, setStats] = useState(() => GembaDB.getDashboardStats());
  // Companies list
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbConfig, setDbConfig] = useState(() => getSupabaseConfig());
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [dbUrl, setDbUrl] = useState(dbConfig.url);
  const [dbKey, setDbKey] = useState(dbConfig.anonKey);
  
  // Filter/Search states
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('Tümü');
  const [selectedConsultant, setSelectedConsultant] = useState('Tümü');
  const [selectedStatus, setSelectedStatus] = useState('Tümü');
  const [viewArchived, setViewArchived] = useState(false);

  // New Company form states
  const [isNewFormOpen, setIsNewFormOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newSector, setNewSector] = useState('Plastik Enjeksiyon');
  const [newLocation, setNewLocation] = useState('');
  const [newConsultant, setNewConsultant] = useState('Saha Danışmanı');

  // Refresh lists with Cloud Sync
  const refreshData = async () => {
    setIsSyncing(true);
    try {
      const syncedCompanies = await GembaDB.syncCompaniesFromCloud();
      setCompanies(syncedCompanies);
      setStats(GembaDB.getDashboardStats());
    } catch (e) {
      setCompanies(GembaDB.getCompanies(true));
      setStats(GembaDB.getDashboardStats());
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [viewArchived]);

  // Handle new company submission
  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    const created = GembaDB.createCompany(
      newCompanyName,
      newSector,
      newLocation,
      newConsultant
    );

    setNewCompanyName('');
    setNewLocation('');
    setIsNewFormOpen(false);
    refreshData();
    onNewCompanyCreated(created.companyId);
  };

  // Clone company
  const handleCloneCompany = (e: React.MouseEvent, companyId: string, name: string) => {
    e.stopPropagation();
    if (confirm(`"${name}" çalışmasını yeni bir firma olarak kopyalamak istediğinizden emin misiniz?`)) {
      const cloned = GembaDB.copyCompanyAsNew(companyId);
      if (cloned) {
        refreshData();
        alert('Firma tüm operasyonel verileri, puanları ve saha gözlemleriyle birlikte başarıyla kopyalandı.');
      }
    }
  };

  // Delete company completely
  const handleDeleteCompany = (e: React.MouseEvent, companyId: string, name: string) => {
    e.stopPropagation();
    if (confirm(`"${name}" firmasını ve firmaya ait TÜM analiz verilerini kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
      GembaDB.deleteCompany(companyId);
      refreshData();
    }
  };

  // Archive company
  const handleArchiveCompany = (e: React.MouseEvent, companyId: string, name: string) => {
    e.stopPropagation();
    if (confirm(`"${name}" çalışmasını arşivlemek istediğinizden emin misiniz?`)) {
      GembaDB.archiveCompany(companyId);
      refreshData();
    }
  };

  // Restore archived company
  const handleRestoreCompany = (e: React.MouseEvent, companyId: string, name: string) => {
    e.stopPropagation();
    if (confirm(`"${name}" çalışmasını arşivden çıkarmak istediğinizden emin misiniz?`)) {
      GembaDB.restoreCompany(companyId);
      refreshData();
    }
  };

  // Formatted Money value
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);
  };

  // Filter list
  const filteredCompanies = companies.filter(c => {
    // Soft Archive filter
    const matchesArchived = viewArchived ? c.status === 'Archived' : c.status !== 'Archived';
    if (!matchesArchived) return false;

    // Search filter
    const matchesSearch = c.companyName.toLowerCase().includes(search.toLowerCase()) || 
                          c.sector.toLowerCase().includes(search.toLowerCase()) || 
                          (c.consultant && c.consultant.toLowerCase().includes(search.toLowerCase()));
    
    // Sector filter
    const matchesSector = selectedSector === 'Tümü' || c.sector === selectedSector;

    // Consultant filter
    const matchesConsultant = selectedConsultant === 'Tümü' || c.consultant === selectedConsultant;

    // Status filter
    const matchesStatus = selectedStatus === 'Tümü' || c.status === selectedStatus;

    return matchesSearch && matchesSector && matchesConsultant && matchesStatus;
  });

  // Unique Sectors and Consultants for filters
  const uniqueSectors = Array.from(new Set(companies.map(c => c.sector))).filter(Boolean);
  const uniqueConsultants = Array.from(new Set(companies.map(c => c.consultant))).filter(Boolean);

  const getCompanyScoreAndSaving = (companyId: string) => {
    const details = GembaDB.getCompanyDetails(companyId);
    return {
      score: details?.assessment?.overallScore ?? 0,
      saving: details?.assessment?.potentialSaving ?? 0
    };
  };

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-main-view">
      {/* ─── DASHBOARD HERO WELCOME & STATISTICS BENTO-GRID ─── */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Abstract background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-600/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="bg-red-650 text-white text-[9px] font-extrabold px-3 py-1 rounded-full border border-red-500/30 uppercase tracking-widest">
              PORTAL KONTROL PANELİ
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight flex items-center gap-2">
              Gemba QLA
              <span className="text-xs bg-red-600 text-white font-bold px-2 py-0.5 rounded-md">Quick Loss Analyzer</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-semibold max-w-xl">
              Endüstriyel danışmanlık operasyonlarınızı, müşteri verilerinizi ve ROI kayıp analizlerinizi tek bir portal üzerinden profesyonelce yönetin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-stretch md:self-auto">
            <button
              onClick={() => setIsNewFormOpen(!isNewFormOpen)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-5 py-3 rounded-2xl transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center justify-center"
            >
              <Plus className="w-4.5 h-4.5 stroke-[3]" />
              YENİ FİRMA ANALİZİ BAŞLAT
            </button>
          </div>
        </div>

        {/* BENTO-GRID STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 relative z-10">
          
          {/* Card 1: Total Companies */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center space-x-3.5">
            <div className="p-3 bg-red-500/10 rounded-xl">
              <Building2 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Aktif Firma</span>
              <span className="text-xl sm:text-2xl font-black font-display text-white mt-0.5 block">{stats.totalCompanies}</span>
            </div>
          </div>

          {/* Card 2: Total Visits */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center space-x-3.5">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <Calendar className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Toplam Ziyaret</span>
              <span className="text-xl sm:text-2xl font-black font-display text-white mt-0.5 block">{stats.totalVisits}</span>
            </div>
          </div>

          {/* Card 3: Total Potential Saving */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center space-x-3.5 col-span-1">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Ekonomik Fırsat Havuzu</span>
              <span className="text-lg sm:text-xl font-black font-display text-emerald-400 mt-0.5 block truncate" title={formatCurrency(stats.totalPotentialSaving)}>
                {formatCurrency(stats.totalPotentialSaving)}
              </span>
            </div>
          </div>

          {/* Card 4: Average Lean Score */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center space-x-3.5">
            <div className="p-3 bg-sky-500/10 rounded-xl">
              <BarChart3 className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Ort. Yalın Seviye</span>
              <span className="text-xl sm:text-2xl font-black font-display text-sky-400 mt-0.5 block">
                {stats.averageLeanScore} <span className="text-xs text-slate-400">/ 51</span>
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ─── SLIDE DOWN COLLAPSED NEW COMPANY FORM ─── */}
      {isNewFormOpen && (
        <div className="bg-white border border-slate-200 shadow-md rounded-3xl p-6 space-y-4 animate-fade-in" id="new-company-form-section">
          <div className="flex justify-between items-center border-b pb-3 border-slate-100">
            <h3 className="font-display font-black text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-red-600 animate-pulse" />
              YENİ BİR GEMBA DEĞERLENDİRME KAYDI AÇ
            </h3>
            <button 
              onClick={() => setIsNewFormOpen(false)}
              className="p-1 text-slate-400 hover:text-red-600 rounded-full hover:bg-slate-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateCompany} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Müşteri / Firma Adı</label>
              <input
                type="text"
                required
                value={newCompanyName}
                onChange={e => setNewCompanyName(e.target.value)}
                placeholder="Örn: Atlas Makina Sanayi A.Ş."
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 bg-stone-50/40 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Üretim Sektörü</label>
              <select
                value={newSector}
                onChange={e => setNewSector(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all cursor-pointer"
              >
                <option value="Plastik Enjeksiyon">Plastik Enjeksiyon</option>
                <option value="Otomotiv Yan Sanayi">Otomotiv Yan Sanayi</option>
                <option value="Metal İşleme & Talaşlı İmalat">Metal İşleme & Talaşlı İmalat</option>
                <option value="Gıda ve İlaç">Gıda ve İlaç</option>
                <option value="Tekstil ve Hazır Giyim">Tekstil ve Hazır Giyim</option>
                <option value="Beyaz Eşya Ana Sanayi">Beyaz Eşya Ana Sanayi</option>
                <option value="Genel İmalat">Genel İmalat</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Saha Konumu / Şehir</label>
              <input
                type="text"
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                placeholder="Örn: Bursa OSB"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 bg-stone-50/40 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Baş Danışman</label>
              <input
                type="text"
                value={newConsultant}
                onChange={e => setNewConsultant(e.target.value)}
                placeholder="Danışman Adı"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 bg-stone-50/40 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all"
              />
            </div>
            <div className="md:col-span-4 flex justify-end gap-2 pt-2 border-t border-slate-50">
              <button
                type="button"
                onClick={() => setIsNewFormOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Kapat
              </button>
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] px-5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Saha Teşhis Formunu Oluştur ve Başla
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── FILTERS & SEARCH ROW ─── */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-xs text-slate-700 tracking-wider uppercase">FİLTRE VE ARAMA SÜZGECİ</h3>
          </div>
          
          {/* Active vs Archived View Toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200/50 self-start sm:self-auto">
            <button
              onClick={() => setViewArchived(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                !viewArchived ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              AKTİF PORTFÖY
            </button>
            <button
              onClick={() => setViewArchived(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                viewArchived ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5" />
              ARŞİVLENMİŞLER
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Firma, sektör, danışman ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-slate-200 rounded-xl pl-9.5 pr-3.5 py-2.5 text-xs text-slate-800 bg-stone-50/40 focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-650 transition-all placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Sector filter */}
          <div>
            <select
              value={selectedSector}
              onChange={e => setSelectedSector(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 bg-white focus:outline-none cursor-pointer font-semibold"
            >
              <option value="Tümü">Sektör: Tümü</option>
              {uniqueSectors.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Consultant filter */}
          <div>
            <select
              value={selectedConsultant}
              onChange={e => setSelectedConsultant(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 bg-white focus:outline-none cursor-pointer font-semibold"
            >
              <option value="Tümü">Danışman: Tümü</option>
              {uniqueConsultants.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 bg-white focus:outline-none cursor-pointer font-semibold"
            >
              <option value="Tümü">Durum: Tümü</option>
              <option value="Active">Aktif (Active)</option>
              <option value="Draft">Taslak (Draft)</option>
              <option value="Completed">Tamamlandı (Completed)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── COMPANIES TABLE LISTING ─── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden" id="companies-table-container">
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-display font-black text-xs uppercase tracking-widest text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-700" />
            FİRMA SAHA DEĞERLENDİRME PORTFÖYÜ ({filteredCompanies.length})
          </h2>
          <span className="text-[10px] font-bold text-slate-400 tracking-wider">
            Tablo satırına veya "İncele" butonuna tıklayarak analizi açabilirsiniz.
          </span>
        </div>

        <div className="overflow-x-auto">
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-sm text-slate-800">Hiçbir Değerlendirme Kaydı Bulunamadı</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 font-medium">
                Seçili filtre kriterlerine uyan veya aradığınız isimde bir firma bulunmuyor. Yeni bir kayıt oluşturarak başlayabilirsiniz.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-6">Firma Adı</th>
                  <th className="py-3 px-4">Sektör</th>
                  <th className="py-3 px-4">Danışman</th>
                  <th className="py-3 px-4">Ziyaret Tarihi</th>
                  <th className="py-3 px-4 text-center">Toplam Puan</th>
                  <th className="py-3 px-4 text-right">Tahmini Kazanım (Yıllık)</th>
                  <th className="py-3 px-4 text-center">Durum</th>
                  <th className="py-3 px-4">Son Güncelleme</th>
                  <th className="py-3 px-6 text-right">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map(comp => {
                  const data = getCompanyScoreAndSaving(comp.companyId);
                  
                  // score badge color
                  const scoreColor = data.score <= 12 ? 'text-red-700 bg-red-50 border-red-200' :
                                     data.score <= 25 ? 'text-amber-700 bg-amber-50 border-amber-200' :
                                     data.score <= 40 ? 'text-sky-700 bg-sky-50 border-sky-200' :
                                     'text-emerald-700 bg-emerald-50 border-emerald-200';

                  // status badge
                  const statusBadge = comp.status === 'Archived' ? 'bg-slate-100 text-slate-600 border-slate-250' :
                                      comp.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      comp.status === 'Draft' ? 'bg-stone-100 text-stone-600 border-stone-200' :
                                      'bg-red-50 text-red-700 border-red-200';

                  const statusText = comp.status === 'Archived' ? 'Arşiv' :
                                     comp.status === 'Completed' ? 'Tamamlandı' :
                                     comp.status === 'Draft' ? 'Taslak' : 'Aktif';

                  return (
                    <tr 
                      key={comp.companyId}
                      onClick={() => onOpenCompany(comp.companyId)}
                      className="border-b border-slate-100 hover:bg-slate-50/75 transition-all duration-150 cursor-pointer text-xs"
                    >
                      {/* Company Name */}
                      <td className="py-4 px-6 font-extrabold text-slate-900">
                        <div className="flex flex-col">
                          <span className="hover:text-red-650 transition-colors">{comp.companyName}</span>
                          {comp.location && (
                            <span className="text-[10px] text-slate-450 font-medium flex items-center gap-0.5 mt-0.5 text-slate-400">
                              <MapPin className="w-3 h-3" />
                              {comp.location}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Sector */}
                      <td className="py-4 px-4 font-semibold text-slate-600">{comp.sector}</td>

                      {/* Consultant */}
                      <td className="py-4 px-4 font-semibold text-slate-650 flex items-center gap-1.5 mt-2.5">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {comp.consultant || 'Belirtilmedi'}
                      </td>

                      {/* Visit Date */}
                      <td className="py-4 px-4 font-mono font-bold text-slate-500">
                        {comp.visitDate ? new Date(comp.visitDate).toLocaleDateString('tr-TR') : 'Girmedi'}
                      </td>

                      {/* Total Score */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 font-mono font-extrabold rounded-full border ${scoreColor}`}>
                          {data.score} <span className="text-[9px] opacity-60">/ 51</span>
                        </span>
                      </td>

                      {/* Estimated Saving */}
                      <td className="py-4 px-4 text-right font-bold text-emerald-600">
                        {data.saving > 0 ? formatCurrency(data.saving) : 'Hesaplanmadı'}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${statusBadge}`}>
                          {statusText}
                        </span>
                      </td>

                      {/* Last Update */}
                      <td className="py-4 px-4 text-slate-450 font-medium">
                        {new Date(comp.updatedDate).toLocaleDateString('tr-TR')}
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-6 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Aç / İncele */}
                          <button
                            onClick={() => onOpenCompany(comp.companyId)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-700 rounded-lg transition-all font-bold text-[11px] flex items-center gap-0.5 border border-red-100 cursor-pointer"
                            title="Saha Teşhis ve Analiz Panelini Aç"
                          >
                            <span>Aç</span>
                            <ChevronRight className="w-3 h-3 stroke-[2.5]" />
                          </button>

                          {/* Kopyala */}
                          <button
                            onClick={(e) => handleCloneCompany(e, comp.companyId, comp.companyName)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-550 hover:text-slate-800 rounded-lg transition-all border border-slate-200/60 cursor-pointer"
                            title="Yeni Firma Olarak Kopyala"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Archive/Restore */}
                          {comp.status === 'Archived' ? (
                            <button
                              onClick={(e) => handleRestoreCompany(e, comp.companyId, comp.companyName)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-all border border-emerald-200 cursor-pointer"
                              title="Arşivden Çıkar"
                            >
                              <FolderOpen className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => handleArchiveCompany(e, comp.companyId, comp.companyName)}
                              className="p-1.5 bg-stone-50 hover:bg-stone-100 text-slate-400 hover:text-orange-700 rounded-lg transition-all border border-slate-200/60 cursor-pointer"
                              title="Arşive Kaldır"
                            >
                              <FolderArchive className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Sil */}
                          <button
                            onClick={(e) => handleDeleteCompany(e, comp.companyId, comp.companyName)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 rounded-lg transition-all border border-rose-200/60 cursor-pointer"
                            title="Firmayı ve Tüm Verilerini Kalıcı Olarak Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
