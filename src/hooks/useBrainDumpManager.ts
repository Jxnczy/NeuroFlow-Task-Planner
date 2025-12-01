import { useState, useEffect, useCallback } from 'react';
import { BrainDumpList } from '../types';
import { SupabaseDataService } from '../services/supabaseDataService';
import { generateId } from '../utils/id';

export function useBrainDumpManager(initialLists: BrainDumpList[], userId?: string, supabaseEnabled: boolean = true) {
    const [lists, setLists] = useState<BrainDumpList[]>(initialLists);

    useEffect(() => {
        setLists(initialLists);
    }, [initialLists]);

    const persistNote = useCallback((list: BrainDumpList) => {
        if (!userId || !supabaseEnabled) return;
        void SupabaseDataService.upsertNote(userId, list);
    }, [userId, supabaseEnabled]);

    const addList = () => {
        const newList: BrainDumpList = {
            id: generateId(),
            title: `List ${lists.length + 1}`,
            content: '',
            lastEdited: Date.now()
        };
        setLists(prev => [...prev, newList]);
        persistNote(newList);
    };

    const updateList = (id: string, content: string) => {
        setLists(prev => {
            const updated = prev.map(l => l.id === id ? { ...l, content, lastEdited: Date.now() } : l);
            const current = updated.find(l => l.id === id);
            if (current) persistNote(current);
            return updated;
        });
    };

    const updateTitle = (id: string, title: string) => {
        setLists(prev => {
            const updated = prev.map(l => l.id === id ? { ...l, title, lastEdited: Date.now() } : l);
            const current = updated.find(l => l.id === id);
            if (current) persistNote(current);
            return updated;
        });
    };

    const deleteList = (id: string) => {
        setLists(prev => prev.filter(l => l.id !== id));
        if (userId && supabaseEnabled) {
            void SupabaseDataService.deleteNote(userId, id);
        }
    };

    return { lists, setLists, addList, updateList, updateTitle, deleteList };
}
