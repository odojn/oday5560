import React from 'react';
import { Sale, Store, StoreSettings, SaleItem, Product } from '../types';
import { formatCurrency, formatNumber } from '../utils/format';
import { Printer, X, Zap } from 'lucide-react';
import { PrintService } from '../services/printService';

interface ThermalReceiptProps {
  sale: Partial<Sale> & { items: SaleItem[] };
  productsMap: Record<string, Product>;
  store?: Store;
  currency?: string;
  onClose: () => void;
}

export default function ThermalReceipt({
  sale,
  productsMap,
  store,
  currency = 'ILS',
  onClose
}: ThermalReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDirectThermalPrint = () => {
    PrintService.printDirectThermalReceipt(sale, productsMap, store, currency);
  };

  const total = sale.totalAmount || 0;
  const paid = sale.paidAmount !== undefined ? sale.paidAmount : total;
  const debt = sale.debtAmount || Math.max(0, total - paid);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #thermal-receipt-printable, #thermal-receipt-printable * {
            visibility: visible;
          }
          #thermal-receipt-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 5mm;
            margin: 0;
            background: white !important;
            color: black !important;
            font-size: 12px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh] overflow-hidden no-print-wrapper">
        {/* Header bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm">معاينة الفاتورة الحرارية</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Area */}
        <div className="p-6 overflow-y-auto font-mono text-slate-800 bg-white" id="thermal-receipt-printable">
          <div className="text-center mb-4 border-b border-dashed border-slate-300 pb-3">
            <h2 className="font-extrabold text-lg text-black">{store?.name || 'المتجر'}</h2>
            {store?.phone && <p className="text-xs text-slate-600">هاتف: {store.phone}</p>}
            <p className="text-[11px] text-slate-500 mt-1">{new Date(sale.createdAt || Date.now()).toLocaleString('ar-EG')}</p>
            <p className="text-[11px] font-bold text-slate-700 mt-0.5">رقم الفاتورة: #{sale.id ? sale.id.slice(0, 8) : 'NEW'}</p>
            {sale.customerName && <p className="text-xs font-semibold text-slate-800 mt-1">العميل: {sale.customerName}</p>}
          </div>

          <table className="w-full text-right text-xs mb-3 border-b border-dashed border-slate-300 pb-3">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-1">الصنف</th>
                <th className="py-1 text-center">العدد</th>
                <th className="py-1 text-left">السعر</th>
                <th className="py-1 text-left">المجموع</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, idx) => {
                const prod = productsMap[item.productId];
                const itemTotal = item.price * item.quantity;
                return (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="py-1.5 font-sans font-medium">{prod?.name || 'منتج'}</td>
                    <td className="py-1.5 text-center">{formatNumber(item.quantity)}</td>
                    <td className="py-1.5 text-left">{formatCurrency(item.price, currency)}</td>
                    <td className="py-1.5 text-left font-bold">{formatCurrency(itemTotal, currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="space-y-1 text-xs mb-4">
            <div className="flex justify-between font-extrabold text-sm border-b border-slate-200 pb-1">
              <span>المبلغ الإجمالي:</span>
              <span>{formatCurrency(total, currency)}</span>
            </div>
            <div className="flex justify-between text-slate-600 pt-1">
              <span>طريقة الدفع:</span>
              <span>{sale.paymentType === 'CREDIT' ? 'بالآجل (دين)' : sale.paymentType === 'CARD' ? 'بطاقة' : 'نقداً'}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>المبلغ المدفوع:</span>
              <span>{formatCurrency(paid, currency)}</span>
            </div>
            {debt > 0 && (
              <div className="flex justify-between text-rose-600 font-bold bg-rose-50 p-1.5 rounded">
                <span>المبلغ المتبقي (دين):</span>
                <span>{formatCurrency(debt, currency)}</span>
              </div>
            )}
          </div>

          <div className="text-center text-[10px] text-slate-400 border-t border-dashed border-slate-300 pt-3">
            <p>شكراً لزيارتكم ونتمنى لكم يوماً سعيداً!</p>
            <p className="mt-0.5">نظام إدارة مبيعات متكامل - Ode.5</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-2 no-print">
          <button
            onClick={handleDirectThermalPrint}
            className="flex-1 bg-indigo-600 text-white font-bold py-2.5 px-3 rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-1.5 text-xs shadow-md transition-all"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            طباعة حرارية مباشرة (Iframe)
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 bg-slate-800 text-white font-bold py-2.5 px-3 rounded-xl hover:bg-slate-900 flex items-center justify-center gap-1.5 text-xs shadow-md transition-all"
          >
            <Printer className="w-4 h-4" />
            طباعة المتصفح
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 text-xs"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
