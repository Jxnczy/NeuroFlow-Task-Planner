import React from 'react';
import { AlertTriangle, RotateCcw, BarChart3, Trash2 } from 'lucide-react';
import { SettingsSection } from './SettingsSection';

interface SettingsAdvancedProps {
    onClearRescheduled?: () => void;
    onResetStats?: () => void;
    onDeleteAllTasks?: () => void;
}

export const SettingsAdvanced: React.FC<SettingsAdvancedProps> = ({
    onResetStats,
    onDeleteAllTasks
}) => {
    const handleDeleteAll = () => {
        const input = window.prompt('Type SURE to delete ALL data. This cannot be undone.', '');
        if (input !== 'SURE') {
            if (input !== null) alert('Deletion cancelled. Type SURE (all caps) to confirm.');
            return;
        }
        onDeleteAllTasks?.();
    };

    return (
        <SettingsSection title="Advanced" icon={AlertTriangle} defaultOpen={false} variant="danger">
            <div className="space-y-2">
                {/* Reset Schedule Trails removed as requested */}

                {onResetStats && (
                    <button
                        onClick={() => {
                            if (window.confirm('Reset all progress (completed tasks)? This will un-complete all tasks but NOT delete them.')) {
                                onResetStats();
                            }
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-rose-500/10"
                        style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                        <BarChart3 size={16} className="text-rose-400" />
                        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Reset All Progress (Stats)</span>
                    </button>
                )}

                {onDeleteAllTasks && (
                    <button
                        onClick={handleDeleteAll}
                        className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-rose-500/10"
                        style={{ border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)' }}
                    >
                        <Trash2 size={16} className="text-rose-400" />
                        <span className="text-sm text-rose-300">Delete All Data</span>
                    </button>
                )}
            </div>
        </SettingsSection>
    );
};
