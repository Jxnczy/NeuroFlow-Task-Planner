import { useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UseSupabaseAuthResult {
    user: User | null;
    session: Session | null;
    isAuthReady: boolean;
    authError: string | null;
    magicLinkSent: boolean;
    signInWithEmail: (email: string) => Promise<void>;
    signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
    signOut: () => Promise<void>;
}

export const useSupabaseAuth = (): UseSupabaseAuthResult => {
    const [session, setSession] = useState<Session | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [magicLinkSent, setMagicLinkSent] = useState(false);

    useEffect(() => {
        let isMounted = true;
        supabase.auth.getSession().then(({ data, error }) => {
            if (!isMounted) return;
            if (error) {
                console.error('Auth session fetch failed', error);
                setAuthError(error.message);
            }
            setSession(data.session);
            setIsAuthReady(true);
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
            if (!isMounted) return;
            setSession(newSession);
            setIsAuthReady(true);
        });

        return () => {
            isMounted = false;
            listener?.subscription.unsubscribe();
        };
    }, []);

    const signInWithEmail = useCallback(async (email: string) => {
        setAuthError(null);
        setMagicLinkSent(false);
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) {
            setAuthError(error.message);
            console.error('Magic link sign-in failed', error);
        } else {
            setMagicLinkSent(true);
        }
    }, []);

    const signInWithOAuth = useCallback(async (provider: 'google' | 'github') => {
        setAuthError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: window.location.origin }
        });
        if (error) {
            setAuthError(error.message);
            console.error('OAuth sign-in failed', error);
        }
    }, []);

    const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Sign out failed', error);
            setAuthError(error.message);
        }
    }, []);

    return {
        user: session?.user ?? null,
        session,
        isAuthReady,
        authError,
        magicLinkSent,
        signInWithEmail,
        signInWithOAuth,
        signOut
    };
};
