import { getSpacesEnabled } from './features';

export type Space = 'private' | 'work';

export const SPACE_KEY = 'weekflux:space';

export const getSpace = (): Space => {
    try {
        // If feature is disabled, ALWAYS return 'private'
        if (!getSpacesEnabled()) {
            return 'private';
        }
        const val = localStorage.getItem(SPACE_KEY);
        if (val === 'work') return 'work';
        return 'private';
    } catch {
        return 'private';
    }
};

export const setSpace = (space: Space): void => {
    try {
        localStorage.setItem(SPACE_KEY, space);
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('weekflux-space-changed'));
    } catch (e) {
        console.error('Failed to set space', e);
    }
};
