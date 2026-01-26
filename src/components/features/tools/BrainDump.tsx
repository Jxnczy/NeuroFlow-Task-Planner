import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Plus, Trash2, MoreVertical, Edit2 } from 'lucide-react';
import { BrainDumpList } from '../../../types';
import { slideIn } from '../../../utils/animations';

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
        <div className="h-full flex flex-col overflow-hidden relative pt-5 max-w-7xl mx-auto w-full">
            <div className="mb-6 flex-shrink-0 px-4 sm:px-6 text-center">
                <h2 className="text-3xl font-display font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Brain Dump</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Unload your thoughts. Multiple lists supported.</p>
            </div>

            <div className="flex-1 overflow-y-auto pb-4 px-4 sm:px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
                    <AnimatePresence mode="popLayout">
                        {lists.map(list => (
                            <motion.div
                                key={list.id}
                                variants={slideIn}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                layout
                                className="min-h-[400px] flex flex-col group relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent rounded-3xl pointer-events-none border border-white/[0.05]"></div>

                                {/* List Header */}
                                <div
                                    className="relative z-10 flex items-center justify-between p-4 border-b border-white/[0.05] rounded-t-3xl backdrop-blur-md transition-colors"
                                    style={{ backgroundColor: 'color-mix(in srgb, var(--bg-tertiary) 60%, transparent)' }}
                                >
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
                                            className="font-bold cursor-pointer hover:text-white transition-colors flex items-center gap-2"
                                            style={{ color: 'var(--text-primary)' }}
                                            onClick={() => setEditingTitleId(list.id)}
                                        >
                                            {list.title}
                                            <Edit2 size={12} className=" opacity-0 group-hover:opacity-50" />
                                        </h3>
                                    )}

                                    <button
                                        onClick={() => {
                                            if (confirm('Delete this list?')) onDeleteList(list.id);
                                        }}
                                        className="p-2 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        style={{ color: 'var(--text-muted)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#fb7185'} // rose-400
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                {/* List Content */}
                                <textarea
                                    value={list.content}
                                    onChange={(e) => onUpdateList(list.id, e.target.value)}
                                    placeholder="Type anything..."
                                    className="flex-1 w-full backdrop-blur-md rounded-b-3xl p-6 text-base leading-relaxed resize-none focus:outline-none transition-colors font-sans border-0 text-theme-primary placeholder:text-zinc-600"
                                    style={{
                                        backgroundColor: 'color-mix(in srgb, var(--bg-tertiary) 40%, transparent)'
                                    }}
                                    onFocus={(e) => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--bg-tertiary) 60%, transparent)'}
                                    onBlur={(e) => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--bg-tertiary) 40%, transparent)'}
                                    spellCheck={false}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Add List Placeholder */}
                    <button
                        onClick={onAddList}
                        className="min-h-[400px] rounded-3xl border-2 border-dashed border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.02] flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 transition-all group"
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
