import React from 'react';
import { Language } from '../types';

interface SettingsViewProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  onClearHistory: () => void;
  onClose: () => void;
}

const translations = {
  en: {
    title: "System Configuration",
    lang: "Interface Language",
    data: "Data Persistence",
    clear: "Format Local Memory",
    clearConfirm: "Confirm Format?",
    cleared: "Memory purged."
  },
  zh: {
    title: "系统配置",
    lang: "界面语言",
    data: "数据持久化",
    clear: "格式化本地存储",
    clearConfirm: "确认格式化？",
    cleared: "内存已清除。"
  }
};

const SettingsView: React.FC<SettingsViewProps> = ({ language, setLanguage, onClearHistory, onClose }) => {
  const t = translations[language];
  const [confirmClear, setConfirmClear] = React.useState(false);

  const handleClear = () => {
    if (confirmClear) {
        onClearHistory();
        setConfirmClear(false);
    } else {
        setConfirmClear(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-paper/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      
      <div className="diffused-card w-full max-w-md p-8 rounded-3xl relative z-10 animate-slide-up bg-white/80 shadow-2xl border-white/20">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
           <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 bg-black rounded-full opacity-20"></div>
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

        <div className="space-y-10">
            {/* Language */}
            <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-4 opacity-30">{t.lang}</label>
                <div className="flex bg-black/5 p-1.5 rounded-2xl relative">
                    {/* Animated background pill could be added here for extra flair, but clean switching works well */}
                    <button 
                        onClick={() => setLanguage('en')}
                        className={`flex-1 py-3 rounded-xl text-xs font-medium transition-all duration-300 ${language === 'en' ? 'bg-white shadow-sm text-black scale-[1.02]' : 'text-black/40 hover:text-black/70'}`}
                    >
                        English
                    </button>
                    <button 
                        onClick={() => setLanguage('zh')}
                        className={`flex-1 py-3 rounded-xl text-xs font-medium transition-all duration-300 ${language === 'zh' ? 'bg-white shadow-sm text-black scale-[1.02]' : 'text-black/40 hover:text-black/70'}`}
                    >
                        中文
                    </button>
                </div>
            </div>

            {/* Divider */}
            <div className="h-[1px] bg-gradient-to-r from-transparent via-black/5 to-transparent w-full"></div>

            {/* Data */}
            <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest mb-4 opacity-30">{t.data}</label>
                <button 
                    onClick={handleClear}
                    className={`
                        w-full border-2 rounded-2xl py-4 text-xs font-mono transition-all duration-300 flex items-center justify-center gap-2
                        ${confirmClear 
                            ? 'bg-red-50 border-red-200 text-red-600 shadow-inner' 
                            : 'border-transparent bg-white/50 hover:bg-red-50 hover:border-red-100 hover:text-red-600 text-ink opacity-60 hover:opacity-100 hover:shadow-sm'
                        }
                    `}
                >
                    {confirmClear && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>}
                    {confirmClear ? t.clearConfirm : t.clear}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;