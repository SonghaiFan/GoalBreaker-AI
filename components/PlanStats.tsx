import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { PlanResponse, Difficulty, TaskType, Language } from '../types';

interface PlanStatsProps {
  plan: PlanResponse;
  language: Language;
}

const COLORS = {
  [Difficulty.Easy]: 'var(--chart-easy)',
  [Difficulty.Medium]: 'var(--chart-medium)',
  [Difficulty.Hard]: 'var(--chart-hard)',
};

const TYPE_COLORS = {
  [TaskType.Research]: 'bg-ink/80', 
  [TaskType.Action]: 'bg-ink/60',   
  [TaskType.Milestone]: 'bg-ink/40',
  [TaskType.Preparation]: 'bg-ink/20' 
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

  const allSteps = useMemo(() => {
    if (!plan?.phases) return [];
    return plan.phases
        .flatMap(phase => phase.steps || [])
        .filter(step => step && step.difficulty && step.type);
  }, [plan]);

  const totalSteps = allSteps.length;

  const difficultyData = useMemo(() => {
    const counts = allSteps.reduce((acc, step) => {
      if (!step?.difficulty) return acc;
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
      if (!step?.type) return acc;
      acc[step.type] = (acc[step.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(TYPE_COLORS).map(key => ({
      name: t[key as TaskType], 
      originalKey: key as TaskType,
      value: counts[key] || 0,
      percentage: totalSteps > 0 ? Math.round(((counts[key] || 0) / totalSteps) * 100) : 0
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [allSteps, totalSteps, t]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-20 md:mb-24 stagger-reveal">
      
      {/* Orbit Chart */}
      <div className="diffused-card p-5 md:p-6 rounded-3xl flex flex-col min-h-[220px] md:min-h-[240px] w-full">
        <div className="flex justify-between items-start mb-4">
            <h3 className="text-[9px] font-mono uppercase opacity-40 tracking-widest text-ink">
            {t.difficultyTitle}
            </h3>
            <div className="flex flex-wrap justify-end gap-x-3 gap-y-1">
                {difficultyData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[d.originalKey as Difficulty] }}></div>
                        <span className="text-[8px] font-mono uppercase tracking-wide text-ink opacity-60">
                            {d.name} <span className="text-ink font-bold opacity-100">{d.value}</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>

        <div className="relative h-32 md:h-40 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={difficultyData}
                cx="50%"
                cy="50%"
                innerRadius={window.innerWidth < 768 ? 40 : 55}
                outerRadius={window.innerWidth < 768 ? 55 : 70}
                paddingAngle={4}
                cornerRadius={4}
                dataKey="value"
                stroke="none"
              >
                {difficultyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.originalKey as Difficulty]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink">{totalSteps}</span>
                <span className="text-[8px] font-mono uppercase tracking-widest opacity-40 text-ink">{t.totalNodes}</span>
          </div>
        </div>
      </div>

      {/* Strata Bars */}
      <div className="diffused-card p-5 md:p-6 rounded-3xl flex flex-col min-h-[220px] md:min-h-[240px] w-full">
        <h3 className="text-[9px] font-mono uppercase opacity-40 tracking-widest text-ink mb-6">
          {t.compositionTitle}
        </h3>
        
        <div className="flex flex-col justify-center flex-1 gap-4 md:gap-5">
            {typeData.map((type) => (
                <div key={type.originalKey}>
                    <div className="flex justify-between items-end mb-1.5">
                        <span className="text-[11px] font-bold text-ink tracking-tight">{type.name}</span>
                        <span className="font-mono text-[10px] opacity-60 text-ink">{type.value}</span>
                    </div>
                    <div className="h-1 w-full bg-ink/5 rounded-full overflow-hidden relative">
                        <div 
                            className={`h-full ${TYPE_COLORS[type.originalKey]} rounded-full`} 
                            style={{ width: `${type.percentage}%` }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default PlanStats;