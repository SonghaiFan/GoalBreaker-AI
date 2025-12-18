import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PlanResponse, Difficulty, TaskType, Language } from '../types';

interface PlanStatsProps {
  plan: PlanResponse;
  language: Language;
}

// Monochrome/Ink palette
const COLORS = {
  [Difficulty.Easy]: '#e5e5e5',   // light gray
  [Difficulty.Medium]: '#a3a3a3', // medium gray
  [Difficulty.Hard]: '#171717',   // almost black
};

// Task Type Colors for the progress bars
const TYPE_COLORS = {
  [TaskType.Research]: 'bg-zinc-800', 
  [TaskType.Action]: 'bg-zinc-600',   
  [TaskType.Milestone]: 'bg-zinc-400',
  [TaskType.Preparation]: 'bg-zinc-200' 
};

const translations = {
  en: {
    difficultyTitle: "Complexity Orbit",
    compositionTitle: "Action Spectrum",
    totalNodes: "Total Nodes",
    [Difficulty.Easy]: "Easy",
    [Difficulty.Medium]: "Medium",
    [Difficulty.Hard]: "Hard",
    [TaskType.Research]: "Research",
    [TaskType.Action]: "Action",
    [TaskType.Milestone]: "Milestone",
    [TaskType.Preparation]: "Preparation"
  },
  zh: {
    difficultyTitle: "复杂度轨道",
    compositionTitle: "行动光谱",
    totalNodes: "节点总数",
    [Difficulty.Easy]: "简单",
    [Difficulty.Medium]: "中等",
    [Difficulty.Hard]: "困难",
    [TaskType.Research]: "研究",
    [TaskType.Action]: "行动",
    [TaskType.Milestone]: "里程碑",
    [TaskType.Preparation]: "准备"
  }
};

const PlanStats: React.FC<PlanStatsProps> = ({ plan, language }) => {
  const t = translations[language];

  // Flatten all steps from all phases
  const allSteps = useMemo(() => {
    return plan.phases.flatMap(phase => phase.steps);
  }, [plan]);

  const totalSteps = allSteps.length;

  const difficultyData = useMemo(() => {
    const counts = allSteps.reduce((acc, step) => {
      acc[step.difficulty] = (acc[step.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(COLORS).map(key => ({
      name: t[key as Difficulty], 
      originalKey: key, 
      value: counts[key] || 0
    })).filter(d => d.value > 0);
  }, [allSteps, t]);

  const typeData = useMemo(() => {
    const counts = allSteps.reduce((acc, step) => {
      acc[step.type] = (acc[step.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Sort by count descending for better visual stacking
    return Object.keys(TYPE_COLORS).map(key => ({
      name: t[key as TaskType], 
      originalKey: key as TaskType,
      value: counts[key] || 0,
      percentage: Math.round(((counts[key] || 0) / totalSteps) * 100)
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [allSteps, totalSteps, t]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24 stagger-reveal" style={{ animationDelay: '0.2s' }}>
      
      {/* 1. ORBIT CHART (Donut) for Difficulty */}
      <div className="diffused-card p-6 rounded-3xl flex flex-col justify-between min-h-[240px] w-full">
        <div className="flex justify-between items-start">
            <h3 className="text-[10px] font-mono uppercase opacity-40 tracking-widest text-ink">
            {t.difficultyTitle}
            </h3>
            <div className="flex gap-2">
                {difficultyData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[d.originalKey as Difficulty] }}></div>
                    </div>
                ))}
            </div>
        </div>

        <div className="relative h-40 w-full mt-2 min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie
                data={difficultyData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={70}
                paddingAngle={4}
                cornerRadius={4}
                dataKey="value"
                stroke="none"
              >
                {difficultyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.originalKey as Difficulty]} />
                ))}
              </Pie>
              <Tooltip 
                cursor={false}
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                        <div className="bg-white/90 backdrop-blur-md border border-black/5 px-3 py-2 rounded-lg shadow-xl">
                            <p className="font-mono text-[10px] uppercase tracking-wider opacity-50">{data.name}</p>
                            <p className="text-sm font-bold text-ink">{data.value} Steps</p>
                        </div>
                    );
                    }
                    return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Central Counter */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-extrabold tracking-tight text-ink">{totalSteps}</span>
                <span className="text-[9px] font-mono uppercase tracking-widest opacity-40">{t.totalNodes}</span>
          </div>
        </div>
      </div>

      {/* 2. STRATA BARS (Custom CSS Progress) for Task Types */}
      <div className="diffused-card p-6 rounded-3xl flex flex-col min-h-[240px] w-full">
        <h3 className="text-[10px] font-mono uppercase opacity-40 tracking-widest text-ink mb-6">
          {t.compositionTitle}
        </h3>
        
        <div className="flex flex-col justify-center flex-1 gap-5">
            {typeData.map((type) => (
                <div key={type.originalKey} className="group">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-bold text-ink tracking-tight">{type.name}</span>
                        <div className="flex items-baseline gap-1">
                            <span className="font-mono text-xs opacity-100">{type.value}</span>
                            <span className="font-mono text-[9px] opacity-40">%</span>
                        </div>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden relative">
                        <div 
                            className={`h-full ${TYPE_COLORS[type.originalKey]} rounded-full relative z-10`} 
                            style={{ width: `${type.percentage}%` }}
                        ></div>
                        {/* Subtle gloss effect on the bar */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent z-20 pointer-events-none"></div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default PlanStats;