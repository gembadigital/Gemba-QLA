import { ReportBuilder } from './ReportBuilder';
import { ReportGenerator } from './ReportGenerator';
import type { ReportMetrics } from './types';

export class ExportService {
  /**
   * Main entry point to compile and download a professional PDF report for a given company.
   * Handles names sanitization, date stamping, and graceful error boundaries.
   */
  public static async exportCompanyReport(companyId: string, metrics?: ReportMetrics): Promise<boolean> {
    try {
      console.log(`Starting PDF Report generation for Company: ${companyId}`);

      // 1. Fetch, compile, and validate all relevant relational data
      const reportData = ReportBuilder.buildReportData(companyId, metrics);

      // Log validation errors (if any) as warnings
      if (reportData.validationErrors.length > 0) {
        console.warn('Report compilation completed with validation warnings:', reportData.validationErrors);
      }

      // 2. Build the multi-page PDF document
      const doc = await ReportGenerator.generateReport(reportData);

      // 3. Format the standard professional filename
      const rawName = reportData.company.companyName || 'Firma';
      // Normalize letters and strip special characters to make safe filenames
      const sanitizedName = rawName
        .trim()
        .replace(/ı/g, 'i')
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/İ/g, 'I')
        .replace(/Ş/g, 'S')
        .replace(/Ğ/g, 'G')
        .replace(/Ü/g, 'U')
        .replace(/Ö/g, 'O')
        .replace(/Ç/g, 'C')
        .replace(/[^a-zA-Z0-9_\-]/g, '_')
        .replace(/__+/g, '_'); // prevent multiple consecutive underscores

      const dateStamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `${sanitizedName}_QLA_Yonetici_Raporu_${dateStamp}.pdf`;

      // 4. Trigger direct client-side save/download
      doc.save(filename);
      console.log(`PDF Report saved successfully as: ${filename}`);
      return true;

    } catch (error) {
      console.error('Fatal error occurred during PDF Report Generation:', error);
      alert(`Rapor oluşturulamadı: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}
