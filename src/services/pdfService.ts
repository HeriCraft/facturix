/**
 * Facturix PDF Template Generator
 * Responsive, high-fidelity A4 HTML/CSS template generator.
 * Encapsulates tabular layouts, fintech styling, zebra striping, and privacy guarantees.
 */

import { CompanyProfile, Invoice } from '../domain/types';
import { formatCurrency, formatDate } from '../domain/formatters';

/**
 * Escapes unsafe characters to prevent HTML/XSS injection in generated PDF documents.
 */
export function escapeHtml(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateInvoiceHtml(
  invoice: Invoice,
  companyProfile?: CompanyProfile | null
): string {
  const currency = companyProfile?.currency || 'EUR';
  const isInvoice = invoice.type === 'INVOICE';
  const docTitle = isInvoice ? 'INVOICE' : 'QUOTATION';
  const statusColor = invoice.status === 'PAID' ? '#10b981' : '#f59e0b';
  const statusBg = invoice.status === 'PAID' ? '#ecfdf5' : '#fffbeb';

  const issuerName = escapeHtml(companyProfile?.name || 'Facturix Merchant');
  const issuerPhone = escapeHtml(companyProfile?.phone || '');
  const issuerEmail = escapeHtml(companyProfile?.email || '');
  const issuerAddress = escapeHtml(companyProfile?.address || '');
  const issuerTaxId = escapeHtml(companyProfile?.taxNumber || '');

  const clientName = escapeHtml(invoice.client.name);
  const clientEmail = escapeHtml(invoice.client.email || '');
  const clientPhone = escapeHtml(invoice.client.phone || '');
  const clientAddress = escapeHtml(invoice.client.address || '');

  const itemsHtml = invoice.items
    .map((item, index) => {
      const lineTotal = item.quantity * item.unitPrice;
      return `
        <tr class="${index % 2 === 1 ? 'even-row' : ''}">
          <td class="col-num">${index + 1}</td>
          <td class="col-desc">${escapeHtml(item.description)}</td>
          <td class="col-qty">${item.quantity}</td>
          <td class="col-price">${formatCurrency(item.unitPrice, currency)}</td>
          <td class="col-total">${formatCurrency(lineTotal, currency)}</td>
        </tr>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(invoice.documentNumber)} - ${docTitle}</title>
  <style>
    @page {
      size: A4;
      margin: 16mm 14mm 16mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 13px;
      line-height: 1.5;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .company-col {
      width: 58%;
      vertical-align: top;
    }
    .doc-meta-col {
      width: 42%;
      vertical-align: top;
      text-align: right;
    }
    .company-name {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px 0;
      letter-spacing: -0.02em;
    }
    .company-details {
      color: #475569;
      font-size: 12px;
      line-height: 1.6;
    }
    .doc-badge {
      display: inline-block;
      font-size: 20px;
      font-weight: 800;
      color: #2563eb;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .doc-number {
      font-size: 15px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 8px;
      font-family: "Courier New", Courier, monospace;
    }
    .status-pill {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      background-color: ${statusBg};
      color: ${statusColor};
      border: 1px solid ${statusColor};
    }
    .dates-container {
      margin-top: 10px;
      color: #475569;
      font-size: 11px;
      line-height: 1.6;
    }
    .dates-container strong {
      color: #0f172a;
    }
    .client-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 24px;
    }
    .client-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 6px;
    }
    .client-name {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .client-info {
      color: #475569;
      font-size: 12px;
      line-height: 1.5;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .items-table th {
      background-color: #0f172a;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 10px 12px;
    }
    .items-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
    }
    .items-table tr.even-row td {
      background-color: #f8fafc;
    }
    .col-num {
      width: 6%;
      text-align: center;
      color: #64748b;
    }
    .col-desc {
      width: 48%;
      text-align: left;
      font-weight: 500;
    }
    .col-qty {
      width: 12%;
      text-align: center;
    }
    .col-price {
      width: 16%;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .col-total {
      width: 18%;
      text-align: right;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: #0f172a;
    }
    .summary-section {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .notes-col {
      width: 55%;
      vertical-align: top;
      padding-right: 24px;
    }
    .totals-col {
      width: 45%;
      vertical-align: top;
    }
    .section-subtitle {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 6px;
    }
    .notes-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      color: #475569;
      font-size: 11px;
      line-height: 1.5;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 6px 10px;
      font-size: 12px;
    }
    .totals-label {
      color: #475569;
      text-align: left;
    }
    .totals-val {
      text-align: right;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    .grand-total-row td {
      background-color: #0f172a;
      color: #ffffff;
      padding: 10px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 800;
    }
    .grand-total-row .totals-label {
      color: #ffffff;
    }
    .footer {
      margin-top: 36px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #94a3b8;
      font-size: 10px;
      line-height: 1.6;
    }
    .footer strong {
      color: #64748b;
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <table class="header-table">
    <tr>
      <td class="company-col">
        <div class="company-name">${issuerName}</div>
        <div class="company-details">
          ${issuerAddress ? `<div>${issuerAddress}</div>` : ''}
          ${issuerPhone ? `<div>Tel: ${issuerPhone}</div>` : ''}
          ${issuerEmail ? `<div>Email: ${issuerEmail}</div>` : ''}
          ${issuerTaxId ? `<div>Tax / VAT ID: ${issuerTaxId}</div>` : ''}
        </div>
      </td>
      <td class="doc-meta-col">
        <div class="doc-badge">${docTitle}</div>
        <div class="doc-number"># ${escapeHtml(invoice.documentNumber)}</div>
        <div>
          <span class="status-pill">${escapeHtml(invoice.status)}</span>
        </div>
        <div class="dates-container">
          <div>Issue Date: <strong>${formatDate(invoice.issueDate, 'medium')}</strong></div>
          <div>Due Date: <strong>${formatDate(invoice.dueDate, 'medium')}</strong></div>
        </div>
      </td>
    </tr>
  </table>

  <!-- BILL TO -->
  <div class="client-card">
    <div class="client-title">Billed To</div>
    <div class="client-name">${clientName}</div>
    <div class="client-info">
      ${clientAddress ? `<div>${clientAddress}</div>` : ''}
      ${clientEmail ? `<div>Email: ${clientEmail}</div>` : ''}
      ${clientPhone ? `<div>Tel: ${clientPhone}</div>` : ''}
    </div>
  </div>

  <!-- ITEMS TABLE -->
  <table class="items-table">
    <thead>
      <tr>
        <th class="col-num">#</th>
        <th class="col-desc">Description</th>
        <th class="col-qty">Qty</th>
        <th class="col-price">Unit Price</th>
        <th class="col-total">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <!-- SUMMARY & NOTES -->
  <table class="summary-section">
    <tr>
      <td class="notes-col">
        ${
          invoice.paymentTerms || companyProfile?.defaultPaymentTerms
            ? `
          <div class="section-subtitle">Payment Terms</div>
          <div class="notes-box" style="margin-bottom: 12px;">
            ${escapeHtml(invoice.paymentTerms || companyProfile?.defaultPaymentTerms)}
          </div>
        `
            : ''
        }
        ${
          invoice.notes
            ? `
          <div class="section-subtitle">Special Notes</div>
          <div class="notes-box">
            ${escapeHtml(invoice.notes)}
          </div>
        `
            : ''
        }
      </td>
      <td class="totals-col">
        <table class="totals-table">
          <tr>
            <td class="totals-label">Subtotal</td>
            <td class="totals-val">${formatCurrency(invoice.subtotal, currency)}</td>
          </tr>
          ${
            invoice.discountAmount && invoice.discountAmount > 0
              ? `
            <tr>
              <td class="totals-label">Discount ${
                invoice.discountRate ? `(${Math.round(invoice.discountRate * 100)}%)` : ''
              }</td>
              <td class="totals-val" style="color: #10b981;">-${formatCurrency(
                invoice.discountAmount,
                currency
              )}</td>
            </tr>
          `
              : ''
          }
          <tr>
            <td class="totals-label">Tax / VAT (${Math.round((invoice.taxRate || 0) * 100)}%)</td>
            <td class="totals-val">${formatCurrency(invoice.taxAmount, currency)}</td>
          </tr>
          <tr class="grand-total-row">
            <td class="totals-label">Grand Total</td>
            <td class="totals-val">${formatCurrency(invoice.grandTotal, currency)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- FOOTER -->
  <div class="footer">
    <div><strong>Facturix</strong> — 100% Offline &amp; Privacy-First Invoicing System.</div>
    <div>Zero data leaves your device. Thank you for your business!</div>
  </div>

</body>
</html>
  `.trim();
}
