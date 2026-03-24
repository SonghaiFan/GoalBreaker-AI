import React, { useState } from 'react';
import { PlanResponse, Language, PlanPhase } from '../types';
import PlanStats from './PlanStats';
import PlanStepItem from './PlanStepItem';

interface PlanDisplayProps {
  plan: PlanResponse | null;
  language: Language;
  onBreakdown: (taskTitle: string) => void;
  isDecomposing?: boolean;
  decomposingTask?: string | null;
  isStreaming?: boolean;
}

const translations = {
  en: {
    summary: "Strategic Summary",
    quote: "Core Philosophy",
    recurring: "Recurring Cycle",
    phase: "Phase",
    decomposeDeeper: "Decompose Deeper",
    finish: "Objectives Met",
    analyzing: "Analyzing Complexity...",
    generating: "Generating Sub-Protocol",
    copy: "Copy Protocol",
    copied: "Copied to Clipboard",
    download: "Save JSON"
  },
  zh: {
    summary: "战略摘要",
    quote: "核心理念",
    recurring: "循环周期",
    phase: "阶段",
    decomposeDeeper: "深度拆解",
    finish: "目标达成",
    analyzing: "分析复杂度...",
    generating: "生成子协议",
    copy: "复制协议",
    copied: "已复制到剪贴板",
    download: "保存 JSON"
  }
};

const SkeletonStep = () => (
    <div className="diffused-card p-5 rounded-2xl border border-dashed border-ink/10 relative overflow-hidden opacity-70">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-ink/5 to-transparent" style={{ backgroundSize: '200% 100%' }}></div>
        <div className="space-y-3 relative z-10">
            <div className="flex gap-2 items-center">
                <div className="h-2 w-16 bg-ink/5 rounded-full"></div>
                <div className="h-2 w-10 bg-ink/5 rounded-full"></div>
            </div>
            <div className="h-4 w-3/4 bg-ink/10 rounded-md"></div>
            <div className="space-y-1.5">
                <div className="h-2 w-full bg-ink/5 rounded-full"></div>
                <div className="h-2 w-5/6 bg-ink/5 rounded-full"></div>
            </div>
        </div>
    </div>
);

const PlanDisplay: React.FC<PlanDisplayProps> = ({ plan, language, onBreakdown, isDecomposing = false, decomposingTask, isStreaming = false }) => {
  const [copied, setCopied] = useState(false);
  
  if (!plan) return null;
  const t = translations[language];
  const phases = plan.phases || [];

  const handleCopyMarkdown = () => {
    let md = `# ${plan.goal}\n\n`;
    md += `> "${plan.motivationalQuote}"\n\n`;
    md += `## ${t.summary}\n${plan.summary}\n\n`;

    phases.forEach((phase, i) => {
        md += `### ${phase.isRecurring ? t.recurring : `${t.phase} ${i + 1}`}: ${phase.title}\n`;
        md += `*${phase.duration}*\n`;
        md += `${phase.description}\n\n`;
        (phase.steps || []).forEach(step => {
            md += `- [ ] **${step.title}** (${step.estimatedDuration}) [${step.type}]\n`;
            md += `  ${step.description}\n`;
        });
        md += `\n`;
    });

    navigator.clipboard.writeText(md).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadJson = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(plan, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `protocol-${plan.id.slice(0, 8)}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const renderPhaseHeader = (phase: PlanPhase, index: number, alignment: 'left' | 'right') => (
    <div className={`animate-fade-in ${alignment === 'right' ? 'md:text-right' : 'md:text-left'}`}>
        {phase.isRecurring ? (
            <div className={`flex items-center gap-2 mb-2 text-ink ${alignment === 'right' ? 'md:justify-end' : 'md:justify-start'}`}>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest">{t.recurring}</span>
            </div>
        ) : (
            <span className="font-mono text-[9px] opacity-40 uppercase text-ink block mb-1.5 tracking-wider">
                {t.phase} 0{index + 1}
            </span>
        )}
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-ink leading-tight">{phase.title}</h3>
        <p className={`mt-3 text-xs md:text-sm leading-relaxed opacity-60 max-w-sm text-ink ${alignment === 'right' ? 'md:ml-auto' : 'md:mr-auto'}`}>
            {phase.description}
        </p>
    </div>
  );

  const renderTaskList = (phase: PlanPhase, showSkeleton: boolean) => (
    <div className={`grid gap-3 ${phase.isRecurring ? 'p-4 rounded-3xl border border-ink/5 bg-surface/10' : ''}`}>
        {(phase.steps || []).map((step, sIdx) => (
            <PlanStepItem 
                key={step.id || `temp-step-${sIdx}`} 
                step={step} 
                language={language} 
                onBreakdown={onBreakdown}
                disabled={isDecomposing} 
            />
        ))}
        {showSkeleton && <SkeletonStep />}
    </div>
  );

  return (
    <div className="w-full relative z-20 pb-24 md:pb-32 px-1">
      
      {isDecomposing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper/70 backdrop-blur-xl transition-all duration-500 animate-fade-in">
           <div className="text-center p-8 max-w-sm">
               <div className="w-16 h-16 border-4 border-ink/10 border-t-ink rounded-full animate-spin mx-auto mb-6"></div>
               <h3 className="font-mono text-[10px] uppercase tracking-widest text-ink opacity-40 mb-2">{t.analyzing}</h3>
               <p className="text-xl font-bold text-ink animate-text-pulse">
                   {decomposingTask ? `"${decomposingTask}"` : t.generating}
               </p>
           </div>
        </div>
      )}

      <div className={`transition-all duration-500 ${isDecomposing ? 'blur-md scale-[0.98] opacity-50 pointer-events-none' : ''}`}>
          
          {/* Toolbar */}
          <div className="flex flex-wrap justify-center md:justify-end gap-2 mb-8 animate-fade-in">
              <button 
                  onClick={handleCopyMarkdown}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-ink/10 bg-surface/40 hover:bg-surface/80 text-ink/60 hover:text-ink transition-all text-[10px] font-mono uppercase tracking-wide group"
              >
                  {copied ? (
                      <span className="text-green-600 flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {t.copied}
                      </span>
                  ) : (
                      <>
                        <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        {t.copy}
                      </>
                  )}
              </button>
              <button 
                  onClick={handleDownloadJson}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-ink/10 bg-surface/40 hover:bg-surface/80 text-ink/60 hover:text-ink transition-all text-[10px] font-mono uppercase tracking-wide group"
              >
                  <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  {t.download}
              </button>
          </div>

          {/* Cards Header */}
          <div className="mb-20 md:mb-32 flex flex-col md:flex-row gap-4 md:gap-6 animate-fade-in">
             <div className="diffused-card p-6 md:p-8 rounded-3xl md:w-2/3 border border-ink/5 bg-surface/40">
                <span className="font-mono text-[9px] opacity-40 uppercase tracking-widest text-ink block mb-4">{t.summary}</span>
                <p className="text-base md:text-lg font-medium leading-relaxed text-ink opacity-90">
                  {plan.summary || <span className="animate-pulse opacity-50">...</span>}
                </p>
             </div>
             <div className="p-6 md:p-8 rounded-3xl md:w-1/3 bg-ink text-paper flex flex-col justify-center relative overflow-hidden shadow-xl transition-transform duration-300 hover:scale-[1.01]">
                <div className="absolute top-0 right-0 w-24 h-24 bg-paper opacity-5 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <span className="font-mono text-[9px] opacity-40 uppercase tracking-widest block mb-4">{t.quote}</span>
                <blockquote className="italic font-light text-base md:text-lg relative z-10">
                    "{plan.motivationalQuote || "..."}"
                </blockquote>
             </div>
          </div>

          <PlanStats plan={plan} language={language} />

          {/* Timeline Roadmap */}
          <div className="relative">
            <div className="roadmap-line"></div>

            {phases.map((phase, index) => {
                const phaseKey = phase.id || `phase-${index}`;
                const isEven = index % 2 === 0;
                const showSkeleton = isStreaming && (index === phases.length - 1 || (phase.steps || []).length === 0);

                return (
                    <div key={phaseKey} className="relative mb-24 md:mb-40">
                        {/* Desktop View: Alternating split layout */}
                        <div className="hidden md:flex flex-row items-center w-full">
                            {/* Left Side */}
                            <div className={`basis-1/2 flex-shrink-0 flex-grow-0 ${isEven ? 'text-right pr-24' : 'pl-24 order-3'}`}>
                                {isEven ? renderPhaseHeader(phase, index, 'right') : renderTaskList(phase, showSkeleton)}
                            </div>

                            {/* Center Node Container */}
                            <div className={`relative flex items-center justify-center z-10 w-0 h-full flex-shrink-0 ${!isEven ? 'order-2' : ''}`}>
                                <div className="node-blob -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"></div>
                                {phase.isRecurring ? (
                                    <div className="w-10 h-10 rounded-full bg-paper border border-ink/10 flex items-center justify-center absolute shadow-md -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
                                        <div className="absolute inset-0 rounded-full border border-dashed border-ink/20"></div>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-ink/80">
                                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16M16 21h5v-5" />
                                        </svg>
                                    </div>
                                ) : (
                                    <div className="w-3 h-3 bg-ink rounded-full ring-4 ring-paper shadow-sm absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 z-20"></div>
                                )}
                            </div>

                            {/* Right Side */}
                            <div className={`basis-1/2 flex-shrink-0 flex-grow-0 ${isEven ? 'pl-24' : 'text-left pr-24 order-1'}`}>
                                {isEven ? renderTaskList(phase, showSkeleton) : renderPhaseHeader(phase, index, 'left')}
                            </div>
                        </div>

                        {/* Mobile View: Linear top-to-bottom layout */}
                        <div className="block md:hidden w-full pl-12">
                            {/* Node (Absolute positioned relative to phase block) */}
                            <div className="absolute left-[20px] top-1 -translate-x-1/2 flex items-center justify-center z-10">
                                {phase.isRecurring ? (
                                    <div className="w-8 h-8 rounded-full bg-paper border border-ink/10 flex items-center justify-center shadow-md">
                                        <div className="absolute inset-0 rounded-full border border-dashed border-ink/20"></div>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-ink/80">
                                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16M16 21h5v-5" />
                                        </svg>
                                    </div>
                                ) : (
                                    <div className="w-2.5 h-2.5 bg-ink rounded-full ring-4 ring-paper shadow-sm"></div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex flex-col gap-6">
                                {renderPhaseHeader(phase, index, 'left')}
                                {renderTaskList(phase, showSkeleton)}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Finish Node */}
            <div className="relative flex flex-col items-center justify-center pt-8 md:pt-12 md:pl-0 pl-[20px]">
                 <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-ink text-paper flex items-center justify-center shadow-2xl z-10 mb-4 hover:scale-105 transition-transform cursor-default relative overflow-hidden group">
                    <div className="absolute inset-0 bg-paper/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                 </div>
                 <span className="font-mono text-[9px] uppercase tracking-widest opacity-40 text-ink">{t.finish}</span>
            </div>
          </div>
      </div>
    </div>
  );
};

export default PlanDisplay;