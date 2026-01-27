import { useState, useEffect, useCallback } from 'react';
import { BrainDumpList } from '../types';
import { SupabaseDataService } from '../services/supabaseDataService';
import { generateId } from '../utils/id';
import { useSpace } from './useSpace';

export function useBrainDumpManager(initialLists: BrainDumpList[], userId?: string, supabaseEnabled: boolean = true) {
    const [allLists, setAllLists] = useState<BrainDumpList[]>(initialLists);
    const { space: currentSpace, spacesEnabled } = useSpace();

    useEffect(() => {
        setAllLists(initialLists);
    }, [initialLists]);

    // Visibility-based refresh for multi-device sync
    const fetchRemoteNotes = useCallback(async () => {
        if (!userId || !supabaseEnabled) return;
        try {
            const remote = await SupabaseDataService.fetchNotes(userId);
            if (remote.length) {
                setAllLists(remote);
            }
        } catch (error) {
            console.error('Failed to refresh notes from Supabase', error);
        }
    }, [userId, supabaseEnabled]);

    useEffect(() => {
        if (!userId || !supabaseEnabled) return;

        /*
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                void fetchRemoteNotes();
            }
        };
        window.addEventListener('visibilitychange', handleVisibility);
        */

        // Periodic polling for sync (every 60 seconds)
        const interval = window.setInterval(() => {
            void fetchRemoteNotes();
        }, 60000);

        return () => {
            // window.removeEventListener('visibilitychange', handleVisibility);
            window.clearInterval(interval);
        };
    }, [userId, supabaseEnabled, fetchRemoteNotes]);

    const persistNote = useCallback((list: BrainDumpList) => {
        if (!userId || !supabaseEnabled) return;
        void SupabaseDataService.upsertNote(userId, list);
    }, [userId, supabaseEnabled]);

    const addList = () => {
        const space = spacesEnabled ? currentSpace : 'private';

        const newList: BrainDumpList = {
            id: generateId(),
            title: `List ${allLists.length + 1}`,
            content: '',
            lastEdited: Date.now(),
            space
        };
        setAllLists(prev => [...prev, newList]);
        persistNote(newList);
    };

    const updateList = (id: string, content: string) => {
        setAllLists(prev => {
            const updated = prev.map(l => l.id === id ? { ...l, content, lastEdited: Date.now() } : l);
            const current = updated.find(l => l.id === id);
            if (current) persistNote(current);
            return updated;
        });
    };

    const updateTitle = (id: string, title: string) => {
        setAllLists(prev => {
            const updated = prev.map(l => l.id === id ? { ...l, title, lastEdited: Date.now() } : l);
            const current = updated.find(l => l.id === id);
            if (current) persistNote(current);
            return updated;
        });
    };

    const deleteList = (id: string) => {
        setAllLists(prev => prev.filter(l => l.id !== id));
        if (userId && supabaseEnabled) {
            void SupabaseDataService.deleteNote(userId, id);
        }
    };

    const clearLists = () => {
        setAllLists([]);
        if (userId && supabaseEnabled) {
            void SupabaseDataService.replaceNotes(userId, []);
        }
    };

    // Derived state
    const lists = allLists.filter(l => {
        if (!spacesEnabled) return !l.space || l.space === 'private';
        return (l.space || 'private') === currentSpace;
    });

    return { lists, allLists, setLists: setAllLists, addList, updateList, updateTitle, deleteList, clearLists };
}

