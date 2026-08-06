import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Box, TrendingUp, ShieldCheck, Smartphone, Monitor } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

export default function Welcome() {
  const navigate = useNavigate();
  const { setMobileMode } = useUIStore();

  const handleStart = (isMobile: boolean) => {
    setMobileMode(isMobile);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/30 via-transparent to-transparent" 
        />
      </div>

      <div className="z-10 max-w-4xl mx-auto w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block px-4 py-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 backdrop-blur-md text-indigo-200 text-sm font-medium mb-6">
            مرحباً بك في مستقبل الإدارة
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
            نظام Ode.5
          </h1>
          <p className="text-xl text-indigo-200/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            النظام الأفضل والأكثر تكاملاً في العالم لإدارة المخزون والمبيعات. 
            مصمم ليعمل بسلاسة فائقة على الحاسوب والأنظمة المكتبية وكذلك الهواتف المحمولة والكاشير السريع.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-12 text-right">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors"
          >
            <div className="h-12 w-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-4 border border-indigo-500/30 text-indigo-300">
              <Box className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">إدارة مخزون متقدمة</h3>
            <p className="text-indigo-200/70 text-sm">إدخال وتحديث سريع للمنتجات، تتبع دقيق للكميات، وتصنيفات متقدمة.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors"
          >
            <div className="h-12 w-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/30 text-emerald-300">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">مبيعات وتقارير</h3>
            <p className="text-indigo-200/70 text-sm">نقطة بيع، مبيعات جملة ومفرق، تقارير أرباح وتكاليف مفصلة للقرارات الحاسمة.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors"
          >
            <div className="h-12 w-12 bg-rose-500/20 rounded-xl flex items-center justify-center mb-4 border border-rose-500/30 text-rose-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">حماية وصلاحيات</h3>
            <p className="text-indigo-200/70 text-sm">نظام صلاحيات متعدد المستويات (مدير، محاسب، مبيعات) مع حماية فائقة للبيانات.</p>
          </motion.div>
        </div>

        {/* Device Mode Selector */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button 
            size="lg" 
            onClick={() => handleStart(false)}
            className="w-full sm:w-auto bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-base px-8 h-14 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.25)] flex items-center justify-center gap-3"
          >
            <Monitor className="w-5 h-5 text-indigo-600" />
            <span>دخول بنمط الحاسوب (Desktop)</span>
          </Button>

          <Button 
            size="lg" 
            onClick={() => handleStart(true)}
            className="w-full sm:w-auto bg-indigo-600 text-white hover:bg-indigo-500 font-bold text-base px-8 h-14 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.4)] flex items-center justify-center gap-3 border border-indigo-400/40"
          >
            <Smartphone className="w-5 h-5 text-indigo-200" />
            <span>دخول بنمط الهاتف (Mobile POS)</span>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
