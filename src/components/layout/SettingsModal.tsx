import React from 'react';
import { X, Cog, Download, Upload, Trash2, ChevronRight, AlertTriangle, Palette, Check, Sparkles } from 'lucide-react';
import { themes } from '../../themes';

interface SettingsModalProps {
    onClose: () => void;
    onExport: () => void;
    onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onDeleteAllTasks?: () => void;
    currentThemeId: string;
    onThemeChange: (themeId: string) => void;
    onResetProgress?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    onClose,
    onExport,
    onImport,
    onDeleteAllTasks,
    currentThemeId,
    onThemeChange,
    onResetProgress
}) => {
    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-200 p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 pb-4 flex items-center justify-between">
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
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--text-muted)';
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 pb-6 space-y-6">
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


                            {onResetProgress && (
                                <button
                                    onClick={onResetProgress}
                                    className="col-span-2 flex items-center justify-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] group"
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.02)',
                                        borderColor: 'var(--border-light)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                        e.currentTarget.style.borderColor = 'var(--text-muted)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
                                        e.currentTarget.style.borderColor = 'var(--border-light)';
                                    }}
                                >
                                    <div className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                                        Reset Progress Bars (Debug)
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Danger Zone */}
                    {onDeleteAllTasks && (
                        <div>
                            <h3
                                className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2"
                                style={{ color: 'var(--error)' }}
                            >
                                <AlertTriangle size={12} />
                                Danger Zone
                            </h3>
                            <button
                                onClick={onDeleteAllTasks}
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
                                            Delete All Tasks
                                        </div>
                                        <div className="text-[10px]" style={{ color: 'var(--error)' }}>
                                            This action cannot be undone.
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-rose-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    )}
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
            </div>
        </div >
    );
};
