import { useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseAvailable } from '../lib/supabase';

interface UseSupabaseAuthResult {
    user: User | null;
    session: Session | null;
    isAuthReady: boolean;
    authError: string | null;
    magicLinkSent: boolean;
    signInWithEmail: (email: string) => Promise<void>;
    signInWithPassword: (email: string, password: string) => Promise<void>;
    signUpWithPassword: (email: string, password: string) => Promise<{ user: User | null; session: Session | null } | undefined>;
    signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
    signOut: () => Promise<void>;
}

export const useSupabaseAuth = (): UseSupabaseAuthResult => {
    const [session, setSession] = useState<Session | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(!supabaseAvailable);
    const [authError, setAuthError] = useState<string | null>(null);
    const [magicLinkSent, setMagicLinkSent] = useState(false);

    useEffect(() => {
        if (!supabaseAvailable || !supabase) return;
        let isMounted = true;

        // Add timeout to prevent indefinite hanging when Supabase is unreachable
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Auth session fetch timed out')), 5000)
        );

        Promise.race([sessionPromise, timeoutPromise])
            .then(({ data, error }) => {
                if (!isMounted) return;
                if (error) {
                    console.error('Auth session fetch failed', error);
                    setAuthError(error.message);
                }
                setSession(data.session);
                setIsAuthReady(true);
            })
            .catch((error) => {
                if (!isMounted) return;
                console.warn('Auth session timed out:', error.message);
                setAuthError('Connection to Supabase timed out. Sign in or continue without sync.');
                setIsAuthReady(true); // Mark ready so UI can proceed to auth overlay
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
        if (!supabaseAvailable || !supabase) return;
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

    const signInWithPassword = useCallback(async (email: string, password: string) => {
        console.log('Attempting sign in with password...', { email, supabaseAvailable: !!supabase });
        if (!supabaseAvailable || !supabase) {
            console.error('Supabase not available for sign in');
            return;
        }
        setAuthError(null);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setAuthError(error.message);
            console.error('Password sign-in failed', error);
            throw error;
        }
        console.log('Sign in successful');
    }, []);

    const signUpWithPassword = useCallback(async (email: string, password: string) => {
        console.log('Attempting sign up...', { email, supabaseAvailable: !!supabase });
        if (!supabaseAvailable || !supabase) {
            console.error('Supabase not available for sign up');
            return { user: null, session: null };
        }
        setAuthError(null);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        if (error) {
            setAuthError(error.message);
            console.error('Sign-up failed', error);
            throw error;
        }
        console.log('Sign up result:', data);
        return data;
    }, []);

    const signInWithOAuth = useCallback(async (provider: 'google' | 'github') => {
        if (!supabaseAvailable || !supabase) return;
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
        if (!supabaseAvailable || !supabase) return;
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
        signInWithPassword,
        signUpWithPassword,
        signInWithOAuth,
        signOut
    };
};
