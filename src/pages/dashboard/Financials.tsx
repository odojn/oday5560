import React, { useState } from 'react';
import { useDB } from '../../store/dbStore';
import { useAuth } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Printer, TrendingUp, TrendingDown, DollarSign, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency, formatNumber } from '../../utils/format';

export default function Financials() {
  const { currentUser } = useAuth();
  const { sales, expenses, addExpense, damagedGoods, settings } = useDB();
  const storeId = currentUser?.storeId || '';
  const storeSettings = settings[storeId] || { currency: 'ILS' };
  
  const storeSales = sales.filter(s => s.storeId === storeId);
  const storeExpenses = expenses.filter(e => e.storeId === storeId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const storeDamaged = damagedGoods.filter(d => d.storeId === storeId);

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ description: '', amount: '' });
  const [includeUncollectedDebts, setIncludeUncollectedDebts] = useState(false);

  // Calculations
  const totalRevenue = storeSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalGrossProfit = storeSales.reduce((sum, sale) => sum + sale.totalProfit, 0); // Total Profit if all sales paid

  // Breakdown of Cash Collected Profit vs Uncollected Debt Profit
  let collectedCashProfit = 0;
  let uncollectedDebtProfit = 0;
  let totalOutstandingCustomerDebt = 0;

  storeSales.forEach(sale => {
    const totalAmt = sale.totalAmount || 0;
    const profit = sale.totalProfit || 0;
    const debt = sale.debtAmount || 0;
    totalOutstandingCustomerDebt += debt;

    if (totalAmt > 0) {
      const paid = sale.paidAmount !== undefined ? Math.min(totalAmt, Math.max(0, sale.paidAmount)) : (totalAmt - debt);
      const paidRatio = Math.min(1, Math.max(0, paid / totalAmt));
      collectedCashProfit += profit * paidRatio;
      uncollectedDebtProfit += profit * (1 - paidRatio);
    } else {
      collectedCashProfit += profit;
    }
  });

  const totalExpenses = storeExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalDamagedValue = storeDamaged.reduce((sum, d) => sum + d.lostValue, 0);
  
  // Effective Gross Profit & Net Profit based on user preference toggle
  const activeGrossProfit = includeUncollectedDebts ? totalGrossProfit : collectedCashProfit;
  const netProfit = activeGrossProfit - totalExpenses - totalDamagedValue;

  const retailRevenue = storeSales.filter(s => s.type === 'RETAIL').reduce((sum, s) => sum + s.totalAmount, 0);
  const wholesaleRevenue = storeSales.filter(s => s.type === 'WHOLESALE').reduce((sum, s) => sum + s.totalAmount, 0);
  const generalRevenue = storeSales.filter(s => s.type === 'GENERAL').reduce((sum, s) => sum + s.totalAmount, 0);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense({
      id: uuidv4(),
      storeId,
      description: formData.description,
      amount: Number(formData.amount) || 0,
      createdAt: new Date().toISOString(),
    });
    setFormData({ description: '', amount: '' });
    setIsAdding(false);
  };

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if(printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>التقرير المالي الشامل والأرباح</title>
            <style>
              body { font-family: Tahoma, Arial, sans-serif; padding: 40px; line-height: 1.6; color: #1e293b; }
              h1 { text-align: center; color: #1e1b4b; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
              .section { margin-top: 30px; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
              .card { padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; }
              .val { font-size: 22px; font-weight: bold; color: #4f46e5; }
              .neg { color: #e11d48; }
              .pos { color: #059669; }
              .badge { display: inline-block; padding: 4px 10px; background: #e0e7ff; color: #3730a3; border-radius: 4px; font-size: 12px; font-weight: bold; margin-bottom: 8px; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: right; }
              th { background: #f1f5f9; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            <h1>التقرير المالي الشامل والأرباح - نظام Ode.5</h1>
            <p>تاريخ التقرير: ${new Date().toLocaleString('ar-EG')}</p>
            <p className="badge">حالة تضمين أرباح الديون والذمم: ${includeUncollectedDebts ? 'مضَمّنة بالكامل في الأرباح' : 'غير مضَمّنة (الربح النقدي المحصل فقط)'}</p>
            
            <div class="section grid">
              <div class="card">
                <h3>إجمالي المبيعات (الإيرادات)</h3>
                <div class="val">${formatCurrency(totalRevenue, storeSettings.currency)}</div>
                <ul style="margin-top:10px; font-size: 14px;">
                  <li>مبيعات المفرق: ${formatCurrency(retailRevenue, storeSettings.currency)}</li>
                  <li>مبيعات الجملة: ${formatCurrency(wholesaleRevenue, storeSettings.currency)}</li>
                  <li>مبيعات عامة: ${formatCurrency(generalRevenue, storeSettings.currency)}</li>
                </ul>
              </div>
              <div class="card">
                <h3>صافي الربح النهائي المعتمد</h3>
                <div class="val pos">${formatCurrency(netProfit, storeSettings.currency)}</div>
                <p style="font-size:12px; color:#64748b; margin-top:5px;">
                  ${includeUncollectedDebts ? 'يشمل الأرباح النقدية وأرباح الآجل والديون' : 'يعتمد فقط على الأرباح المحصلة نقدياً'}
                </p>
              </div>
            </div>

            <div class="section grid">
              <div class="card">
                <h3>الأرباح النقدية المحصلة فعلياً</h3>
                <div class="val pos">${formatCurrency(collectedCashProfit, storeSettings.currency)}</div>
              </div>
              <div class="card">
                <h3>أرباح الديون والآجل المتبقية</h3>
                <div class="val" style="color: #d97706">${formatCurrency(uncollectedDebtProfit, storeSettings.currency)}</div>
              </div>
            </div>

            <div class="section grid">
              <div class="card">
                <h3>إجمالي المصروفات التشغيلية</h3>
                <div class="val neg">${formatCurrency(totalExpenses, storeSettings.currency)}</div>
              </div>
              <div class="card">
                <h3>خسائر البضاعة التالفة</h3>
                <div class="val neg">${formatCurrency(totalDamagedValue, storeSettings.currency)}</div>
              </div>
            </div>

            <div class="section">
              <h2>سجل المصروفات (التكاليف)</h2>
              <table>
                <tr><th>البيان</th><th>المبلغ</th><th>التاريخ</th></tr>
                ${storeExpenses.map(e => `<tr><td>${e.description}</td><td>${formatCurrency(e.amount, storeSettings.currency)}</td><td>${new Date(e.createdAt).toLocaleDateString('ar-EG')}</td></tr>`).join('')}
                ${storeExpenses.length === 0 ? '<tr><td colspan="3" style="text-align:center">لا يوجد مصروفات</td></tr>' : ''}
              </table>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h4 className="font-bold text-slate-800">التكاليف والأرباح وتقارير الديون</h4>
            <p className="text-xs text-slate-500">تحليل المبيعات النقدية مقابل أرباح الديون والآجل ومؤشرات الصافي</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Toggle Switch to include/exclude debt profit */}
            <label className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-xl text-xs font-bold text-indigo-900 cursor-pointer hover:bg-indigo-100 transition-all">
              <input 
                type="checkbox" 
                checked={includeUncollectedDebts} 
                onChange={e => setIncludeUncollectedDebts(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" 
              />
              إدراج أرباح الديون غير المحصلة
            </label>

            <button onClick={handlePrintReport} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-900 flex items-center gap-2 shadow-sm">
              <Printer className="w-4 h-4" />
              طباعة التقرير الشامل
            </button>
          </div>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-bold mb-1">إجمالي الإيرادات (المبيعات)</p>
          <h3 className="text-2xl font-bold text-slate-800 font-mono">{formatCurrency(totalRevenue, storeSettings.currency)}</h3>
          <div className="mt-2 text-[11px] text-indigo-600 font-medium">مبيعات نقدية وآجلة</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-sm">
          <p className="text-slate-500 text-xs font-bold mb-1">أرباح نقدية (محصلة فعلياً)</p>
          <h3 className="text-2xl font-bold text-emerald-600 font-mono">{formatCurrency(collectedCashProfit, storeSettings.currency)}</h3>
          <div className="mt-2 text-[11px] text-emerald-600 font-medium">مبالغ دخلت الخزينة</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm">
          <p className="text-slate-500 text-xs font-bold mb-1">أرباح الديون والآجل (غير محصلة)</p>
          <h3 className="text-2xl font-bold text-amber-600 font-mono">{formatCurrency(uncollectedDebtProfit, storeSettings.currency)}</h3>
          <div className="mt-2 text-[11px] text-amber-700 font-medium">أرباح مسجلة كديون للعملاء</div>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800">
          <div className="flex justify-between items-center mb-1">
            <p className="text-slate-300 text-xs font-bold">صافي الربح المعتمد</p>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${includeUncollectedDebts ? 'bg-amber-400 text-slate-900' : 'bg-emerald-400 text-slate-900'}`}>
              {includeUncollectedDebts ? '+ الديون' : 'نقدي فقط'}
            </span>
          </div>
          <h3 className="text-2xl font-extrabold text-emerald-400 font-mono">{formatCurrency(netProfit, storeSettings.currency)}</h3>
          <div className="mt-2 text-[11px] text-slate-400">
            {includeUncollectedDebts ? 'صافي الربح النقدي والديون - التكاليف' : 'صافي الربح النقدي المحصل - التكاليف'}
          </div>
        </div>
      </div>

      {/* Secondary Financial Indicators: Expenses & Damaged */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-rose-100 bg-rose-50/10 shadow-sm">
          <p className="text-slate-500 text-xs font-bold mb-1">إجمالي المصروفات التشغيلية</p>
          <h3 className="text-2xl font-bold text-rose-600 font-mono">{formatCurrency(totalExpenses, storeSettings.currency)}</h3>
          <div className="mt-2 text-[11px] text-rose-500 font-medium">تكاليف وتصفيات نقدية</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-orange-100 bg-orange-50/10 shadow-sm">
          <p className="text-slate-500 text-xs font-bold mb-1">قيمة الخسائر (بضاعة تالفة)</p>
          <h3 className="text-2xl font-bold text-orange-500 font-mono">{formatCurrency(totalDamagedValue, storeSettings.currency)}</h3>
          <div className="mt-2 text-[11px] text-orange-500 font-medium">تكلفة البضاعة التالفة والمعوضة</div>
        </div>
      </div>

      {/* Expenses Management */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h4 className="font-bold text-slate-800">سجل المصروفات التشغيلية</h4>
          <button onClick={() => setIsAdding(!isAdding)} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-200 flex items-center gap-1">
            <Plus className="w-3 h-3" /> إضافة مصروف
          </button>
        </div>
        
        {isAdding && (
          <form onSubmit={handleAddExpense} className="p-5 border-b border-slate-100 bg-white grid md:grid-cols-3 gap-4 items-end">
            <Input label="البيان (مثال: إيجار، رواتب)" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required className="md:col-span-1 text-sm" />
            <Input label="المبلغ" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required className="md:col-span-1 text-sm" />
            <div className="flex gap-2 mb-[2px]">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600">إلغاء</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 rounded-lg text-sm text-white font-medium">حفظ المصروف</button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-tighter border-b border-slate-100">
              <tr className="h-10 text-[10px]">
                <th className="px-4 py-2 font-medium">البيان</th>
                <th className="px-4 py-2 font-medium">المبلغ</th>
                <th className="px-4 py-2 font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {storeExpenses.map(exp => (
                <tr key={exp.id}>
                  <td className="px-4 py-3 font-bold text-slate-700">{exp.description}</td>
                  <td className="px-4 py-3 font-mono text-red-600 font-bold">{formatCurrency(exp.amount, storeSettings.currency)}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(exp.createdAt).toLocaleDateString('en-US')}</td>
                </tr>
              ))}
              {storeExpenses.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500">لا يوجد مصروفات مسجلة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
  );
}
