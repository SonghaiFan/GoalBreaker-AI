import React from 'react';
import { PlanResponse, Language } from '../types';

interface ArchiveViewProps {
  history: PlanResponse[];
  onSelect: (plan: PlanResponse) => void;
  onClose: () => void;
  language: Language;
  onDelete: (timestamp: number) => void;
}

const translations = {
  en: {
    title: "Protocol Archive",
    empty: "No protocols stored in local memory.",
    phases: "Phases",
    load: "Initialize",
    delete: "Purge"
  },
  zh: {
    title: "协议归档",
    empty: "本地存储中没有协议。",
    phases: "阶段",
    load: "加载",
    delete: "清除"
  }
};

const ArchiveView: React.FC<ArchiveViewProps> = ({ history, onSelect, onClose, language, onDelete }) => {
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop with noise/blur matching app feel */}
      <div 
        className="absolute inset-0 bg-paper/80 backdrop-blur-sm transition-opacity duration-500" 
        onClick={onClose}
      ></div>
      
      <div className="diffused-card w-full max-w-2xl max-h-[80vh] flex flex-col rounded-3xl relative z-10 animate-slide-up shadow-2xl border-white/20">
        
        {/* Header */}
        <div className="p-8 border-b border-black/5 flex justify-between items-center bg-white/20">
           <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-black rounded-full animate-pulse-slow"></div>
             <h2 className="font-mono text-xs uppercase tracking-widest text-ink opacity-60">{t.title}</h2>
           </div>
           <button 
             onClick={onClose} 
             className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors group"
           >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-40 group-hover:opacity-100 transition-opacity">
               <path d="M18 6L6 18M6 6l12 12" />
             </svg>
           </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-6 custom-scrollbar space-y-3">
            {history.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border border-black/5 flex items-center justify-center">
                        <div className="w-1 h-1 bg-black/20 rounded-full"></div>
                    </div>
                    <span className="font-mono text-[10px] opacity-40 uppercase tracking-widest">
                        {t.empty}
                    </span>
                </div>
            ) : (
                history.sort((a, b) => b.createdAt - a.createdAt).map((plan) => (
                    <div 
                        key={plan.createdAt} 
                        className="group relative p-6 rounded-2xl border border-black/5 bg-white/40 hover:bg-white/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <span className="font-mono text-[10px] opacity-30 uppercase tracking-wider group-hover:opacity-50 transition-opacity">
                                {new Date(plan.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })}
                            </span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(plan.createdAt); }}
                                className="text-[10px] font-mono text-red-600 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 px-2 py-1 rounded"
                            >
                                {t.delete}
                            </button>
                        </div>
                        
                        <div className="flex justify-between items-end gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-ink mb-1 leading-tight tracking-tight">{plan.goal}</h3>
                                <p className="text-xs text-ink opacity-50 line-clamp-1 font-mono">{plan.summary}</p>
                            </div>
                            
                            <button 
                                onClick={() => onSelect(plan)}
                                className="opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 px-5 py-2 bg-black text-white text-xs font-medium rounded-full hover:scale-105 shadow-lg flex-shrink-0"
                            >
                                {t.load}
                            </button>
                        </div>
                        
                        {/* Decorative progress indicator */}
                        <div className="mt-4 h-[2px] w-full bg-black/5 rounded-full overflow-hidden">
                            <div className="h-full bg-black/20 w-1/3"></div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default ArchiveView;