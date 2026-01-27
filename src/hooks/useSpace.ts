import { useState, useEffect } from 'react';
import { getSpace, Space } from '../state/space';
import { getSpacesEnabled } from '../state/features';

export function useSpace() {
    const [space, setSpaceState] = useState<Space>(getSpace());
    const [spacesEnabled, setSpacesEnabled] = useState<boolean>(getSpacesEnabled());

    useEffect(() => {
        const handleUpdate = () => {
            setSpaceState(getSpace());
            setSpacesEnabled(getSpacesEnabled());
        };

        window.addEventListener('storage', handleUpdate);
        window.addEventListener('weekflux-space-changed', handleUpdate);

        return () => {
            window.removeEventListener('storage', handleUpdate);
            window.removeEventListener('weekflux-space-changed', handleUpdate);
        };
    }, []);

    return { space, spacesEnabled };
}
