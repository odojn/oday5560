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
  const [formData, setFormData] = useState({ description: '', amount: 0 });

  // Calculations
  const totalRevenue = storeSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const grossProfit = storeSales.reduce((sum, sale) => sum + sale.totalProfit, 0); // Profit before expenses
  const totalExpenses = storeExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalDamagedValue = storeDamaged.reduce((sum, d) => sum + d.lostValue, 0);
  
  // Net profit = Gross profit - explicit expenses - damaged goods cost
  const netProfit = grossProfit - totalExpenses - totalDamagedValue;

  const retailRevenue = storeSales.filter(s => s.type === 'RETAIL').reduce((sum, s) => sum + s.totalAmount, 0);
  const wholesaleRevenue = storeSales.filter(s => s.type === 'WHOLESALE').reduce((sum, s) => sum + s.totalAmount, 0);
  const generalRevenue = storeSales.filter(s => s.type === 'GENERAL').reduce((sum, s) => sum + s.totalAmount, 0);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense({
      id: uuidv4(),
      storeId,
      description: formData.description,
      amount: formData.amount,
      createdAt: new Date().toISOString(),
    });
    setFormData({ description: '', amount: 0 });
    setIsAdding(false);
  };

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if(printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>التقرير المالي الشامل</title>
            <style>
              body { font-family: Tahoma, Arial, sans-serif; padding: 40px; line-height: 1.6; }
              h1 { text-align: center; color: #1e1b4b; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
              .section { margin-top: 30px; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
              .card { padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; }
              .val { font-size: 24px; font-weight: bold; color: #4f46e5; }
              .neg { color: #e11d48; }
              .pos { color: #059669; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: right; }
              th { background: #f1f5f9; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            <h1>التقرير المالي الشامل - نظام Ode.5</h1>
            <p>تاريخ الإصدار: ${new Date().toLocaleString('en-US')}</p>
            
            <div class="section grid">
              <div class="card">
                <h3>إجمالي الإيرادات (المبيعات)</h3>
                <div class="val">${formatCurrency(totalRevenue, storeSettings.currency)}</div>
                <ul style="margin-top:10px; font-size: 14px;">
                  <li>مبيعات المفرق: ${formatCurrency(retailRevenue, storeSettings.currency)}</li>
                  <li>مبيعات الجملة: ${formatCurrency(wholesaleRevenue, storeSettings.currency)}</li>
                  <li>مبيعات عامة: ${formatCurrency(generalRevenue, storeSettings.currency)}</li>
                </ul>
              </div>
              <div class="card">
                <h3>صافي الأرباح (النهائي)</h3>
                <div class="val pos">${formatCurrency(netProfit, storeSettings.currency)}</div>
              </div>
            </div>

            <div class="section grid">
              <div class="card">
                <h3>إجمالي المصروفات التشغيلية</h3>
                <div class="val neg">${formatCurrency(totalExpenses, storeSettings.currency)}</div>
              </div>
              <div class="card">
                <h3>إجمالي الخسائر (بضاعة تالفة)</h3>
                <div class="val neg">${formatCurrency(totalDamagedValue, storeSettings.currency)}</div>
              </div>
            </div>

            <div class="section">
              <h2>سجل المصروفات (التكاليف)</h2>
              <table>
                <tr><th>البيان</th><th>المبلغ</th><th>التاريخ</th></tr>
                ${storeExpenses.map(e => `<tr><td>${e.description}</td><td>${formatCurrency(e.amount, storeSettings.currency)}</td><td>${new Date(e.createdAt).toLocaleDateString('en-US')}</td></tr>`).join('')}
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
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h4 className="font-bold text-slate-800">التكاليف والأرباح (المالية)</h4>
            <p className="text-xs text-slate-400">تحليل مالي متكامل وإدارة المصروفات التشغيلية</p>
          </div>
          <button onClick={handlePrintReport} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-900 flex items-center gap-2">
            <Printer className="w-4 h-4" />
            طباعة التقرير الشامل
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm mb-1">إجمالي الإيرادات</p>
          <h3 className="text-2xl font-bold text-slate-800 font-mono">{formatCurrency(totalRevenue, storeSettings.currency)}</h3>
          <div className="mt-2 text-xs text-indigo-600 font-medium tracking-tight">إجمالي عمليات البيع</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm mb-1">صافي الأرباح</p>
          <h3 className="text-2xl font-bold text-emerald-600 font-mono">{formatCurrency(netProfit, storeSettings.currency)}</h3>
          <div className="mt-2 text-xs text-emerald-500 font-medium tracking-tight">بعد خصم التكاليف</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm mb-1">إجمالي المصروفات</p>
          <h3 className="text-2xl font-bold text-rose-600 font-mono">{formatCurrency(totalExpenses, storeSettings.currency)}</h3>
          <div className="mt-2 text-xs text-rose-500 font-medium tracking-tight">تكاليف تشغيلية</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm mb-1">قيمة الخسائر (تالف)</p>
          <h3 className="text-2xl font-bold text-orange-500 font-mono">{formatCurrency(totalDamagedValue, storeSettings.currency)}</h3>
          <div className="mt-2 text-xs text-orange-500 font-medium tracking-tight">بضاعة تالفة</div>
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
            <Input label="المبلغ" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} required className="md:col-span-1 text-sm" />
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
