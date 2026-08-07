import React, { useState } from 'react';
import { useDB } from '../../store/dbStore';
import { useAuth } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AlertOctagon, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, formatNumber } from '../../utils/format';

export default function Damaged() {
  const { currentUser } = useAuth();
  const { products, damagedGoods, addDamagedGood, updateProduct, settings } = useDB();
  const storeId = currentUser?.storeId || '';
  const storeSettings = settings[storeId] || { currency: 'ILS' };
  
  const storeProducts = products.filter(p => p.storeId === storeId);
  const storeDamaged = damagedGoods.filter(d => d.storeId === storeId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ productId: '', quantity: '', supplierCompany: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = storeProducts.find(p => p.id === formData.productId);
    if (!product) return;
    const qtyNum = Number(formData.quantity) || 0;
    if (qtyNum <= 0) return;
    if (qtyNum > product.quantity) {
      alert('الكمية التالفة أكبر من المتوفر في المخزون');
      return;
    }

    const lostValue = product.purchasePrice * qtyNum;

    addDamagedGood({
      id: uuidv4(),
      storeId,
      productId: product.id,
      quantity: qtyNum,
      lostValue,
      supplierCompany: formData.supplierCompany,
      createdAt: new Date().toISOString()
    });

    updateProduct(product.id, { quantity: product.quantity - qtyNum });

    setIsAdding(false);
    setFormData({ productId: '', quantity: '', supplierCompany: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">البضاعة التالفة والمرتجعات</h1>
          <p className="text-slate-500 text-sm mt-1">تسجيل التوالف لخصمها من المخزون والأرباح</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} variant="danger">
          <Plus className="w-4 h-4 ml-2" />
          تسجيل بضاعة تالفة
        </Button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-rose-200 grid md:grid-cols-2 gap-4 overflow-hidden">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-slate-700">المنتج التالف</label>
              <select 
                className="h-11 rounded-lg border border-slate-300 px-3 bg-white focus:ring-2 focus:ring-rose-500 outline-none" 
                value={formData.productId}
                onChange={e => setFormData({...formData, productId: e.target.value})}
                required
              >
                <option value="" disabled>اختر منتجاً...</option>
                {storeProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (متوفر: {formatNumber(p.quantity)})</option>
                ))}
              </select>
            </div>
            
            <Input label="الكمية التالفة" type="number" min={1} value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
            <Input label="الشركة الموردة (لاسترجاعها)" value={formData.supplierCompany} onChange={e => setFormData({...formData, supplierCompany: e.target.value})} className="md:col-span-2" />
            
            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <Button variant="ghost" type="button" onClick={() => setIsAdding(false)}>إلغاء</Button>
              <Button type="submit" variant="danger">تسجيل وتأكيد الخصم</Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <h4 className="font-bold text-slate-800">سجل البضاعة التالفة</h4>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-tighter border-b border-slate-100">
              <tr className="h-10 text-[10px]">
                <th className="px-4 py-2 font-medium">المنتج</th>
                <th className="px-4 py-2 font-medium">الكمية</th>
                <th className="px-4 py-2 font-medium">قيمة الخسارة</th>
                <th className="px-4 py-2 font-medium">الشركة الموردة</th>
                <th className="px-4 py-2 font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {storeDamaged.map(item => {
                const product = products.find(p => p.id === item.productId);
                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-bold text-slate-700">{product?.name || 'منتج محذوف'}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{formatNumber(item.quantity)}</td>
                    <td className="px-4 py-3 font-mono text-red-600 font-bold">{formatCurrency(item.lostValue, storeSettings.currency)}</td>
                    <td className="px-4 py-3 text-slate-500">{item.supplierCompany || '-'}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(item.createdAt).toLocaleDateString('en-US')}</td>
                  </tr>
                );
              })}
              {storeDamaged.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">لا يوجد سجلات بضاعة تالفة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
