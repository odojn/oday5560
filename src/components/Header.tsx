import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { Button } from './ui/Button';
import { LogOut, Smartphone, Monitor, Download } from 'lucide-react';

export default function Header() {
  const { currentUser, logout } = useAuth();
  const { isMobileMode, toggleMobileMode } = useUIStore();
  const navigate = useNavigate();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 z-10 shrink-0">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg text-white font-bold text-lg leading-none flex items-center justify-center">ode.5</div>
        <h1 className="text-base sm:text-lg font-bold text-slate-700 tracking-tight hidden sm:block">نظام Ode.5 الذكي</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* PWA Install Button */}
        {deferredPrompt && (
          <button
            onClick={handleInstallPWA}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all shadow-sm"
            title="تثبيت التطبيق على الهاتف أو الجهاز"
          >
            <Download className="w-4 h-4 text-emerald-600 animate-bounce" />
            <span className="hidden xs:inline">تثبيت التطبيق</span>
          </button>
        )}

        {/* Toggle Mode Button */}
        <button
          onClick={toggleMobileMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
            isMobileMode 
              ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100' 
              : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
          }`}
          title="تبديل العرض بين نمط الهاتف ونمط الحاسوب"
        >
          {isMobileMode ? (
            <>
              <Smartphone className="w-4 h-4 text-amber-600" />
              <span>نمط الهاتف</span>
            </>
          ) : (
            <>
              <Monitor className="w-4 h-4 text-indigo-600" />
              <span>نمط الحاسوب</span>
            </>
          )}
        </button>

        <div className="text-left hidden lg:block">
          <p className="text-xs text-slate-400">المطور: عدي قطقط</p>
          <p className="text-sm font-semibold text-slate-800">Oday Qutqut</p>
        </div>

        <div className="w-9 h-9 bg-indigo-100 rounded-full border-2 border-indigo-200 flex items-center justify-center text-indigo-600 font-bold shrink-0 text-xs">
          {currentUser?.username?.substring(0,2).toUpperCase() || 'US'}
        </div>

        <Button variant="ghost" onClick={handleLogout} className="text-red-600 hover:bg-red-50 hover:text-red-700 p-2 sm:px-3 text-xs">
          <LogOut className="w-4 h-4 sm:ml-1" />
          <span className="hidden sm:inline">خروج</span>
        </Button>
      </div>
    </header>
  );
}

