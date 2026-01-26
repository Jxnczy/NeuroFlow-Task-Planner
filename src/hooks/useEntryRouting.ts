import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';

// Persistence key for onboarding status
const ONBOARDING_SEEN_KEY = 'neuroflow_onboarding_seen_v1';

export type EntryRoute = 'loading' | 'feature-overview' | 'login' | 'unlock' | 'app';

interface UseEntryRoutingProps {
    isAuthReady: boolean;
    user: User | null;
    isVaultSetup: boolean;
    isUnlocked: boolean;
    isReturningUser?: boolean; // From local DB check
    syncEnabled?: boolean; // Whether user wants to sync
}

export function useEntryRouting({
    isAuthReady,
    user,
    isVaultSetup,
    isUnlocked,
    isReturningUser = false,
    syncEnabled = true
}: UseEntryRoutingProps) {
    // Local state for the onboarding flag
    const [hasSeenFeatureOverview, setHasSeenFeatureOverview] = useState(() => {
        // If they are a known returning user (DB flag), assume they've seen it to prevent regression
        if (isReturningUser) return true;
        try {
            return localStorage.getItem(ONBOARDING_SEEN_KEY) === '1';
        } catch {
            return false;
        }
    });

    const [currentRoute, setCurrentRoute] = useState<EntryRoute>('loading');

    // The State Machine
    useEffect(() => {
        // Priority 0: Loading
        // We need auth to be ready to make any decision.
        if (!isAuthReady) {
            setCurrentRoute('loading');
            return;
        }

        // Priority 1: Unauthenticated Flow
        if (!user) {
            // New user = Feature Overview
            if (!hasSeenFeatureOverview) {
                setCurrentRoute('feature-overview');
                return;
            }

            // If sync is explicitly disabled (Continue as Guest), go to app
            if (syncEnabled === false) {
                setCurrentRoute('app');
                return;
            }

            // Otherwise, show login
            setCurrentRoute('login');
            return;
        }

        // Priority 2: Authenticated Flow
        // Authentication is valid, now check encryption
        if (isVaultSetup && !isUnlocked) {
            setCurrentRoute('unlock');
        } else {
            setCurrentRoute('app');
        }
    }, [isAuthReady, user, hasSeenFeatureOverview, isVaultSetup, isUnlocked, syncEnabled]);

    // Action to transition state when user completes onboarding
    const markFeatureOverviewSeen = () => {
        try {
            localStorage.setItem(ONBOARDING_SEEN_KEY, '1');
            setHasSeenFeatureOverview(true);
        } catch (e) {
            console.error('Failed to save onboarding state', e);
        }
    };

    return {
        currentRoute,
        markFeatureOverviewSeen
    };
}
