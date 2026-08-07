import React, { useState, useMemo } from 'react';
import { useDB } from '../../store/dbStore';
import { useAuth } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Search, Eye, X, Barcode } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, formatNumber } from '../../utils/format';
import { ProductHistoryModal } from '../../components/ProductHistoryModal';

export default function Inventory() {
  const { currentUser } = useAuth();
  const { products, categories, addProduct, updateProduct, deleteProduct, settings } = useDB();
  const storeId = currentUser?.storeId || '';
  
  const storeProducts = products.filter(p => p.storeId === storeId);
  const storeCategories = categories.filter(c => c.storeId === storeId);
  const storeSettings = settings[storeId] || { currency: 'ILS' };
  
  const [isAdding, setIsAdding] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<any>(null);
  const [historyProductId, setHistoryProductId] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  const [formData, setFormData] = useState({
    name: '', barcode: '', categoryId: '', description: '', purchasePrice: '', 
    wholesalePrice: '', retailPrice: '', quantity: '', expiryDate: '', imageUrl: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateProduct(editingId, {
        ...formData,
        purchasePrice: Number(formData.purchasePrice),
        wholesalePrice: Number(formData.wholesalePrice),
        retailPrice: formData.retailPrice ? Number(formData.retailPrice) : undefined,
        quantity: Number(formData.quantity)
      } as any);
      setEditingId(null);
    } else {
      addProduct({
        ...formData,
        purchasePrice: Number(formData.purchasePrice),
        wholesalePrice: Number(formData.wholesalePrice),
        retailPrice: formData.retailPrice ? Number(formData.retailPrice) : undefined,
        quantity: Number(formData.quantity),
        id: uuidv4(),
        storeId,
      } as any);
    }
    setFormData({ name: '', barcode: '', categoryId: '', description: '', purchasePrice: '', wholesalePrice: '', retailPrice: '', quantity: '', expiryDate: '', imageUrl: '' });
    setIsAdding(false);
  };

  const filteredProducts = useMemo(() => {
    return storeProducts.filter(p => {
      const matchesSearch = p.name.includes(search);
      const matchesCat = categoryFilter ? p.categoryId === categoryFilter : true;
      return matchesSearch && matchesCat;
    });
  }, [storeProducts, search, categoryFilter]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-wrap gap-4">
          <div>
            <h4 className="font-bold text-slate-800">إدارة المخزون الاحترافية</h4>
            <p className="text-xs text-slate-400">المنتجات المتوفرة والتفاصيل</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setIsAdding(true); setEditingId(null); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              منتج جديد
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 bg-white">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="ابحث برقم المنتج أو اسمه..." 
              className="w-full h-10 pl-4 pr-9 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="h-10 rounded-lg border border-slate-200 px-4 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none min-w-[200px] text-sm text-slate-700 bg-white"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="">جميع الأصناف</option>
            {storeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-tighter border-b border-slate-100">
              <tr className="h-10 text-[10px]">
                <th className="px-4 py-2 font-medium">المنتج</th>
                <th className="px-4 py-2 font-medium">الكود / الباركود</th>
                <th className="px-4 py-2 font-medium">الصنف</th>
                <th className="px-4 py-2 font-medium">الكمية</th>
                <th className="px-4 py-2 font-medium">سعر الشراء</th>
                <th className="px-4 py-2 font-medium">سعر المفرق</th>
                <th className="px-4 py-2 font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProducts.map(prod => (
                <tr key={prod.id} className={prod.quantity <= 10 ? "bg-orange-50/30" : ""}>
                  <td className="px-4 py-3 font-bold text-slate-700">{prod.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">
                    {prod.barcode ? (
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        <Barcode className="w-3 h-3 text-indigo-600" />
                        {prod.barcode}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{storeCategories.find(c => c.id === prod.categoryId)?.name}</td>
                  <td className={`px-4 py-3 ${prod.quantity <= 10 ? 'text-orange-600 font-semibold' : ''}`}>
                    {formatNumber(prod.quantity)} وحدة {prod.quantity <= 10 ? '(منخفض)' : ''}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">{formatCurrency(prod.purchasePrice, storeSettings.currency)}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{prod.retailPrice ? formatCurrency(prod.retailPrice, storeSettings.currency) : '-'}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button className="text-blue-600 font-semibold hover:underline flex items-center gap-1" onClick={() => setViewingProduct(prod)}>
                      <Eye className="w-3 h-3" />
                      عرض
                    </button>
                    <span className="text-slate-300">|</span>
                    <button className="text-emerald-600 font-semibold hover:underline" onClick={() => setHistoryProductId(prod.id)}>السجل</button>
                    <span className="text-slate-300">|</span>
                    <button className="text-indigo-600 font-semibold hover:underline" onClick={() => {
                      setFormData({
                        ...prod,
                        barcode: prod.barcode || '',
                        purchasePrice: prod.purchasePrice.toString(),
                        wholesalePrice: prod.wholesalePrice.toString(),
                        retailPrice: prod.retailPrice ? prod.retailPrice.toString() : '',
                        quantity: prod.quantity.toString(),
                        imageUrl: prod.imageUrl || ''
                      } as any);
                      setEditingId(prod.id);
                      setIsAdding(true);
                    }}>تعديل</button>
                    <span className="text-slate-300">|</span>
                    <button className="text-red-600 font-semibold hover:underline" onClick={() => deleteProduct(prod.id)}>حذف</button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">لا يوجد منتجات تطابق بحثك</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0, height:0}} onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid md:grid-cols-3 gap-4">
            <Input label="اسم المنتج" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-slate-700">رمز الباركود / الكود</label>
              <div className="flex gap-2">
                <Input 
                  value={formData.barcode} 
                  onChange={e => setFormData({...formData, barcode: e.target.value})} 
                  placeholder="أدخل أو امسح الباركود..." 
                />
                <Button 
                  type="button" 
                  variant="secondary" 
                  className="whitespace-nowrap text-xs px-3"
                  onClick={() => {
                    const generated = '629' + Math.floor(100000000 + Math.random() * 900000000).toString();
                    setFormData({...formData, barcode: generated});
                  }}
                >
                  توليد كود
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-slate-700">الصنف</label>
              <select 
                className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                value={formData.categoryId} 
                onChange={e => setFormData({...formData, categoryId: e.target.value})}
                required
              >
                <option value="">اختر صنفاً...</option>
                {storeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Input label="الكمية" type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
            
            <Input label="سعر الشراء" type="number" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} required />
            <Input label="سعر الجملة" type="number" value={formData.wholesalePrice} onChange={e => setFormData({...formData, wholesalePrice: e.target.value})} required />
            <Input label="سعر المفرق (اختياري)" type="number" value={formData.retailPrice} onChange={e => setFormData({...formData, retailPrice: e.target.value})} />
            
            <Input label="رابط الصورة (اختياري)" type="url" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." />
            <Input label="تاريخ الانتهاء (اختياري)" type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
            <Input label="وصف (اختياري)" className="md:col-span-3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            
            <div className="md:col-span-3 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
              <Button variant="ghost" type="button" onClick={() => setIsAdding(false)}>إلغاء</Button>
              <Button type="submit">{editingId ? 'حفظ التعديلات' : 'إضافة المنتج'}</Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {viewingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-lg text-slate-800">تفاصيل المنتج</h3>
                <button onClick={() => setViewingProduct(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex gap-6 items-start">
                  {viewingProduct.imageUrl ? (
                    <img src={viewingProduct.imageUrl} alt={viewingProduct.name} className="w-32 h-32 object-cover rounded-xl border border-slate-200 bg-slate-50" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-32 h-32 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-slate-400 text-xs">لا توجد صورة</span>
                    </div>
                  )}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 className="text-xl font-bold text-slate-900">{viewingProduct.name}</h4>
                      <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md mt-1">
                        {storeCategories.find(c => c.id === viewingProduct.categoryId)?.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                      <div>
                        <span className="text-slate-500 block text-xs">الكمية المتوفرة</span>
                        <strong className="text-slate-800">{formatNumber(viewingProduct.quantity)} وحدة</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-xs">تاريخ الانتهاء</span>
                        <strong className="text-slate-800">{viewingProduct.expiryDate || 'لا يوجد'}</strong>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">سعر الشراء</span>
                    <strong className="text-slate-900 text-lg">{formatCurrency(viewingProduct.purchasePrice, storeSettings.currency)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">سعر الجملة</span>
                    <strong className="text-indigo-600 text-lg">{formatCurrency(viewingProduct.wholesalePrice, storeSettings.currency)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">سعر المفرق</span>
                    <strong className="text-emerald-600 text-lg">{viewingProduct.retailPrice ? formatCurrency(viewingProduct.retailPrice, storeSettings.currency) : '-'}</strong>
                  </div>
                </div>

                {viewingProduct.description && (
                  <div>
                    <span className="text-slate-500 block text-xs font-bold mb-1">الوصف:</span>
                    <p className="text-slate-700 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">{viewingProduct.description}</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <Button onClick={() => setViewingProduct(null)}>إغلاق</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {historyProductId && (
          <ProductHistoryModal 
            productId={historyProductId} 
            storeId={storeId} 
            onClose={() => setHistoryProductId(null)} 
          />
        )}
      </AnimatePresence>

    </div>
  );
}
