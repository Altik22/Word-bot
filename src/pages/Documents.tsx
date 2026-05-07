import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/i18nContext';
import { FileText, Trash2, Calendar, Info, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Documents() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchDocuments() {
      try {
        console.log('Fetching documents for user:', user.id);
        const { data, error } = await supabase
          .from('history')
          .select('*')
          .eq('account_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase fetch error:', error);
          throw error;
        }
        
        console.log('Documents fetched successfully:', data);
        setDocuments(data || []);
      } catch (error: any) {
        console.error('Full fetch error object:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены?')) return;
    try {
      const { error } = await supabase
        .from('history')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (error: any) {
      console.error('Delete error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="border-b border-border pb-8">
        <h1 className="text-4xl font-black tracking-tight mb-2">{t('nav.history')}</h1>
        <p className="text-foreground/50 font-medium">Ваши сохраненные анализы и исправленные тексты.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {documents.map((doc, idx) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card border border-border rounded-3xl p-6 sm:p-8 hover:shadow-2xl hover:shadow-black/10 transition-all group flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <FileText size={24} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase bg-foreground/5 px-2.5 py-1.5 rounded-lg opacity-40">
                    ID: {doc.id.slice(0, 6)}
                  </span>
                </div>
              </div>

              <h2 className="text-xl font-bold mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                {doc.title || 'Untitled Document'}
              </h2>
              
              <div className="flex-1">
                <p className="text-sm text-foreground/40 line-clamp-3 mb-6 font-medium leading-relaxed italic">
                  "{doc.content.slice(0, 150)}..."
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {doc.analysis.plagiarismScore > 0 && (
                    <span className="text-[10px] font-black uppercase px-2 py-1 bg-green-500/10 text-green-500 rounded-md">
                      {t('results.originality')}: {doc.analysis.plagiarismScore}%
                    </span>
                  )}
                  {doc.analysis.errors.length > 0 && (
                    <span className="text-[10px] font-black uppercase px-2 py-1 bg-primary/10 text-primary rounded-md">
                      {doc.analysis.errors.length} {t('results.corrections')}
                    </span>
                  )}
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground/30">
                    <Calendar size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 text-foreground/20 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {documents.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-[40px] bg-foreground/[0.01]">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-foreground/5 rounded-full text-foreground/20">
                <Info size={40} />
              </div>
              <p className="text-foreground/30 font-black uppercase tracking-widest text-sm">История пуста</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
