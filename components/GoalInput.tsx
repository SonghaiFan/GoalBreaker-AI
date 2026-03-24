import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Language } from '../types';

interface GoalInputProps {
  onGenerate: (goal: string) => void;
  isLoading: boolean;
  language: Language;
  currentValue?: string;
  isReadOnly?: boolean;
}

const translations = {
  en: {
    label: "Objective",
    placeholder: "Design a bio-regenerative Martian habitat prototype",
    button: "Deconstruct Goal",
    processing: "DERIVING AXIOMS FROM FIRST PRINCIPLES",
    status: "AI ENGINE ACTIVE: WAITING FOR INPUT"
  },
  zh: {
    label: "目标",
    placeholder: "设计一个生物再生火星栖息地原型",
    button: "拆解目标",
    processing: "正在从第一性原理推导公理",
    status: "AI 引擎就绪：等待输入"
  }
};

const GoalInput: React.FC<GoalInputProps> = ({ onGenerate, isLoading, language, currentValue, isReadOnly }) => {
  const [input, setInput] = useState('');
  const t = translations[language];
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize logic
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
        el.style.height = 'auto'; // Reset to recalculate shrink
        el.style.height = `${el.scrollHeight}px`;
    }
  }, []);

  // Sync input with external current value
  useEffect(() => {
    if (currentValue) {
      setInput(currentValue);
    } else if (currentValue === undefined && !isLoading && !isReadOnly) {
       // Allow clear if needed, though mostly managed by parent passing '' or undefined
    }
  }, [currentValue, isLoading, isReadOnly]);

  // Adjust height whenever input changes
  useEffect(() => {
    if (!isReadOnly) {
      adjustHeight();
    }
  }, [input, isReadOnly, adjustHeight]);

  // Adjust on window resize to handle wrapping changes
  useEffect(() => {
      window.addEventListener('resize', adjustHeight);
      return () => window.removeEventListener('resize', adjustHeight);
  }, [adjustHeight]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !isReadOnly) {
      onGenerate(input.trim());
    }
  }, [input, isLoading, onGenerate, isReadOnly]);

  // Read-Only Mode (Result Display) - Returns a clean Title
  if (isReadOnly) {
    return (
        <div className="max-w-5xl mb-12 stagger-reveal relative z-20" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-ink leading-tight break-words">
                {currentValue}
            </h1>
        </div>
    );
  }

  // Interactive Input Mode
  return (
    <div className="max-w-4xl mb-12 stagger-reveal relative z-20" style={{ animationDelay: '0.1s' }}>
      <form onSubmit={handleSubmit}>
        
        {/* Label */}
        <div className="mb-4 max-h-8 opacity-40">
            <span className="font-mono text-xs uppercase text-ink block">
                {t.label}
            </span>
        </div>
        
        {/* Input */}
        <textarea 
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                }
            }}
            disabled={isLoading}
            rows={1}
            className="w-full bg-transparent font-extrabold tracking-tighter text-ink resize-none outline-none border-none focus:ring-0 p-0 text-4xl md:text-6xl placeholder-ink/20 leading-tight transition-all"
            placeholder={t.placeholder}
            style={{ minHeight: '80px' }}
        />
        
        {/* Action Area */}
        <div className="flex items-center gap-6 mt-8 max-h-24 opacity-100 transition-all">
            <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`
                    px-8 py-4 bg-ink text-paper rounded-full text-sm font-medium transition-all duration-300
                    ${!input.trim() || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-xl cursor-pointer'}
                `}
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                         <span className="w-2 h-2 bg-paper rounded-full animate-pulse"></span>
                         Thinking...
                    </span>
                ) : t.button}
            </button>
            
            <div className="h-[1px] w-24 bg-ink opacity-10 hidden sm:block"></div>
            
            <span className="font-mono text-[10px] opacity-40 max-w-[200px] leading-relaxed text-ink hidden sm:block uppercase">
                {isLoading ? t.processing : t.status}
            </span>
        </div>
      </form>
    </div>
  );
};

export default GoalInput;