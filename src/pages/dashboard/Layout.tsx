import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import MobileBottomNav from '../../components/MobileBottomNav';
import { useAuth } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

export default function DashboardLayout() {
  const { currentUser } = useAuth();
  const { isMobileMode } = useUIStore();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === 'SUPER_ADMIN') {
    return <Navigate to="/super-admin" replace />;
  }

  return (
    <div className="h-screen bg-[#F8FAFC] flex font-sans text-slate-800 overflow-hidden" dir="rtl">
      {/* Hide Sidebar if in Mobile Mode */}
      <div className={isMobileMode ? 'hidden' : 'hidden md:block'}>
        <Sidebar />
      </div>

      <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all ${isMobileMode ? 'mr-0' : 'mr-0 md:mr-64'}`}>
        <Header />
        <main className="flex-1 p-4 sm:p-6 md:p-8 pb-20 md:pb-8 overflow-y-auto flex flex-col gap-6">
          <Outlet />
        </main>
        
        <footer className="h-10 bg-slate-50 border-t border-slate-200 items-center justify-between px-8 text-[10px] text-slate-400 shrink-0 hidden md:flex">
          <div>نظام ode.5 النسخة 2024.1 | مشفر ومحمي بأعلى المعايير</div>
          <div className="flex gap-4">
            <span>تواصل مع الدعم الفني</span>
            <span>سياسة الخصوصية</span>
            <span>Oday Qutqut &copy; 2024</span>
          </div>
        </footer>
      </div>

      {/* Render Mobile Navigation Bar */}
      <MobileBottomNav />
    </div>
  );
}

