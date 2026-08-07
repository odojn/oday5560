import React, { useState, useMemo } from 'react';
import { useDB } from '../../store/dbStore';
import { useAuth } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Search, Eye, X, Barcode, Layers, Truck, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, formatNumber } from '../../utils/format';
import { ProductHistoryModal } from '../../components/ProductHistoryModal';
import { ProductUnit } from '../../types';

export default function Inventory() {
  const { currentUser } = useAuth();
  const { products, categories, addProduct, updateProduct, deleteProduct, addExpense, settings } = useDB();
  const storeId = currentUser?.storeId || '';
  
  const storeProducts = products.filter(p => p.storeId === storeId);
  const storeCategories = categories.filter(c => c.storeId === storeId);
  const storeSettings = settings[storeId] || { currency: 'ILS', enableMultiUOM: true, costingMethod: 'AVCO' };
  
  // RBAC Permissions check
  const isOwner = currentUser?.role === 'STORE_OWNER';
  const perms = currentUser?.permissions || {
    viewPurchasePrice: isOwner,
    canManageInventory: isOwner || currentUser?.role === 'INVENTORY_MANAGER',
    canApplyLandingCost: isOwner || currentUser?.role === 'ACCOUNTANT',
  };

  const [isAdding, setIsAdding] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<any>(null);
  const [historyProductId, setHistoryProductId] = useState<string | null>(null);
  
  // AVCO Landing Cost Modal state
  const [avcoProduct, setAvcoProduct] = useState<any | null>(null);
  const [avcoQty, setAvcoQty] = useState('');
  const [avcoUnitPrice, setAvcoUnitPrice] = useState('');
  const [avcoFreight, setAvcoFreight] = useState('');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  const [formData, setFormData] = useState({
    name: '', barcode: '', categoryId: '', description: '', purchasePrice: '', 
    wholesalePrice: '', retailPrice: '', quantity: '', expiryDate: '', imageUrl: '',
    baseUnit: 'حبة'
  });
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddUnitRow = () => {
    setUnits([...units, { id: uuidv4(), unitName: 'كرتونة', conversionFactor: 12, price: 0 }]);
  };

  const handleRemoveUnitRow = (id: string) => {
    setUnits(units.filter(u => u.id !== id));
  };

  const handleUpdateUnitRow = (id: string, field: keyof ProductUnit, val: any) => {
    setUnits(units.map(u => u.id === id ? { ...u, [field]: val } : u));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateProduct(editingId, {
        ...formData,
        purchasePrice: Number(formData.purchasePrice),
        wholesalePrice: Number(formData.wholesalePrice),
        retailPrice: formData.retailPrice ? Number(formData.retailPrice) : undefined,
        quantity: Number(formData.quantity),
        baseUnit: formData.baseUnit,
        units
      } as any);
      setEditingId(null);
    } else {
      addProduct({
        ...formData,
        purchasePrice: Number(formData.purchasePrice),
        wholesalePrice: Number(formData.wholesalePrice),
        retailPrice: formData.retailPrice ? Number(formData.retailPrice) : undefined,
        quantity: Number(formData.quantity),
        baseUnit: formData.baseUnit,
        units,
        id: uuidv4(),
        storeId,
      } as any);
    }
    setFormData({ name: '', barcode: '', categoryId: '', description: '', purchasePrice: '', wholesalePrice: '', retailPrice: '', quantity: '', expiryDate: '', imageUrl: '', baseUnit: 'حبة' });
    setUnits([]);
    setIsAdding(false);
  };

  // AVCO Landing Cost submit
  const handleApplyAvcoLandingCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!avcoProduct) return;
    const addQty = Number(avcoQty) || 0;
    const unitPrice = Number(avcoUnitPrice) || 0;
    const freight = Number(avcoFreight) || 0;

    if (addQty <= 0) {
      alert('يرجى إدخال كمية واردة أكبر من صفر');
      return;
    }

    const currentQty = avcoProduct.quantity || 0;
    const currentCost = avcoProduct.purchasePrice || 0;

    const currentTotalValue = currentQty * currentCost;
    const incomingGoodsValue = (addQty * unitPrice) + freight;
    const newTotalQty = currentQty + addQty;
    const newAVCOPurchasePrice = newTotalQty > 0 ? (currentTotalValue + incomingGoodsValue) / newTotalQty : currentCost;

    updateProduct(avcoProduct.id, {
      quantity: newTotalQty,
      purchasePrice: Number(newAVCOPurchasePrice.toFixed(2))
    });

    if (freight > 0) {
      addExpense({
        id: uuidv4(),
        storeId,
        description: `مصاريف شحن وجمارك لشحنة (${avcoProduct.name}) - كمية ${addQty}`,
        amount: freight,
        createdAt: new Date().toISOString()
      });
    }

    alert(`تم تحديث التكلفة المرجحة (AVCO) للمنتج (${avcoProduct.name}) بنجاح!\nسعر التكلفة الجديد للوحدة: ${formatCurrency(newAVCOPurchasePrice, storeSettings.currency)}`);
    setAvcoProduct(null);
    setAvcoQty('');
    setAvcoUnitPrice('');
    setAvcoFreight('');
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
            <h4 className="font-bold text-slate-800">إدارة المخزون الاحترافية (Multi-UOM & AVCO)</h4>
            <p className="text-xs text-slate-400">المنتجات، وحدات القياس المتعددة، وتحديث متوسط التكلفة للشحنات</p>
          </div>
          <div className="flex gap-2">
            {perms.canManageInventory && (
              <button onClick={() => { setIsAdding(true); setEditingId(null); setUnits([]); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                منتج جديد
              </button>
            )}
          </div>
        </div>

        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 bg-white">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="ابحث برقم الباركود أو اسم المنتج..." 
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
                <th className="px-4 py-2 font-medium">المنتج والوحدات</th>
                <th className="px-4 py-2 font-medium">الكود / الباركود</th>
                <th className="px-4 py-2 font-medium">الصنف</th>
                <th className="px-4 py-2 font-medium">الكمية الأساسية</th>
                <th className="px-4 py-2 font-medium">سعر التكلفة (AVCO)</th>
                <th className="px-4 py-2 font-medium">سعر المفرق</th>
                <th className="px-4 py-2 font-medium text-center">الإجراءات والخدمات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProducts.map(prod => (
                <tr key={prod.id} className={prod.quantity <= 10 ? "bg-orange-50/30" : ""}>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800">{prod.name}</div>
                    {prod.units && prod.units.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {prod.units.map((u, i) => (
                          <span key={i} className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-indigo-100">
                            1 {u.unitName} = {u.conversionFactor} {prod.baseUnit || 'حبة'} ({formatCurrency(u.price, storeSettings.currency)})
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
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
                    {formatNumber(prod.quantity)} {prod.baseUnit || 'وحدة'} {prod.quantity <= 10 ? '(منخفض)' : ''}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 font-bold">
                    {perms.viewPurchasePrice ? formatCurrency(prod.purchasePrice, storeSettings.currency) : '***'}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">{prod.retailPrice ? formatCurrency(prod.retailPrice, storeSettings.currency) : '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      <button className="text-blue-600 font-semibold hover:underline flex items-center gap-0.5" onClick={() => setViewingProduct(prod)}>
                        <Eye className="w-3 h-3" />
                        عرض
                      </button>

                      {perms.canApplyLandingCost && (
                        <>
                          <span className="text-slate-300">|</span>
                          <button 
                            className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200" 
                            onClick={() => {
                              setAvcoProduct(prod);
                              setAvcoQty('');
                              setAvcoUnitPrice(prod.purchasePrice.toString());
                              setAvcoFreight('');
                            }}
                            title="إضافة شحنة وتعديل التكلفة برسم الوصول"
                          >
                            <Truck className="w-3 h-3 text-emerald-600" />
                            شحنة AVCO
                          </button>
                        </>
                      )}

                      <span className="text-slate-300">|</span>
                      <button className="text-slate-600 font-semibold hover:underline" onClick={() => setHistoryProductId(prod.id)}>السجل</button>
                      
                      {perms.canManageInventory && (
                        <>
                          <span className="text-slate-300">|</span>
                          <button className="text-indigo-600 font-semibold hover:underline" onClick={() => {
                            setFormData({
                              ...prod,
                              barcode: prod.barcode || '',
                              purchasePrice: prod.purchasePrice.toString(),
                              wholesalePrice: prod.wholesalePrice.toString(),
                              retailPrice: prod.retailPrice ? prod.retailPrice.toString() : '',
                              quantity: prod.quantity.toString(),
                              imageUrl: prod.imageUrl || '',
                              baseUnit: prod.baseUnit || 'حبة'
                            } as any);
                            setUnits(prod.units || []);
                            setEditingId(prod.id);
                            setIsAdding(true);
                          }}>تعديل</button>
                          <span className="text-slate-300">|</span>
                          <button className="text-red-600 font-semibold hover:underline" onClick={() => deleteProduct(prod.id)}>حذف</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">لا يوجد منتجات تطابق بحثك</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Add/Edit Form Modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.form initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0, height:0}} onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                {editingId ? 'تعديل بيانات المنتج والوحدات' : 'إضافة منتج جديد مع الوحدات المزدوجة'}
              </h3>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Input label="اسم المنتج" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-bold text-slate-700">رمز الباركود / الكود الرئيسي</label>
                <div className="flex gap-2">
                  <Input 
                    value={formData.barcode} 
                    onChange={e => setFormData({...formData, barcode: e.target.value})} 
                    placeholder="أدخل الباركود..." 
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
                <label className="text-xs font-bold text-slate-700">الصنف</label>
                <select 
                  className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                  value={formData.categoryId} 
                  onChange={e => setFormData({...formData, categoryId: e.target.value})}
                  required
                >
                  <option value="">اختر صنفاً...</option>
                  {storeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-bold text-slate-700">الوحدة الأساسية للمخزون</label>
                <select 
                  className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                  value={formData.baseUnit} 
                  onChange={e => setFormData({...formData, baseUnit: e.target.value})}
                >
                  <option value="حبة">حبة / قطعة</option>
                  <option value="كيلو">كيلوجرام (كجم)</option>
                  <option value="جرام">جرام</option>
                  <option value="لتر">لتر</option>
                  <option value="علبة">علبة صغيرة</option>
                </select>
              </div>

              <Input label="الكمية الافتتاحية (بالوحدة الأساسية)" type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
              
              <Input label="سعر الشراء / التكلفة للوحدة الأساسية" type="number" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} required />
              <Input label="سعر الجملة للوحدة الأساسية" type="number" value={formData.wholesalePrice} onChange={e => setFormData({...formData, wholesalePrice: e.target.value})} required />
              <Input label="سعر المفرق للوحدة الأساسية" type="number" value={formData.retailPrice} onChange={e => setFormData({...formData, retailPrice: e.target.value})} />
              
              <Input label="رابط الصورة (اختياري)" type="url" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." />
              <Input label="تاريخ الانتهاء (اختياري)" type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
            </div>

            {/* Multi-UOM Sub Units section */}
            {storeSettings.enableMultiUOM !== false && (
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-950">إدارة وحدات القياس الفرعية (Multi-UOM): كرتونة، علبة، طرد</span>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={handleAddUnitRow} className="text-xs bg-white">
                    + إضافة وحدة قياس فرعية
                  </Button>
                </div>

                {units.length > 0 ? (
                  <div className="space-y-2">
                    {units.map((u) => (
                      <div key={u.id} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-indigo-100 text-xs">
                        <div className="col-span-3">
                          <label className="text-[10px] text-slate-500 block mb-0.5">اسم الوحدة</label>
                          <input 
                            type="text" 
                            value={u.unitName} 
                            onChange={e => handleUpdateUnitRow(u.id, 'unitName', e.target.value)} 
                            placeholder="مثلاً كرتونة أو علبة"
                            className="w-full h-8 px-2 border border-slate-300 rounded font-bold"
                          />
                        </div>

                        <div className="col-span-3">
                          <label className="text-[10px] text-slate-500 block mb-0.5">معامل التحويل (كم {formData.baseUnit || 'حبة'} تحتوي؟)</label>
                          <input 
                            type="number" 
                            value={u.conversionFactor} 
                            onChange={e => handleUpdateUnitRow(u.id, 'conversionFactor', Number(e.target.value))} 
                            placeholder="24"
                            className="w-full h-8 px-2 border border-slate-300 rounded font-bold font-mono text-center"
                          />
                        </div>

                        <div className="col-span-3">
                          <label className="text-[10px] text-slate-500 block mb-0.5">سعر بيع هذه الوحدة ({storeSettings.currency})</label>
                          <input 
                            type="number" 
                            value={u.price} 
                            onChange={e => handleUpdateUnitRow(u.id, 'price', Number(e.target.value))} 
                            placeholder="100"
                            className="w-full h-8 px-2 border border-slate-300 rounded font-bold font-mono"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="text-[10px] text-slate-500 block mb-0.5">بار كود الوحدة</label>
                          <input 
                            type="text" 
                            value={u.barcode || ''} 
                            onChange={e => handleUpdateUnitRow(u.id, 'barcode', e.target.value)} 
                            placeholder="اختياري"
                            className="w-full h-8 px-2 border border-slate-300 rounded font-mono"
                          />
                        </div>

                        <div className="col-span-1 flex justify-center pt-3">
                          <button type="button" onClick={() => handleRemoveUnitRow(u.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">لا توجد وحدات قياس إضافية مضافة. اضغط إضافة وحدة لبيع المنتج بالكرتونة أو العلبة.</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" type="button" onClick={() => setIsAdding(false)}>إلغاء</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">{editingId ? 'حفظ التعديلات' : 'إضافة المنتج'}</Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* AVCO Landing Cost Shipment Modal */}
      <AnimatePresence>
        {avcoProduct && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 space-y-5"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">تحديث الشحنة وتعديل التكلفة المرجحة (AVCO)</h3>
                  <p className="text-xs text-slate-500">المنتج: {avcoProduct.name}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">الكمية الحالية بمخزونك:</span>
                  <strong className="text-slate-800 font-mono text-sm">{avcoProduct.quantity} {avcoProduct.baseUnit || 'وحدة'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">تكلفة الوحدة الحالية:</span>
                  <strong className="text-indigo-600 font-mono text-sm">{formatCurrency(avcoProduct.purchasePrice, storeSettings.currency)}</strong>
                </div>
              </div>

              <form onSubmit={handleApplyAvcoLandingCost} className="space-y-4">
                <Input 
                  label="الكمية الواردة الجديدة" 
                  type="number" 
                  value={avcoQty} 
                  onChange={e => setAvcoQty(e.target.value)} 
                  placeholder="مثلاً: 100" 
                  required 
                />

                <Input 
                  label="سعر الشراء الوارد للوحدة من المورد" 
                  type="number" 
                  value={avcoUnitPrice} 
                  onChange={e => setAvcoUnitPrice(e.target.value)} 
                  placeholder="أدخل سعر الشراء..." 
                  required 
                />

                <Input 
                  label="مصاريف الشحن والجمارك والنقل الإضافية على الشحنة" 
                  type="number" 
                  value={avcoFreight} 
                  onChange={e => setAvcoFreight(e.target.value)} 
                  placeholder="0.00" 
                />

                {/* Live AVCO calculation preview */}
                {Number(avcoQty) > 0 && (
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs space-y-1">
                    <span className="font-bold text-emerald-900 block">معاينة متوسط التكلفة الجديد (AVCO):</span>
                    <div className="flex justify-between text-emerald-800 font-mono font-bold text-sm">
                      <span>التكلفة الجديدة للوحدة:</span>
                      <span>
                        {formatCurrency(
                          ((avcoProduct.quantity * avcoProduct.purchasePrice) + (Number(avcoQty) * Number(avcoUnitPrice || 0)) + Number(avcoFreight || 0)) / (avcoProduct.quantity + Number(avcoQty)),
                          storeSettings.currency
                        )}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setAvcoProduct(null)}>
                    إلغاء
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                    تحديث الشحنة وحساب التكلفة
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
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
