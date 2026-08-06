import React, { useState } from 'react';
import { useDB } from '../../store/dbStore';
import { useAuth } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function Categories() {
  const { currentUser } = useAuth();
  const { categories, addCategory, updateCategory, deleteCategory } = useDB();
  const storeId = currentUser?.storeId || '';
  
  const storeCategories = categories.filter(c => c.storeId === storeId);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateCategory(editingId, formData);
      setEditingId(null);
    } else {
      addCategory({
        id: uuidv4(),
        storeId,
        name: formData.name,
        description: formData.description,
      });
    }
    setFormData({ name: '', description: '' });
    setIsAdding(false);
  };

  const handleEdit = (category: any) => {
    setFormData({ name: category.name, description: category.description || '' });
    setEditingId(category.id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h4 className="font-bold text-slate-800">إدارة الأصناف</h4>
            <p className="text-xs text-slate-400">إضافة وتعديل أصناف المنتجات</p>
          </div>
          <button onClick={() => { setIsAdding(true); setEditingId(null); setFormData({name:'', description:''}); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            صنف جديد
          </button>
        </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid md:grid-cols-2 gap-4">
          <Input 
            label="اسم الصنف" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            required 
          />
          <Input 
            label="الوصف (اختياري)" 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})} 
          />
          <div className="md:col-span-2 flex justify-end gap-3 mt-2">
            <Button variant="ghost" type="button" onClick={() => setIsAdding(false)}>إلغاء</Button>
            <Button type="submit">{editingId ? 'حفظ التعديلات' : 'إضافة الصنف'}</Button>
          </div>
        </form>
      )}

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-tighter border-b border-slate-100">
              <tr className="h-10 text-[10px]">
                <th className="px-4 py-2 font-medium">اسم الصنف</th>
                <th className="px-4 py-2 font-medium">الوصف</th>
                <th className="px-4 py-2 font-medium text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {storeCategories.map(cat => (
                <tr key={cat.id}>
                  <td className="px-4 py-3 font-bold text-slate-700">{cat.name}</td>
                  <td className="px-4 py-3 text-slate-500">{cat.description || '-'}</td>
                  <td className="px-4 py-3 flex justify-center gap-2">
                    <button className="text-indigo-600 font-semibold hover:underline" onClick={() => handleEdit(cat)}>تعديل</button>
                    <span className="text-slate-300">|</span>
                    <button className="text-indigo-600 font-semibold hover:underline" onClick={() => deleteCategory(cat.id)}>حذف</button>
                  </td>
                </tr>
              ))}
              {storeCategories.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500">لا يوجد أصناف حالياً</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
