import React from 'react';
import { ShieldCheck, Server, Zap, Cpu } from 'lucide-react';
import { motion } from 'motion/react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center">
        <h1 className="text-4xl font-bold text-slate-800 mb-4 tracking-tight">Ode.5</h1>
        <p className="text-xl text-slate-500 mb-8">نظام المخزون والمبيعات الأفضل في العالم</p>
        
        <div className="inline-block bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-right">
          <p className="text-sm text-indigo-400 font-bold mb-1">المطور المهندس</p>
          <h2 className="text-2xl font-black text-indigo-900 mb-1">عدي قطقط</h2>
          <p className="text-indigo-600 font-medium">Oday Qutqut</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">إدارة مخزون متطورة</h3>
          <p className="text-slate-600 leading-relaxed text-sm">
            نظام متطور يتيح لك تنظيم وتصنيف كافة المنتجات وتتبع الكميات والأسعار وسجل حركاتها بدقة متناهية.
          </p>
        </motion.div>
        
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
            <Server className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">استقرار وأداء عالي</h3>
          <p className="text-slate-600 leading-relaxed text-sm">
            نظام مبني بأحدث التقنيات ليعمل بسلاسة على كافة الأجهزة (حاسوب وهاتف) دون أي تعليق، مع ضمان سرعة المعالجة واستخراج التقارير.
          </p>
        </motion.div>
        
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2}} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">حماية مطلقة للصلاحيات</h3>
          <p className="text-slate-600 leading-relaxed text-sm">
            بنية تحتية آمنة تمنع التلاعب بالبيانات، حيث تم تخصيص صلاحيات دقيقة ومستقلة لكل موظف (محاسب، مدير مخزون) مع إمكانية طردهم بكبسة زر.
          </p>
        </motion.div>
        
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.3}} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">متكامل وجاهز</h3>
          <p className="text-slate-600 leading-relaxed text-sm">
            من المبيعات والمفرق ونقاط البيع، إلى البضاعة التالفة والتكاليف التشغيلية.. كل ما تحتاجه لإدارة تجارتك موجود في واجهة واحدة احترافية.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
