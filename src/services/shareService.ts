/**
 * Facturix Share & PDF Orchestration Service
 * Infrastructure adapter encapsulating expo-print file compilation and expo-sharing sheet.
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { CompanyProfile, Invoice } from '../domain/types';
import { generateInvoiceHtml } from './pdfService';

export interface IShareService {
  generatePdfFile(invoice: Invoice, companyProfile?: CompanyProfile | null): Promise<string>;
  sharePdf(
    invoice: Invoice,
    companyProfile?: CompanyProfile | null
  ): Promise<{ uri: string; shared: boolean }>;
}

export class ShareService implements IShareService {
  private printEngine: typeof Print;
  private sharingEngine: typeof Sharing;

  constructor(
    printEngine: typeof Print = Print,
    sharingEngine: typeof Sharing = Sharing
  ) {
    this.printEngine = printEngine;
    this.sharingEngine = sharingEngine;
  }

  /**
   * Compiles invoice HTML into a local PDF file and returns the file URI.
   */
  async generatePdfFile(
    invoice: Invoice,
    companyProfile?: CompanyProfile | null
  ): Promise<string> {
    try {
      const html = generateInvoiceHtml(invoice, companyProfile);
      const result = await this.printEngine.printToFileAsync({
        html,
        base64: false,
      });

      if (!result?.uri) {
        throw new Error('PDF compiler did not return a valid file URI.');
      }

      return result.uri;
    } catch (error) {
      console.error('[ShareService] Error compiling PDF to file:', error);
      throw new Error(`[ShareService] PDF generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generates the PDF and presents the native device sharing dialog.
   * If sharing is unavailable (e.g. unsupported web browser), returns uri with shared: false.
   */
  async sharePdf(
    invoice: Invoice,
    companyProfile?: CompanyProfile | null
  ): Promise<{ uri: string; shared: boolean }> {
    const fileUri = await this.generatePdfFile(invoice, companyProfile);

    try {
      const canShare = await this.sharingEngine.isAvailableAsync();
      if (!canShare) {
        console.warn('[ShareService] Native sharing is not available on this platform.');
        return { uri: fileUri, shared: false };
      }

      await this.sharingEngine.shareAsync(fileUri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Share ${invoice.documentNumber}`,
      });

      return { uri: fileUri, shared: true };
    } catch (error) {
      console.error('[ShareService] Failed to present share sheet:', error);
      throw new Error(`[ShareService] Share dialog failed: ${(error as Error).message}`);
    }
  }
}

export const shareService = new ShareService();
