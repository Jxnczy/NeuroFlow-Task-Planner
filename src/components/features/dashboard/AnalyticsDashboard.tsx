import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Flame, CheckCircle2, Target, Zap, Trophy, Clock, TrendingUp, Calendar, Award, Sparkles, Brain, Coffee, Rocket, HelpCircle } from 'lucide-react';
import { Task } from '../../../types';
import { formatDate, TARGET_HOURS_PER_DAY, getWeekDays } from '../../../constants';

interface AnalyticsDashboardProps {
    tasks: Task[];
    statsResetAt?: number;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ tasks: allTasks, statsResetAt = 0 }) => {
    // Filter tasks based on statsResetAt baseline
    const tasks = (allTasks || []).filter(t => {
        // If not completed, keep it for "Planned" stats (capacity, progress)
        if (t.status !== 'completed') return true;
        // If completed, only keep if it was completed AFTER the reset
        return t.completedAt && t.completedAt > statsResetAt;
    });

    const [showFlowScoreTooltip, setShowFlowScoreTooltip] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    React.useEffect(() => {
        // Small delay to ensure layout is fully calculated before rendering charts
        const timer = setTimeout(() => {
            setIsMounted(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);
    const todayStr = formatDate(new Date());
    const todayTasks = (tasks || []).filter(t => t.dueDate === todayStr && t.status !== 'unscheduled');
    const completedToday = todayTasks.filter(t => t.status === 'completed');
    const rescheduledToday = todayTasks.filter(t => t.status === 'rescheduled');

    // Completion Rate: Completed / (Completed + Remaining + Rescheduled)
    // Note: todayTasks already includes completed, remaining, and rescheduled
    const completionRate = todayTasks.length > 0 ? Math.round((completedToday.length / todayTasks.length) * 100) : 0;

    // Total completed tasks and time
    const allCompleted = (tasks || []).filter(t => t.status === 'completed');
    const totalCompletedMinutes = allCompleted.reduce((acc, t) => acc + t.duration, 0);
    const totalCompletedHours = Math.floor(totalCompletedMinutes / 60);

    // Flow Score (High value tasks vs Total)
    const highValueCompleted = allCompleted.filter(t => t.type === 'high' || t.type === 'medium').length;
    const flowScore = allCompleted.length > 0 ? Math.round((highValueCompleted / allCompleted.length) * 100) : 0;

    const flowData = [
        { name: 'Deep Work', value: flowScore, color: '#10b981' },
        { name: 'Shallow', value: 100 - flowScore, color: 'rgba(255,255,255,0.1)' },
    ];

    // Capacity Thermometer
    // Include rescheduled tasks in the capacity calculation to show "what was planned"
    const totalPlannedMinutes = todayTasks.reduce((acc, t) => acc + t.duration, 0);
    const capacityLimit = TARGET_HOURS_PER_DAY * 60;
    const capacityPercent = Math.min(100, (totalPlannedMinutes / capacityLimit) * 100);

    let capacityColor = 'bg-emerald-500';
    if (capacityPercent > 80) capacityColor = 'bg-amber-500';
    if (capacityPercent > 100) capacityColor = 'bg-rose-500';

    // Streak calculation
    const completedDates = new Set(
        (tasks || [])
            .filter(t => t.status === 'completed' && t.dueDate)
            .map(t => t.dueDate)
    );
    const streak = completedDates.size;

    // Weekly data for chart
    const weekDays = getWeekDays(new Date());
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyData = weekDays.map((day, i) => {
        const dayStr = formatDate(day);
        const dayCompleted = (tasks || []).filter(t => t.dueDate === dayStr && t.status === 'completed');
        const dayMinutes = dayCompleted.reduce((acc, t) => acc + t.duration, 0);
        return {
            name: dayNames[i],
            hours: +(dayMinutes / 60).toFixed(1),
            tasks: dayCompleted.length
        };
    });

    // Personal Bests
    const maxTasksDay = Math.max(...weeklyData.map(d => d.tasks));
    const maxHoursDay = Math.max(...weeklyData.map(d => d.hours));
    const longestTaskCompleted = Math.max(...allCompleted.map(t => t.duration), 0);

    // Task type breakdown
    const typeBreakdown = [
        { type: '🔥 High', count: allCompleted.filter(t => t.type === 'high').length, color: '#f43f5e' },
        { type: '⚡ Medium', count: allCompleted.filter(t => t.type === 'medium').length, color: '#f97316' },
        { type: '📋 Low', count: allCompleted.filter(t => t.type === 'low').length, color: '#facc15' },
        { type: '🎮 Leisure', count: allCompleted.filter(t => t.type === 'leisure').length, color: '#22d3ee' },
        { type: '🧹 Chores', count: allCompleted.filter(t => t.type === 'chores').length, color: '#a1a1aa' },
    ].filter(t => t.count > 0);

    // Level calculation (gamification)
    const xp = allCompleted.reduce((acc, t) => {
        const baseXP = t.type === 'high' ? 50 : t.type === 'medium' ? 30 : 15;
        return acc + baseXP + Math.floor(t.duration / 15) * 5;
    }, 0);
    const level = Math.floor(xp / 500) + 1;
    const xpForNextLevel = level * 500;
    const xpProgress = ((xp % 500) / 500) * 100;

    // Motivational quotes based on stats
    const getMotivationalMessage = () => {
        if (completionRate >= 100) return "🎉 Perfect day! You crushed it!";
        if (completionRate >= 75) return "🔥 On fire! Almost there!";
        if (completionRate >= 50) return "💪 Halfway done, keep pushing!";
        if (streak > 5) return "🌟 Incredible streak! Don't break it!";
        return "🚀 Let's make today count!";
    };

    return (
        <div className="h-full p-6 overflow-y-auto overflow-x-hidden">
            <div className="mx-auto w-full" style={{ maxWidth: '60%' }}>
                {/* Header with Motivational Message */}
                <div className="mb-8 flex flex-col items-center text-center gap-4">
                    <div>
                        <h2 className="text-3xl font-display font-bold text-white mb-1">Productivity Insights</h2>
                        <p className="text-lg" style={{ color: 'var(--accent)' }}>{getMotivationalMessage()}</p>
                    </div>
                    {/* Level Badge */}
                    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 w-full max-w-md">
                        <Trophy size={28} className="text-amber-400" />
                        <div>
                            <div className="text-xs text-amber-400/80 font-bold uppercase tracking-wider">Level</div>
                            <div className="text-2xl font-bold text-amber-400">{level}</div>
                        </div>
                        <div className="ml-auto w-32">
                            <div className="text-[10px] text-amber-400/60 mb-1">{xp} / {xpForNextLevel} XP</div>
                            <div className="h-2 bg-amber-900/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500"
                                    style={{ width: `${xpProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Flow Score */}
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-white/[0.04] transition-colors">
                        <div className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                            Flow Score
                            <div
                                className="relative"
                                onMouseEnter={() => setShowFlowScoreTooltip(true)}
                                onMouseLeave={() => setShowFlowScoreTooltip(false)}
                            >
                                <HelpCircle size={10} className="cursor-help text-slate-600 hover:text-slate-400 transition-colors" />
                                {showFlowScoreTooltip && (
                                    <div className="absolute left-0 top-full mt-1 z-50 px-3 py-2 rounded-xl text-[9px] whitespace-nowrap shadow-2xl border bg-slate-900 border-white/[0.1] text-slate-300 w-48">
                                        <div className="font-bold mb-1 text-white">Flow Score</div>
                                        Share of high-value tasks (high/medium priority) vs all completed tasks.
                                        <div className="mt-1 text-emerald-400">{highValueCompleted} high / {allCompleted.length} total</div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="w-28 h-28 relative">
                            <PieChart width={112} height={112}>
                                <Pie
                                    data={flowData}
                                    innerRadius={32}
                                    outerRadius={42}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {flowData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-2xl font-bold text-white">{flowScore}</span>
                                <span className="text-[9px] text-slate-500">%</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 text-center">Deep vs Shallow Ratio</p>
                    </div>

                    {/* Capacity Thermometer */}
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 flex flex-col justify-between group hover:bg-white/[0.04] transition-colors">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Daily Capacity</div>
                        <div className="flex-1 flex flex-col justify-center gap-3">
                            <div className="flex justify-between items-end">
                                <span className="text-2xl font-bold text-white">{(totalPlannedMinutes / 60).toFixed(1)}h</span>
                                <span className="text-xs text-slate-500">/ {TARGET_HOURS_PER_DAY}h</span>
                            </div>
                            <div className="w-full h-3 bg-slate-800/50 rounded-full overflow-hidden border border-white/[0.05]">
                                <div
                                    className={`h-full ${capacityColor} transition-all duration-1000 ease-out`}
                                    style={{ width: `${capacityPercent}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-slate-400">
                                {capacityPercent > 100 ? '⚠️ Over capacity!' : capacityPercent > 80 ? '⚡ Near limit' : '✅ Healthy'}
                            </p>
                        </div>
                    </div>

                    {/* Focus Streak */}
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 flex flex-col items-center justify-center text-center group hover:bg-white/[0.04] transition-colors relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-24 bg-orange-500/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>
                        <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center mb-3 text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)] group-hover:scale-110 transition-transform">
                            <Flame size={28} fill="currentColor" />
                        </div>
                        <div className="text-3xl font-bold text-white mb-0.5">{streak}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Day Streak</div>
                    </div>

                    {/* Completion Rate */}
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 flex flex-col items-center justify-center text-center group hover:bg-white/[0.04] transition-colors">
                        <div
                            className="w-14 h-14 rounded-full border-4 flex items-center justify-center mb-3 relative"
                            style={{
                                borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)',
                                borderTopColor: 'var(--accent)'
                            }}
                        >
                            <Zap size={22} style={{ color: 'var(--accent)' }} fill="currentColor" />
                        </div>
                        <div className="text-3xl font-bold text-white mb-0.5">{completionRate}%</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Today Done</div>
                    </div>
                </div>

                {/* Second Row - Detailed Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    {/* Weekly Activity Chart */}
                    <div className="lg:col-span-2 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <TrendingUp size={14} style={{ color: 'var(--accent)' }} />
                                This Week's Progress
                            </div>
                            <div className="text-xs text-slate-400">
                                {weeklyData.reduce((a, d) => a + d.tasks, 0)} tasks · {weeklyData.reduce((a, d) => a + d.hours, 0).toFixed(1)}h
                            </div>
                        </div>
                        <div className="h-40 w-full">
                            {isMounted && (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                                    <BarChart data={weeklyData}>
                                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1e2338',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '12px',
                                                fontSize: '12px'
                                            }}
                                            formatter={(value: number, name: string) => [
                                                name === 'hours' ? `${value}h` : `${value} tasks`,
                                                name === 'hours' ? 'Time' : 'Tasks'
                                            ]}
                                        />
                                        <Bar dataKey="hours" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Personal Bests */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-5">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-purple-400 flex items-center gap-2 mb-4">
                            <Award size={14} />
                            Personal Bests
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                        <CheckCircle2 size={16} className="text-purple-400" />
                                    </div>
                                    <span className="text-xs text-slate-300">Tasks in a day</span>
                                </div>
                                <span className="text-lg font-bold text-white">{maxTasksDay}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                                        <Clock size={16} className="text-pink-400" />
                                    </div>
                                    <span className="text-xs text-slate-300">Hours in a day</span>
                                </div>
                                <span className="text-lg font-bold text-white">{maxHoursDay}h</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                        <Brain size={16} className="text-violet-400" />
                                    </div>
                                    <span className="text-xs text-slate-300">Longest task</span>
                                </div>
                                <span className="text-lg font-bold text-white">{longestTaskCompleted}m</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Third Row - Fun Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Total Completed */}
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 text-center hover:bg-white/[0.04] transition-colors">
                        <Rocket size={24} className="mx-auto mb-2 text-emerald-400" />
                        <div className="text-2xl font-bold text-white">{allCompleted.length}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Tasks Crushed</div>
                    </div>

                    {/* Total Hours */}
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 text-center hover:bg-white/[0.04] transition-colors">
                        <Coffee size={24} className="mx-auto mb-2 text-amber-400" />
                        <div className="text-2xl font-bold text-white">{totalCompletedHours}h</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Deep Work</div>
                    </div>

                    {/* High Priority Done */}
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 text-center hover:bg-white/[0.04] transition-colors">
                        <Target size={24} className="mx-auto mb-2 text-rose-400" />
                        <div className="text-2xl font-bold text-white">{highValueCompleted}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">High Priority</div>
                    </div>

                    {/* Productivity Score */}
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 text-center hover:bg-white/[0.04] transition-colors">
                        <Sparkles size={24} className="mx-auto mb-2" style={{ color: 'var(--accent)' }} />
                        <div className="text-2xl font-bold text-white">{Math.min(100, Math.round((flowScore + completionRate) / 2))}%</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Productivity</div>
                    </div>
                </div>

                {/* Task Type Breakdown */}
                {typeBreakdown.length > 0 && (
                    <div className="mt-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 text-center">Completed by Category</div>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {typeBreakdown.map(item => (
                                <div
                                    key={item.type}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:scale-105 cursor-pointer"
                                    style={{ backgroundColor: `${item.color}15`, border: `1px solid ${item.color}30` }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${item.color}25`}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${item.color}15`}
                                >
                                    <span className="text-sm">{item.type}</span>
                                    <span className="text-lg font-bold" style={{ color: item.color }}>{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
