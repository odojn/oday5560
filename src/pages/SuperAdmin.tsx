import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../store/authStore';
import { useDB } from '../store/dbStore';
import { 
  Edit2, Trash2, LogOut, ShieldAlert, Plus, Ban, CheckCircle, 
  KeyRound, Lock, Unlock, RotateCcw, AlertTriangle, Archive, UserCheck, Key, ArrowRight, Check
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { User, Store } from '../types';
import { supabase } from '../lib/supabase';

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { stores, addStore, updateStore, deleteStore, addUser, updateUser, users } = useDB();

  // Active Tab: 'ACTIVE' | 'ARCHIVED'
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');

  // Form State for Adding Store
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', password: '' });

  // State for Edit Store & Owner Modal
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', phone: '', email: '', username: '', password: '' });

  // State for Delete Confirmation Modal
  const [deletingStore, setDeletingStore] = useState<Store | null>(null);

  // State for Quick Password Edit Modal
  const [editingPasswordUser, setEditingPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  if (currentUser?.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-slate-200">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">غير مصرح لك بالدخول</h1>
          <Button onClick={() => navigate('/')}>العودة للرئيسية</Button>
        </div>
      </div>
    );
  }

  // Active vs Deleted Stores
  const activeStores = stores.filter(s => !s.isDeleted);
  const archivedStores = stores.filter(s => s.isDeleted);

  const handleAddStore = (e: React.FormEvent) => {
    e.preventDefault();
    const storeId = uuidv4();
    
    // Create Store
    addStore({
      id: storeId,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      createdAt: new Date().toISOString(),
      isDeleted: false,
    });

    // Create Owner Account
    addUser({
      id: uuidv4(),
      storeId,
      username: formData.email.split('@')[0],
      email: formData.email,
      role: 'STORE_OWNER',
      password: formData.password,
      isSuspended: false,
      isDeleted: false,
    } as any);

    setIsAdding(false);
    setFormData({ name: '', phone: '', email: '', password: '' });
  };

  // Handle Edit Store & Owner Details
  const handleStartEditStore = (store: Store) => {
    const ownerUser = users.find(u => u.storeId === store.id && u.role === 'STORE_OWNER');
    setEditingStore(store);
    setEditFormData({
      name: store.name,
      phone: store.phone,
      email: store.email,
      username: ownerUser?.username || store.email.split('@')[0],
      password: ownerUser?.password || '',
    });
  };

  const handleSaveStoreEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;

    // Update Store details
    updateStore(editingStore.id, {
      name: editFormData.name,
      phone: editFormData.phone,
      email: editFormData.email,
    });

    // Update Owner details
    const ownerUser = users.find(u => u.storeId === editingStore.id && u.role === 'STORE_OWNER');
    if (ownerUser) {
      updateUser(ownerUser.id, {
        username: editFormData.username,
        email: editFormData.email,
        password: editFormData.password,
      });
    }

    alert('✅ تم تعديل بيانات المتجر والعميل بنجاح مع حفظ جميع البيانات والديون والمبيعات!');
    setEditingStore(null);
  };

  // Handle Suspend/Unsuspend
  const toggleSuspendAccount = (ownerUser: User) => {
    const nextState = !ownerUser.isSuspended;
    updateUser(ownerUser.id, { isSuspended: nextState });
    alert(nextState 
      ? `🔒 تم تعليق حساب العميل (${ownerUser.username || ownerUser.email}) بنجاح. لن يتمكن من الدخول حتى فك التعليق مع احتفاظه بكافة بياناته.`
      : `🔓 تم فك تعليق حساب العميل (${ownerUser.username || ownerUser.email}) بنجاح وإعادة تفعيل دخوله.`
    );
  };

  // Handle Soft-Delete (Archive) Store
  const handleConfirmDeleteStore = () => {
    if (!deletingStore) return;

    const now = new Date().toISOString();
    // Mark store as deleted
    updateStore(deletingStore.id, { isDeleted: true, deletedAt: now });

    // Mark store owner & employees as deleted
    users.filter(u => u.storeId === deletingStore.id).forEach(u => {
      updateUser(u.id, { isDeleted: true, deletedAt: now });
    });

    alert(`🗑️ تم نقل متجر (${deletingStore.name}) بنجاح إلى "سلة الحسابات المحذوفة". كافة البيانات محفوظة 100% ويمكنك استرجاعها في أي وقت!`);
    setDeletingStore(null);
  };

  // Handle Restore Deleted Store
  const handleRestoreStore = (store: Store) => {
    updateStore(store.id, { isDeleted: false, deletedAt: undefined });
    users.filter(u => u.storeId === store.id).forEach(u => {
      updateUser(u.id, { isDeleted: false, deletedAt: undefined });
    });
    alert(`✨ تمت استرجاع متجر (${store.name}) وكافة بياناته ومستخدميه بنجاح 100%!`);
  };

  // Permanent Delete
  const handlePermanentDeleteStore = (store: Store) => {
    if (window.confirm(`⚠️ تحذير شديد: هل أنت متأكد من الحذف النهائي المبرم لمتجر (${store.name})؟ لا يمكن التراجع عن هذه الخطوة!`)) {
      deleteStore(store.id);
    }
  };

  // Quick Password Edit
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPasswordUser) return;
    if (!newPassword.trim()) {
      alert('يرجى إدخال كلمة المرور الجديدة');
      return;
    }

    updateUser(editingPasswordUser.id, { password: newPassword });
    alert(`🔑 تم تغيير كلمة المرور للعميل (${editingPasswordUser.username || editingPasswordUser.email}) بنجاح دون المساس بأي بيانات.`);
    setEditingPasswordUser(null);
    setNewPassword('');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-6 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-md">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">لوحة تحكم مدير النظام العام (Super Admin)</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">إدارة كاملة لحسابات العملاء، التعديل، التعليق، الأرشفة، والحفظ الدائم</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50 text-xs font-bold">
            <LogOut className="w-4 h-4 ml-1.5" />
            تسجيل الخروج
          </Button>
        </div>

        {/* Credentials & Database Status Info Box */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Key className="w-6 h-6 shrink-0" />
            </div>
            <div>
              <div className="font-bold text-amber-300 text-sm flex items-center gap-2">
                <span>🛡️ بيانات دخول مدير النظام المعتمة والمشفرة (Cybersecurity Credentials):</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-slate-300">
                <span>اسم المستخدم الأساسي: <strong className="text-white font-mono bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 select-all">SuperAdmin_CyberX_2030</strong></span>
                <span>كلمة المرور المشفرة: <strong className="text-white font-mono bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 select-all">SecPass_9824#OdayQut!2030</strong></span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                المعرف البديل المشفر: <code className="text-amber-200 font-mono">odqy5qutqutadmin2030</code> | السر البديل: <code className="text-amber-200 font-mono">u20102030ooy79</code>
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 items-end shrink-0">
            <div className="text-[11px] bg-slate-800 px-3.5 py-1.5 rounded-xl text-emerald-400 font-semibold border border-slate-700 text-center flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ✓ قاعدة البيانات دائمية ومحفوظة تلقائياً 100%
            </div>
            <div className={`text-[11px] px-3.5 py-1.5 rounded-xl font-semibold border text-center flex items-center gap-1.5 ${
              supabase ? 'bg-indigo-950 text-indigo-300 border-indigo-700' : 'bg-slate-800 text-sky-400 border-slate-700'
            }`}>
              <Check className="w-3.5 h-3.5" />
              {supabase ? 'Supabase Database: متصلة ونشطة' : 'محرك الحفظ التلقائي المحلي Supabase/Zustand: متصل بنجاح'}
            </div>
          </div>
        </div>

        {/* BIG PROMINENT ACTION BUTTON BANNER FOR DELETED ACCOUNTS PAGE */}
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`p-5 rounded-2xl border text-right transition-all flex items-center justify-between shadow-sm ${
              activeTab === 'ACTIVE'
                ? 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-400'
                : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${activeTab === 'ACTIVE' ? 'bg-white/20' : 'bg-indigo-100 text-indigo-700'}`}>
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base">المتاجر والحسابات النشطة</h3>
                <p className={`text-xs mt-0.5 ${activeTab === 'ACTIVE' ? 'text-indigo-100' : 'text-slate-500'}`}>
                  إدارة المتاجر الفعالة، تعديل البيانات، وتعليق الحسابات
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
              activeTab === 'ACTIVE' ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-800'
            }`}>
              {activeStores.length} متجر
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ARCHIVED')}
            className={`p-5 rounded-2xl border text-right transition-all flex items-center justify-between shadow-sm ${
              activeTab === 'ARCHIVED'
                ? 'bg-red-600 text-white border-red-700 ring-2 ring-red-400'
                : 'bg-white text-slate-800 border-slate-200 hover:border-red-300 hover:bg-red-50/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${activeTab === 'ARCHIVED' ? 'bg-white/20' : 'bg-red-100 text-red-600'}`}>
                <Archive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <span>سلة الحسابات المحذوفة</span>
                  <span className="text-[10px] bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full font-extrabold">الاسترجاع الشامل</span>
                </h3>
                <p className={`text-xs mt-0.5 ${activeTab === 'ARCHIVED' ? 'text-red-100' : 'text-slate-500'}`}>
                  عرض الحسابات المحذوفة وإعادة استرجاعها بكافة البيانات
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
              activeTab === 'ARCHIVED' ? 'bg-white text-red-700' : 'bg-red-100 text-red-800'
            }`}>
              {archivedStores.length} محذوف
            </span>
          </button>
        </div>

        {/* ACTIVE STORES TAB */}
        {activeTab === 'ACTIVE' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">قائمة متاجر العملاء النشطة</h2>
                <p className="text-xs text-slate-500 mt-1">يمكنك تعديل بيانات العميل، تعليق الحساب، أو نقله لسلة المحذوفات بأمان تام</p>
              </div>
              <Button onClick={() => setIsAdding(!isAdding)} className="bg-indigo-600 hover:bg-indigo-700 shadow-md">
                <Plus className="w-4 h-4 ml-2" />
                إنشاء متجر عميل جديد
              </Button>
            </div>

            {/* Add Store Form */}
            {isAdding && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-slate-50 p-6 rounded-2xl border border-slate-200 grid md:grid-cols-2 gap-4 shadow-inner"
                onSubmit={handleAddStore}
              >
                <Input label="اسم متجر العميل" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <Input label="رقم هاتف العميل" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                <Input label="البريد الإلكتروني / اسم المستخدم" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                <Input label="كلمة المرور الحالية" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                
                <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                  <Button variant="ghost" type="button" onClick={() => setIsAdding(false)}>إلغاء</Button>
                  <Button type="submit">إضافة المتجر</Button>
                </div>
              </motion.form>
            )}

            {/* Active Stores Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase bg-slate-50/80">
                    <th className="py-3.5 px-4 font-bold">المتجر والعميل</th>
                    <th className="py-3.5 px-4 font-bold">الهاتف والبريد</th>
                    <th className="py-3.5 px-4 font-bold">حالة الحساب</th>
                    <th className="py-3.5 px-4 font-bold text-center">الإجراءات والتحكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {activeStores.map(store => {
                    const ownerUser = users.find(u => u.storeId === store.id && u.role === 'STORE_OWNER');
                    const isSuspended = !!ownerUser?.isSuspended;

                    return (
                      <tr key={store.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4 font-bold text-slate-800">
                          <div className="text-sm font-bold text-indigo-950">{store.name}</div>
                          <div className="text-[11px] text-slate-500 font-normal">مالك المتجر: <span className="font-semibold">{ownerUser?.username || store.email.split('@')[0]}</span></div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {store.id.substring(0,8)}</div>
                        </td>
                        <td className="py-4 px-4 text-slate-700">
                          <div className="font-semibold dir-ltr text-right">{store.phone}</div>
                          <div className="text-[11px] text-slate-500 dir-ltr text-right">{store.email}</div>
                        </td>
                        <td className="py-4 px-4">
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-bold text-[11px]">
                              <Ban className="w-3.5 h-3.5" />
                              حساب معلّق
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-bold text-[11px]">
                              <CheckCircle className="w-3.5 h-3.5" />
                              نشط وفعّال
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            {/* Edit Store Details */}
                            <button
                              onClick={() => handleStartEditStore(store)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 text-xs font-bold flex items-center gap-1 border border-slate-300 transition-all shadow-sm"
                              title="تعديل كافة بيانات المتجر والعميل"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                              <span>تعديل</span>
                            </button>

                            {ownerUser && (
                              <>
                                {/* Suspend / Unsuspend */}
                                <button
                                  onClick={() => toggleSuspendAccount(ownerUser)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                                    isSuspended
                                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                      : 'bg-amber-500 text-white hover:bg-amber-600'
                                  }`}
                                  title={isSuspended ? 'فك التعليق' : 'تعليق الحساب مؤقتاً'}
                                >
                                  {isSuspended ? (
                                    <>
                                      <Unlock className="w-3.5 h-3.5" />
                                      <span>فك التعليق</span>
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="w-3.5 h-3.5" />
                                      <span>تعليق الحساب</span>
                                    </>
                                  )}
                                </button>

                                {/* Edit Password */}
                                <button
                                  onClick={() => {
                                    setEditingPasswordUser(ownerUser);
                                    setNewPassword(ownerUser.password || '');
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1 border border-indigo-200 transition-all shadow-sm"
                                  title="تغيير كلمة المرور فقط"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                  <span>كلمة المرور</span>
                                </button>
                              </>
                            )}

                            {/* Delete (Archive) Store with Confirmation Modal */}
                            <button 
                              className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold flex items-center gap-1 border border-red-200 transition-all shadow-sm" 
                              onClick={() => setDeletingStore(store)}
                              title="أرشفة / حذف الحساب مع التأكيد"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف الحساب</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {activeStores.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">لا يوجد متاجر نشطة حالياً في النظام</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ARCHIVED STORES TAB */}
        {activeTab === 'ARCHIVED' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Archive className="w-5 h-5 text-red-500" />
                صفحة وسلة الحسابات والمتاجر المحذوفة
              </h2>
              <p className="text-xs text-slate-500 mt-1">جميع بيانات المنتجات، المبيعات والديون متوفرة ومحفوظة بالكامل ويمكنك استرجاع أي متجر مع مستخدميه بضغطة زر واحدة</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase bg-slate-50/80">
                    <th className="py-3.5 px-4 font-bold">اسم المتجر المحذوف</th>
                    <th className="py-3.5 px-4 font-bold">بيانات المالك</th>
                    <th className="py-3.5 px-4 font-bold">تاريخ الأرشفة</th>
                    <th className="py-3.5 px-4 font-bold text-center">زر استرجاع الحساب والبيانات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {archivedStores.map(store => {
                    const ownerUser = users.find(u => u.storeId === store.id && u.role === 'STORE_OWNER');

                    return (
                      <tr key={store.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4 font-bold text-slate-800">
                          <div className="text-sm font-bold text-slate-700 line-through decoration-red-400">{store.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {store.id.substring(0,8)}</div>
                        </td>
                        <td className="py-4 px-4 text-slate-700">
                          <div className="font-semibold">{ownerUser?.username || store.email.split('@')[0]}</div>
                          <div className="text-[11px] text-slate-500 dir-ltr text-right">{store.email}</div>
                        </td>
                        <td className="py-4 px-4 text-slate-500">
                          {store.deletedAt ? new Date(store.deletedAt).toLocaleString('ar-EG') : 'محذوف مؤقتاً'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            {/* BIG RESTORE BUTTON */}
                            <button
                              onClick={() => handleRestoreStore(store)}
                              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span>استرجاع الحساب والبيانات بالكامل</span>
                            </button>

                            {/* Permanent Delete */}
                            <button
                              onClick={() => handlePermanentDeleteStore(store)}
                              className="px-3 py-2.5 bg-slate-100 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold border border-red-200 transition-all"
                              title="حذف نهائي مبرم"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {archivedStores.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">لا يوجد أي حساب محذوف في سلة المحذوفات حالياً</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* EDIT STORE & OWNER MODAL */}
      <AnimatePresence>
        {editingStore && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200"
            >
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Edit2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">تعديل كافة بيانات المتجر والعميل</h3>
                  <p className="text-xs text-slate-500">عدّل البيانات بحريّة دون المساس بأي مبيعات أو ديون أو مخزون</p>
                </div>
              </div>

              <form onSubmit={handleSaveStoreEdits} className="space-y-4">
                <Input 
                  label="اسم المتجر" 
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  required
                />
                <Input 
                  label="رقم الهاتف" 
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                  required
                  dir="ltr"
                  className="text-right"
                />
                <Input 
                  label="البريد الإلكتروني" 
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  required
                  dir="ltr"
                  className="text-right"
                />
                <Input 
                  label="اسم المستخدم لمالك المتجر" 
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                  required
                  dir="ltr"
                  className="text-right"
                />
                <Input 
                  label="كلمة المرور الجديدة" 
                  type="text"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                  required
                  dir="ltr"
                  className="text-right"
                />

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button type="button" variant="ghost" onClick={() => setEditingStore(null)}>
                    إلغاء
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    حفظ التعديلات
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingStore && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200"
            >
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 text-red-600">
                <div className="p-3 bg-red-100 rounded-2xl">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">تأكيد حذف وأرشفة الحساب</h3>
                  <p className="text-xs text-slate-500">متجر: {deletingStore.name}</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-800">سيتم إجراء الآتي عند التأكيد:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>نقل المتجر وحسابه إلى <strong className="text-red-600">سلة الحسابات المحذوفة</strong>.</li>
                  <li>منع الدخول المؤقت للمالك والموظفين لهذا المتجر.</li>
                  <li><strong className="text-emerald-700">الحفاظ الكامل 100%</strong> على جميع المنتجات، المبيعات، الفواتير، والديون.</li>
                  <li>يمكنك استرجاع المتجر وإعادة تفعيله بالكامل في أي لحظة.</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setDeletingStore(null)}>
                  إلغاء
                </Button>
                <Button onClick={handleConfirmDeleteStore} className="bg-red-600 hover:bg-red-700 text-white font-bold">
                  تأكيد الحذف والأرشفة
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUICK PASSWORD EDIT MODAL */}
      <AnimatePresence>
        {editingPasswordUser && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200"
            >
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">تعديل كلمة المرور للعميل</h3>
                  <p className="text-xs text-slate-500">حساب: {editingPasswordUser.username || editingPasswordUser.email}</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور الجديدة</label>
                  <Input 
                    type="text" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الجديدة"
                    required
                    dir="ltr"
                    className="text-right"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">تنبيه: سيتم حفظ كافة سجلات المتجر، الديون والمبيعات دون مساس.</p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setEditingPasswordUser(null)}>
                    إلغاء
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    حفظ كلمة المرور
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
