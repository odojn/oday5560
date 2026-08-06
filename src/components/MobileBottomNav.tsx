import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Store, CreditCard, Box, Settings } from 'lucide-react';
import { useAuth } from '../store/authStore';

export default function MobileBottomNav() {
  const { currentUser } = useAuth();
  const role = currentUser?.role;

  const items = [
    { to: '/app', icon: LayoutDashboard, label: 'الرئيسية', roles: ['STORE_OWNER', 'ACCOUNTANT', 'INVENTORY_MANAGER'] },
    { to: '/app/retail-pos', icon: ShoppingCart, label: 'المفرق', roles: ['STORE_OWNER', 'INVENTORY_MANAGER'] },
    { to: '/app/wholesale-pos', icon: Store, label: 'الجملة', roles: ['STORE_OWNER', 'INVENTORY_MANAGER'] },
    { to: '/app/inventory', icon: Box, label: 'المخزون', roles: ['STORE_OWNER', 'INVENTORY_MANAGER'] },
    { to: '/app/debts', icon: CreditCard, label: 'الديون', roles: ['STORE_OWNER', 'ACCOUNTANT', 'INVENTORY_MANAGER'] },
    { to: '/app/settings', icon: Settings, label: 'الإعدادات', roles: ['STORE_OWNER'] },
  ].filter(item => role && item.roles.includes(role));

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-2 py-1 flex items-center justify-around shadow-lg">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/app'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all ${
                isActive
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
}
