import React from 'react';
import { PlanStep, Difficulty, TaskType, Language } from '../types';

interface PlanStepItemProps {
  step: PlanStep;
  language: Language;
  onBreakdown: (taskTitle: string) => void;
  disabled?: boolean;
}

const translations = {
  en: {
    decompose: "Decompose",
    [Difficulty.Easy]: "Easy",
    [Difficulty.Medium]: "Medium",
    [Difficulty.Hard]: "Hard",
    [TaskType.Research]: "Research",
    [TaskType.Action]: "Action",
    [TaskType.Milestone]: "Milestone",
    [TaskType.Preparation]: "Preparation"
  },
  zh: {
    decompose: "拆解",
    [Difficulty.Easy]: "简单",
    [Difficulty.Medium]: "中等",
    [Difficulty.Hard]: "困难",
    [TaskType.Research]: "研究",
    [TaskType.Action]: "行动",
    [TaskType.Milestone]: "里程碑",
    [TaskType.Preparation]: "准备"
  }
};

const PlanStepItem: React.FC<PlanStepItemProps> = ({ step, language, onBreakdown, disabled }) => {
  const t = translations[language];

  return (
    <div 
        onClick={() => !disabled && step.isBreakable && onBreakdown(step.title)}
        className={`
            diffused-card p-5 rounded-2xl group flex justify-between items-center relative overflow-hidden
            ${step.isBreakable && !disabled
                ? 'cursor-pointer border-l-[3px] border-l-black/80 pl-4' // Slight visual indicator for interactive cards
                : 'cursor-default border-l-[3px] border-l-transparent pl-4'
            }
            ${disabled ? 'opacity-50 pointer-events-none' : ''}
            /* Note: Hover lift and shadow are handled by .diffused-card in index.html */
        `}
    >
        <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[10px] opacity-40 uppercase text-ink tracking-wide">
                    {t[step.type]} • {step.estimatedDuration}
                </span>
                {step.isBreakable && (
                    <span className="bg-black/5 text-ink/60 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-tight">
                        {t.decompose}
                    </span>
                )}
            </div>
            
            <h4 className="text-sm font-bold text-ink mb-1 tracking-tight">{step.title}</h4>
            
            {/* Description is always visible for functionality, but styled minimally to match 'clean' aesthetic */}
            <p className="text-xs leading-relaxed text-ink opacity-50 group-hover:opacity-80 transition-opacity">
                {step.description}
            </p>
        </div>
        
        <div className={`text-ink flex-shrink-0 transition-opacity duration-300 ${step.isBreakable ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
            {step.isBreakable ? (
                 // Drill down icon
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <polyline points="9 18 15 12 9 6"></polyline>
                 </svg>
            ) : (
                // Check icon
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                     <path d="M5 12h14M12 5l7 7-7 7" />
                 </svg>
            )}
        </div>
    </div>
  );
};

export default PlanStepItem;