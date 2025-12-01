import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cog, Download, Upload, Trash2, ChevronRight, AlertTriangle, Palette, Check, Sparkles, CloudOff, Cloud } from 'lucide-react';
import { themes } from '../../themes';
import { modal, backdrop } from '../../utils/animations';
import { FrostOverlay } from '../ui/FrostOverlay';
import { useIceSound } from '../../hooks/useIceSound';

interface SettingsModalProps {
    onClose: () => void;
    onExport: () => void;
    onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onDeleteAllTasks?: () => void;
    onFreezeOverloaded?: () => void;
    onClearRescheduled?: () => void;
    currentThemeId: string;
    onThemeChange: (themeId: string) => void;
    viewMode?: 'show' | 'fade' | 'hide';
    onViewModeChange?: (mode: 'show' | 'fade' | 'hide') => void;
    supabaseEnabled: boolean;
    onToggleSupabase: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    onClose,
    onExport,
    onImport,
    onDeleteAllTasks,
    onFreezeOverloaded,
    onClearRescheduled,
    currentThemeId,
    onThemeChange,
    viewMode = 'fade',
    onViewModeChange,
    supabaseEnabled,
    onToggleSupabase
}) => {
    const [freezing, setFreezing] = useState(false);
    const { play } = useIceSound();

    const handleDoomLoop = () => {
        if (!onFreezeOverloaded) return;
        const confirmed = window.confirm('Freeze everything and start fresh? This will move tasks to the Icebox.');
        if (!confirmed) return;

        play();
        setFreezing(true);
        setTimeout(() => {
            onFreezeOverloaded();
        }, 500);
        setTimeout(() => {
            setFreezing(false);
        }, 1500);
    };

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    variants={modal}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="relative w-full h-[95vh] md:h-auto max-w-none md:max-w-md rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-medium)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 pb-4 flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <button
                            onClick={onClose}
                            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 bg-white/[0.06] text-white font-bold"
                            aria-label="Close settings"
                        >
                            Done
                        </button>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: 'var(--accent-muted)' }}
                            >
                                <Cog size={22} style={{ color: 'var(--accent)' }} />
                            </div>
                            <h2 className="text-xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
                                System Settings
                            </h2>
                        </div>

                        {/* Close Button - Large clickable area */}
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                            style={{
                                color: 'var(--text-muted)',
                                backgroundColor: 'transparent'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="px-6 pb-6 space-y-6 overflow-y-auto h-[calc(95vh-80px)] md:h-auto">
                        {/* Theme Selection */}
                        <div>
                            <h3
                                className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                <Palette size={12} />
                                Appearance
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {themes.map((theme) => {
                                    const isSelected = theme.id === currentThemeId;
                                    return (
                                        <button
                                            key={theme.id}
                                            onClick={() => onThemeChange(theme.id)}
                                            className="relative text-left p-3 rounded-xl border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                            style={{
                                                backgroundColor: isSelected
                                                    ? 'var(--accent-muted)'
                                                    : 'rgba(255,255,255,0.02)',
                                                borderColor: isSelected
                                                    ? 'var(--accent)'
                                                    : 'var(--border-light)'
                                            }}
                                        >
                                            {/* Color Preview */}
                                            <div className="flex gap-1 mb-2">
                                                <div
                                                    className="w-4 h-4 rounded-md"
                                                    style={{ backgroundColor: theme.colors.bgPrimary, border: '1px solid rgba(255,255,255,0.1)' }}
                                                />
                                                <div
                                                    className="w-4 h-4 rounded-md"
                                                    style={{ backgroundColor: theme.colors.accent }}
                                                />
                                                <div
                                                    className="w-4 h-4 rounded-md"
                                                    style={{ backgroundColor: theme.colors.textPrimary }}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span
                                                    className="text-xs font-semibold"
                                                    style={{ color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}
                                                >
                                                    {theme.name}
                                                </span>
                                                {isSelected && (
                                                    <Check size={14} style={{ color: 'var(--accent)' }} />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* View Mode Selection */}
                        {onViewModeChange && (
                            <div>
                                <h3
                                    className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    <Check size={12} />
                                    Completed Tasks
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['show', 'fade', 'hide'] as const).map((mode) => {
                                        const isSelected = viewMode === mode;
                                        return (
                                            <button
                                                key={mode}
                                                onClick={() => onViewModeChange(mode)}
                                                className="relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                                style={{
                                                    backgroundColor: isSelected
                                                        ? 'var(--accent-muted)'
                                                        : 'rgba(255,255,255,0.02)',
                                                    borderColor: isSelected
                                                        ? 'var(--accent)'
                                                        : 'var(--border-light)'
                                                }}
                                            >
                                                <span
                                                    className="text-xs font-bold capitalize"
                                                    style={{ color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}
                                                >
                                                    {mode}
                                                </span>
                                                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                                    {mode === 'show' ? 'Visible' : mode === 'fade' ? 'Dimmed' : 'Hidden'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Data Management */}
                        <div>
                            <h3
                                className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                Data Management
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={onExport}
                                    className="flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.02)',
                                        borderColor: 'var(--border-light)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'var(--accent-muted)';
                                        e.currentTarget.style.borderColor = 'var(--accent)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
                                        e.currentTarget.style.borderColor = 'var(--border-light)';
                                    }}
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
                                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                                    >
                                        <Sparkles size={22} style={{ color: 'var(--accent)' }} />
                                    </div>
                                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        Export Backup
                                    </span>
                                </button>

                                <label
                                    className="flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.02)',
                                        borderColor: 'var(--border-light)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'var(--accent-muted)';
                                        e.currentTarget.style.borderColor = 'var(--accent)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
                                        e.currentTarget.style.borderColor = 'var(--border-light)';
                                    }}
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                                    >
                                        <Upload size={22} style={{ color: 'var(--accent)' }} />
                                    </div>
                                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        Import Data
                                    </span>
                                    <input type="file" accept=".json" onChange={onImport} className="hidden" />
                                </label>
                            </div>
                        </div>

                        {/* Sync Preference */}
                        <div>
                            <h3
                                className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                <Sparkles size={12} />
                                Sync Mode
                            </h3>
                            <button
                                onClick={() => onToggleSupabase(!supabaseEnabled)}
                                className="w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] group"
                                style={{
                                    backgroundColor: supabaseEnabled ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.05)',
                                    borderColor: supabaseEnabled ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.2)'
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                                        style={{ backgroundColor: supabaseEnabled ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)' }}>
                                        {supabaseEnabled ? <Cloud size={18} className="text-emerald-400" /> : <CloudOff size={18} className="text-rose-400" />}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            {supabaseEnabled ? 'Supabase sync ON' : 'Local-only mode'}
                                        </div>
                                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                            Local backup always saved. Turn off cloud if you prefer offline.
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={18} className={supabaseEnabled ? 'text-emerald-400' : 'text-rose-400'} />
                            </button>
                        </div>

                        {/* Danger Zone */}
                        <div>
                            <h3
                                className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2"
                                style={{ color: 'var(--error)' }}
                            >
                                <AlertTriangle size={12} />
                                Danger Zone
                            </h3>
                            <div className="space-y-3">
                                {/* Reset Schedule Button */}
                                {onClearRescheduled && (
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Are you sure you want to clear all rescheduled tasks? This cannot be undone.')) {
                                                onClearRescheduled();
                                            }
                                        }}
                                        className="w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] group"
                                        style={{
                                            backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                            borderColor: 'rgba(239, 68, 68, 0.2)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
                                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                                <Trash2 size={18} className="text-rose-400" />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                    Reset Schedule
                                                </div>
                                                <div className="text-[10px]" style={{ color: 'var(--error)' }}>
                                                    Clears all "rescheduled" ghost trails.
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-rose-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                )}

                                {/* Delete All Tasks Button */}
                                {onDeleteAllTasks && (
                                    <button
                                        onClick={handleDoomLoop}
                                        className="w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] group"
                                        style={{
                                            backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                            borderColor: 'rgba(239, 68, 68, 0.2)'
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                                <Trash2 size={18} className="text-rose-400" />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                    Doom Loop Breaker
                                                </div>
                                                <div className="text-[10px]" style={{ color: 'var(--error)' }}>
                                                    Freezes and clears all tasks.
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-rose-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        className="px-6 py-4 text-center border-t"
                        style={{ borderColor: 'var(--border-light)' }}
                    >
                        <span className="text-[10px] font-medium tracking-wider" style={{ color: 'var(--text-muted)' }}>
                            NeuroFlow OS v1.2.0 • Build 2409
                        </span>
                    </div>
                    <FrostOverlay isVisible={freezing} />
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
