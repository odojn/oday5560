import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { 
  LayoutDashboard, 
  PackageSearch, 
  Tags, 
  ShoppingCart, 
  Store, 
  Banknote,
  PieChart,
  AlertOctagon,
  Settings,
  Info,
  CreditCard
} from 'lucide-react';
import { cn } from './ui/Button';

export default function Sidebar() {
  const { currentUser } = useAuth();
  
  const role = currentUser?.role;

  const links = [
    { to: '/app', icon: LayoutDashboard, label: 'الرئيسية', roles: ['STORE_OWNER', 'ACCOUNTANT', 'INVENTORY_MANAGER'] },
    { to: '/app/inventory', icon: PackageSearch, label: 'إدارة المخزون', roles: ['STORE_OWNER', 'INVENTORY_MANAGER'] },
    { to: '/app/categories', icon: Tags, label: 'إدارة الأصناف', roles: ['STORE_OWNER', 'INVENTORY_MANAGER'] },
    { to: '/app/retail-pos', icon: ShoppingCart, label: 'بيع المفرق', roles: ['STORE_OWNER', 'INVENTORY_MANAGER'] },
    { to: '/app/wholesale-pos', icon: Store, label: 'نقطة البيع (جملة)', roles: ['STORE_OWNER', 'INVENTORY_MANAGER'] },
    { to: '/app/sales', icon: Banknote, label: 'المبيعات العامة', roles: ['STORE_OWNER', 'ACCOUNTANT', 'INVENTORY_MANAGER'] },
    { to: '/app/debts', icon: CreditCard, label: 'الديون والحسابات', roles: ['STORE_OWNER', 'ACCOUNTANT', 'INVENTORY_MANAGER'] },
    { to: '/app/financials', icon: PieChart, label: 'التكاليف والأرباح', roles: ['STORE_OWNER', 'ACCOUNTANT'] },
    { to: '/app/damaged', icon: AlertOctagon, label: 'البضاعة التالفة', roles: ['STORE_OWNER', 'INVENTORY_MANAGER'] },
    { to: '/app/settings', icon: Settings, label: 'الإعدادات والصلاحيات', roles: ['STORE_OWNER'] },
    { to: '/app/about', icon: Info, label: 'معلومات عنا', roles: ['STORE_OWNER', 'ACCOUNTANT', 'INVENTORY_MANAGER'] },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed right-0 top-0 shadow-xl z-20">
      <div className="p-4 space-y-1 flex-1 flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 bg-indigo-600 rounded-xl mb-6 shadow-lg shadow-indigo-900/20">
          <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="font-medium">لوحة التحكم</span>
        </div>
        <nav className="space-y-1 font-light opacity-90 overflow-y-auto flex-1">
          {links.filter(l => l.roles.includes(role || '')).map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/app'}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors",
                isActive 
                  ? "bg-slate-800 text-white font-medium" 
                  : "hover:bg-slate-800 text-slate-300"
              )}
            >
              <link.icon className="w-5 h-5" />
              <span className="text-sm">{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      
      <div className="mt-auto p-4 mx-4 mb-4 bg-slate-800/50 rounded-2xl border border-slate-700">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">مسجل كـ</p>
        <p className="text-xs truncate font-mono text-slate-300">{currentUser?.username}</p>
      </div>
    </aside>
  );
}
