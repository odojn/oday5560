import React, { useState } from 'react';
import { useDB } from '../../store/dbStore';
import { useAuth } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Trash2, Eye, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, formatNumber } from '../../utils/format';

export default function Sales() {
  const { currentUser } = useAuth();
  const { products, sales, addSale, updateSale, deleteSale, updateProduct, settings } = useDB();
  const storeId = currentUser?.storeId || '';
  const storeSettings = settings[storeId] || { currency: 'ILS' };
  
  const storeProducts = products.filter(p => p.storeId === storeId);
  const availableStoreProducts = storeProducts.filter(p => p.quantity > 0);
  const storeSales = sales.filter(s => s.storeId === storeId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const [isAdding, setIsAdding] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [cart, setCart] = useState<{product: any, qty: number, customPrice: number}[]>([]);
  const [viewingSale, setViewingSale] = useState<any>(null);
  
  const handleAddProductToCart = (productId: string) => {
    const product = storeProducts.find(p => p.id === productId);
    if(!product) return;
    
    const existing = cart.find(c => c.product.id === productId);
    if(existing) return;
    
    setCart([...cart, { product, qty: 1, customPrice: product.wholesalePrice }]);
  };

  const updateCartItem = (productId: string, field: 'qty' | 'customPrice', value: number) => {
    setCart(cart.map(c => c.product.id === productId ? { ...c, [field]: value } : c));
  };

  const totalAmount = cart.reduce((acc, curr) => acc + (curr.customPrice * curr.qty), 0);
  const totalCost = cart.reduce((acc, curr) => acc + (curr.product.purchasePrice * curr.qty), 0);

  const handleSubmitSale = (printInvoice: boolean = false) => {
    if(cart.length === 0) return;
    
    // If editing, we first restore stock of the previous items to compute correct limits
    let previousSale: any = null;
    if (editingSaleId) {
      previousSale = storeSales.find(s => s.id === editingSaleId);
    }
    
    // Check stock accounting for previous sale if editing
    for (const item of cart) {
      let availableQty = item.product.quantity;
      if (previousSale) {
        const prevItem = previousSale.items.find((i: any) => i.productId === item.product.id);
        if (prevItem) {
          availableQty += prevItem.quantity;
        }
      }
      if (item.qty > availableQty) {
        alert(`الكمية المطلوبة من ${item.product.name} غير متوفرة! المتوفر (بما في ذلك الطلبية الحالية): ${availableQty}`);
        return;
      }
    }

    const saleId = editingSaleId || uuidv4();
    const date = previousSale ? previousSale.createdAt : new Date().toISOString();
    
    const newSaleData = {
      id: saleId,
      storeId,
      type: previousSale ? previousSale.type : 'GENERAL',
      customerName: customerName || 'غير محدد',
      items: cart.map(c => ({ productId: c.product.id, quantity: c.qty, price: c.customPrice })),
      totalAmount,
      totalProfit: totalAmount - totalCost,
      createdAt: date,
    };

    if (editingSaleId) {
      updateSale(saleId, newSaleData);
    } else {
      addSale(newSaleData as any);
    }

    // Apply new stock deductions & restorations
    // 1. Create a map of product deltas
    const productDeltas: Record<string, number> = {};
    
    // Add back previous sale items
    if (editingSaleId && previousSale) {
      previousSale.items.forEach((item: any) => {
        productDeltas[item.productId] = (productDeltas[item.productId] || 0) + item.quantity;
      });
    }
    
    // Subtract new sale items
    cart.forEach(c => {
      productDeltas[c.product.id] = (productDeltas[c.product.id] || 0) - c.qty;
    });

    // Apply deltas
    Object.keys(productDeltas).forEach(productId => {
      const delta = productDeltas[productId];
      if (delta !== 0) {
        const product = products.find(p => p.id === productId);
        if (product) {
          updateProduct(product.id, { quantity: product.quantity + delta });
        }
      }
    });

    if (printInvoice) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const symbol = storeSettings.currency === 'ILS' ? '₪' : storeSettings.currency === 'USD' ? '$' : '';
        const html = `
          <html dir="rtl">
            <head>
              <title>فاتورة مبيعات عامة</title>
              <style>
                body { font-family: Tahoma, Arial, sans-serif; padding: 20px; }
                .header { text-align: center; border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                .total { font-weight: bold; font-size: 1.2em; text-align: left; }
              </style>
            </head>
            <body onload="window.print(); window.close();">
              <div class="header">
                <h1>فاتورة مبيعات</h1>
                <p>رقم الفاتورة: #${saleId.split('-')[0]}</p>
                <p>التاريخ: ${new Date(date).toLocaleString('en-US')}</p>
                <p>العميل: ${customerName || 'غير محدد'}</p>
              </div>
              <table>
                <tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr>
                ${cart.map(c => `<tr><td>${c.product.name}</td><td>${formatNumber(c.qty)}</td><td>${formatCurrency(c.customPrice, storeSettings.currency)}</td><td>${formatCurrency(c.qty * c.customPrice, storeSettings.currency)}</td></tr>`).join('')}
              </table>
              <div class="total">الإجمالي الكلي: ${formatCurrency(totalAmount, storeSettings.currency)}</div>
            </body>
          </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
      }
    } else {
      alert('تم إضافة المبيعة بنجاح');
    }

    setIsAdding(false);
    setEditingSaleId(null);
    setCart([]);
    setCustomerName('');
  };

  const handleEditSale = (sale: any) => {
    setEditingSaleId(sale.id);
    setCustomerName(sale.customerName === 'غير محدد' ? '' : sale.customerName);
    
    // reconstruct cart
    const editingCart = sale.items.map((item: any) => {
      const product = products.find(p => p.id === item.productId);
      return {
        product: product || { id: item.productId, name: 'منتج محذوف', quantity: 0, purchasePrice: 0, retailPrice: 0, wholesalePrice: 0 },
        qty: item.quantity,
        customPrice: item.price
      };
    }).filter((c: any) => c.product.name !== 'منتج محذوف');
    
    setCart(editingCart);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSale = (sale: any) => {
    if(window.confirm('هل أنت متأكد من حذف هذه المبيعة واسترجاع المنتجات للمخزون؟')) {
      // Restore stock
      sale.items.forEach((item: any) => {
        const product = products.find(p => p.id === item.productId);
        if(product) {
          updateProduct(product.id, { quantity: product.quantity + item.quantity });
        }
      });
      deleteSale(sale.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h4 className="font-bold text-slate-800">المبيعات العامة والطلبيات</h4>
            <p className="text-xs text-slate-400">إنشاء طلبيات مخصصة، تعديل الأسعار، ومراجعة سجل المبيعات</p>
          </div>
          <button onClick={() => setIsAdding(!isAdding)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            مبيعة جديدة
          </button>
        </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <h3 className="font-bold text-lg mb-4 text-slate-800">تفاصيل الطلبية المخصصة</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <Input label="اسم الزبون" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="اسم الزبون (اختياري)" />
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-medium text-slate-700">إضافة منتج للطلبية</label>
                <select className="h-11 rounded-lg border border-slate-300 px-3 bg-white" onChange={(e) => handleAddProductToCart(e.target.value)} value="">
                  <option value="" disabled>اختر منتجاً...</option>
                  {storeProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (متوفر: {p.quantity})</option>
                  ))}
                </select>
              </div>
            </div>

            {cart.length > 0 && (
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-right border border-slate-200 rounded-lg hidden sm:table">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="py-3 px-4 text-slate-600 font-medium">المنتج</th>
                      <th className="py-3 px-4 text-slate-600 font-medium">الكمية</th>
                      <th className="py-3 px-4 text-slate-600 font-medium">السعر المخصص</th>
                      <th className="py-3 px-4 text-slate-600 font-medium">الإجمالي</th>
                      <th className="py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.product.id} className="border-t border-slate-200">
                        <td className="py-3 px-4">{item.product.name}</td>
                        <td className="py-3 px-4">
                          <input type="number" min={1} max={item.product.quantity} value={item.qty} onChange={(e) => updateCartItem(item.product.id, 'qty', Number(e.target.value))} className="w-20 p-1 border rounded" />
                        </td>
                        <td className="py-3 px-4">
                          <input type="number" min={0} value={item.customPrice} onChange={(e) => updateCartItem(item.product.id, 'customPrice', Number(e.target.value))} className="w-24 p-1 border rounded" />
                        </td>
                        <td className="py-3 px-4 font-bold text-indigo-600">{formatCurrency(item.qty * item.customPrice, storeSettings.currency)}</td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="sm" onClick={() => setCart(cart.filter(c => c.product.id !== item.product.id))} className="text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <div className="text-xl font-bold">الإجمالي: <span className="text-indigo-600">{formatCurrency(totalAmount, storeSettings.currency)}</span></div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setIsAdding(false)}>إلغاء</Button>
                <Button variant="outline" disabled={cart.length === 0} onClick={() => handleSubmitSale(false)}>حفظ فقط</Button>
                <Button disabled={cart.length === 0} onClick={() => handleSubmitSale(true)}>حفظ وطباعة</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-tighter border-b border-slate-100">
              <tr className="h-10 text-[10px]">
                <th className="px-4 py-2 font-medium">رقم الفاتورة</th>
                <th className="px-4 py-2 font-medium">النوع</th>
                <th className="px-4 py-2 font-medium">العميل</th>
                <th className="px-4 py-2 font-medium">التاريخ</th>
                <th className="px-4 py-2 font-medium">الإجمالي</th>
                <th className="px-4 py-2 font-medium">الربح</th>
                <th className="px-4 py-2 font-medium text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {storeSales.map(sale => (
                <tr key={sale.id}>
                  <td className="px-4 py-3 font-mono text-slate-400">{sale.id.split('-')[0]}</td>
                  <td className="px-4 py-3">
                    {sale.type === 'RETAIL' && <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px] font-bold">مفرق</span>}
                    {sale.type === 'WHOLESALE' && <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">جملة</span>}
                    {sale.type === 'GENERAL' && <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-bold">عامة (مخصصة)</span>}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-700">{sale.customerName || '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(sale.createdAt).toLocaleString('en-US')}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-800">{formatCurrency(sale.totalAmount, storeSettings.currency)}</td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-600">{formatCurrency(sale.totalProfit, storeSettings.currency)}</td>
                  <td className="px-4 py-3 flex justify-center gap-2">
                    <button className="text-blue-600 font-semibold hover:underline flex items-center gap-1" onClick={() => setViewingSale(sale)}>
                      <Eye className="w-3 h-3" />
                      عرض
                    </button>
                    <span className="text-slate-300">|</span>
                    <button className="text-amber-600 font-semibold hover:underline" onClick={() => handleEditSale(sale)}>تعديل</button>
                    <span className="text-slate-300">|</span>
                    <button className="text-red-600 font-semibold hover:underline" onClick={() => handleDeleteSale(sale)}>حذف</button>
                  </td>
                </tr>
              ))}
              {storeSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">لا يوجد مبيعات مسجلة حتى الآن</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {viewingSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">تفاصيل الطلبية / المبيعة</h3>
                  <p className="text-sm text-slate-500 font-mono mt-1">#{viewingSale.id.split('-')[0]}</p>
                </div>
                <button onClick={() => setViewingSale(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">العميل</span>
                    <strong className="text-slate-800">{viewingSale.customerName || 'غير محدد'}</strong>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">التاريخ</span>
                    <strong className="text-slate-800">{new Date(viewingSale.createdAt).toLocaleString('en-US')}</strong>
                  </div>
                </div>

                <h4 className="font-bold text-sm text-slate-700 mb-3 border-b border-slate-100 pb-2">المنتجات في الطلبية</h4>
                <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-64 overflow-y-auto mb-4">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="py-2 px-4 text-slate-600 font-medium border-b border-slate-200">المنتج</th>
                        <th className="py-2 px-4 text-slate-600 font-medium border-b border-slate-200">الكمية</th>
                        <th className="py-2 px-4 text-slate-600 font-medium border-b border-slate-200">سعر الوحدة</th>
                        <th className="py-2 px-4 text-slate-600 font-medium border-b border-slate-200">المجموع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingSale.items.map((item: any, i: number) => {
                        const product = products.find(p => p.id === item.productId);
                        return (
                          <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-medium text-slate-700">{product?.name || 'منتج محذوف'}</td>
                            <td className="py-3 px-4">{formatNumber(item.quantity)}</td>
                            <td className="py-3 px-4 font-mono">{formatCurrency(item.price, storeSettings.currency)}</td>
                            <td className="py-3 px-4 font-mono font-bold text-indigo-600">{formatCurrency(item.quantity * item.price, storeSettings.currency)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <span className="font-bold text-indigo-900">الإجمالي الكلي:</span>
                  <span className="text-2xl font-bold font-mono text-indigo-600">{formatCurrency(viewingSale.totalAmount, storeSettings.currency)}</span>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                <Button onClick={() => setViewingSale(null)}>إغلاق</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
