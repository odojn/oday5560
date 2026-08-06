import React, { useMemo } from 'react';
import { useDB } from '../store/dbStore';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/format';

interface Props {
  productId: string;
  storeId: string;
  onClose: () => void;
}

export function ProductHistoryModal({ productId, storeId, onClose }: Props) {
  const { products, sales, damagedGoods, settings } = useDB();
  const storeSettings = settings[storeId] || { currency: 'ILS' };
  
  const product = products.find(p => p.id === productId);

  const history = useMemo(() => {
    if (!product) return [];
    
    const events: any[] = [];
    
    // Initial Stock (approximate, since we don't track pure additions yet, we just assume current + sold + damaged = initial)
    // Actually, we can just show the sales and damaged as the "History"
    
    // Sales
    sales.filter(s => s.storeId === storeId).forEach(sale => {
      const item = sale.items.find(i => i.productId === productId);
      if (item) {
        let typeName = 'مبيعة عامة';
        if (sale.type === 'RETAIL') typeName = 'مبيعة مفرق';
        if (sale.type === 'WHOLESALE') typeName = 'مبيعة جملة';
        
        events.push({
          id: sale.id,
          date: new Date(sale.createdAt),
          type: 'SALE',
          typeName,
          quantity: -item.quantity,
          price: item.price,
          customer: sale.customerName
        });
      }
    });

    // Damaged Goods
    damagedGoods.filter(d => d.storeId === storeId && d.productId === productId).forEach(damage => {
      events.push({
        id: damage.id,
        date: new Date(damage.createdAt),
        type: 'DAMAGE',
        typeName: 'تالف / خسارة',
        quantity: -damage.quantity,
        price: damage.lostValue / damage.quantity,
        customer: damage.supplierCompany || 'غير محدد'
      });
    });

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [sales, damagedGoods, productId, storeId]);

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-lg text-slate-800">سجل حركة المنتج: {product.name}</h3>
            <p className="text-sm text-slate-500 font-mono mt-1">المتوفر حالياً: {formatNumber(product.quantity)} وحدة</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-0 overflow-y-auto flex-1">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-tighter sticky top-0 border-b border-slate-100 shadow-sm">
              <tr className="h-10 text-[10px]">
                <th className="px-4 py-2 font-medium">التاريخ</th>
                <th className="px-4 py-2 font-medium">نوع الحركة</th>
                <th className="px-4 py-2 font-medium">الكمية</th>
                <th className="px-4 py-2 font-medium">السعر / التكلفة</th>
                <th className="px-4 py-2 font-medium">العميل / المورد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {history.map((evt, i) => (
                <tr key={evt.id + i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-slate-500">{evt.date.toLocaleString('en-US')}</td>
                  <td className="px-4 py-3">
                    {evt.type === 'SALE' ? (
                      <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded text-xs font-bold w-max">
                        <TrendingUp className="w-3 h-3" />
                        {evt.typeName}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded text-xs font-bold w-max">
                        <AlertTriangle className="w-3 h-3" />
                        {evt.typeName}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-800 dir-ltr">{evt.quantity > 0 ? '+' : ''}{evt.quantity}</td>
                  <td className="px-4 py-3 font-mono">{formatCurrency(evt.price, storeSettings.currency)}</td>
                  <td className="px-4 py-3 text-slate-600">{evt.customer || '-'}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">لا يوجد حركات مسجلة لهذا المنتج</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
