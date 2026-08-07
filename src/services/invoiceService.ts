import { formatCurrency, formatNumber } from '../utils/format';

export interface InvoiceData {
  invoiceId: string;
  storeName: string;
  storePhone?: string;
  storeEmail?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: Array<{
    name: string;
    barcode?: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentType: 'CASH' | 'CREDIT' | 'CARD';
  paidAmount: number;
  debtAmount: number;
  date: string;
  currency: string;
}

export class InvoiceService {
  static generateHTML(data: InvoiceData): string {
    const paymentTypeText = data.paymentType === 'CASH' 
      ? 'نقداً (كاش)' 
      : data.paymentType === 'CARD' 
      ? 'بطاقة ائتمان' 
      : 'آجل (دين)';

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>فاتورة مبيعات - ${data.invoiceId.slice(0, 8)}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #fff; color: #1e293b; padding: 30px; font-size: 13px; line-height: 1.5; }
            .invoice-box { max-width: 800px; margin: auto; border: 1px solid #e2e8f0; padding: 25px; border-radius: 12px; background: #ffffff; }
            
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #4f46e5; padding-bottom: 15px; margin-bottom: 20px; }
            .store-title { font-size: 22px; font-weight: 800; color: #1e1b4b; }
            .store-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
            .invoice-tag { text-align: left; }
            .invoice-badge { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 12px; border-radius: 6px; font-weight: bold; font-size: 14px; }
            .meta-text { font-size: 11px; color: #64748b; margin-top: 5px; font-family: monospace; }

            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #f1f5f9; }
            .details-box h4 { font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 4px; font-weight: 700; }
            .details-box p { font-size: 13px; font-weight: 600; color: #0f172a; }

            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #4f46e5; color: #ffffff; padding: 10px 12px; text-align: right; font-size: 12px; font-weight: 600; }
            th:first-child { border-top-right-radius: 6px; }
            th:last-child { border-top-left-radius: 6px; text-align: left; }
            td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right; }
            td.left { text-align: left; font-family: monospace; font-weight: 600; }

            .summary-section { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-top: 15px; }
            .payment-badge-box { background: #f1f5f9; border-radius: 8px; padding: 12px; width: 45%; border: 1px solid #e2e8f0; }
            .summary-table { width: 50%; }
            .summary-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #cbd5e1; font-size: 12px; }
            .summary-row.total { border-bottom: none; border-top: 2px solid #4f46e5; padding-top: 10px; margin-top: 6px; font-size: 16px; font-weight: 800; color: #1e1b4b; }
            
            .debt-warning { margin-top: 8px; background: #fff1f2; border: 1px solid #fecdd3; padding: 8px; border-radius: 6px; color: #9f1239; font-weight: bold; font-size: 12px; text-align: center; }

            .footer { margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; color: #94a3b8; }
            .signature-area { margin-top: 25px; display: flex; justify-content: space-between; padding: 0 40px; font-size: 12px; font-weight: 600; color: #475569; }

            @media print {
              body { padding: 0; background: #fff; }
              .invoice-box { border: none; padding: 0; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="invoice-box">
            <div class="header">
              <div>
                <div class="store-title">${data.storeName || 'المتجر التجارى'}</div>
                <div class="store-sub">
                  ${data.storePhone ? 'هاتف: ' + data.storePhone : ''} 
                  ${data.storeEmail ? ' | بريد: ' + data.storeEmail : ''}
                </div>
              </div>
              <div class="invoice-tag">
                <span class="invoice-badge">فاتورة مبيعات</span>
                <div class="meta-text">رقم الفاتورة: #${data.invoiceId.slice(0, 8)}</div>
                <div class="meta-text">التاريخ: ${new Date(data.date).toLocaleString('ar-EG')}</div>
              </div>
            </div>

            <div class="details-grid">
              <div class="details-box">
                <h4>معلومات العميل / الزبون</h4>
                <p>${data.customerName || 'زبون نقدي'}</p>
                ${data.customerPhone ? `<p style="font-size:11px; color:#475569; font-weight:normal;">رقم الهاتف: ${data.customerPhone}</p>` : ''}
                ${data.customerAddress ? `<p style="font-size:11px; color:#475569; font-weight:normal;">العنوان: ${data.customerAddress}</p>` : ''}
              </div>
              <div class="details-box">
                <h4>طريقة الدفع والدفعات</h4>
                <p style="color: ${data.paymentType === 'CREDIT' ? '#e11d48' : '#059669'}">${paymentTypeText}</p>
                ${data.paymentType === 'CREDIT' ? `
                  <p style="font-size:11px; color:#475569; margin-top:4px;">
                    الدفعة الأولى النقدية: <strong>${formatCurrency(data.paidAmount, data.currency)}</strong>
                  </p>
                  <p style="font-size:11px; color:#e11d48; font-weight:bold;">
                    المبلغ المتبقي كدين: <strong>${formatCurrency(data.debtAmount, data.currency)}</strong>
                  </p>
                ` : ''}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>المنتج / البيان</th>
                  <th>الكود</th>
                  <th>الكمية</th>
                  <th>سعر الوحدة</th>
                  <th style="text-align:left;">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${data.items.map((item, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td style="font-weight: bold;">${item.name}</td>
                    <td style="font-family: monospace; color: #64748b;">${item.barcode || '-'}</td>
                    <td>${formatNumber(item.quantity)}</td>
                    <td>${formatCurrency(item.price, data.currency)}</td>
                    <td class="left">${formatCurrency(item.quantity * item.price, data.currency)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="summary-section">
              <div class="payment-badge-box">
                <div style="font-size:11px; font-weight:bold; color:#475569; margin-bottom:6px;">ملاحظات وشروط الدفع</div>
                <div style="font-size:11px; color:#64748b;">
                  شكراً لتعاملكم معنا. البضاعة المباعة تطبق عليها سياسة الاستبدال والاسترجاع حسب الشروط المعتمدة.
                </div>
                ${data.debtAmount > 0 ? `
                  <div class="debt-warning">
                    تنبيه: يوجد مبلغ آجل متبقي بقيمة ${formatCurrency(data.debtAmount, data.currency)} مسجل في الذمم والديون.
                  </div>
                ` : ''}
              </div>

              <div class="summary-table">
                <div class="summary-row">
                  <span>المجموع الفرعي:</span>
                  <span>${formatCurrency(data.subtotal, data.currency)}</span>
                </div>
                ${data.discount > 0 ? `
                  <div class="summary-row" style="color: #e11d48;">
                    <span>الخصم الممنوح:</span>
                    <span>-${formatCurrency(data.discount, data.currency)}</span>
                  </div>
                ` : ''}
                ${data.tax > 0 ? `
                  <div class="summary-row">
                    <span>الضريبة:</span>
                    <span>+${formatCurrency(data.tax, data.currency)}</span>
                  </div>
                ` : ''}
                <div class="summary-row total">
                  <span>الإجمالي الصافي:</span>
                  <span>${formatCurrency(data.totalAmount, data.currency)}</span>
                </div>
              </div>
            </div>

            <div class="signature-area">
              <div>توقيع واستلام العميل: ..........................</div>
              <div>توقيع وتختيم النشاط التجاري: ..........................</div>
            </div>

            <div class="footer">
              تم إصدار هذه الفاتورة إلكترونياً من نظام إداري متكامل.
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static printInvoice(data: InvoiceData) {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(this.generateHTML(data));
      printWindow.document.close();
    }
  }

  static printAccountStatement(data: {
    storeName: string;
    entityName: string;
    entityType: 'CUSTOMER' | 'SUPPLIER';
    records: Array<{
      date: string;
      notes?: string;
      totalAmount: number;
      paidAmount: number;
      remainingAmount: number;
      status: string;
      payments: Array<{ date: string; amount: number; notes?: string }>;
    }>;
    currency: string;
  }) {
    const title = data.entityType === 'CUSTOMER' ? 'كشف حساب عميل (ديون ومستحقات)' : 'كشف حساب مورد (التزامات ودفعات)';
    const totalRemaining = data.records.reduce((acc, r) => acc + r.remainingAmount, 0);

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>${title} - ${data.entityName}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #fff; color: #1e293b; padding: 30px; font-size: 13px; line-height: 1.5; }
            .statement-box { max-width: 850px; margin: auto; border: 1px solid #e2e8f0; padding: 25px; border-radius: 12px; }
            .header { border-bottom: 2px solid #4f46e5; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
            .store-name { font-size: 20px; font-weight: 800; color: #1e1b4b; }
            .title-badge { background: #e0e7ff; color: #3730a3; padding: 4px 12px; border-radius: 6px; font-weight: bold; font-size: 14px; }
            .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #4f46e5; color: #fff; padding: 10px; text-align: right; font-size: 12px; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right; }
            .payment-row { background: #f1f5f9; font-size: 11px; color: #059669; }
            @media print { body { padding: 0; } .statement-box { border: none; padding: 0; } }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="statement-box">
            <div class="header">
              <div>
                <div class="store-name">${data.storeName}</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">كشف حركة الحساب والديون التفصيلي</div>
              </div>
              <div style="text-align: left;">
                <span class="title-badge">${title}</span>
                <div style="font-size: 11px; color: #64748b; margin-top: 6px;">تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')}</div>
              </div>
            </div>

            <div class="summary-card">
              <div>
                <div style="font-size: 11px; color: #64748b;">اسم الحساب / الشخص:</div>
                <div style="font-size: 16px; font-weight: bold; color: #0f172a;">${data.entityName}</div>
              </div>
              <div style="text-align: left;">
                <div style="font-size: 11px; color: #64748b;">إجمالي الرصيد المتبقي المترتب:</div>
                <div style="font-size: 20px; font-weight: 900; color: #e11d48; font-family: monospace;">${formatCurrency(totalRemaining, data.currency)}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>تاريخ الدين</th>
                  <th>بيان / سبب الدين</th>
                  <th>إجمالي الدين</th>
                  <th>المسدد</th>
                  <th>المتبقي</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                ${data.records.map(r => `
                  <tr>
                    <td style="font-family: monospace;">${new Date(r.date).toLocaleDateString('ar-EG')}</td>
                    <td style="font-weight: bold;">${r.notes || 'سجل دين'}</td>
                    <td style="font-family: monospace;">${formatCurrency(r.totalAmount, data.currency)}</td>
                    <td style="font-family: monospace; color: #059669;">${formatCurrency(r.paidAmount, data.currency)}</td>
                    <td style="font-family: monospace; font-weight: bold; color: #e11d48;">${formatCurrency(r.remainingAmount, data.currency)}</td>
                    <td>${r.status === 'PAID' ? 'مسدد بالكامل' : r.status === 'PARTIAL' ? 'جزئي' : 'غير مسدد'}</td>
                  </tr>
                  ${r.payments.map(p => `
                    <tr class="payment-row">
                      <td colspan="2" style="padding-right: 25px;">↳ دفعة مسددة: ${p.notes || 'دفعة نقداً'} بتاريخ (${new Date(p.date).toLocaleDateString('ar-EG')})</td>
                      <td colspan="4" style="font-family: monospace; font-weight: bold;">+ ${formatCurrency(p.amount, data.currency)}</td>
                    </tr>
                  `).join('')}
                `).join('')}
              </tbody>
            </table>

            <div style="margin-top: 30px; display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; color: #475569;">
              <div>توقيع صاحب الحساب: ..........................</div>
              <div>توقيع المعتمد / المحاسب: ..........................</div>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  }
}
