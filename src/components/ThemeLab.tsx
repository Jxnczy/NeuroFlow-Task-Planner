import React from 'react';
import { ChevronRight, Clock, Check, AlertCircle, Sun, Moon } from 'lucide-react';

/**
 * Theme Lab - Visual testing page for Light Theme v2
 * Shows all components and states for quick iteration
 */
export const ThemeLab: React.FC = () => {
    return (
        <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--bg, #F6F7F9)' }}>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text, #101828)' }}>
                        Theme Lab - Light Mode v2
                    </h1>
                    <div className="flex items-center gap-2">
                        <Sun size={18} style={{ color: 'var(--primary, #2563EB)' }} />
                        <span style={{ color: 'var(--text-muted, #475467)' }}>Semantic Tokens</span>
                    </div>
                </div>

                {/* Surface Hierarchy */}
                <section>
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text, #101828)' }}>
                        Surface Hierarchy
                    </h2>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg, #F6F7F9)', border: '1px solid var(--border, #E4E7EC)' }}>
                            <div className="text-sm font-medium" style={{ color: 'var(--text, #101828)' }}>--bg</div>
                            <div className="text-xs mt-1" style={{ color: 'var(--text-muted, #475467)' }}>App Canvas</div>
                        </div>
                        <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--panel, #FFFFFF)', border: '1px solid var(--border, #E4E7EC)', boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(16,24,40,.06))' }}>
                            <div className="text-sm font-medium" style={{ color: 'var(--text, #101828)' }}>--panel</div>
                            <div className="text-xs mt-1" style={{ color: 'var(--text-muted, #475467)' }}>Sidebar/Header</div>
                        </div>
                        <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--surface, #FFFFFF)', border: '1px solid var(--border, #E4E7EC)', boxShadow: 'var(--shadow-sm)' }}>
                            <div className="text-sm font-medium" style={{ color: 'var(--text, #101828)' }}>--surface</div>
                            <div className="text-xs mt-1" style={{ color: 'var(--text-muted, #475467)' }}>Planner</div>
                        </div>
                        <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--surface-alt, #F2F4F7)', border: '1px solid var(--border, #E4E7EC)' }}>
                            <div className="text-sm font-medium" style={{ color: 'var(--text, #101828)' }}>--surface-alt</div>
                            <div className="text-xs mt-1" style={{ color: 'var(--text-muted, #475467)' }}>Hover/Alt</div>
                        </div>
                    </div>
                </section>

                {/* Typography */}
                <section>
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text, #101828)' }}>
                        Typography (Contrast &gt;= 4.5:1)
                    </h2>
                    <div className="space-y-3 p-6 rounded-lg" style={{ backgroundColor: 'var(--panel, #FFFFFF)', border: '1px solid var(--border, #E4E7EC)' }}>
                        <div className="text-xl font-bold" style={{ color: 'var(--text, #101828)' }}>
                            --text: Primary headings and body text
                        </div>
                        <div className="text-base" style={{ color: 'var(--text-muted, #475467)' }}>
                            --text-muted: Labels and descriptions
                        </div>
                        <div className="text-sm" style={{ color: 'var(--text-subtle, #667085)' }}>
                            --text-subtle: Meta information only
                        </div>
                    </div>
                </section>

                {/* Task Cards */}
                <section>
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text, #101828)' }}>
                        Task Cards (Elevated Objects)
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                        {/* Default */}
                        <div
                            className="p-4 rounded-lg border-l-4"
                            style={{
                                backgroundColor: 'var(--panel, #FFFFFF)',
                                border: '1px solid var(--border, #E4E7EC)',
                                borderLeftColor: '#EF4444',
                                boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(16,24,40,.06))'
                            }}
                        >
                            <div className="font-medium" style={{ color: 'var(--text, #101828)' }}>
                                High Priority Task
                            </div>
                            <div className="flex items-center gap-1 mt-2 text-sm" style={{ color: 'var(--text-muted, #475467)' }}>
                                <Clock size={12} />
                                <span>45 min</span>
                            </div>
                        </div>

                        {/* Hover */}
                        <div
                            className="p-4 rounded-lg border-l-4"
                            style={{
                                backgroundColor: 'var(--panel, #FFFFFF)',
                                border: '1px solid var(--border, #E4E7EC)',
                                borderLeftColor: '#F97316',
                                boxShadow: 'var(--shadow-md, 0 6px 18px rgba(16,24,40,.12))'
                            }}
                        >
                            <div className="font-medium" style={{ color: 'var(--text, #101828)' }}>
                                Focus Task (Hover)
                            </div>
                            <div className="flex items-center gap-1 mt-2 text-sm" style={{ color: 'var(--text-muted, #475467)' }}>
                                <Clock size={12} />
                                <span>30 min</span>
                            </div>
                        </div>

                        {/* Completed */}
                        <div
                            className="p-4 rounded-lg"
                            style={{
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid #10b981'
                            }}
                        >
                            <div className="flex items-center gap-2 font-medium" style={{ color: 'var(--text, #101828)' }}>
                                <Check size={16} className="text-emerald-600" />
                                Completed Task
                            </div>
                            <div className="flex items-center gap-1 mt-2 text-sm" style={{ color: 'var(--text-muted, #475467)' }}>
                                <Clock size={12} />
                                <span>60 min</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Buttons & Controls */}
                <section>
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text, #101828)' }}>
                        Buttons & Controls
                    </h2>
                    <div className="flex flex-wrap gap-4 p-6 rounded-lg" style={{ backgroundColor: 'var(--panel, #FFFFFF)', border: '1px solid var(--border, #E4E7EC)' }}>
                        {/* Default */}
                        <button
                            className="px-4 py-2 rounded-lg transition-all"
                            style={{
                                backgroundColor: 'transparent',
                                border: '1px solid var(--border, #E4E7EC)',
                                color: 'var(--text-muted, #475467)'
                            }}
                        >
                            Default
                        </button>

                        {/* Hover */}
                        <button
                            className="px-4 py-2 rounded-lg transition-all"
                            style={{
                                backgroundColor: 'var(--surface-alt, #F2F4F7)',
                                border: '1px solid var(--border, #E4E7EC)',
                                color: 'var(--text, #101828)'
                            }}
                        >
                            Hover
                        </button>

                        {/* Selected */}
                        <button
                            className="px-4 py-2 rounded-lg transition-all"
                            style={{
                                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                                border: '1px solid var(--primary, #2563EB)',
                                color: 'var(--primary, #2563EB)'
                            }}
                        >
                            Selected
                        </button>

                        {/* Focus */}
                        <button
                            className="px-4 py-2 rounded-lg transition-all"
                            style={{
                                backgroundColor: 'var(--panel, #FFFFFF)',
                                border: '1px solid var(--border, #E4E7EC)',
                                color: 'var(--text, #101828)',
                                boxShadow: 'var(--focus-ring, 0 0 0 3px rgba(37,99,235,.25))'
                            }}
                        >
                            Focus
                        </button>

                        {/* Primary */}
                        <button
                            className="px-4 py-2 rounded-lg transition-all"
                            style={{
                                backgroundColor: 'var(--primary, #2563EB)',
                                border: 'none',
                                color: '#FFFFFF'
                            }}
                        >
                            Primary
                        </button>
                    </div>
                </section>

                {/* Category Chips */}
                <section>
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text, #101828)' }}>
                        Category Chips
                    </h2>
                    <div className="flex flex-wrap gap-3 p-6 rounded-lg" style={{ backgroundColor: 'var(--panel, #FFFFFF)', border: '1px solid var(--border, #E4E7EC)' }}>
                        {[
                            { name: 'Goal', color: '#EF4444' },
                            { name: 'Focus', color: '#F97316' },
                            { name: 'Work', color: '#EAB308' },
                            { name: 'Leisure', color: '#06B6D4' },
                            { name: 'Chores', color: '#94A3B8' },
                            { name: 'Backlog', color: '#A855F7' },
                        ].map(cat => (
                            <div
                                key={cat.name}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                                style={{
                                    backgroundColor: `${cat.color}15`,
                                    border: `1px solid ${cat.color}40`
                                }}
                            >
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                <span className="text-sm font-medium" style={{ color: 'var(--text, #101828)' }}>
                                    {cat.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Grid Preview */}
                <section>
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text, #101828)' }}>
                        Grid Lines
                    </h2>
                    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-strong, #D0D5DD)' }}>
                        <div className="grid grid-cols-5 divide-x" style={{ borderColor: 'var(--border-strong, #D0D5DD)' }}>
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                                <div
                                    key={day}
                                    className="p-4 text-center"
                                    style={{
                                        backgroundColor: i === 2 ? 'rgba(37, 99, 235, 0.04)' : 'var(--surface, #FFFFFF)',
                                        borderColor: 'var(--border-strong, #D0D5DD)'
                                    }}
                                >
                                    <div className="text-sm font-medium" style={{ color: 'var(--text-muted, #475467)' }}>
                                        {day}
                                    </div>
                                    <div className="text-2xl font-bold" style={{ color: 'var(--text, #101828)' }}>
                                        {20 + i}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="divide-y" style={{ borderColor: 'var(--border, #E4E7EC)' }}>
                            {['Goal', 'Focus', 'Work'].map(row => (
                                <div
                                    key={row}
                                    className="grid grid-cols-5 divide-x h-16"
                                    style={{ borderColor: 'var(--border-strong, #D0D5DD)' }}
                                >
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="p-2"
                                            style={{
                                                backgroundColor: i === 2 ? 'rgba(37, 99, 235, 0.04)' : 'var(--surface, #FFFFFF)',
                                                borderColor: 'var(--border-strong, #D0D5DD)'
                                            }}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Tokens Reference */}
                <section className="p-6 rounded-lg" style={{ backgroundColor: 'var(--surface-alt, #F2F4F7)', border: '1px solid var(--border, #E4E7EC)' }}>
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text, #101828)' }}>
                        Token Reference
                    </h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="font-medium mb-2" style={{ color: 'var(--text, #101828)' }}>Surfaces</div>
                            <ul className="space-y-1" style={{ color: 'var(--text-muted, #475467)' }}>
                                <li>--bg: #F6F7F9</li>
                                <li>--panel: #FFFFFF</li>
                                <li>--surface: #FFFFFF</li>
                                <li>--surface-alt: #F2F4F7</li>
                            </ul>
                        </div>
                        <div>
                            <div className="font-medium mb-2" style={{ color: 'var(--text, #101828)' }}>Text</div>
                            <ul className="space-y-1" style={{ color: 'var(--text-muted, #475467)' }}>
                                <li>--text: #101828</li>
                                <li>--text-muted: #475467</li>
                                <li>--text-subtle: #667085</li>
                            </ul>
                        </div>
                        <div>
                            <div className="font-medium mb-2" style={{ color: 'var(--text, #101828)' }}>Borders</div>
                            <ul className="space-y-1" style={{ color: 'var(--text-muted, #475467)' }}>
                                <li>--border: #E4E7EC</li>
                                <li>--border-strong: #D0D5DD</li>
                            </ul>
                        </div>
                        <div>
                            <div className="font-medium mb-2" style={{ color: 'var(--text, #101828)' }}>Shadows</div>
                            <ul className="space-y-1" style={{ color: 'var(--text-muted, #475467)' }}>
                                <li>--shadow-sm: 0 1px 2px rgba(16,24,40,.06)</li>
                                <li>--shadow-md: 0 6px 18px rgba(16,24,40,.12)</li>
                            </ul>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ThemeLab;
