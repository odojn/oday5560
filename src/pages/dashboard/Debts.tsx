import React, { useState, useMemo } from 'react';
import { useAuth } from '../../store/authStore';
import { useDB } from '../../store/dbStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Users, 
  Truck, 
  Receipt, 
  Plus, 
  Search, 
  DollarSign, 
  Calendar, 
  Phone, 
  CheckCircle, 
  Clock, 
  FileText, 
  X,
  CreditCard,
  Printer
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency, formatNumber } from '../../utils/format';
import { Customer, Supplier, DebtRecord, DebtPayment } from '../../types';
import { InvoiceService } from '../../services/invoiceService';

export default function Debts() {
  const { currentUser } = useAuth();
  const storeId = currentUser?.storeId || '';
  
  const { 
    customers, addCustomer, updateCustomer, deleteCustomer,
    suppliers, addSupplier, updateSupplier, deleteSupplier,
    debtRecords, addDebtRecord, updateDebtRecord, deleteDebtRecord,
    debtPayments, addDebtPayment,
    sales, stores, settings
  } = useDB();

  const currentStore = stores.find(s => s.id === storeId);
  const storeSettings = settings[storeId] || { currency: 'ILS' };

  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'SUPPLIERS' | 'PAYMENTS'>('CUSTOMERS');
  const [search, setSearch] = useState('');

  // Customer Modal State
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', address: '', notes: '' });

  // Supplier Modal State
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', company: '', phone: '', notes: '' });

  // Add Debt Modal
  const [isAddingDebt, setIsAddingDebt] = useState(false);
  const [debtForm, setDebtForm] = useState({
    entityType: 'CUSTOMER' as 'CUSTOMER' | 'SUPPLIER',
    entityId: '',
    totalAmount: '',
    notes: '',
    dueDate: ''
  });

  // Payoff / Payment Modal
  const [payingDebt, setPayingDebt] = useState<DebtRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Selected Entity Statement View
  const [viewingEntityStatement, setViewingEntityStatement] = useState<{
    type: 'CUSTOMER' | 'SUPPLIER';
    id: string;
    name: string;
  } | null>(null);

  // Store Specific Data
  const storeCustomers = useMemo(() => (customers || []).filter(c => c.storeId === storeId), [customers, storeId]);
  const storeSuppliers = useMemo(() => (suppliers || []).filter(s => s.storeId === storeId), [suppliers, storeId]);
  const storeDebtRecords = useMemo(() => (debtRecords || []).filter(d => d.storeId === storeId), [debtRecords, storeId]);
  const storeDebtPayments = useMemo(() => (debtPayments || []).filter(p => p.storeId === storeId), [debtPayments, storeId]);

  // Handle Add Customer
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name.trim()) return;
    addCustomer({
      id: uuidv4(),
      storeId,
      name: customerForm.name.trim(),
      phone: customerForm.phone.trim(),
      address: customerForm.address.trim(),
      notes: customerForm.notes.trim(),
      createdAt: new Date().toISOString()
    });
    setCustomerForm({ name: '', phone: '', address: '', notes: '' });
    setIsAddingCustomer(false);
  };

  // Handle Add Supplier
  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) return;
    addSupplier({
      id: uuidv4(),
      storeId,
      name: supplierForm.name.trim(),
      company: supplierForm.company.trim(),
      phone: supplierForm.phone.trim(),
      notes: supplierForm.notes.trim(),
      createdAt: new Date().toISOString()
    });
    setSupplierForm({ name: '', company: '', phone: '', notes: '' });
    setIsAddingSupplier(false);
  };

  // Handle Create Debt Record manually
  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(debtForm.totalAmount);
    if (!debtForm.entityId || amount <= 0) return;

    let entityName = '';
    if (debtForm.entityType === 'CUSTOMER') {
      entityName = storeCustomers.find(c => c.id === debtForm.entityId)?.name || 'عميل';
    } else {
      entityName = storeSuppliers.find(s => s.id === debtForm.entityId)?.name || 'مورد';
    }

    addDebtRecord({
      id: uuidv4(),
      storeId,
      entityType: debtForm.entityType,
      entityId: debtForm.entityId,
      entityName,
      totalAmount: amount,
      paidAmount: 0,
      remainingAmount: amount,
      status: 'UNPAID',
      notes: debtForm.notes,
      dueDate: debtForm.dueDate || undefined,
      createdAt: new Date().toISOString()
    });

    setIsAddingDebt(false);
    setDebtForm({ entityType: 'CUSTOMER', entityId: '', totalAmount: '', notes: '', dueDate: '' });
  };

  // Handle Payment Payoff
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebt) return;
    const amount = Number(paymentAmount);
    if (amount <= 0 || amount > payingDebt.remainingAmount) {
      alert('مبلغ الدفعة يفضل أن يكون أكبر من الصفر ولا يتجاوز المتبقي من الدين');
      return;
    }

    addDebtPayment({
      id: uuidv4(),
      storeId,
      debtId: payingDebt.id,
      amount,
      date: new Date().toISOString(),
      notes: paymentNotes
    });

    setPayingDebt(null);
    setPaymentAmount('');
    setPaymentNotes('');
  };

  // Customer debt summaries
  const customerDebtSummaries = useMemo(() => {
    return storeCustomers.map(customer => {
      const records = storeDebtRecords.filter(d => d.entityType === 'CUSTOMER' && d.entityId === customer.id);
      const totalDebt = records.reduce((sum, r) => sum + r.totalAmount, 0);
      const totalPaid = records.reduce((sum, r) => sum + r.paidAmount, 0);
      const remainingDebt = records.reduce((sum, r) => sum + r.remainingAmount, 0);

      return {
        ...customer,
        records,
        totalDebt,
        totalPaid,
        remainingDebt
      };
    }).filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone && c.phone.includes(search)));
  }, [storeCustomers, storeDebtRecords, search]);

  // Supplier debt summaries
  const supplierDebtSummaries = useMemo(() => {
    return storeSuppliers.map(supplier => {
      const records = storeDebtRecords.filter(d => d.entityType === 'SUPPLIER' && d.entityId === supplier.id);
      const totalDebt = records.reduce((sum, r) => sum + r.totalAmount, 0);
      const totalPaid = records.reduce((sum, r) => sum + r.paidAmount, 0);
      const remainingDebt = records.reduce((sum, r) => sum + r.remainingAmount, 0);

      return {
        ...supplier,
        records,
        totalDebt,
        totalPaid,
        remainingDebt
      };
    }).filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || (s.company && s.company.includes(search)));
  }, [storeSuppliers, storeDebtRecords, search]);

  // Overall statistics
  const totalCustomerDebt = useMemo(() => {
    return storeDebtRecords.filter(d => d.entityType === 'CUSTOMER').reduce((sum, d) => sum + d.remainingAmount, 0);
  }, [storeDebtRecords]);

  const totalSupplierDebt = useMemo(() => {
    return storeDebtRecords.filter(d => d.entityType === 'SUPPLIER').reduce((sum, d) => sum + d.remainingAmount, 0);
  }, [storeDebtRecords]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600" />
            إدارة الحسابات والديون (العملاء والموردين)
          </h2>
          <p className="text-xs text-slate-500 mt-1">تتبع ذمم العملاء والمستحقات، وإدارة ديون الموردين والدفعات.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsAddingCustomer(true)} className="text-xs flex items-center gap-2 bg-indigo-600">
            <Plus className="w-4 h-4" />
            إضافة عميل جديد
          </Button>
          <Button onClick={() => setIsAddingSupplier(true)} variant="secondary" className="text-xs flex items-center gap-2">
            <Plus className="w-4 h-4" />
            إضافة مورد جديد
          </Button>
          <Button onClick={() => setIsAddingDebt(true)} variant="ghost" className="text-xs flex items-center gap-2 border border-slate-300">
            <CreditCard className="w-4 h-4 text-slate-600" />
            تسجيل دين جديد
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">إجمالي ديون العملاء (مستحقات لك)</p>
            <h3 className="text-2xl font-extrabold text-indigo-600 font-mono mt-1">{formatCurrency(totalCustomerDebt, storeSettings.currency)}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">إجمالي ديون الموردين (التزامات عليك)</p>
            <h3 className="text-2xl font-extrabold text-rose-600 font-mono mt-1">{formatCurrency(totalSupplierDebt, storeSettings.currency)}</h3>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">إجمالي الحسابات والعملاء</p>
            <h3 className="text-2xl font-extrabold text-slate-800 font-mono mt-1">{storeCustomers.length + storeSuppliers.length} حساب</h3>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('CUSTOMERS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'CUSTOMERS' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              ديون العملاء ({storeCustomers.length})
            </button>
            <button
              onClick={() => setActiveTab('SUPPLIERS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'SUPPLIERS' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Truck className="w-4 h-4" />
              ديون الموردين ({storeSuppliers.length})
            </button>
            <button
              onClick={() => setActiveTab('PAYMENTS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'PAYMENTS' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Receipt className="w-4 h-4" />
              سجل تسديد الدفعات ({storeDebtPayments.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              placeholder="بحث باسم الحساب أو الهاتف..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-3 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Tab 1: Customers */}
        {activeTab === 'CUSTOMERS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">اسم العميل</th>
                  <th className="px-6 py-4">رقم الهاتف</th>
                  <th className="px-6 py-4">إجمالي الديون</th>
                  <th className="px-6 py-4">المدفوع</th>
                  <th className="px-6 py-4">المتبقي (المطلوب)</th>
                  <th className="px-6 py-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerDebtSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-xs">
                      لا يوجد عملاء مسجلين حالياً.
                    </td>
                  </tr>
                ) : (
                  customerDebtSummaries.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{c.name}</td>
                      <td className="px-6 py-4 font-mono text-slate-600 text-xs">{c.phone || '-'}</td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-700">{formatCurrency(c.totalDebt, storeSettings.currency)}</td>
                      <td className="px-6 py-4 font-mono text-emerald-600 font-bold">{formatCurrency(c.totalPaid, storeSettings.currency)}</td>
                      <td className="px-6 py-4 font-mono font-extrabold text-rose-600">{formatCurrency(c.remainingDebt, storeSettings.currency)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {c.remainingDebt > 0 && (
                            <button
                              onClick={() => {
                                const activeDebt = c.records.find(r => r.remainingAmount > 0);
                                if (activeDebt) {
                                  setPayingDebt(activeDebt);
                                }
                              }}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 shadow-sm"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              تسديد دين / دفعة
                            </button>
                          )}
                          <button
                            onClick={() => setViewingEntityStatement({ type: 'CUSTOMER', id: c.id, name: c.name })}
                            className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            كشف حساب
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Suppliers */}
        {activeTab === 'SUPPLIERS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">اسم المورد</th>
                  <th className="px-6 py-4">اسم الشركة</th>
                  <th className="px-6 py-4">رقم الهاتف</th>
                  <th className="px-6 py-4">إجمالي المستحق</th>
                  <th className="px-6 py-4">المسدد له</th>
                  <th className="px-6 py-4">المتبقي له (التزام)</th>
                  <th className="px-6 py-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplierDebtSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-xs">
                      لا يوجد موردين مسجلين حالياً.
                    </td>
                  </tr>
                ) : (
                  supplierDebtSummaries.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{s.name}</td>
                      <td className="px-6 py-4 text-slate-600 text-xs">{s.company || '-'}</td>
                      <td className="px-6 py-4 font-mono text-slate-600 text-xs">{s.phone || '-'}</td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-700">{formatCurrency(s.totalDebt, storeSettings.currency)}</td>
                      <td className="px-6 py-4 font-mono text-emerald-600 font-bold">{formatCurrency(s.totalPaid, storeSettings.currency)}</td>
                      <td className="px-6 py-4 font-mono font-extrabold text-rose-600">{formatCurrency(s.remainingDebt, storeSettings.currency)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {s.remainingDebt > 0 && (
                            <button
                              onClick={() => {
                                const activeDebt = s.records.find(r => r.remainingAmount > 0);
                                if (activeDebt) {
                                  setPayingDebt(activeDebt);
                                }
                              }}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 shadow-sm"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              تسديد دين / دفعة
                            </button>
                          )}
                          <button
                            onClick={() => setViewingEntityStatement({ type: 'SUPPLIER', id: s.id, name: s.name })}
                            className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            كشف حساب
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Debt Payment Logs */}
        {activeTab === 'PAYMENTS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">التاريخ والوقت</th>
                  <th className="px-6 py-4">صاحب الدين</th>
                  <th className="px-6 py-4">نوع الحساب</th>
                  <th className="px-6 py-4">المبلغ المسدد</th>
                  <th className="px-6 py-4">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {storeDebtPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-xs">
                      لا يوجد أي عمليات تسديد مسجلة حتى الآن.
                    </td>
                  </tr>
                ) : (
                  storeDebtPayments.map(p => {
                    const record = storeDebtRecords.find(r => r.id === p.debtId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono text-slate-500 text-xs">
                          {new Date(p.date).toLocaleString('ar-EG')}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">{record?.entityName || 'مجهول'}</td>
                        <td className="px-6 py-4 text-xs">
                          <span className={`px-2 py-1 rounded font-bold ${record?.entityType === 'CUSTOMER' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                            {record?.entityType === 'CUSTOMER' ? 'عميل' : 'مورد'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-emerald-600">{formatCurrency(p.amount, storeSettings.currency)}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">{p.notes || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isAddingCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">إضافة عميل جديد</h3>
              <button onClick={() => setIsAddingCustomer(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveCustomer} className="space-y-4 pt-4">
              <Input label="اسم العميل الكامل" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} required />
              <Input label="رقم الهاتف" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} />
              <Input label="العنوان" value={customerForm.address} onChange={e => setCustomerForm({...customerForm, address: e.target.value})} />
              <Input label="ملاحظات" value={customerForm.notes} onChange={e => setCustomerForm({...customerForm, notes: e.target.value})} />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsAddingCustomer(false)}>إلغاء</Button>
                <Button type="submit">حفظ العميل</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {isAddingSupplier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">إضافة مورد جديد</h3>
              <button onClick={() => setIsAddingSupplier(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveSupplier} className="space-y-4 pt-4">
              <Input label="اسم المورد" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} required />
              <Input label="اسم الشركة / المؤسسة" value={supplierForm.company} onChange={e => setSupplierForm({...supplierForm, company: e.target.value})} />
              <Input label="رقم الهاتف" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} />
              <Input label="ملاحظات" value={supplierForm.notes} onChange={e => setSupplierForm({...supplierForm, notes: e.target.value})} />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsAddingSupplier(false)}>إلغاء</Button>
                <Button type="submit">حفظ المورد</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Debt Record Modal */}
      {isAddingDebt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">تسجيل دين / مستحق جديد</h3>
              <button onClick={() => setIsAddingDebt(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveDebt} className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">نوع الحساب</label>
                <select
                  value={debtForm.entityType}
                  onChange={e => setDebtForm({...debtForm, entityType: e.target.value as any, entityId: ''})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                >
                  <option value="CUSTOMER">دين على عميل (مستحق لك)</option>
                  <option value="SUPPLIER">دين لمورد (التزام عليك)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">اختر الشخص / الحساب</label>
                <select
                  value={debtForm.entityId}
                  onChange={e => setDebtForm({...debtForm, entityId: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  required
                >
                  <option value="">-- اختر --</option>
                  {debtForm.entityType === 'CUSTOMER'
                    ? storeCustomers.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)
                    : storeSuppliers.map(s => <option key={s.id} value={s.id}>{s.name} {s.company ? `- ${s.company}` : ''}</option>)
                  }
                </select>
              </div>

              <Input label="قيمة الدين الإجمالية" type="number" value={debtForm.totalAmount} onChange={e => setDebtForm({...debtForm, totalAmount: e.target.value})} required />
              <Input label="تاريخ الاستحقاق (اختياري)" type="date" value={debtForm.dueDate} onChange={e => setDebtForm({...debtForm, dueDate: e.target.value})} />
              <Input label="ملاحظات / سبب الدين" value={debtForm.notes} onChange={e => setDebtForm({...debtForm, notes: e.target.value})} />

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsAddingDebt(false)}>إلغاء</Button>
                <Button type="submit">تسجيل الدين</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payoff Payment Modal */}
      {payingDebt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">تسجيل دفعة سداد جزئية</h3>
                  <p className="text-xs text-slate-500">صاحب الدين: <strong className="text-slate-800 font-bold">{payingDebt.entityName}</strong></p>
                </div>
              </div>
              <button onClick={() => setPayingDebt(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If there are multiple active debts for this entity, allow switching between them */}
            {(() => {
              const entityActiveDebts = storeDebtRecords.filter(r => r.entityType === payingDebt.entityType && r.entityId === payingDebt.entityId && r.remainingAmount > 0);
              if (entityActiveDebts.length > 1) {
                return (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">اختر الدين المراد تسديده:</label>
                    <select
                      value={payingDebt.id}
                      onChange={e => {
                        const sel = entityActiveDebts.find(d => d.id === e.target.value);
                        if (sel) setPayingDebt(sel);
                      }}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    >
                      {entityActiveDebts.map(d => (
                        <option key={d.id} value={d.id}>
                          دين بتاريخ {new Date(d.createdAt).toLocaleDateString('ar-EG')} - متبقي {formatCurrency(d.remainingAmount, storeSettings.currency)} {d.notes ? `(${d.notes})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }
              return null;
            })()}

            {/* Debt Financial Summary & Progress */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">إجمالي الدين</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">{formatCurrency(payingDebt.totalAmount, storeSettings.currency)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">المسدد سابقاً</span>
                  <span className="font-mono font-bold text-emerald-600 text-sm">{formatCurrency(payingDebt.paidAmount, storeSettings.currency)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">المتبقي حالياً</span>
                  <span className="font-mono font-extrabold text-rose-600 text-sm">{formatCurrency(payingDebt.remainingAmount, storeSettings.currency)}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-500">
                  <span>نسبة السداد: {payingDebt.totalAmount > 0 ? Math.round((payingDebt.paidAmount / payingDebt.totalAmount) * 100) : 0}%</span>
                  <span>المتبقي: {payingDebt.totalAmount > 0 ? Math.round((payingDebt.remainingAmount / payingDebt.totalAmount) * 100) : 0}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-300" 
                    style={{ width: `${payingDebt.totalAmount > 0 ? (payingDebt.paidAmount / payingDebt.totalAmount) * 100 : 0}%` }}
                  />
                  <div 
                    className="bg-rose-500 h-full transition-all duration-300" 
                    style={{ width: `${payingDebt.totalAmount > 0 ? (payingDebt.remainingAmount / payingDebt.totalAmount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* History of Partial Payments for this Debt */}
            {(() => {
              const paymentsForThisDebt = storeDebtPayments.filter(p => p.debtId === payingDebt.id);
              if (paymentsForThisDebt.length > 0) {
                return (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        سجل الدفعات الجزئية السابقة ({paymentsForThisDebt.length}):
                      </span>
                      <span className="text-[11px] text-emerald-600 font-mono font-bold">
                        مجموع المسدد: {formatCurrency(paymentsForThisDebt.reduce((s, p) => s + p.amount, 0), storeSettings.currency)}
                      </span>
                    </p>
                    <div className="max-h-36 overflow-y-auto bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1.5 divide-y divide-slate-100">
                      {paymentsForThisDebt.map((p, idx) => (
                        <div key={p.id} className="pt-1.5 first:pt-0 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-800">دفعة #{idx + 1}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {new Date(p.date).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          <div className="text-left">
                            <span className="font-mono font-bold text-emerald-600">+{formatCurrency(p.amount, storeSettings.currency)}</span>
                            {p.notes && <span className="text-[10px] text-slate-500 block">{p.notes}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                  لا توجد دفعات جزئية مسجلة سابقاً لهذا الدين (دين جديد).
                </p>
              );
            })()}

            {/* New Partial Payment Form */}
            <form onSubmit={handleSavePayment} className="space-y-4 pt-1">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 block">مبلغ الدفعة الحالية</label>
                  <span className="text-[11px] text-slate-400">حدد المبلغ المسدد</span>
                </div>

                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    value={paymentAmount} 
                    onChange={e => setPaymentAmount(e.target.value)} 
                    placeholder="0.00"
                    className="font-mono text-base font-bold"
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(payingDebt.remainingAmount.toString())}
                    className="px-3 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl whitespace-nowrap hover:bg-emerald-200 transition-colors"
                  >
                    سداد كامل
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount((payingDebt.remainingAmount / 2).toFixed(2))}
                    className="px-3 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl whitespace-nowrap hover:bg-indigo-100 transition-colors"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount((payingDebt.remainingAmount / 4).toFixed(2))}
                    className="px-3 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl whitespace-nowrap hover:bg-slate-200 transition-colors"
                  >
                    25%
                  </button>
                </div>

                {/* Dynamic Remaining Balance Preview */}
                {Number(paymentAmount) > 0 && (
                  <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200 text-xs flex justify-between items-center text-emerald-900 font-bold">
                    <span>الرصيد المتبقي بعد إضافة هذه الدفعة:</span>
                    <span className="font-mono text-sm text-emerald-700">
                      {formatCurrency(Math.max(0, payingDebt.remainingAmount - Number(paymentAmount)), storeSettings.currency)}
                    </span>
                  </div>
                )}
              </div>

              <Input 
                label="طريقة الدفع / ملاحظات الدفعة" 
                value={paymentNotes} 
                onChange={e => setPaymentNotes(e.target.value)} 
                placeholder="مثال: دفعة نقداً، تحويل بنكي، كليك، شيك..." 
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setPayingDebt(null)}>إلغاء</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  تسجيل الدفعة الجزئية
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Statement View Modal */}
      {viewingEntityStatement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">كشف حساب التفصيلي - {viewingEntityStatement.name}</h3>
              <button onClick={() => setViewingEntityStatement(null)} className="p-1 hover:bg-slate-800 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* List of Debt Records */}
              {storeDebtRecords.filter(r => r.entityType === viewingEntityStatement.type && r.entityId === viewingEntityStatement.id).length === 0 ? (
                <p className="text-center text-slate-400 py-6 text-sm">لا يوجد أي سجل ديون مسجل لهذا الحساب.</p>
              ) : (
                storeDebtRecords
                  .filter(r => r.entityType === viewingEntityStatement.type && r.entityId === viewingEntityStatement.id)
                  .map(debt => {
                    const payments = storeDebtPayments.filter(p => p.debtId === debt.id);
                    return (
                      <div key={debt.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                        <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                          <div>
                            <span className="text-xs text-slate-400 font-mono">تاريخ الدين: {new Date(debt.createdAt).toLocaleDateString('ar-EG')}</span>
                            {debt.notes && <p className="text-xs font-bold text-slate-700 mt-1">{debt.notes}</p>}
                          </div>
                          <div className="text-left">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${debt.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {debt.status === 'PAID' ? 'مسدد بالكامل' : debt.status === 'PARTIAL' ? 'مسدد جزئياً' : 'غير مسدد'}
                            </span>
                            <p className="font-mono font-extrabold text-sm text-indigo-900 mt-1">{formatCurrency(debt.remainingAmount, storeSettings.currency)} متبقي</p>
                          </div>
                        </div>

                        {/* Payments Breakdown */}
                        {payments.length > 0 && (
                          <div className="bg-white p-3 rounded-lg border border-slate-100 text-xs space-y-1">
                            <p className="font-bold text-slate-600 mb-2">الدفعات التي تم تسديدها:</p>
                            {payments.map(p => (
                              <div key={p.id} className="flex justify-between text-slate-600 font-mono py-1 border-b border-slate-50 last:border-0">
                                <span>{new Date(p.date).toLocaleDateString('ar-EG')}: {p.notes || 'دفعة'}</span>
                                <span className="text-emerald-600 font-bold">+{formatCurrency(p.amount, storeSettings.currency)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {debt.remainingAmount > 0 && (
                          <div className="flex justify-end pt-2">
                            <Button size="sm" onClick={() => setPayingDebt(debt)} className="text-xs flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5" />
                              تسديد دفعة لهذا الدين
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <Button 
                variant="ghost" 
                onClick={() => {
                  const records = storeDebtRecords
                    .filter(r => r.entityType === viewingEntityStatement.type && r.entityId === viewingEntityStatement.id)
                    .map(r => ({
                      date: r.createdAt,
                      notes: r.notes,
                      totalAmount: r.totalAmount,
                      paidAmount: r.paidAmount,
                      remainingAmount: r.remainingAmount,
                      status: r.status,
                      payments: storeDebtPayments
                        .filter(p => p.debtId === r.id)
                        .map(p => ({ date: p.date, amount: p.amount, notes: p.notes }))
                    }));

                  InvoiceService.printAccountStatement({
                    storeName: currentStore?.name || 'المتجر التجاري',
                    entityName: viewingEntityStatement.name,
                    entityType: viewingEntityStatement.type,
                    records,
                    currency: storeSettings.currency
                  });
                }} 
                className="flex items-center gap-1 text-xs"
              >
                <Printer className="w-4 h-4" /> طباعة كشف الحساب
              </Button>
              <Button onClick={() => setViewingEntityStatement(null)}>إغلاق</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
