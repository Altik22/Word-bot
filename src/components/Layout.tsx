import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/i18nContext';
import { supabase } from '../lib/supabase';
import { Wand2, FileText, Moon, Sun, LayoutGrid, LogOut, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useI18n();
  const navigate = useNavigate();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300 flex flex-col">
      <div className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <motion.div 
                whileHover={{ rotate: 15 }}
                className="p-2 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20"
              >
                <Wand2 size={24} />
              </motion.div>
              <span className="text-xl font-black tracking-tight hidden sm:block">LingoMagic</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link to="/" className="px-4 py-2 text-sm font-bold hover:bg-foreground/5 rounded-lg transition-colors flex items-center gap-2">
                <LayoutGrid size={18} /> {t('nav.home')}
              </Link>
              <Link to="/documents" className="px-4 py-2 text-sm font-bold hover:bg-foreground/5 rounded-lg transition-colors flex items-center gap-2">
                <FileText size={18} /> {t('nav.history')}
              </Link>
            </nav>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative">
                <button
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="p-2.5 rounded-xl bg-foreground/5 text-foreground hover:bg-foreground/10 transition-all flex items-center gap-1"
                >
                  <Globe size={20} />
                  <span className="text-[10px] font-black uppercase">{language}</span>
                </button>
                <AnimatePresence>
                  {langMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 p-2 bg-card border border-border rounded-2xl shadow-2xl min-w-[120px]"
                    >
                      {[
                        { code: 'ru', label: 'Русский' },
                        { code: 'en', label: 'English' },
                        { code: 'kk', label: 'Қазақша' }
                      ].map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code as any);
                            setLangMenuOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-sm font-bold text-left rounded-xl hover:bg-primary hover:text-primary-foreground transition-all mb-1 last:mb-0 ${language === lang.code ? 'bg-primary/10 text-primary' : ''}`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-foreground/5 text-foreground hover:bg-foreground/10 transition-all"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>

              <div className="h-4 w-[1px] bg-border mx-1" />

              {user && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="hidden lg:flex flex-col items-end">
                    <span className="text-sm font-black whitespace-nowrap">{user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}</span>
                    <span className="text-[10px] font-bold opacity-30 tracking-wider">PREMIUM</span>
                  </div>
                  <button 
                    onClick={handleSignOut}
                    className="p-2.5 text-foreground/60 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                    title={t('nav.logout')}
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Mobile Nav */}
      <div className="md:hidden sticky bottom-0 z-50 w-full border-t border-border bg-background/80 backdrop-blur-xl px-6 py-3 flex justify-around">
        <Link to="/" className="flex flex-col items-center gap-1 py-1 px-4 rounded-xl hover:bg-foreground/5">
          <LayoutGrid size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest">{t('nav.home').slice(0, 4)}</span>
        </Link>
        <Link to="/documents" className="flex flex-col items-center gap-1 py-1 px-4 rounded-xl hover:bg-foreground/5">
          <FileText size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest">{t('nav.history').slice(0, 4)}</span>
        </Link>
      </div>
    </div>
  );
}
