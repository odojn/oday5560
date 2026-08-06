import React, { useState } from 'react';
import { useDB } from '../../store/dbStore';
import { useAuth } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Users, ShieldAlert, Settings as SettingsIcon, Ban, CheckCircle, KeyRound, Lock, Unlock, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../../types';

export default function Settings() {
  const { currentUser } = useAuth();
  const { users, addUser, updateUser, deleteUser, settings, updateSettings } = useDB();
  const storeId = currentUser?.storeId || '';
  
  const storeUsers = users.filter(u => u.storeId === storeId && u.id !== currentUser?.id);
  const storeSettings = settings[storeId] || { currency: 'ILS' };

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'ACCOUNTANT' });
  const [currency, setCurrency] = useState(storeSettings.currency);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Password edit state
  const [editingPasswordUser, setEditingPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Only STORE_OWNER can access
  if (currentUser?.role !== 'STORE_OWNER') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold">غير مصرح لك بالوصول للإعدادات</h2>
        <p className="text-slate-500">هذه الصفحة مخصصة لمالك المتجر فقط.</p>
      </div>
    );
  }

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.find(u => u.username === formData.username)) {
      alert('اسم المستخدم موجود بالفعل');
      return;
    }
    addUser({
      id: uuidv4(),
      storeId,
      username: formData.username,
      email: formData.email,
      role: formData.role as any,
      password: formData.password,
      isSuspended: false,
    } as any);
    setIsAdding(false);
    setFormData({ username: '', email: '', password: '', role: 'ACCOUNTANT' });
  };

  const toggleSuspendUser = (user: User) => {
    const nextState = !user.isSuspended;
    updateUser(user.id, { isSuspended: nextState });
    alert(nextState 
      ? `تم تعليق حساب الموظف (${user.username}) بنجاح. لن يتمكن من الدخول للنظام.`
      : `تم فك تعليق حساب الموظف (${user.username}) بنجاح.`
    );
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPasswordUser) return;
    if (!newPassword.trim()) {
      alert('يرجى إدخال كلمة المرور الجديدة');
      return;
    }
    updateUser(editingPasswordUser.id, { password: newPassword });
    alert(`تم تعديل كلمة المرور للموظف (${editingPasswordUser.username}) بنجاح.`);
    setEditingPasswordUser(null);
    setNewPassword('');
  };

  const handleSaveSettings = () => {
    setIsSavingSettings(true);
    updateSettings(storeId, { currency });
    setTimeout(() => setIsSavingSettings(false), 500);
  };

  const getRoleBadge = (role: string) => {
    if(role === 'ACCOUNTANT') return <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-medium">محاسب</span>;
    if(role === 'INVENTORY_MANAGER') return <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium">مدير مخزون ومبيعات</span>;
    return role;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">إعدادات المتجر والصلاحيات</h1>
          <p className="text-slate-500 text-sm mt-1">إعدادات العملة، تعليق حسابات الموظفين وتعديل كلمات المرور</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
           <SettingsIcon className="w-5 h-5 text-indigo-600" />
           <h3 className="font-bold text-lg text-slate-800">إعدادات عامة</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">عملة المتجر</label>
            <select
              className="h-11 rounded-lg border border-slate-300 px-3 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              value={currency}
              onChange={e => setCurrency(e.target.value)}
            >
              <option value="ILS">شيكل (₪)</option>
              <option value="USD">دولار ($)</option>
              <option value="JOD">دينار أردني (د.أ)</option>
              <option value="SAR">ريال سعودي (ر.س)</option>
              <option value="TRY">ليرة تركية (₺)</option>
              <option value="EUR">يورو (€)</option>
              <option value="EGP">جنيه مصري (ج.م)</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
             {isSavingSettings ? 'تم الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h4 className="font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            حسابات الموظفين والصلاحيات
          </h4>
          <Button variant="outline" size="sm" onClick={() => setIsAdding(!isAdding)}>
            <Plus className="w-4 h-4 ml-1" />
            إضافة موظف
          </Button>
        </div>
        
        <AnimatePresence>
          {isAdding && (
            <motion.form initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} onSubmit={handleAddUser} className="p-6 border-b border-slate-100 bg-slate-50/50 grid md:grid-cols-2 gap-4 overflow-hidden">
              <Input label="اسم المستخدم (للدخول)" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
              <Input label="البريد الإلكتروني (اختياري)" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <Input label="كلمة المرور" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-medium text-slate-700">الصلاحية</label>
                <select 
                  className="h-11 rounded-lg border border-slate-300 px-3 bg-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  required
                >
                  <option value="ACCOUNTANT">محاسب (مبيعات، تكاليف، أرباح فقط)</option>
                  <option value="INVENTORY_MANAGER">مدير مخزون (مخزون، مبيعات، فواتير فقط)</option>
                </select>
              </div>
              
              <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                <Button variant="ghost" type="button" onClick={() => setIsAdding(false)}>إلغاء</Button>
                <Button type="submit">تأكيد وإضافة</Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-tighter border-b border-slate-100">
              <tr className="h-10 text-[10px]">
                <th className="px-4 py-2 font-medium">اسم المستخدم</th>
                <th className="px-4 py-2 font-medium">البريد</th>
                <th className="px-4 py-2 font-medium">الصلاحية</th>
                <th className="px-4 py-2 font-medium">الحالة</th>
                <th className="px-4 py-2 font-medium text-center">الإجراءات والتحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {storeUsers.map(u => {
                const isSuspended = !!u.isSuspended;
                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-700">{u.username}</td>
                    <td className="px-4 py-3 text-slate-500">{u.email || '-'}</td>
                    <td className="px-4 py-3">{getRoleBadge(u.role)}</td>
                    <td className="px-4 py-3">
                      {isSuspended ? (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <Ban className="w-3 h-3" /> معلّق
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <CheckCircle className="w-3 h-3" /> نشط
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {/* Toggle suspend */}
                        <button
                          onClick={() => toggleSuspendUser(u)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                            isSuspended 
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                              : 'bg-amber-500 text-white hover:bg-amber-600'
                          }`}
                        >
                          {isSuspended ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          <span>{isSuspended ? 'فك التعليق' : 'تعليق'}</span>
                        </button>

                        {/* Edit password */}
                        <button
                          onClick={() => {
                            setEditingPasswordUser(u);
                            setNewPassword(u.password || '');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold flex items-center gap-1"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>كلمة المرور</span>
                        </button>

                        {/* Delete */}
                        <button 
                          className="p-1 text-red-600 hover:bg-red-50 rounded-lg" 
                          onClick={() => {
                            if(window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) deleteUser(u.id);
                          }}
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {storeUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">لا يوجد موظفين مسجلين</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Employee Password Modal */}
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
                  <h3 className="font-bold text-lg text-slate-800">تعديل كلمة المرور للموظف</h3>
                  <p className="text-xs text-slate-500">حساب: {editingPasswordUser.username}</p>
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
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setEditingPasswordUser(null)}>
                    إلغاء
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    حفظ التغييرات
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

