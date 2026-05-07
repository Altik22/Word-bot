import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/i18nContext';
import { analyzeText, fixText, analyzePlagiarism, protectCopyright, TextAnalysisResult, PlagiarismResult, CopyrightResult } from '../lib/gemini';
import { Search, Sparkles, ShieldCheck, Copy, Check, FileCheck, AlertCircle, RefreshCcw, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [plagiarismChecking, setPlagiarismChecking] = useState(false);
  const [copyrightChecking, setCopyrightChecking] = useState(false);
  
  const [analysisResult, setAnalysisResult] = useState<TextAnalysisResult | null>(null);
  const [plagiarismResult, setPlagiarismResult] = useState<PlagiarismResult | null>(null);
  const [copyrightResult, setCopyrightResult] = useState<CopyrightResult | null>(null);
  const [correctedText, setCorrectedText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'results'>('editor');

  const handleProcessText = async () => {
    if (!text.trim()) return;
    setAnalyzing(true);
    setAnalysisResult(null);
    setCorrectedText(null);
    
    try {
      const analysis = await analyzeText(text);
      setAnalysisResult(analysis);
      
      setFixing(true);
      const fixed = await fixText(text, analysis.errors);
      setCorrectedText(fixed);
      setActiveTab('results');
    } catch (error) {
      console.error('Process error:', error);
    } finally {
      setAnalyzing(false);
      setFixing(false);
    }
  };

  const handleApplyToDraft = () => {
    if (correctedText) {
      setText(correctedText);
      setActiveTab('editor');
      setAnalysisResult(null);
      setCorrectedText(null);
    }
  };

  const handlePlagiarismCheck = async () => {
    if (!text.trim()) return;
    setPlagiarismChecking(true);
    try {
      const result = await analyzePlagiarism(correctedText || text);
      setPlagiarismResult(result);
    } catch (error) {
      console.error('Plagiarism check error:', error);
    } finally {
      setPlagiarismChecking(false);
    }
  };

  const handleCopyrightProtect = async () => {
    if (!text.trim()) return;
    setCopyrightChecking(true);
    try {
      const result = await protectCopyright(correctedText || text);
      setCopyrightResult(result);
    } catch (error) {
      console.error('Copyright check error:', error);
    } finally {
      setCopyrightChecking(false);
    }
  };

  const saveDocument = async () => {
    if (!user) {
      alert('Пользователь не авторизован');
      return;
    }
    
    try {
      console.log('Attempting to save document for user:', user.id);
      
      const documentData = {
        account_id: user.id,
        title: text.slice(0, 30) || 'Untitled',
        content: text,
        analysis: {
          errors: analysisResult?.errors || [],
          correctedContent: correctedText || '',
          plagiarismScore: plagiarismResult?.score || 0,
          plagiarismDetails: plagiarismResult?.details || '',
          copyrightInfo: copyrightResult?.suggestion || ''
        },
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('history')
        .insert([documentData])
        .select();
      
      if (error) {
        console.error('Supabase insert error details:', error);
        throw error;
      }

      console.log('Document saved successfully:', data);
      alert(t('auth.success'));
    } catch (error: any) {
      console.error('Full save error object:', error);
      alert(`Ошибка при сохранении: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-8 pb-20 mt-4 sm:mt-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-8">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{t('home.title')}</h1>
          <p className="text-foreground/50 font-medium text-sm sm:text-base">{t('home.description')}</p>
        </div>
        <div className="flex items-center gap-3">
          {analysisResult && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={saveDocument}
              className="flex items-center gap-2 px-5 py-3 bg-foreground/5 border border-border rounded-xl hover:bg-foreground/10 font-bold transition-all text-sm"
            >
              <FileCheck size={18} />
              <span className="hidden sm:inline">Save Record</span>
            </motion.button>
          )}
          <button
            onClick={() => {
              setText('');
              setAnalysisResult(null);
              setPlagiarismResult(null);
              setCopyrightResult(null);
              setCorrectedText(null);
              setActiveTab('editor');
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-foreground/40 hover:text-foreground transition-all font-bold text-sm"
          >
            <RefreshCcw size={18} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className={activeTab === 'editor' ? 'lg:col-span-8 space-y-6' : 'lg:col-span-9 space-y-6'}>
          <div className="bg-card rounded-3xl border border-border overflow-hidden flex flex-col min-h-[500px] sm:min-h-[650px] shadow-2xl shadow-black/5 ring-1 ring-white/5">
            <div className="flex border-b border-border bg-foreground/2">
              <button
                onClick={() => setActiveTab('editor')}
                className={`flex-1 sm:flex-none px-8 py-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'editor' ? 'text-primary' : 'text-foreground/30 hover:text-foreground/60'}`}
              >
                Editor
                {activeTab === 'editor' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
              </button>
              <button
                onClick={() => { if (correctedText) setActiveTab('results'); }}
                disabled={!correctedText}
                className={`flex-1 sm:flex-none px-8 py-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'results' ? 'text-primary' : 'text-foreground/30 hover:text-foreground/60 disabled:opacity-20'}`}
              >
                {t('results.final')}
                {activeTab === 'results' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
              </button>
            </div>

            <div className="flex-1 p-6 sm:p-12 relative overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {activeTab === 'editor' ? (
                  <motion.textarea
                    key="editor"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t('home.placeholder')}
                    className="w-full h-full min-h-[300px] sm:min-h-[400px] resize-none bg-transparent focus:outline-none text-lg sm:text-2xl font-medium tracking-tight text-foreground leading-[1.6] placeholder:text-foreground/10"
                  />
                ) : (
                  <motion.div 
                    key="results"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="relative h-full"
                  >
                    <div className="prose dark:prose-invert prose-neutral max-w-none prose-p:text-lg sm:prose-p:text-2xl prose-p:leading-[1.6] prose-p:font-medium mb-24">
                      <ReactMarkdown>{correctedText || ''}</ReactMarkdown>
                    </div>

                    <div className="fixed bottom-24 sm:bottom-12 right-6 sm:right-12 sm:static md:mt-8 flex flex-col sm:flex-row gap-3 justify-end z-20">
                       <button
                        onClick={() => {
                          if (correctedText) {
                            navigator.clipboard.writeText(correctedText);
                            alert(t('results.copy') + '!');
                          }
                        }}
                        className="flex items-center gap-2 px-6 py-4 bg-foreground/5 hover:bg-foreground/10 rounded-2xl text-sm font-black uppercase tracking-widest transition-all border border-border shadow-2xl backdrop-blur-md"
                       >
                         <Copy size={18} />
                         {t('results.copy')}
                       </button>
                       <button
                        onClick={handleApplyToDraft}
                        className="flex items-center gap-2 px-6 py-4 bg-primary text-primary-foreground hover:opacity-90 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20"
                       >
                         <Check size={18} />
                         {t('results.useAsDraft')}
                       </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {activeTab === 'editor' && (
              <div className="p-6 bg-foreground/2 border-t border-border flex flex-col sm:flex-row gap-6 justify-between items-center px-8">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.2em]">{t('home.stats')}</span>
                    <span className="text-sm font-black">{text.split(/\s+/).filter(Boolean).length} {t('home.words')}</span>
                  </div>
                </div>

                <div className="flex gap-4 w-full sm:w-auto">
                  <button
                    onClick={handleProcessText}
                    disabled={analyzing || !text.trim()}
                    className="w-full sm:w-auto bg-primary text-primary-foreground px-10 py-5 rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-primary/30 group"
                  >
                    {analyzing || fixing ? <RefreshCcw className="animate-spin" size={24} /> : <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />}
                    {t('home.magicBtn')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={activeTab === 'editor' ? 'lg:col-span-4 space-y-6' : 'hidden lg:col-span-3 lg:flex flex-col space-y-6'}>
          <div className="bg-card rounded-3xl border border-border p-8 shadow-sm">
            <h3 className="font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-3">
              <ShieldCheck size={20} className="text-primary" />
              Advanced checks
            </h3>
            
            <div className="space-y-4">
              <ToolButton 
                onClick={handlePlagiarismCheck}
                loading={plagiarismChecking}
                disabled={plagiarismChecking || !!plagiarismResult}
                icon={<Search size={20} />}
                title={t('results.originality')}
                description="Deep analysis"
                badge={plagiarismResult ? `${plagiarismResult.score}%` : null}
                badgeColor={plagiarismResult?.score && plagiarismResult.score > 20 ? 'red' : 'green'}
              />

              <ToolButton 
                onClick={handleCopyrightProtect}
                loading={copyrightChecking}
                disabled={copyrightChecking || !!copyrightResult}
                icon={<ShieldCheck size={20} />}
                title={t('results.style')}
                description="Author protection"
                done={!!copyrightResult}
              />
            </div>
          </div>

          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-primary text-primary-foreground rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-lg tracking-tight uppercase">{t('results.corrections')}</h3>
                  <span className="text-[10px] bg-primary-foreground/20 px-3 py-1.5 rounded-full font-black uppercase tracking-wider">
                    {analysisResult.errors.length}
                  </span>
                </div>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {analysisResult.errors.map((error, idx) => (
                    <div key={idx} className="bg-primary-foreground/5 rounded-2xl p-4 border border-primary-foreground/10 group hover:bg-primary-foreground/10 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{error.type}</span>
                        <AlertCircle size={16} className="text-yellow-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="line-through text-red-300 text-sm font-bold opacity-60 decoration-2">{error.original}</span>
                        <div className="w-2 h-[1px] bg-primary-foreground/20" />
                        <span className="text-green-300 text-sm font-black">{error.suggested}</span>
                      </div>
                      <p className="text-[11px] opacity-70 font-medium leading-normal italic">{error.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
            </motion.div>
          )}

          {analysisResult && activeTab === 'editor' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 border border-border rounded-3xl bg-foreground/2 italic text-sm text-foreground/50 leading-relaxed font-medium"
            >
              <Info size={18} className="mb-3 opacity-30" />
              "{analysisResult.summary}"
            </motion.div>
          )}

          {plagiarismResult && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border rounded-3xl p-8 shadow-lg">
              <h4 className="font-black text-[10px] text-foreground/40 mb-4 flex items-center gap-2 uppercase tracking-[0.2em]">
                {t('results.originality')}
              </h4>
              <p className="text-xs font-bold leading-relaxed opacity-70">{plagiarismResult.details}</p>
            </motion.div>
          )}

          {copyrightResult && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border rounded-3xl p-8 shadow-lg">
              <h4 className="font-bold text-xs text-foreground/40 mb-4 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={16} /> {t('results.style')}
              </h4>
              <ul className="space-y-4">
                {copyrightResult.creativeModifications.map((mod, i) => (
                  <li key={i} className="text-xs font-bold text-foreground flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center shrink-0 font-black text-[10px] border border-border">{i+1}</div>
                    <span className="pt-1 opacity-70">{mod}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolButton({ onClick, loading, disabled, icon, title, description, badge, badgeColor, done }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full text-left p-5 rounded-2xl border border-border hover:bg-foreground/5 transition-all group disabled:opacity-30 relative overflow-hidden ${done ? 'ring-2 ring-primary/20 bg-primary/2' : ''}`}
    >
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${done ? 'bg-primary text-primary-foreground' : 'bg-foreground/5 text-foreground/60'}`}>
            {icon}
          </div>
          <span className="font-black text-sm uppercase tracking-widest">{title}</span>
        </div>
        {badge && <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${badgeColor === 'red' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>{badge}</span>}
        {!badge && done && <Check className="text-primary" size={20} />}
      </div>
      <p className="text-[11px] text-foreground/40 font-bold ml-11">{description}</p>
      {loading && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-foreground/5">
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="h-full w-1/2 bg-primary"
          />
        </div>
      )}
    </button>
  );
}
