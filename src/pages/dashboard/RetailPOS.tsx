import React, { useState, useMemo } from 'react';
import { useDB } from '../../store/dbStore';
import { useAuth } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input, convertArabicToEnglishNumbers } from '../../components/ui/Input';
import { ShoppingCart, Printer, CheckCircle, Search, Barcode, CreditCard, UserPlus, Zap } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency, formatNumber } from '../../utils/format';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';
import ThermalReceipt from '../../components/ThermalReceipt';
import { PrintService } from '../../services/printService';

export default function RetailPOS() {
  const { currentUser } = useAuth();
  const { products, customers, addSale, addDebtRecord, updateProduct, settings, stores } = useDB();
  const storeId = currentUser?.storeId || '';
  const currentStore = stores.find(s => s.id === storeId);
  const storeSettings = settings[storeId] || { currency: 'ILS' };
  
  // Only products with retail price
  const storeProducts = products.filter(p => p.storeId === storeId && (p.retailPrice || 0) > 0 && p.quantity > 0);
  const storeCustomers = (customers || []).filter(c => c.storeId === storeId);

  const [cart, setCart] = useState<{product: any, qty: number}[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [paymentType, setPaymentType] = useState<'CASH' | 'CARD' | 'CREDIT'>('CASH');
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  const [search, setSearch] = useState('');

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeReceiptSale, setActiveReceiptSale] = useState<any | null>(null);

  const [quickBarcode, setQuickBarcode] = useState('');
  const [scanMessage, setScanMessage] = useState('');

  const filteredProducts = useMemo(() => {
    return storeProducts.filter(p => 
      p.name.includes(search) || 
      (p.barcode && p.barcode.includes(search))
    );
  }, [storeProducts, search]);

  const addToCart = (product: any) => {
    const existing = cart.find(c => c.product.id === product.id);
    if (existing) {
      if (existing.qty < product.quantity) {
        setCart(cart.map(c => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c));
      } else {
        alert('لا توجد كمية كافية في المخزون');
      }
    } else {
      setCart([...cart, { product, qty: 1 }]);
    }
  };

  const handleBarcodeScan = (scannedCode: string) => {
    const cleanCode = scannedCode.trim();
    if (!cleanCode) return;
    const matchedProduct = storeProducts.find(p => p.barcode === cleanCode || p.id === cleanCode || p.barcode === convertArabicToEnglishNumbers(cleanCode));
    if (matchedProduct) {
      addToCart(matchedProduct);
      setScanMessage(`تمت إضافة: ${matchedProduct.name}`);
      setTimeout(() => setScanMessage(''), 3000);
    } else {
      alert(`لم يتم العثور على منتج بالباركود: ${cleanCode}`);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(c => c.product.id !== productId));
  };

  const updateQty = (productId: string, qty: number) => {
    const product = storeProducts.find(p => p.id === productId);
    if (!product || qty < 1 || qty > product.quantity) return;
    setCart(cart.map(c => c.product.id === productId ? { ...c, qty } : c));
  };

  const totalAmount = cart.reduce((acc, curr) => acc + (curr.product.retailPrice * curr.qty), 0);
  const totalCost = cart.reduce((acc, curr) => acc + (curr.product.purchasePrice * curr.qty), 0);

  const productsMap = useMemo(() => {
    const map: Record<string, any> = {};
    products.forEach(p => { map[p.id] = p; });
    return map;
  }, [products]);

  const handleCheckout = (printMode: 'NONE' | 'MODAL' | 'DIRECT' = 'MODAL') => {
    if (cart.length === 0) return;

    const selectedCustomer = storeCustomers.find(c => c.id === selectedCustomerId);
    const finalCustomerName = selectedCustomer ? selectedCustomer.name : (customCustomerName || 'زبون نقدي');

    let paid = totalAmount;
    if (paymentType === 'CREDIT') {
      paid = paidAmountInput !== '' ? Number(paidAmountInput) : 0;
    }
    const debt = Math.max(0, totalAmount - paid);

    const saleId = uuidv4();
    const date = new Date().toISOString();

    const saleRecord = {
      id: saleId,
      storeId,
      type: 'RETAIL' as const,
      paymentType,
      customerName: finalCustomerName,
      customerId: selectedCustomerId || undefined,
      paidAmount: paid,
      debtAmount: debt,
      items: cart.map(c => ({ productId: c.product.id, quantity: c.qty, price: c.product.retailPrice })),
      totalAmount,
      totalProfit: totalAmount - totalCost,
      createdAt: date,
    };

    addSale(saleRecord);

    // If debt exists, create debt record automatically!
    if (debt > 0) {
      addDebtRecord({
        id: uuidv4(),
        storeId,
        entityType: 'CUSTOMER',
        entityId: selectedCustomerId || uuidv4(),
        entityName: finalCustomerName,
        saleId,
        totalAmount: debt,
        paidAmount: 0,
        remainingAmount: debt,
        status: 'UNPAID',
        notes: `دين ناتج عن فاتورة بيع مفرق #${saleId.slice(0, 8)}`,
        createdAt: date
      });
    }

    // Reduce stock
    cart.forEach(c => {
      updateProduct(c.product.id, { quantity: c.product.quantity - c.qty });
    });

    if (printMode === 'DIRECT') {
      PrintService.printDirectThermalReceipt(saleRecord, productsMap, currentStore, storeSettings.currency);
    } else if (printMode === 'MODAL') {
      setActiveReceiptSale(saleRecord);
    } else {
      alert('تم إنهاء الفاتورة بنجاح!');
    }

    setCart([]);
    setSelectedCustomerId('');
    setCustomCustomerName('');
    setPaymentType('CASH');
    setPaidAmountInput('');
  };

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden h-[calc(100vh-120px)]">
      {/* Products Grid */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-800">المنتجات (المفرق)</h4>
            <Button 
              size="sm" 
              onClick={() => setIsScannerOpen(true)}
              className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs flex items-center gap-1.5"
            >
              <Barcode className="w-4 h-4" />
              كاميرا السكنر
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {scanMessage && (
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg animate-pulse">
                ✓ {scanMessage}
              </span>
            )}
            
            {/* Quick Barcode USB Scanner Input */}
            <div className="relative">
              <Barcode className="w-4 h-4 absolute right-3 top-3 text-indigo-500" />
              <input
                type="text"
                placeholder="مسح كود/باركود (Enter)..."
                className="h-10 pl-3 pr-9 border border-indigo-200 rounded-lg text-xs bg-indigo-50/40 focus:bg-white focus:border-indigo-600 outline-none w-48 ltr font-mono"
                value={quickBarcode}
                onChange={(e) => setQuickBarcode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && quickBarcode) {
                    handleBarcodeScan(quickBarcode);
                    setQuickBarcode('');
                  }
                }}
              />
            </div>

            <div className="relative w-full sm:w-48">
              <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              <input 
                type="text" 
                placeholder="ابحث بالاسم أو الباركود..." 
                className="w-full h-10 pl-4 pr-9 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && search) {
                    const match = storeProducts.find(p => p.barcode === search || p.name === search);
                    if (match) {
                      addToCart(match);
                      setSearch('');
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(p => (
              <div 
                key={p.id} 
                onClick={() => addToCart(p)}
                className="bg-white border border-slate-100 rounded-xl p-3 cursor-pointer hover:border-indigo-400 hover:shadow-sm transition-all flex flex-col text-center group"
              >
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-24 object-cover rounded-lg mb-3" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-24 bg-slate-50 rounded-lg border border-slate-100 mb-3 flex items-center justify-center text-slate-300">
                    <ShoppingCart className="w-8 h-8 opacity-50" />
                  </div>
                )}
                <h3 className="font-bold text-slate-700 text-sm mb-1 line-clamp-2">{p.name}</h3>
                <p className="text-indigo-600 font-mono font-bold mt-auto">{formatCurrency(p.retailPrice, storeSettings.currency)}</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase">الكمية: {formatNumber(p.quantity)}</p>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 text-sm">لا يوجد منتجات متاحة بأسعار المفرق</div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
            <ShoppingCart className="w-4 h-4 text-indigo-600" />
            سلة المبيعات
          </h4>
        </div>
        
        {/* Customer & Payment Options */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/30">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">اختر العميل:</label>
            <select
              value={selectedCustomerId}
              onChange={e => {
                setSelectedCustomerId(e.target.value);
                if (e.target.value) setCustomCustomerName('');
              }}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">-- زبون نقدي عام --</option>
              {storeCustomers.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
              ))}
            </select>
          </div>

          {!selectedCustomerId && (
            <Input 
              placeholder="أو اكتب اسم الزبون..." 
              value={customCustomerName}
              onChange={(e) => setCustomCustomerName(e.target.value)}
              className="text-xs"
            />
          )}

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">طريقة الدفع:</label>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setPaymentType('CASH')}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-all ${
                  paymentType === 'CASH' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                نقداً
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('CARD')}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-all ${
                  paymentType === 'CARD' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                بطاقة
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('CREDIT')}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-all ${
                  paymentType === 'CREDIT' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                بالآجل (دين)
              </button>
            </div>
          </div>

          {paymentType === 'CREDIT' && (
            <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-xl space-y-2">
              <label className="text-xs font-bold text-rose-800 block">المبلغ المدفوع مقدمًا (إن وجد):</label>
              <input
                type="number"
                placeholder="0.00"
                value={paidAmountInput}
                onChange={e => setPaidAmountInput(e.target.value)}
                className="w-full p-2 bg-white border border-rose-200 rounded-lg text-xs font-mono outline-none"
              />
              <p className="text-[11px] text-rose-600 font-bold">
                المتبقي كدين للعميل: {formatCurrency(Math.max(0, totalAmount - (Number(paidAmountInput) || 0)), storeSettings.currency)}
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.map(item => (
            <div key={item.product.id} className="flex flex-col gap-3 py-3 border-b border-slate-100 last:border-0">
              <div className="flex justify-between items-start">
                <span className="font-bold text-sm text-slate-700">{item.product.name}</span>
                <span className="font-bold font-mono text-indigo-600 text-sm">{formatCurrency(item.product.retailPrice * item.qty, storeSettings.currency)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 bg-slate-50 rounded-lg border border-slate-200 p-1">
                  <button onClick={() => updateQty(item.product.id, item.qty - 1)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-200 text-slate-600 text-xs font-bold">-</button>
                  <span className="w-8 text-center text-xs font-mono font-medium">{formatNumber(item.qty)}</span>
                  <button onClick={() => updateQty(item.product.id, item.qty + 1)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-200 text-slate-600 text-xs font-bold">+</button>
                </div>
                <button onClick={() => removeFromCart(item.product.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">
                  حذف
                </button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">السلة فارغة</div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-slate-500 text-sm">الإجمالي الكلي:</span>
            <span className="text-xl font-bold font-mono text-indigo-600">{formatCurrency(totalAmount, storeSettings.currency)}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button 
              className="py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50 hover:bg-emerald-700 shadow-sm" 
              disabled={cart.length === 0}
              onClick={() => handleCheckout('NONE')}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>إنهاء</span>
            </button>
            <button 
              className="py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50 hover:bg-indigo-700 shadow-sm" 
              disabled={cart.length === 0}
              onClick={() => handleCheckout('DIRECT')}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>طباعة الفاتورة</span>
            </button>
            <button 
              className="py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50 hover:bg-slate-900 shadow-sm" 
              disabled={cart.length === 0}
              onClick={() => handleCheckout('MODAL')}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>معاينة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScan}
      />

      {/* Thermal Receipt Print Modal */}
      {activeReceiptSale && (
        <ThermalReceipt
          sale={activeReceiptSale}
          productsMap={productsMap}
          store={currentStore}
          currency={storeSettings.currency}
          onClose={() => setActiveReceiptSale(null)}
        />
      )}
    </div>
  );
}
