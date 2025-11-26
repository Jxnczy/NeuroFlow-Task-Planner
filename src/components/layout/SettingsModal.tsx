import React from 'react';
import { X, Cog, ArrowRight, Palette, Check } from 'lucide-react';
import { themes } from '../../themes';

interface SettingsModalProps {
    onClose: () => void;
    onExport: () => void;
    onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
    currentThemeId: string;
    onThemeChange: (themeId: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    onClose, 
    onExport, 
    onImport,
    currentThemeId,
    onThemeChange
}) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div 
                className="backdrop-blur-3xl border rounded-[2rem] p-8 w-[480px] max-h-[85vh] overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,0.5)] relative"
                style={{
                    backgroundColor: 'color-mix(in srgb, var(--bg-secondary) 80%, transparent)',
                    borderColor: 'var(--border-medium)'
                }}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-6 right-6 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                    <X size={24} />
                </button>
                <h2 
                    className="text-2xl font-display font-bold mb-8 drop-shadow-md flex items-center gap-3"
                    style={{ color: 'var(--text-primary)' }}
                >
                    <Cog style={{ color: 'var(--accent)' }} /> Settings
                </h2>

                <div className="space-y-8">
                    {/* Theme Selection */}
                    <div>
                        <h3 
                            className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <Palette size={14} style={{ color: 'var(--accent)' }} />
                            Theme
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {themes.map((theme) => {
                                const isSelected = theme.id === currentThemeId;
                                return (
                                    <button
                                        key={theme.id}
                                        onClick={() => onThemeChange(theme.id)}
                                        className={`
                                            relative text-left p-4 rounded-xl border transition-all duration-200
                                            hover:scale-[1.02] active:scale-[0.98]
                                            ${isSelected ? 'ring-2' : ''}
                                        `}
                                        style={{
                                            backgroundColor: isSelected 
                                                ? 'var(--accent-muted)' 
                                                : 'rgba(255,255,255,0.03)',
                                            borderColor: isSelected 
                                                ? 'var(--accent)' 
                                                : 'var(--border-light)',
                                            ringColor: isSelected ? 'var(--accent)' : 'transparent'
                                        }}
                                    >
                                        {/* Color Preview Swatches */}
                                        <div className="flex gap-1 mb-3">
                                            <div 
                                                className="w-6 h-6 rounded-md border border-white/10"
                                                style={{ backgroundColor: theme.colors.bgPrimary }}
                                            />
                                            <div 
                                                className="w-6 h-6 rounded-md border border-white/10"
                                                style={{ backgroundColor: theme.colors.bgTertiary }}
                                            />
                                            <div 
                                                className="w-6 h-6 rounded-md border border-white/10"
                                                style={{ backgroundColor: theme.colors.accent }}
                                            />
                                            <div 
                                                className="w-6 h-6 rounded-md border border-white/10"
                                                style={{ backgroundColor: theme.colors.textPrimary }}
                                            />
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div 
                                                    className="font-bold text-sm mb-0.5"
                                                    style={{ color: 'var(--text-primary)' }}
                                                >
                                                    {theme.name}
                                                </div>
                                                <div 
                                                    className="text-[10px]"
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    {theme.description}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div 
                                                    className="w-5 h-5 rounded-full flex items-center justify-center"
                                                    style={{ backgroundColor: 'var(--accent)' }}
                                                >
                                                    <Check size={12} className="text-white" />
                                                </div>
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
                            className="text-xs font-bold uppercase tracking-widest mb-3"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            Data Management
                        </h3>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={onExport}
                                className="w-full text-left px-5 py-3 rounded-xl border transition-all hover:scale-[1.01]"
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                    borderColor: 'var(--border-light)',
                                    color: 'var(--text-secondary)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                                    e.currentTarget.style.borderColor = 'var(--accent)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                                    e.currentTarget.style.borderColor = 'var(--border-light)';
                                }}
                            >
                                Export Data (.json)
                            </button>
                            <label 
                                className="w-full text-left px-5 py-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group hover:scale-[1.01]"
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                    borderColor: 'var(--border-light)',
                                    color: 'var(--text-secondary)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                                    e.currentTarget.style.borderColor = 'var(--accent)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                                    e.currentTarget.style.borderColor = 'var(--border-light)';
                                }}
                            >
                                <span>Import Data (.json)</span>
                                <ArrowRight 
                                    size={16} 
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ color: 'var(--accent)' }}
                                />
                                <input type="file" accept=".json" onChange={onImport} className="hidden" />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
