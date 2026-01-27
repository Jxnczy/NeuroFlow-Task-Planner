import React from 'react';
import { Palette, Eye, EyeOff } from 'lucide-react';
import { themes } from '../../../themes';
import { SettingsSection } from './SettingsSection';

interface SettingsAppearanceProps {
    currentThemeId: string;
    onThemeChange: (themeId: string) => void;
    viewMode?: 'show' | 'fade' | 'hide';
    onViewModeChange?: (mode: 'show' | 'fade' | 'hide') => void;
}

export const SettingsAppearance: React.FC<SettingsAppearanceProps> = ({
    currentThemeId,
    onThemeChange,
    viewMode = 'fade',
    onViewModeChange
}) => {
    return (
        <SettingsSection title="Appearance" icon={Palette} defaultOpen={false}>
            <div className="grid grid-cols-2 gap-3">
                {themes.map((theme) => {
                    const isSelected = theme.id === currentThemeId;
                    return (
                        <button
                            key={theme.id}
                            onClick={() => onThemeChange(theme.id)}
                            className="relative p-3 rounded-xl border transition-all hover:scale-[1.02] flex items-center justify-between group"
                            style={{
                                backgroundColor: isSelected ? 'var(--accent-muted)' : 'transparent',
                                borderColor: isSelected ? 'var(--accent)' : 'var(--border-light)'
                            }}
                        >
                            <span className="text-xs font-medium" style={{ color: isSelected ? 'var(--accent)' : 'var(--text-secondary)' }}>
                                {theme.name}
                            </span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: theme.colors.bgPrimary, border: '1px solid rgba(0,0,0,0.1)' }} />
                                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: theme.colors.accent }} />
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Completed Tasks Toggle */}
            {onViewModeChange && (
                <div className="flex items-center justify-between pt-3 mt-3" style={{ borderTop: '1px solid var(--border-light)' }}>
                    <div className="flex items-center gap-2">
                        {viewMode === 'hide' ? <EyeOff size={14} style={{ color: 'var(--text-muted)' }} /> : <Eye size={14} style={{ color: 'var(--text-muted)' }} />}
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Completed tasks</span>
                    </div>
                    <div className="flex gap-1">
                        {(['show', 'fade', 'hide'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => onViewModeChange(mode)}
                                className="px-2.5 py-1 rounded-md text-[10px] font-semibold capitalize transition-all"
                                style={{
                                    backgroundColor: viewMode === mode ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                    color: viewMode === mode ? 'white' : 'var(--text-muted)'
                                }}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {/* Day View Mode removed as requested */}
        </SettingsSection>
    );
};
