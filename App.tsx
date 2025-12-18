import React, { useState, useEffect, useMemo } from 'react';
import GoalInput from './components/GoalInput';
import PlanDisplay from './components/PlanDisplay';
import ArchiveView from './components/ArchiveView';
import SettingsView from './components/SettingsView';
import { generateGoalPlan } from './services/geminiService';
import { PlanResponse, Language } from './types';

type ViewState = 'home' | 'archive' | 'settings';

const App: React.FC = () => {
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('zh');
  
  const [view, setView] = useState<ViewState>('home');
  const [history, setHistory] = useState<PlanResponse[]>([]);
  const [decomposingTask, setDecomposingTask] = useState<string | null>(null);

  // Load history from local storage
  useEffect(() => {
    const savedHistory = localStorage.getItem('strata_history');
    if (savedHistory) {
        try {
            setHistory(JSON.parse(savedHistory));
        } catch (e) {
            console.error("Failed to load history", e);
        }
    }
    
    // Check for saved language preference
    const savedLang = localStorage.getItem('strata_lang');
    if (savedLang === 'en' || savedLang === 'zh') {
        setLanguage(savedLang as Language);
    }
  }, []);

  // Save history and language
  useEffect(() => {
    localStorage.setItem('strata_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('strata_lang', language);
  }, [language]);

  // Haze effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        document.body.style.backgroundImage = `
            radial-gradient(circle at ${x}% ${y}%, rgba(0,0,0,0.04) 0%, transparent 20%),
            radial-gradient(circle at 10% 20%, rgba(18, 18, 18, 0.03) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(18, 18, 18, 0.03) 0%, transparent 40%)
        `;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleGenerate = async (goal: string, parentId?: string, isSubTask: boolean = false) => {
    setLoading(true);
    setError(null);
    
    // Create a temporary plan structure to show "Loading" state effectively
    // but actual data will come via streaming
    
    try {
      const generatedPlan = await generateGoalPlan(goal, language, { 
          isSubTask,
          onPartialUpdate: (partialPlan) => {
              // During breakdown, we might want to keep the "Analyzing..." overlay a bit longer
              // or we can just start showing the result. 
              // For new plans, we show immediately.
              if (parentId) {
                 partialPlan.parentId = parentId;
              }
              setPlan(partialPlan);
          }
      });
      
      // Link logic: If this is a breakdown, assign the parentId
      if (parentId) {
          generatedPlan.parentId = parentId;
      }

      // Final set to ensure consistency
      setPlan(generatedPlan);
      
      // Update history only when fully complete
      setHistory(prev => {
          // Remove if it was added partially (by checking ID) or just add new
          const filtered = prev.filter(p => p.id !== generatedPlan.id);
          return [generatedPlan, ...filtered];
      });

    } catch (err: any) {
      console.error(err);
      setError("Something went wrong while generating your plan. Please try again.");
    } finally {
      setLoading(false);
      setDecomposingTask(null);
    }
  };

  const handleLoadPlan = (savedPlan: PlanResponse) => {
    setPlan(savedPlan);
    setView('home');
  };

  const handleDeleteHistoryItem = (timestamp: number) => {
    setHistory(prev => prev.filter(p => p.createdAt !== timestamp));
    if (plan?.createdAt === timestamp) {
        setPlan(null);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    setPlan(null);
  };

  // Triggered when a 'breakable' task card is clicked
  const handleBreakdown = (taskTitle: string) => {
      if (!plan) return;
      
      // Check if we already have this decomposition in history
      const existingSubPlan = history.find(h => h.parentId === plan.id && h.goal === taskTitle);
      
      if (existingSubPlan) {
          setPlan(existingSubPlan);
          return;
      }

      setDecomposingTask(taskTitle);
      // Pass the current plan's ID as the parentId for the new sub-plan
      // Set isSubTask = true to trigger the hourly breakdown prompt
      handleGenerate(taskTitle, plan.id, true);
  };

  // Calculate Ancestry Path for Breadcrumbs
  const planPath = useMemo(() => {
    if (!plan) return [];
    const path: PlanResponse[] = [plan];
    let curr = plan;
    // Safety break counter to prevent infinite loops if data is corrupted
    let loops = 0;
    while (curr.parentId && loops < 20) {
        const parent = history.find(p => p.id === curr.parentId);
        if (parent) {
            path.unshift(parent);
            curr = parent;
        } else {
            break; 
        }
        loops++;
    }
    return path;
  }, [plan, history]);

  // Calculate Children (Sub-plans) for the current plan
  const childPlans = useMemo(() => {
    if (!plan) return [];
    return history
      .filter(h => h.parentId === plan.id)
      .sort((a, b) => b.createdAt - a.createdAt); // Newest first
  }, [plan, history]);

  const translations = {
      en: { 
          archive: 'Archive', 
          new: 'New Protocol', 
          settings: 'Settings', 
          confidence: 'Neural Confidence', 
          active: 'Active Diffusion', 
          expand: 'Swipe to Navigate Strata',
          depth: 'Strata Depth',
          ancestor: 'Ancestor',
          current: 'Current',
          sub: 'Sub-Layer'
      },
      zh: { 
          archive: '归档', 
          new: '新协议', 
          settings: '设置', 
          confidence: '神经置信度', 
          active: '活跃扩散', 
          expand: '滑动浏览层级',
          depth: '层级深度',
          ancestor: '上层',
          current: '当前',
          sub: '子层' 
      }
  };
  const t = translations[language];

  return (
    <>
      {/* Navigation */}
      <nav className="flex justify-between items-center p-8 relative z-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setPlan(null); setView('home'); }}>
            <div className="w-6 h-6 bg-black rounded-full blur-[1px]"></div>
            <span className="font-mono text-sm font-light uppercase tracking-widest text-ink">GoalBreaker.AI</span>
        </div>
        <div className="flex gap-4 md:gap-8 text-xs font-medium uppercase tracking-tighter text-ink opacity-40 hover:opacity-100 transition-opacity cursor-pointer items-center">
            <button 
                onClick={() => setView('archive')} 
                className={`hover:text-black transition-colors uppercase ${view === 'archive' ? 'text-black font-bold' : ''}`}
            >
                {t.archive}
            </button>
            
            <button 
                onClick={() => { setPlan(null); setView('home'); }}
                className={`hover:text-black transition-colors uppercase ${view === 'home' && !plan ? 'text-black font-bold' : ''}`}
            >
                {t.new}
            </button>
            
            <button 
                onClick={() => setView('settings')}
                className={`hover:text-black transition-colors uppercase ${view === 'settings' ? 'text-black font-bold' : ''}`}
            >
                {t.settings}
            </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 pt-12 pb-32 relative z-10 min-h-[60vh]">
        
        {/* Modals/Views */}
        {view === 'archive' && (
            <ArchiveView 
                history={history} 
                onSelect={handleLoadPlan} 
                onClose={() => setView('home')} 
                language={language}
                onDelete={handleDeleteHistoryItem}
            />
        )}
        
        {view === 'settings' && (
            <SettingsView 
                language={language} 
                setLanguage={setLanguage} 
                onClearHistory={handleClearHistory} 
                onClose={() => setView('home')} 
            />
        )}
            
        {/* Home View content (Input + Plan) */}
        {!plan && view === 'home' && (
            <GoalInput onGenerate={(goal) => handleGenerate(goal)} isLoading={loading} language={language} />
        )}

        {error && view === 'home' && (
            <div className="max-w-3xl mx-auto mb-12 stagger-reveal text-center">
                <div className="diffused-card p-4 rounded-xl inline-block border-red-200 bg-red-50/50 text-red-800 text-sm font-mono">
                    ERROR: {error}
                </div>
                <button 
                    onClick={() => setError(null)}
                    className="block mx-auto mt-4 text-xs font-mono underline opacity-50 hover:opacity-100"
                >
                    Dismiss
                </button>
            </div>
        )}

        {/* Plan Display is visible if plan exists and we are in home view */}
        {/* During streaming, plan exists, so this renders immediately */}
        {view === 'home' && (
             <PlanDisplay 
                plan={plan} 
                language={language} 
                onBreakdown={handleBreakdown} 
                isDecomposing={loading && !!decomposingTask} 
                decomposingTask={decomposingTask}
                isStreaming={loading && !decomposingTask}
             />
        )}
        
        {/* Mobile FAB for clearing plan */}
        {plan && view === 'home' && (
             <button 
                onClick={() => setPlan(null)}
                className="md:hidden fixed bottom-32 right-8 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-xl z-50 hover:scale-105 active:scale-95 transition-transform"
             >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
             </button>
        )}

      </main>

      {/* Floating UI Info & Breadcrumbs - Minimalist Version */}
      {plan && (
        <footer className="fixed bottom-0 left-0 right-0 z-40 pb-8 pt-20 px-4 md:px-8 pointer-events-none bg-gradient-to-t from-paper via-paper/90 to-transparent">
            
            {/* Minimalist Horizontal Deck */}
            <div className="pointer-events-auto w-full max-w-6xl mx-auto flex flex-col items-end">
                
                <div className="w-full flex items-center justify-end gap-2 overflow-x-auto pb-1 snap-x no-scrollbar">
                    
                    {/* Ancestors - Minimal Chips */}
                    {planPath.slice(0, -1).map((p, idx) => (
                        <button 
                            key={p.id} 
                            onClick={() => setPlan(p)}
                            className="flex-shrink-0 snap-start bg-white/30 hover:bg-white/60 border border-black/5 rounded-lg py-2 px-3 max-w-[120px] text-left transition-all hover:-translate-y-0.5"
                        >
                            <div className="text-[9px] font-mono uppercase tracking-widest text-ink/40 mb-0.5">{t.ancestor} 0{idx + 1}</div>
                            <div className="font-medium text-xs truncate text-ink/60">{p.goal}</div>
                        </button>
                    ))}

                    {/* Current - Active Chip */}
                    <div className="flex-shrink-0 snap-center bg-white/80 backdrop-blur-md border border-black/10 shadow-sm rounded-lg py-2 px-4 max-w-[160px] text-left relative">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <div className={`w-1 h-1 rounded-full ${loading && !decomposingTask ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
                            <span className="text-[9px] font-mono uppercase tracking-widest text-ink">{t.current}</span>
                        </div>
                        <div className="font-bold text-xs truncate text-ink">{plan.goal}</div>
                    </div>

                    {/* Children - Dashed Chips */}
                    {childPlans.map((child, idx) => (
                        <button 
                            key={child.id} 
                            onClick={() => setPlan(child)}
                            className="flex-shrink-0 snap-start bg-white/20 hover:bg-white/50 border border-dashed border-black/10 hover:border-black/30 rounded-lg py-2 px-3 max-w-[120px] text-left transition-all hover:-translate-y-0.5"
                        >
                             <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[9px] font-mono uppercase tracking-widest text-ink/40">{t.sub} 0{idx + 1}</span>
                             </div>
                            <div className="font-medium text-xs truncate text-ink/60">{child.goal}</div>
                        </button>
                    ))}
                    
                     {/* Empty state hint for children */}
                     {childPlans.length === 0 && (
                        <div className="flex-shrink-0 opacity-20 px-2 font-mono text-[9px] text-center w-[60px] leading-tight">
                            →
                        </div>
                    )}
                </div>
            </div>
        </footer>
      )}
    </>
  );
};

export default App;