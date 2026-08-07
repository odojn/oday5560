import React, { useState } from 'react';
import { useDB } from '../../store/dbStore';
import { useAuth } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input, convertArabicToEnglishNumbers } from '../../components/ui/Input';
import { Plus, Trash2, Eye, X, Printer, FileText, CreditCard, DollarSign } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, formatNumber } from '../../utils/format';
import { InvoiceService } from '../../services/invoiceService';

export default function Sales() {
  const { currentUser } = useAuth();
  const { products, sales, stores, addSale, updateSale, deleteSale, updateProduct, addDebtRecord, settings } = useDB();
  const storeId = currentUser?.storeId || '';
  const currentStore = stores.find(s => s.id === storeId);
  const storeSettings = settings[storeId] || { currency: 'ILS' };
  
  const storeProducts = products.filter(p => p.storeId === storeId);
  const storeSales = sales.filter(s => s.storeId === storeId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const [isAdding, setIsAdding] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  
  // Customer & Invoice Details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentType, setPaymentType] = useState<'CASH' | 'CREDIT' | 'CARD'>('CASH');
  const [discountInput, setDiscountInput] = useState('');
  const [taxRateInput, setTaxRateInput] = useState('');
  const [paidAmountInput, setPaidAmountInput] = useState('');

  const [cart, setCart] = useState<{product: any, qty: number, customPrice: number}[]>([]);
  const [viewingSale, setViewingSale] = useState<any>(null);
  
  const handleAddProductToCart = (productId: string) => {
    const product = storeProducts.find(p => p.id === productId);
    if(!product) return;
    
    const existing = cart.find(c => c.product.id === productId);
    if(existing) return;
    
    setCart([...cart, { product, qty: 1, customPrice: product.wholesalePrice || product.purchasePrice || 0 }]);
  };

  const updateCartItem = (productId: string, field: 'qty' | 'customPrice', value: number) => {
    setCart(cart.map(c => c.product.id === productId ? { ...c, [field]: Math.max(0, value) } : c));
  };

  // Financial Calculations
  const rawSubtotal = cart.reduce((acc, curr) => acc + (curr.customPrice * curr.qty), 0);
  const totalCost = cart.reduce((acc, curr) => acc + (curr.product.purchasePrice * curr.qty), 0);
  
  const discountVal = Number(convertArabicToEnglishNumbers(discountInput)) || 0;
  const afterDiscount = Math.max(0, rawSubtotal - discountVal);
  const taxRate = Number(convertArabicToEnglishNumbers(taxRateInput)) || 0;
  const taxVal = (afterDiscount * taxRate) / 100;
  const finalTotalAmount = afterDiscount + taxVal;

  let paidAmount = finalTotalAmount;
  if (paymentType === 'CREDIT') {
    paidAmount = paidAmountInput !== '' ? Number(convertArabicToEnglishNumbers(paidAmountInput)) : 0;
  }
  const remainingDebtAmount = Math.max(0, finalTotalAmount - paidAmount);

  const resetForm = () => {
    setIsAdding(false);
    setEditingSaleId(null);
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setPaymentType('CASH');
    setDiscountInput('');
    setTaxRateInput('');
    setPaidAmountInput('');
  };

  const handleSubmitSale = (printInvoice: boolean = false) => {
    if(cart.length === 0) return;
    
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
      paymentType,
      customerName: customerName.trim() || 'زبون نقدي',
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      paidAmount: paidAmount,
      debtAmount: remainingDebtAmount,
      items: cart.map(c => ({ productId: c.product.id, quantity: c.qty, price: c.customPrice })),
      subtotal: rawSubtotal,
      discount: discountVal,
      tax: taxVal,
      totalAmount: finalTotalAmount,
      totalProfit: finalTotalAmount - totalCost,
      createdAt: date,
    };

    if (editingSaleId) {
      updateSale(saleId, newSaleData as any);
    } else {
      addSale(newSaleData as any);
    }

    // Auto create debt record in Debt Tracker if remaining debt > 0
    if (remainingDebtAmount > 0) {
      addDebtRecord({
        id: uuidv4(),
        storeId,
        entityType: 'CUSTOMER',
        entityId: uuidv4(),
        entityName: customerName.trim() || 'عميل آجل',
        saleId,
        totalAmount: remainingDebtAmount,
        paidAmount: 0,
        remainingAmount: remainingDebtAmount,
        status: 'UNPAID',
        notes: `دين آجل من فاتورة مبيعات العامة #${saleId.slice(0, 8)} - الدفعة الأولى النقدية: ${formatCurrency(paidAmount, storeSettings.currency)}`,
        createdAt: date
      });
    }

    // Apply stock changes
    const productDeltas: Record<string, number> = {};
    if (editingSaleId && previousSale) {
      previousSale.items.forEach((item: any) => {
        productDeltas[item.productId] = (productDeltas[item.productId] || 0) + item.quantity;
      });
    }
    cart.forEach(c => {
      productDeltas[c.product.id] = (productDeltas[c.product.id] || 0) - c.qty;
    });

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
      InvoiceService.printInvoice({
        invoiceId: saleId,
        storeName: currentStore?.name || 'النشاط التجاري',
        storePhone: currentStore?.phone,
        storeEmail: currentStore?.email,
        customerName: customerName.trim() || 'زبون نقدي',
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        items: cart.map(c => ({
          name: c.product.name,
          barcode: c.product.barcode,
          quantity: c.qty,
          price: c.customPrice
        })),
        subtotal: rawSubtotal,
        discount: discountVal,
        tax: taxVal,
        totalAmount: finalTotalAmount,
        paymentType,
        paidAmount,
        debtAmount: remainingDebtAmount,
        date,
        currency: storeSettings.currency
      });
    } else {
      alert('تم حفظ الفاتورة بنجاح!');
    }

    resetForm();
  };

  const handleEditSale = (sale: any) => {
    setEditingSaleId(sale.id);
    setCustomerName(sale.customerName === 'زبون نقدي' || sale.customerName === 'غير محدد' ? '' : sale.customerName);
    setCustomerPhone(sale.customerPhone || '');
    setCustomerAddress(sale.customerAddress || '');
    setPaymentType(sale.paymentType || 'CASH');
    setDiscountInput(sale.discount ? sale.discount.toString() : '');
    setTaxRateInput('');
    setPaidAmountInput(sale.paidAmount !== undefined ? sale.paidAmount.toString() : '');
    
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
      sale.items.forEach((item: any) => {
        const product = products.find(p => p.id === item.productId);
        if(product) {
          updateProduct(product.id, { quantity: product.quantity + item.quantity });
        }
      });
      deleteSale(sale.id);
    }
  };

  const handlePrintExistingInvoice = (sale: any) => {
    const saleItems = sale.items.map((item: any) => {
      const p = products.find(prod => prod.id === item.productId);
      return {
        name: p?.name || 'منتج',
        barcode: p?.barcode,
        quantity: item.quantity,
        price: item.price
      };
    });

    InvoiceService.printInvoice({
      invoiceId: sale.id,
      storeName: currentStore?.name || 'النشاط التجاري',
      storePhone: currentStore?.phone,
      storeEmail: currentStore?.email,
      customerName: sale.customerName || 'زبون نقدي',
      customerPhone: sale.customerPhone,
      customerAddress: sale.customerAddress,
      items: saleItems,
      subtotal: sale.subtotal || sale.totalAmount,
      discount: sale.discount || 0,
      tax: sale.tax || 0,
      totalAmount: sale.totalAmount,
      paymentType: sale.paymentType || 'CASH',
      paidAmount: sale.paidAmount !== undefined ? sale.paidAmount : sale.totalAmount,
      debtAmount: sale.debtAmount || 0,
      date: sale.createdAt,
      currency: storeSettings.currency
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h4 className="font-bold text-slate-800">المبيعات العامة والطلبيات مع طباعة الفواتير</h4>
            <p className="text-xs text-slate-500">إنشاء طلبيات، خصومات، ضرائب، تحصيل الدفعة الأولى وتسجيل الديون التلقائي</p>
          </div>
          <button onClick={() => { if(!isAdding) resetForm(); setIsAdding(!isAdding); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            {isAdding ? 'إغلاق النموذج' : 'مبيعة / فاتورة جديدة'}
          </button>
        </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="bg-white p-6 rounded-2xl shadow-sm border-b border-slate-200 overflow-hidden space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                تفاصيل الفاتورة والعميل ({currentStore?.name || 'النشاط التجاري'})
              </h3>
              <span className="text-xs font-mono text-slate-400">التاريخ: {new Date().toLocaleDateString('ar-EG')}</span>
            </div>

            {/* Customer Details Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              <Input label="اسم الزبون / العميل" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="أدخل اسم العميل (أو اتركه لزبون نقدي)" />
              <Input label="رقم هاتف الزبون (اختياري)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="05XXXXXXXX" type="tel" />
              <Input label="عنوان الزبون (اختياري)" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="المدينة / المنطقة" />
            </div>

            {/* Payment & Financial Settings */}
            <div className="grid md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">طريقة الدفع</label>
                <select 
                  value={paymentType} 
                  onChange={e => setPaymentType(e.target.value as any)}
                  className="h-11 rounded-lg border border-slate-300 px-3 bg-white text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CASH">كاش (نقداً)</option>
                  <option value="CREDIT">آجل / دين (ذمم)</option>
                  <option value="CARD">بطاقة ائتمان</option>
                </select>
              </div>

              {paymentType === 'CREDIT' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-rose-700">الدفع الأولى النقدية (المقدم)</label>
                  <Input 
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={paidAmountInput}
                    onChange={e => setPaidAmountInput(e.target.value)}
                    className="border-rose-300 focus:ring-rose-500 font-mono font-bold"
                  />
                </div>
              )}

              <Input 
                label="الخصم الممنوح (مبلغ)" 
                type="number"
                min="0"
                placeholder="0.00"
                value={discountInput}
                onChange={e => setDiscountInput(e.target.value)}
              />

              <Input 
                label="نسبة الضريبة (%)" 
                type="number"
                min="0"
                placeholder="0 %"
                value={taxRateInput}
                onChange={e => setTaxRateInput(e.target.value)}
              />
            </div>

            {/* Product Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">اختر المنتج لإضافته للفاتورة</label>
              <select className="h-11 rounded-xl border border-slate-300 px-3 bg-white text-xs" onChange={(e) => { if(e.target.value) handleAddProductToCart(e.target.value); e.target.value = ''; }} value="">
                <option value="">-- اضغط لاختيار منتج من القائمة --</option>
                {storeProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} {p.barcode ? `(${p.barcode})` : ''} - سعر البيع: {p.wholesalePrice || p.retailPrice || 0} - (المتوفر: {p.quantity})</option>
                ))}
              </select>
            </div>

            {/* Cart Items Table */}
            {cart.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">المنتج</th>
                      <th className="py-2.5 px-3">الباركود</th>
                      <th className="py-2.5 px-3 w-28">الكمية</th>
                      <th className="py-2.5 px-3 w-32">السعر للوحدة</th>
                      <th className="py-2.5 px-3">الإجمالي</th>
                      <th className="py-2.5 px-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cart.map(item => (
                      <tr key={item.product.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-slate-800">{item.product.name}</td>
                        <td className="py-2 px-3 font-mono text-slate-400">{item.product.barcode || '-'}</td>
                        <td className="py-2 px-3">
                          <input 
                            type="number" 
                            min="1" 
                            max={item.product.quantity} 
                            value={item.qty === 0 ? '' : item.qty} 
                            onChange={(e) => updateCartItem(item.product.id, 'qty', e.target.value === '' ? 0 : Number(convertArabicToEnglishNumbers(e.target.value)))} 
                            className="w-20 h-8 px-2 border border-slate-300 rounded text-center font-mono font-bold" 
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input 
                            type="number" 
                            min="0" 
                            value={item.customPrice === 0 ? '' : item.customPrice} 
                            onChange={(e) => updateCartItem(item.product.id, 'customPrice', e.target.value === '' ? 0 : Number(convertArabicToEnglishNumbers(e.target.value)))} 
                            className="w-24 h-8 px-2 border border-slate-300 rounded text-center font-mono font-bold" 
                          />
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-indigo-600">
                          {formatCurrency(item.qty * item.customPrice, storeSettings.currency)}
                        </td>
                        <td className="py-2 px-3">
                          <button onClick={() => setCart(cart.filter(c => c.product.id !== item.product.id))} className="text-rose-500 hover:text-rose-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Calculation Summary Footer */}
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-700">
                <div>المجموع: <span className="font-mono text-indigo-700">{formatCurrency(rawSubtotal, storeSettings.currency)}</span></div>
                {discountVal > 0 && <div className="text-rose-600">الخصم: -{formatCurrency(discountVal, storeSettings.currency)}</div>}
                {taxVal > 0 && <div>الضريبة: +{formatCurrency(taxVal, storeSettings.currency)}</div>}
                <div className="text-sm border-r border-slate-300 pr-3">الإجمالي الصافي: <span className="text-base font-extrabold text-indigo-900 font-mono">{formatCurrency(finalTotalAmount, storeSettings.currency)}</span></div>
                {paymentType === 'CREDIT' && (
                  <div className="text-xs bg-rose-100 text-rose-800 px-2.5 py-1 rounded-lg">
                    الدفعة الأولى: {formatCurrency(paidAmount, storeSettings.currency)} | المتبقي كدين: {formatCurrency(remainingDebtAmount, storeSettings.currency)}
                  </div>
                )}
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <Button variant="ghost" onClick={resetForm} className="text-xs">إلغاء</Button>
                <Button variant="outline" disabled={cart.length === 0} onClick={() => handleSubmitSale(false)} className="text-xs">
                  حفظ فقط
                </Button>
                <Button disabled={cart.length === 0} onClick={() => handleSubmitSale(true)} className="text-xs gap-1 bg-indigo-600 hover:bg-indigo-700">
                  <Printer className="w-3.5 h-3.5" />
                  حفظ وطباعة فاتورة احترافية
                </Button>
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
                <th className="px-4 py-2 font-medium">النوع وطريقة الدفع</th>
                <th className="px-4 py-2 font-medium">العميل</th>
                <th className="px-4 py-2 font-medium">التاريخ</th>
                <th className="px-4 py-2 font-medium">الإجمالي</th>
                <th className="px-4 py-2 font-medium">المدفوع / الدين</th>
                <th className="px-4 py-2 font-medium text-center">إجراءات الفاتورة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {storeSales.map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono text-slate-500 font-bold">#{sale.id.split('-')[0]}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {sale.type === 'RETAIL' && <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px] font-bold">مفرق</span>}
                      {sale.type === 'WHOLESALE' && <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">جملة</span>}
                      {sale.type === 'GENERAL' && <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-bold">عامة</span>}
                      
                      {sale.paymentType === 'CREDIT' ? (
                        <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-bold">آجل (دين)</span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold">كاش</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-700">
                    {sale.customerName || 'زبون نقدي'}
                    {sale.customerPhone && <div className="text-[10px] text-slate-400 font-mono font-normal">{sale.customerPhone}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(sale.createdAt).toLocaleString('ar-EG')}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-800">{formatCurrency(sale.totalAmount, storeSettings.currency)}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {sale.debtAmount && sale.debtAmount > 0 ? (
                      <div>
                        <span className="text-rose-600 font-bold">متبقي: {formatCurrency(sale.debtAmount, storeSettings.currency)}</span>
                        <div className="text-[10px] text-slate-400">مدفوع: {formatCurrency(sale.paidAmount || 0, storeSettings.currency)}</div>
                      </div>
                    ) : (
                      <span className="text-emerald-600 font-bold">مدفوع بالكامل</span>
                    )}
                  </td>
                  <td className="px-4 py-3 flex justify-center items-center gap-2">
                    <button className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg" onClick={() => handlePrintExistingInvoice(sale)}>
                      <Printer className="w-3.5 h-3.5" />
                      طباعة
                    </button>
                    <button className="text-slate-600 hover:text-slate-800 flex items-center gap-1" onClick={() => setViewingSale(sale)}>
                      <Eye className="w-3.5 h-3.5" />
                      عرض
                    </button>
                    <button className="text-amber-600 hover:text-amber-800 font-semibold" onClick={() => handleEditSale(sale)}>تعديل</button>
                    <button className="text-rose-600 hover:text-rose-800 font-semibold" onClick={() => handleDeleteSale(sale)}>حذف</button>
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
