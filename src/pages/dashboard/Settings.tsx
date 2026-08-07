import React, { useState } from 'react';
import { useDB } from '../../store/dbStore';
import { useAuth } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Users, ShieldAlert, Settings as SettingsIcon, Ban, CheckCircle, KeyRound, Lock, Unlock, Trash2, ShieldCheck, Sliders, Layers, Percent, Eye, EyeOff, DollarSign, Truck } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserPermissions } from '../../types';

const defaultEmployeePermissions: UserPermissions = {
  viewPurchasePrice: false,
  maxDiscountPercent: 5,
  canChangePrices: false,
  canDeleteSales: false,
  canManageInventory: true,
  canViewReports: false,
  canManageDebts: true,
  canApplyLandingCost: false,
};

export default function Settings() {
  const { currentUser } = useAuth();
  const { users, addUser, updateUser, deleteUser, settings, updateSettings } = useDB();
  const storeId = currentUser?.storeId || '';
  
  const storeUsers = users.filter(u => u.storeId === storeId && u.id !== currentUser?.id);
  const storeSettings = settings[storeId] || { currency: 'ILS', enableMultiUOM: true, costingMethod: 'AVCO' };

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'ACCOUNTANT' });
  const [currency, setCurrency] = useState(storeSettings.currency || 'ILS');
  const [enableMultiUOM, setEnableMultiUOM] = useState(storeSettings.enableMultiUOM !== false);
  const [costingMethod, setCostingMethod] = useState<'AVCO' | 'FIFO'>(storeSettings.costingMethod || 'AVCO');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Password edit state
  const [editingPasswordUser, setEditingPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // RBAC Permissions modal state
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<User | null>(null);
  const [userPerms, setUserPerms] = useState<UserPermissions>(defaultEmployeePermissions);

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
      permissions: defaultEmployeePermissions
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

  const handleSavePermissions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPermissionsUser) return;
    updateUser(editingPermissionsUser.id, { permissions: userPerms });
    alert(`تم حفظ الصلاحيات الدقيقة للموظف (${editingPermissionsUser.username}) بنجاح!`);
    setEditingPermissionsUser(null);
  };

  const handleSaveSettings = () => {
    setIsSavingSettings(true);
    updateSettings(storeId, {
      currency,
      enableMultiUOM,
      costingMethod,
    });
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
          <h1 className="text-2xl font-bold text-slate-800">إعدادات المتجر والصلاحيات الدقيقة (RBAC)</h1>
          <p className="text-slate-500 text-sm mt-1">وحدات القياس المتعددة، حساب التكلفة (AVCO)، والتحكم بالصلاحيات الجزيئية</p>
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
           <SettingsIcon className="w-5 h-5 text-indigo-600" />
           <h3 className="font-bold text-lg text-slate-800">إعدادات النظام والخصائص المتقدمة</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">عملة النظام</label>
            <select
              className="h-11 rounded-xl border border-slate-300 px-3 bg-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
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

          <div className="flex flex-col gap-1.5 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                تفعيل وحدات القياس المتعددة (Multi-UOM)
              </span>
              <input 
                type="checkbox" 
                checked={enableMultiUOM} 
                onChange={e => setEnableMultiUOM(e.target.checked)} 
                className="w-5 h-5 accent-indigo-600 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              بيع بالكرتونة، العلبة، الحبة، أو الكيلو مع خصم تلقائي دقيق من المخزون الأساسي.
            </p>
          </div>

          <div className="flex flex-col gap-1.5 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
            <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-600" />
              نظام حساب التكلفة والربحية (AVCO)
            </label>
            <select
              className="h-9 rounded-lg border border-emerald-300 px-2 bg-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              value={costingMethod}
              onChange={e => setCostingMethod(e.target.value as any)}
            >
              <option value="AVCO">المتوسط المرجح للتكلفة (AVCO + مصاريف الشحن والجمارك)</option>
              <option value="FIFO">الوارد أولاً صادر أولاً (FIFO)</option>
            </select>
            <p className="text-[11px] text-slate-500">
              تحديث متوسط التكلفة وربحية الفواتير لحظياً عند إضافة مصاريف الشحن والجمارك.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="bg-indigo-600 hover:bg-indigo-700">
             {isSavingSettings ? 'تم الحفظ...' : 'حفظ إعدادات النظام'}
          </Button>
        </div>
      </div>

      {/* Employees & Granular RBAC */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              حسابات الموظفين والصلاحيات الدقيقة (Granular RBAC)
            </h4>
            <p className="text-xs text-slate-500">تخصيص الصلاحيات حتى مستوى الأزرار، إخفاء أسعار التكلفة، وتحديد سقف الخصم</p>
          </div>
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
                <label className="text-sm font-medium text-slate-700">الصلاحية العامة</label>
                <select 
                  className="h-11 rounded-lg border border-slate-300 px-3 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs" 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  required
                >
                  <option value="ACCOUNTANT">محاسب (مبيعات، تكاليف، أرباح)</option>
                  <option value="INVENTORY_MANAGER">كاشير / مدير مخزون</option>
                </select>
              </div>
              
              <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                <Button variant="ghost" type="button" onClick={() => setIsAdding(false)}>إلغاء</Button>
                <Button type="submit">تأكيد وإضافة الموظف</Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-tighter border-b border-slate-100">
              <tr className="h-10 text-[10px]">
                <th className="px-4 py-2 font-medium">اسم المستخدم</th>
                <th className="px-4 py-2 font-medium">الصلاحية العامة</th>
                <th className="px-4 py-2 font-medium">الخصم المسموح (%)</th>
                <th className="px-4 py-2 font-medium">سعر التكلفة</th>
                <th className="px-4 py-2 font-medium">الحالة</th>
                <th className="px-4 py-2 font-medium text-center">الصلاحيات والتحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {storeUsers.map(u => {
                const isSuspended = !!u.isSuspended;
                const perms = u.permissions || defaultEmployeePermissions;
                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-700">{u.username}</td>
                    <td className="px-4 py-3">{getRoleBadge(u.role)}</td>
                    <td className="px-4 py-3 font-mono font-bold text-amber-700">{perms.maxDiscountPercent}% max</td>
                    <td className="px-4 py-3 font-bold">
                      {perms.viewPurchasePrice ? (
                        <span className="text-emerald-600 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> ظاهرة</span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1"><EyeOff className="w-3.5 h-3.5" /> مخفية (محظورة)</span>
                      )}
                    </td>
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
                        {/* Granular RBAC button */}
                        <button
                          onClick={() => {
                            setEditingPermissionsUser(u);
                            setUserPerms(u.permissions || defaultEmployeePermissions);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>الصلاحيات الدقيقة</span>
                        </button>

                        {/* Toggle suspend */}
                        <button
                          onClick={() => toggleSuspendUser(u)}
                          className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                            isSuspended 
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                              : 'bg-amber-500 text-white hover:bg-amber-600'
                          }`}
                        >
                          {isSuspended ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        </button>

                        {/* Edit password */}
                        <button
                          onClick={() => {
                            setEditingPasswordUser(u);
                            setNewPassword(u.password || '');
                          }}
                          className="p-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                          title="تعديل كلمة المرور"
                        >
                          <KeyRound className="w-4 h-4" />
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
                  <td colSpan={6} className="py-8 text-center text-slate-500">لا يوجد موظفين مسجلين</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Granular RBAC Permissions Modal */}
      <AnimatePresence>
        {editingPermissionsUser && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-2xl border border-slate-200 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-800">تخصيص الصلاحيات الدقيقة (Granular RBAC)</h3>
                    <p className="text-xs text-slate-500">الموظف: {editingPermissionsUser.username}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSavePermissions} className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-700">رؤية سعر التكلفة والأرباح (viewPurchasePrice)</span>
                    <input 
                      type="checkbox" 
                      checked={userPerms.viewPurchasePrice} 
                      onChange={e => setUserPerms({...userPerms, viewPurchasePrice: e.target.checked})}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <span className="font-bold text-slate-700 block">الحد الأقصى للخصم المسموح المباشر (%)</span>
                      <span className="text-[10px] text-slate-400">إذا حاول الموظف منح خصم يتجاوز هذه النسبة سيتم منعه تلقائياً</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={userPerms.maxDiscountPercent}
                        onChange={e => setUserPerms({...userPerms, maxDiscountPercent: Math.min(100, Math.max(0, Number(e.target.value)))})}
                        className="w-16 h-8 border border-slate-300 rounded px-2 text-center font-bold font-mono"
                      />
                      <span className="font-bold text-slate-600">%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-700">تعديل أسعار البيع يدوياً في الفاتورة (canChangePrices)</span>
                    <input 
                      type="checkbox" 
                      checked={userPerms.canChangePrices} 
                      onChange={e => setUserPerms({...userPerms, canChangePrices: e.target.checked})}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-700">حذف المبيعات والفواتير (canDeleteSales)</span>
                    <input 
                      type="checkbox" 
                      checked={userPerms.canDeleteSales} 
                      onChange={e => setUserPerms({...userPerms, canDeleteSales: e.target.checked})}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-700">إدارة المخزون وإضافة منتجات جديدة (canManageInventory)</span>
                    <input 
                      type="checkbox" 
                      checked={userPerms.canManageInventory} 
                      onChange={e => setUserPerms({...userPerms, canManageInventory: e.target.checked})}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-700">رؤية التقارير المالية والإحصائيات (canViewReports)</span>
                    <input 
                      type="checkbox" 
                      checked={userPerms.canViewReports} 
                      onChange={e => setUserPerms({...userPerms, canViewReports: e.target.checked})}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-700">إدارة وتحديث مصاريف الشحن والجمارك التكلفة AVCO (canApplyLandingCost)</span>
                    <input 
                      type="checkbox" 
                      checked={userPerms.canApplyLandingCost} 
                      onChange={e => setUserPerms({...userPerms, canApplyLandingCost: e.target.checked})}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">إدارة وتحصيل الديون والذمم (canManageDebts)</span>
                    <input 
                      type="checkbox" 
                      checked={userPerms.canManageDebts} 
                      onChange={e => setUserPerms({...userPerms, canManageDebts: e.target.checked})}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setEditingPermissionsUser(null)}>
                    إلغاء
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    حفظ الصلاحيات الدقيقة
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                  <h3 className="font-bold text-base text-slate-800">تعديل كلمة المرور للموظف</h3>
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


