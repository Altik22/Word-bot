import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, checkSupabaseConfig } from '../lib/supabase';
import { Wand2, Loader2, Lock, ArrowRight, User, Mail, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from '../contexts/i18nContext';

export default function AuthPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [configMissing, setConfigMissing] = useState(false);

  useEffect(() => {
    if (!checkSupabaseConfig()) {
      setConfigMissing(true);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkSupabaseConfig()) {
      setError('Supabase не настроен. Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в настройках проекта.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login Logic: Search for the email associated with this username if email is not provided
        let loginEmail = email.trim();
        
        if (!loginEmail && name.trim()) {
          // If the user only provided a name, try to find their email in the profiles table
          const { data, error: profileErr } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('full_name', name.trim())
            .single();
            
          if (profileErr || !data) {
            setError(t('auth.error'));
            setLoading(false);
            return;
          }
          loginEmail = data.email;
        }

        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: password,
        });

        if (signInErr) throw signInErr;
      } else {
        // Register Logic
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: name.trim(),
            }
          }
        });

        if (signUpErr) throw signUpErr;

        if (signUpData.user) {
          // Profile is usually created via trigger in Supabase, but we can manually upsert if needed
          // Assuming a trigger is set up. If not, we could do it here.
          const { error: profileErr } = await supabase
            .from('profiles')
            .upsert({
              id: signUpData.user.id,
              full_name: name.trim(),
              email: email.trim(),
              updated_at: new Date().toISOString(),
            });
          if (profileErr) console.error('Profile creation error:', profileErr);
        }
      }
      
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || t('auth.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1a1a1a_0%,#000_100%)]" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-[440px] w-full relative z-10"
      >
        <div className="bg-neutral-900/40 backdrop-blur-3xl rounded-[32px] shadow-2xl border border-white/10 p-8 md:p-10">
          <div className="text-center mb-8">
            <motion.div 
              initial={{ rotate: -20, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              className="inline-flex p-4 bg-primary rounded-3xl mb-6 shadow-2xl shadow-primary/40"
            >
              <Wand2 size={40} className="text-primary-foreground" />
            </motion.div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-3">
              {t('auth.title')}
            </h1>
            <p className="text-neutral-400 text-sm font-medium">
              {t('auth.subtitle')}
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex bg-white/5 p-1.5 rounded-2xl mb-8">
            <button 
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${isLogin ? 'bg-primary text-primary-foreground shadow-lg' : 'text-neutral-500 hover:text-white'}`}
            >
              {t('auth.loginTab')}
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${!isLogin ? 'bg-primary text-primary-foreground shadow-lg' : 'text-neutral-500 hover:text-white'}`}
            >
              {t('auth.registerTab')}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {configMissing && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl flex items-start gap-3"
              >
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <div className="text-xs text-red-200 font-bold leading-relaxed">
                  Настройка не завершена! <br/>
                  Добавьте <code className="bg-red-500/20 px-1 rounded text-white">VITE_SUPABASE_URL</code> и <br/>
                  <code className="bg-red-500/20 px-1 rounded text-white">VITE_SUPABASE_ANON_KEY</code> в меню Settings.
                </div>
              </motion.div>
            )}
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-red-500/10 text-red-400 text-xs font-bold rounded-2xl border border-red-500/20"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 ml-4">
                  {t('auth.name')}
                </label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-primary transition-colors z-10" size={20} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/5 group-focus-within:border-primary/50 group-focus-within:ring-4 group-focus-within:ring-primary/10 rounded-2xl focus:outline-none transition-all text-white font-bold"
                    placeholder="Александр"
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 ml-4">
                    {t('auth.email')}
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-primary transition-colors z-10" size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/5 group-focus-within:border-primary/50 group-focus-within:ring-4 group-focus-within:ring-primary/10 rounded-2xl focus:outline-none transition-all text-white font-bold"
                      placeholder="alex@magic.com"
                      required
                    />
                  </div>
                </motion.div>
              )}

              <div>
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 ml-4">
                  {t('auth.password')}
                </label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-primary transition-colors z-10" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/5 group-focus-within:border-primary/50 group-focus-within:ring-4 group-focus-within:ring-primary/10 rounded-2xl focus:outline-none transition-all text-white font-bold"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-black py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-50 text-xl mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={28} /> : (
                <>
                  {isLogin ? t('auth.submitLogin') : t('auth.submitRegister')}
                  <ArrowRight size={24} />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
