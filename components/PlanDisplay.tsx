import React from 'react';
import { PlanResponse, Language } from '../types';
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
    generating: "Generating Sub-Protocol"
  },
  zh: {
    summary: "战略摘要",
    quote: "核心理念",
    recurring: "循环周期",
    phase: "阶段",
    decomposeDeeper: "深度拆解",
    finish: "目标达成",
    analyzing: "分析复杂度...",
    generating: "生成子协议"
  }
};

const SkeletonStep = () => (
    <div className="diffused-card p-5 rounded-2xl border border-dashed border-black/10 relative overflow-hidden opacity-70">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-black/5 to-transparent" style={{ backgroundSize: '200% 100%' }}></div>
        <div className="space-y-3 relative z-10">
            <div className="flex gap-2 items-center">
                <div className="h-2 w-16 bg-black/5 rounded-full"></div>
                <div className="h-2 w-10 bg-black/5 rounded-full"></div>
            </div>
            <div className="h-4 w-3/4 bg-black/10 rounded-md"></div>
            <div className="space-y-1.5">
                <div className="h-2 w-full bg-black/5 rounded-full"></div>
                <div className="h-2 w-5/6 bg-black/5 rounded-full"></div>
            </div>
        </div>
    </div>
);

const PlanDisplay: React.FC<PlanDisplayProps> = ({ plan, language, onBreakdown, isDecomposing = false, decomposingTask, isStreaming = false }) => {
  if (!plan) return null;
  const t = translations[language];

  // Safeguard: During streaming, phases might be undefined initially
  const phases = plan.phases || [];

  return (
    <div className="w-full relative z-20 pb-24">
      
      {/* Loading Overlay for Decomposition */}
      {isDecomposing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper/60 backdrop-blur-md transition-all duration-500 animate-fade-in">
           <div className="text-center p-8">
               <div className="w-16 h-16 border-4 border-black/10 border-t-black rounded-full animate-spin mx-auto mb-6"></div>
               <h3 className="font-mono text-xs uppercase tracking-widest text-ink opacity-40 mb-2">{t.analyzing}</h3>
               <p className="text-xl md:text-2xl font-bold text-ink animate-text-pulse">
                   {decomposingTask ? `"${decomposingTask}"` : t.generating}
               </p>
           </div>
        </div>
      )}

      {/* Main Content - Blurred if decomposing */}
      <div className={`transition-all duration-500 ${isDecomposing ? 'blur-sm scale-[0.98] opacity-50 pointer-events-none' : ''}`}>
          {/* Header Summary (Diffused) */}
          <div className="mb-32 flex flex-col md:flex-row gap-6 animate-fade-in">
             <div className="diffused-card p-8 rounded-3xl md:w-2/3 border border-black/5 bg-white/40">
                <span className="font-mono text-[10px] opacity-40 uppercase tracking-widest text-ink block mb-4">{t.summary}</span>
                <p className="text-lg md:text-xl font-medium leading-relaxed text-ink opacity-90">
                  {plan.summary || (
                      <span className="animate-pulse opacity-50">...</span>
                  )}
                </p>
             </div>
             {/* Quote Card */}
             {/* Note: Removed 'diffused-card' class here to prevent background color inversion on hover. Manually styled for dark theme. */}
             <div className="p-8 rounded-3xl md:w-1/3 bg-black text-white flex flex-col justify-center relative overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-[1.02]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <span className="font-mono text-[10px] opacity-40 uppercase tracking-widest block mb-4">{t.quote}</span>
                <blockquote className="italic font-light text-lg relative z-10">
                    "{plan.motivationalQuote || "..."}"
                </blockquote>
             </div>
          </div>

          <PlanStats plan={plan} language={language} />

          {/* Roadmap Container */}
          <div className="relative">
            {/* Roadmap Line - Continuous thin line */}
            <div className="roadmap-line hidden md:block"></div>

            {phases.map((phase, index) => {
                // Safeguard: ID might be missing during very early stream chunks
                const phaseKey = phase.id || `temp-phase-${index}`;
                const isEven = index % 2 === 0;
                
                // Show skeleton if:
                // 1. We are streaming AND
                // 2. This is the last phase (where new tasks are appended) OR this phase is empty (just created)
                const showSkeleton = isStreaming && (index === phases.length - 1 || (phase.steps || []).length === 0);

                return (
                    <div key={phaseKey} className="relative mb-40 flex flex-col md:flex-row items-center">
                        
                        {/* Left Column */}
                        <div className={`w-full md:w-1/2 mb-8 md:mb-0 ${isEven ? 'md:pr-24 text-right' : 'md:pr-24 order-2 md:order-1'}`}>
                            {isEven ? (
                                 // Phase Info (Right Aligned)
                                 <div>
                                    {phase.isRecurring ? (
                                        <div className="flex items-center justify-end gap-2 mb-2 text-ink">
                                            <span className="font-mono text-xs font-bold uppercase tracking-widest">{t.recurring}</span>
                                        </div>
                                    ) : (
                                        <span className="font-mono text-xs opacity-40 uppercase text-ink block mb-2">
                                            {t.phase} 0{index + 1}
                                        </span>
                                    )}
                                    <h3 className="text-3xl font-bold tracking-tight text-ink">{phase.title}</h3>
                                    <p className="mt-4 text-sm leading-relaxed opacity-60 max-w-sm ml-auto text-ink">
                                        {phase.description}
                                    </p>
                                 </div>
                            ) : (
                                 // Task List (Left Side)
                                 <div className={`grid gap-3 ${phase.isRecurring ? 'p-4 rounded-3xl border border-black/5 bg-white/20' : ''}`}>
                                    {(phase.steps || []).map((step, sIdx) => (
                                        <PlanStepItem 
                                            key={step.id || `temp-step-${index}-${sIdx}`} 
                                            step={step} 
                                            language={language} 
                                            onBreakdown={onBreakdown}
                                            disabled={isDecomposing} 
                                        />
                                    ))}
                                    {showSkeleton && <SkeletonStep />}
                                 </div>
                            )}
                        </div>

                        {/* Central Node Visuals */}
                        <div className={`relative flex items-center justify-center z-10 my-6 md:my-0 ${!isEven ? 'order-1 md:order-2' : ''}`}>
                            <div className="node-blob"></div>
                            
                            {phase.isRecurring ? (
                                // DESIGN: Recurring "Cyclotron" Node
                                <div className="w-12 h-12 rounded-full bg-paper border border-black/5 flex items-center justify-center relative shadow-lg">
                                    {/* Rotating Dashed Ring - REMOVED ANIMATION */}
                                    <div className="absolute inset-0 rounded-full border border-dashed border-black/30"></div>
                                    {/* Inner Icon */}
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-black/80">
                                       <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                       <path d="M3 3v5h5" />
                                       <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                                       <path d="M16 21h5v-5" />
                                    </svg>
                                </div>
                            ) : (
                                // DESIGN: Standard "Waypoint" Node
                                <div className="relative flex items-center justify-center">
                                    {/* Core Node */}
                                    <div className="w-3 h-3 bg-black rounded-full ring-4 ring-white shadow-sm relative z-20"></div>
                                </div>
                            )}
                        </div>

                        {/* Right Column */}
                        <div className={`w-full md:w-1/2 ${isEven ? 'md:pl-24' : 'md:pl-24 order-3'}`}>
                            {isEven ? (
                                 // Task List (Right Side)
                                 <div className={`grid gap-3 ${phase.isRecurring ? 'p-4 rounded-3xl border border-black/5 bg-white/20' : ''}`}>
                                    {(phase.steps || []).map((step, sIdx) => (
                                        <PlanStepItem 
                                            key={step.id || `temp-step-${index}-${sIdx}`} 
                                            step={step} 
                                            language={language} 
                                            onBreakdown={onBreakdown}
                                            disabled={isDecomposing}
                                        />
                                    ))}
                                    {showSkeleton && <SkeletonStep />}
                                 </div>
                            ) : (
                                 // Phase Info (Left Aligned)
                                 <div className="text-left">
                                    {phase.isRecurring ? (
                                        <div className="flex items-center justify-start gap-2 mb-2 text-ink">
                                             <span className="font-mono text-xs font-bold uppercase tracking-widest">{t.recurring}</span>
                                        </div>
                                    ) : (
                                        <span className="font-mono text-xs opacity-40 uppercase text-ink block mb-2">
                                            {t.phase} 0{index + 1}
                                        </span>
                                    )}
                                    <h3 className="text-3xl font-bold tracking-tight text-ink">{phase.title}</h3>
                                    <p className="mt-4 text-sm leading-relaxed opacity-60 max-w-sm text-ink">
                                        {phase.description}
                                    </p>
                                 </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Finish Node */}
            <div className="relative flex flex-col items-center justify-center pt-12">
                 <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center shadow-2xl z-10 mb-4 hover:scale-110 transition-transform cursor-default relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                 </div>
                 <span className="font-mono text-[10px] uppercase tracking-widest opacity-40 text-ink">{t.finish}</span>
            </div>
          </div>
      </div>
    </div>
  );
};

export default PlanDisplay;