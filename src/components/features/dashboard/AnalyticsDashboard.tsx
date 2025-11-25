import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Flame, CheckCircle2, Target, Zap } from 'lucide-react';
import { Task } from '../../../types';
import { formatDate, TARGET_HOURS_PER_DAY } from '../../../constants';

interface AnalyticsDashboardProps {
    tasks: Task[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ tasks }) => {
    const todayStr = formatDate(new Date());
    const todayTasks = tasks.filter(t => t.dueDate === todayStr && t.status !== 'unscheduled');
    const completedToday = todayTasks.filter(t => t.status === 'completed').length;
    const completionRate = todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 0;

    // Flow Score (Goal/Focus vs Total)
    const highValueTasks = tasks.filter(t => t.status === 'completed' && (t.type === 'high' || t.type === 'medium')).length;
    const totalCompleted = tasks.filter(t => t.status === 'completed').length;
    const flowScore = totalCompleted > 0 ? Math.round((highValueTasks / totalCompleted) * 100) : 0;

    const flowData = [
        { name: 'Deep Work', value: flowScore, color: '#10b981' }, // Emerald
        { name: 'Shallow', value: 100 - flowScore, color: 'rgba(255,255,255,0.1)' },
    ];

    // Capacity Thermometer
    const totalPlannedMinutes = todayTasks.reduce((acc, t) => acc + t.duration, 0);
    const capacityLimit = 6 * 60; // 6 hours
    const capacityPercent = Math.min(100, (totalPlannedMinutes / capacityLimit) * 100);

    let capacityColor = 'bg-emerald-500';
    if (capacityPercent > 80) capacityColor = 'bg-amber-500';
    if (capacityPercent > 100) capacityColor = 'bg-rose-500';

    // Focus Streak (Mock logic - in real app would check history)
    // For now, just check if yesterday had completed tasks, etc. 
    // Simplified: Just show a static "3 Days" for demo or calculate based on simple logic if possible.
    // Let's calculate based on unique days with completed "high" tasks
    const completedDates = new Set(
        tasks
            .filter(t => t.status === 'completed' && t.type === 'high' && t.dueDate)
            .map(t => t.dueDate)
    );
    const streak = completedDates.size; // Simple count of productive days for now

    return (
        <div className="h-full p-8 overflow-y-auto">
            <h2 className="text-3xl font-display font-bold text-white mb-8">Productivity Insights</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Flow Score */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-white/[0.04] transition-colors">
                    <div className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Flow Score</div>
                    <div className="w-32 h-32 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={flowData}
                                    innerRadius={35}
                                    outerRadius={45}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {flowData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-2xl font-bold text-white">{flowScore}</span>
                            <span className="text-[9px] text-slate-500">%</span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-center px-4">High Value vs. Shallow Work Ratio</p>
                </div>

                {/* 2. Capacity Thermometer */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 flex flex-col justify-between group hover:bg-white/[0.04] transition-colors">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Daily Capacity</div>
                    <div className="flex-1 flex flex-col justify-center gap-4">
                        <div className="flex justify-between items-end">
                            <span className="text-3xl font-bold text-white">{(totalPlannedMinutes / 60).toFixed(1)}h</span>
                            <span className="text-xs text-slate-500 mb-1">/ 6h Limit</span>
                        </div>
                        <div className="w-full h-4 bg-slate-800/50 rounded-full overflow-hidden border border-white/[0.05]">
                            <div
                                className={`h-full ${capacityColor} transition-all duration-1000 ease-out`}
                                style={{ width: `${capacityPercent}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-slate-400">
                            {capacityPercent > 100 ? 'Over capacity! Consider rescheduling.' : 'Within healthy limits.'}
                        </p>
                    </div>
                </div>

                {/* 3. Focus Streak */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 flex flex-col items-center justify-center text-center group hover:bg-white/[0.04] transition-colors relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-orange-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4 text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)] group-hover:scale-110 transition-transform">
                        <Flame size={32} fill="currentColor" />
                    </div>
                    <div className="text-4xl font-bold text-white mb-1">{streak}</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-orange-400">Day Streak</div>
                    <p className="text-[10px] text-slate-500 mt-2">Consistent Deep Work</p>
                </div>

                {/* 4. Completion Rate */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 flex flex-col items-center justify-center text-center group hover:bg-white/[0.04] transition-colors">
                    <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 flex items-center justify-center mb-4 relative">
                        <Zap size={24} className="text-cyan-400" fill="currentColor" />
                    </div>
                    <div className="text-4xl font-bold text-white mb-1">{completionRate}%</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-cyan-400">Completion</div>
                    <p className="text-[10px] text-slate-500 mt-2">Today's Tasks Done</p>
                </div>
            </div>
        </div>
    );
};
