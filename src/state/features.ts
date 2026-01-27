export const SPACED_ENABLED_KEY = 'weekflux:spaces_enabled';

export const getSpacesEnabled = (): boolean => {
    try {
        return localStorage.getItem(SPACED_ENABLED_KEY) === 'true';
    } catch {
        return false;
    }
};

export const setSpacesEnabled = (enabled: boolean): void => {
    try {
        localStorage.setItem(SPACED_ENABLED_KEY, enabled ? 'true' : 'false');
        // Dispatch a storage event so other tabs/components sync up if needed (optional but good practice)
        window.dispatchEvent(new Event('storage'));
    } catch (e) {
        console.error('Failed to set spaces enabled flag', e);
    }
};
