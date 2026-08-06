import { Sale, SaleItem, Product, Store } from '../types';
import { formatCurrency, formatNumber } from '../utils/format';

export interface PrintOptions {
  paperWidth?: '80mm' | '58mm';
  autoPrint?: boolean;
}

export class PrintService {
  /**
   * Directly triggers browser thermal receipt printing using iframe injection
   * without navigating away or causing full-page re-renders.
   */
  static printDirectThermalReceipt(
    sale: Partial<Sale> & { items: SaleItem[] },
    productsMap: Record<string, Product>,
    store?: Store,
    currency: string = 'ILS',
    options: PrintOptions = {}
  ) {
    const paperWidth = options.paperWidth || '80mm';
    const total = sale.totalAmount || 0;
    const paid = sale.paidAmount !== undefined ? sale.paidAmount : total;
    const debt = sale.debtAmount || Math.max(0, total - paid);

    const dateStr = new Date(sale.createdAt || Date.now()).toLocaleString('ar-EG');
    const invoiceNo = sale.id ? sale.id.slice(0, 8) : 'NEW';

    const itemsHtml = sale.items.map((item) => {
      const prod = productsMap[item.productId];
      const name = prod?.name || 'منتج';
      const itemTotal = item.price * item.quantity;
      return `
        <tr style="border-bottom: 1px dashed #e2e8f0;">
          <td style="padding: 4px 0; text-align: right;">${name}</td>
          <td style="padding: 4px 0; text-align: center;">${formatNumber(item.quantity)}</td>
          <td style="padding: 4px 0; text-align: left;">${formatCurrency(item.price, currency)}</td>
          <td style="padding: 4px 0; text-align: left; font-weight: bold;">${formatCurrency(itemTotal, currency)}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>فاتورة #${invoiceNo}</title>
        <style>
          @page {
            size: ${paperWidth} auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace, sans-serif;
            width: ${paperWidth};
            padding: 4mm;
            margin: 0 auto;
            color: #000;
            background: #fff;
            font-size: 11px;
            direction: rtl;
          }
          .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          .store-title {
            font-size: 16px;
            font-weight: bold;
            margin: 0 0 4px 0;
          }
          .meta-info {
            font-size: 10px;
            color: #333;
            margin: 2px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            font-size: 10px;
          }
          th {
            border-bottom: 1px solid #000;
            padding: 4px 0;
            text-align: right;
          }
          .totals {
            border-top: 1px dashed #000;
            padding-top: 6px;
            margin-bottom: 8px;
            font-size: 11px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
          }
          .total-row {
            font-weight: bold;
            font-size: 13px;
            border-bottom: 1px solid #000;
            padding-bottom: 4px;
          }
          .footer {
            text-align: center;
            border-top: 1px dashed #000;
            padding-top: 6px;
            font-size: 9px;
            color: #555;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="store-title">${store?.name || 'المتجر'}</div>
          ${store?.phone ? `<div class="meta-info">هاتف: ${store.phone}</div>` : ''}
          <div class="meta-info">${dateStr}</div>
          <div class="meta-info" style="font-weight: bold;">رقم الفاتورة: #${invoiceNo}</div>
          ${sale.customerName ? `<div class="meta-info" style="font-weight: bold;">العميل: ${sale.customerName}</div>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: right;">الصنف</th>
              <th style="text-align: center;">العدد</th>
              <th style="text-align: left;">السعر</th>
              <th style="text-align: left;">المجموع</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div class="row total-row">
            <span>الإجمالي:</span>
            <span>${formatCurrency(total, currency)}</span>
          </div>
          <div class="row" style="margin-top: 4px;">
            <span>طريقة الدفع:</span>
            <span>${sale.paymentType === 'CREDIT' ? 'بالآجل (دين)' : sale.paymentType === 'CARD' ? 'بطاقة' : 'نقداً'}</span>
          </div>
          <div class="row">
            <span>المدفوع:</span>
            <span>${formatCurrency(paid, currency)}</span>
          </div>
          ${debt > 0 ? `
            <div class="row" style="font-weight: bold; color: #b91c1c;">
              <span>المتبقي (دين):</span>
              <span>${formatCurrency(debt, currency)}</span>
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <div>شكراً لزيارتكم ونتمنى لكم يوماً سعيداً!</div>
          <div>نظام إدارة مبيعات - Ode.5</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.frameElement && window.frameElement.remove();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    // Create invisible iframe for direct printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
    }
  }
}
