import React, { useState, useCallback } from 'react';
import { Language } from '../types';

interface GoalInputProps {
  onGenerate: (goal: string) => void;
  isLoading: boolean;
  language: Language;
}

const translations = {
  en: {
    label: "Root Objective",
    placeholder: "Design a bio-regenerative Martian habitat prototype",
    button: "Decompose Goal",
    processing: "CALCULATING FIBROUS NODES",
    status: "AI ENGINE ACTIVE: WAITING FOR INPUT"
  },
  zh: {
    label: "核心目标",
    placeholder: "设计一个生物再生火星栖息地原型",
    button: "拆解目标",
    processing: "正在计算纤维节点",
    status: "AI 引擎就绪：等待输入"
  }
};

const GoalInput: React.FC<GoalInputProps> = ({ onGenerate, isLoading, language }) => {
  const [input, setInput] = useState('');
  const t = translations[language];

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onGenerate(input.trim());
    }
  }, [input, isLoading, onGenerate]);

  return (
    <div className="max-w-3xl mb-32 stagger-reveal relative z-20" style={{ animationDelay: '0.1s' }}>
      <form onSubmit={handleSubmit}>
        
        {/* Label */}
        <span className="font-mono text-xs mb-4 block opacity-40 uppercase text-ink">
            {t.label}
        </span>
        
        {/* Input */}
        <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                }
            }}
            disabled={isLoading}
            autoFocus
            rows={1}
            className="w-full bg-transparent text-5xl md:text-7xl font-extrabold tracking-tighter text-ink placeholder-ink/20 resize-none overflow-hidden outline-none border-none focus:ring-0 leading-tight mb-8 p-0"
            placeholder={t.placeholder}
            style={{ minHeight: '140px' }}
        />
        
        {/* Action Area */}
        <div className="flex items-center gap-6">
            <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`
                    px-8 py-4 bg-black text-white rounded-full text-sm font-medium transition-all duration-300
                    ${!input.trim() || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-xl cursor-pointer'}
                `}
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                         <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                         Generating...
                    </span>
                ) : t.button}
            </button>
            
            <div className="h-[1px] w-24 bg-black opacity-10 hidden sm:block"></div>
            
            <span className="font-mono text-[10px] opacity-40 max-w-[140px] leading-relaxed text-ink hidden sm:block uppercase">
                {isLoading ? t.processing : t.status}
            </span>
        </div>
      </form>
    </div>
  );
};

export default GoalInput;