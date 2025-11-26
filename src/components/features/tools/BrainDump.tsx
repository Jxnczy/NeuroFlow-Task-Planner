import React, { useState } from 'react';
import { Save, Plus, Trash2, MoreVertical, Edit2 } from 'lucide-react';
import { BrainDumpList } from '../../../types';

interface BrainDumpProps {
    lists: BrainDumpList[];
    onUpdateList: (id: string, content: string) => void;
    onAddList: () => void;
    onDeleteList: (id: string) => void;
    onUpdateTitle: (id: string, title: string) => void;
}

export const BrainDump: React.FC<BrainDumpProps> = ({ lists, onUpdateList, onAddList, onDeleteList, onUpdateTitle }) => {
    const [editingTitleId, setEditingTitleId] = useState<string | null>(null);

    return (
        <div className="h-full p-8 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white mb-1">Brain Dump</h2>
                    <p className="text-sm text-slate-500">Unload your thoughts. Multiple lists supported.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                        <Save size={12} />
                        <span>Auto-saved</span>
                    </div>
                    <button
                        onClick={onAddList}
                        className="flex items-center gap-2 px-4 py-2 border rounded-xl transition-all font-bold text-sm"
                        style={{
                            backgroundColor: 'var(--accent-muted)',
                            color: 'var(--accent)',
                            borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--accent) 30%, transparent)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--accent-muted)';
                        }}
                    >
                        <Plus size={16} />
                        Add List
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                <div className="flex gap-6 h-full min-w-max px-1">
                    {lists.map(list => (
                        <div key={list.id} className="w-[30vw] min-w-[350px] h-full flex flex-col group relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent rounded-3xl pointer-events-none border border-white/[0.05]"></div>

                            {/* List Header */}
                            <div className="relative z-10 flex items-center justify-between p-4 border-b border-white/[0.05] bg-slate-900/40 rounded-t-3xl backdrop-blur-md">
                                {editingTitleId === list.id ? (
                                    <input
                                        autoFocus
                                        type="text"
                                        value={list.title}
                                        onChange={(e) => onUpdateTitle(list.id, e.target.value)}
                                        onBlur={() => setEditingTitleId(null)}
                                        onKeyDown={(e) => e.key === 'Enter' && setEditingTitleId(null)}
                                        className="bg-transparent font-bold outline-none border-b w-full"
                                        style={{ color: 'var(--text-primary)', borderColor: 'var(--accent)' }}
                                    />
                                ) : (
                                    <h3
                                        className="font-bold text-slate-200 cursor-pointer hover:text-white transition-colors flex items-center gap-2"
                                        onClick={() => setEditingTitleId(list.id)}
                                    >
                                        {list.title}
                                        <Edit2 size={12} className="opacity-0 group-hover:opacity-50" />
                                    </h3>
                                )}

                                <button
                                    onClick={() => {
                                        if (confirm('Delete this list?')) onDeleteList(list.id);
                                    }}
                                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {/* List Content */}
                            <textarea
                                value={list.content}
                                onChange={(e) => onUpdateList(list.id, e.target.value)}
                                placeholder="Type anything..."
                                className="flex-1 w-full bg-slate-900/40 backdrop-blur-md rounded-b-3xl p-6 text-slate-300 text-base leading-relaxed resize-none focus:outline-none focus:bg-slate-900/60 transition-colors placeholder:text-slate-600 font-sans border-0"
                                spellCheck={false}
                            />
                        </div>
                    ))}

                    {/* Add List Placeholder */}
                    <button
                        onClick={onAddList}
                        className="w-[100px] h-full rounded-3xl border-2 border-dashed border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.02] flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-slate-300 transition-all group"
                    >
                        <div className="p-3 rounded-full bg-white/[0.05] group-hover:bg-white/[0.1] transition-colors">
                            <Plus size={24} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">New List</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
