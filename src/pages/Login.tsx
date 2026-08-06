import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../store/authStore';
import { useDB } from '../store/dbStore';
import { Lock, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuth((state) => state.login);
  const fetchServerDB = useDB((state) => state.fetchServerDB);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchServerDB();
  }, [fetchServerDB]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Refresh latest users from central database
      await fetchServerDB();
      const latestUsers = useDB.getState().users || [];

      // Super Admin check (Cybersecurity High-Security Credentials Only)
      const isCyberAdmin = 
        (username === 'SuperAdmin_CyberX_2030' && password === 'SecPass_9824#OdayQut!2030') ||
        (username === 'odqy5qutqutadmin2030' && password === 'u20102030ooy79');

      if (isCyberAdmin) {
        login({
          id: 'super-admin-id',
          username: 'Admin (مدير النظام)',
          role: 'SUPER_ADMIN',
        });
        navigate('/super-admin');
        return;
      }

      // Normal Users
      const user = latestUsers.find(u => (u.username === username || u.email === username) && (u as any).password === password);
      if (user) {
        if (user.isDeleted) {
          setError('⚠️ هذا الحساب محذوف أو مؤرشف حالياً. يرجى التواصل مع إدارة النظام لإعادة تفعيله واسترجاعه.');
          return;
        }
        if (user.isSuspended) {
          setError('⚠️ تم تعليق هذا الحساب مؤقتاً (بسبب عدم تسديد المستحقات أو المراجعة). يرجى التواصل مع إدارة النظام لفك التعليق.');
          return;
        }
        if (user.role === 'SUPER_ADMIN') {
          login(user);
          navigate('/super-admin');
          return;
        }
        login(user);
        navigate('/app');
      } else {
        setError('بيانات الدخول غير صحيحة');
      }
    } catch (err) {
      setError('حدث خطأ أثناء الاتصال بالخادم، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-slate-900 rounded-b-[100px] shadow-2xl -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="p-8 pb-10 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">تسجيل الدخول</h2>
          <p className="text-slate-500 text-sm mb-8">أدخل بيانات الحساب للوصول إلى نظام Ode.5</p>

          <form onSubmit={handleLogin} className="space-y-5 text-right">
            <Input 
              label="اسم المستخدم / البريد الإلكتروني" 
              placeholder="أدخل اسم المستخدم"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              dir="ltr"
              className="text-right"
            />
            
            <Input 
              label="كلمة المرور" 
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              dir="ltr"
              className="text-right"
            />

            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-sm text-center font-medium"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" disabled={isLoading} className="w-full h-12 text-base mt-4 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري التحقق والتزامن...</span>
                </>
              ) : (
                'دخول'
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
