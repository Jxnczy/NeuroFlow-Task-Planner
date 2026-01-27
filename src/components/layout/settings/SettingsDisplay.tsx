import React from 'react';
import { Moon } from 'lucide-react';
import { SettingsSection } from './SettingsSection';

interface SettingsDisplayProps {
    dayBoundary: number;
    onDayBoundaryChange: (hour: number) => void;
}

export const SettingsDisplay: React.FC<SettingsDisplayProps> = ({
    dayBoundary,
    onDayBoundaryChange
}) => {
    return (
        <SettingsSection title="Night Owl Mode" icon={Moon} defaultOpen={false}>
            <p className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>
                Shift your day's start time. Tasks done before this time count as "yesterday".
            </p>

            <div className="space-y-3">
                {/* Toggle */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Enable Night Owl Mode</span>
                    <button
                        onClick={() => onDayBoundaryChange(dayBoundary === 0 ? 4 : 0)} // Toggle between 0 (off) and 4am (default)
                        className={`w-11 h-6 rounded-full transition-colors relative ${dayBoundary !== 0 ? 'bg-indigo-500' : 'bg-zinc-600'}`}
                    >
                        <div
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${dayBoundary !== 0 ? 'left-6' : 'left-1'}`}
                        />
                    </button>
                </div>

                {/* Collapsible Selector */}
                {dayBoundary !== 0 && (
                    <div className="pt-2 flex items-center justify-between animate-in slide-in-from-top-2 fade-in duration-200">
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Day ends at</span>
                        <div className="flex items-center gap-1">
                            {[3, 4, 5, 6, 7].map((hour) => (
                                <button
                                    key={hour}
                                    onClick={() => onDayBoundaryChange(hour)}
                                    className="w-9 h-8 rounded-lg text-xs font-bold transition-all"
                                    style={{
                                        backgroundColor: dayBoundary === hour ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                        color: dayBoundary === hour ? 'white' : 'var(--text-muted)'
                                    }}
                                >
                                    {hour}am
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </SettingsSection>
    );
};
