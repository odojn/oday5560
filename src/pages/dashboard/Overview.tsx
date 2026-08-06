import React from 'react';
import { useDB } from '../../store/dbStore';
import { useAuth } from '../../store/authStore';
import { Package, TrendingUp, DollarSign, AlertCircle, ArrowLeft } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/format';
import { useNavigate } from 'react-router-dom';

export default function Overview() {
  const { currentUser } = useAuth();
  const { products, sales, damagedGoods, settings } = useDB();
  const navigate = useNavigate();

  const storeId = currentUser?.storeId || '';
  const storeSettings = settings[storeId] || { currency: 'ILS' };

  const storeProducts = products.filter(p => p.storeId === storeId);
  const storeSales = sales.filter(s => s.storeId === storeId);
  const storeDamaged = damagedGoods.filter(d => d.storeId === storeId);

  const totalProducts = storeProducts.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalSalesAmount = storeSales.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalProfit = storeSales.reduce((acc, curr) => acc + curr.totalProfit, 0);
  const totalDamagedValue = storeDamaged.reduce((acc, curr) => acc + curr.lostValue, 0);

  const stats = [
    { title: 'إجمالي المنتجات', value: totalProducts, icon: Package, color: 'bg-blue-50 text-blue-600', border: 'border-blue-200' },
    { title: 'إجمالي المبيعات', value: formatCurrency(totalSalesAmount, storeSettings.currency), icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-200' },
    { title: 'إجمالي الأرباح', value: formatCurrency(totalProfit, storeSettings.currency), icon: DollarSign, color: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-200' },
    { title: 'خسائر البضاعة التالفة', value: formatCurrency(totalDamagedValue, storeSettings.currency), icon: AlertCircle, color: 'bg-rose-50 text-rose-600', border: 'border-rose-200' },
  ];

  const profitMargin = totalSalesAmount > 0 ? (totalProfit / totalSalesAmount) * 100 : 0;

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <div className="grid grid-cols-4 gap-6 shrink-0">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm mb-1">إجمالي المبيعات</p>
          <h3 className="text-2xl font-bold text-slate-800 font-mono">{formatCurrency(totalSalesAmount, storeSettings.currency)}</h3>
          <div className="mt-2 text-xs text-green-600 font-medium tracking-tight">تم حسابها بنجاح</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm mb-1">الأرباح الصافية</p>
          <h3 className="text-2xl font-bold text-emerald-600 font-mono">{formatCurrency(totalProfit, storeSettings.currency)}</h3>
          <div className="mt-2 text-xs font-medium tracking-tight flex items-center justify-between">
            <span className="text-green-600">هامش الربح:</span>
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-bold">{profitMargin.toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm mb-1">إجمالي المخزون</p>
          <h3 className="text-2xl font-bold text-slate-800">{formatNumber(totalProducts)} <span className="text-xs font-normal text-slate-400">قطعة</span></h3>
          <div className="mt-2 text-xs text-indigo-600 font-medium tracking-tight">متوفرة في المخزون</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm mb-1">قيمة الخسائر</p>
          <h3 className="text-2xl font-bold text-orange-500 font-mono">{formatCurrency(totalDamagedValue, storeSettings.currency)}</h3>
          <div className="mt-2 text-xs text-slate-400 font-medium tracking-tight underline cursor-pointer">إجمالي التوالف</div>
        </div>
      </div>
      
      <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
        <div className="col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h4 className="font-bold">نظرة عامة على المنتجات</h4>
              <p className="text-xs text-slate-400">أحدث المنتجات المضافة في المخزون</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate('/app/inventory')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700">+ منتج جديد</button>
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-tighter border-b border-slate-100">
              <tr className="h-10 text-[10px]">
                <th className="px-4 py-2 font-medium">المنتج</th>
                <th className="px-4 py-2 font-medium">الكمية</th>
                <th className="px-4 py-2 font-medium">سعر المفرق</th>
                <th className="px-4 py-2 font-medium">تاريخ الانتهاء</th>
                <th className="px-4 py-2 font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {storeProducts.slice(0, 5).map(prod => (
                <tr key={prod.id} className={prod.quantity <= 10 ? "bg-orange-50/30" : ""}>
                  <td className="px-4 py-3 font-bold text-slate-700">{prod.name}</td>
                  <td className={`px-4 py-3 ${prod.quantity <= 10 ? 'text-orange-600 font-bold' : ''}`}>{formatNumber(prod.quantity)} وحدة</td>
                  <td className="px-4 py-3 font-mono">{prod.retailPrice ? formatCurrency(prod.retailPrice, storeSettings.currency) : '-'}</td>
                  <td className="px-4 py-3 text-slate-400">{prod.expiryDate || '-'}</td>
                  <td className="px-4 py-3 text-indigo-600 font-semibold cursor-pointer"></td>
                </tr>
              ))}
                {storeProducts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">لا يوجد منتجات لعرضها</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
            <h4 className="text-lg font-bold mb-2">نظام المبيعات الذكي</h4>
            <p className="text-xs text-indigo-100 leading-relaxed mb-6">حل شامل لمشاكل التوريد، الفاقد، وموازنة الأرباح بدقة متناهية عبر خوارزميات متطورة.</p>
            <div className="space-y-3">
              <button onClick={() => navigate('/app/retail-pos')} className="w-full bg-white/10 p-3 rounded-xl flex items-center justify-between border border-white/10 hover:bg-white/20 transition-colors">
                <span className="text-xs">إضافة مبيعة مفرق</span>
                <div className="w-6 h-6 bg-white rounded flex items-center justify-center text-indigo-600 font-bold">+</div>
              </button>
              <button onClick={() => navigate('/app/financials')} className="w-full bg-white/10 p-3 rounded-xl flex items-center justify-between border border-white/10 hover:bg-white/20 transition-colors">
                <span className="text-xs">التقرير المالي (PDF)</span>
                <div className="w-6 h-6 bg-white rounded flex items-center justify-center text-indigo-600 font-bold">↓</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
