import { useState, useEffect } from 'react';

export function useAppReady(conditions: boolean[]) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (conditions.every(Boolean)) {
            setReady(true);
        }
    }, conditions);

    return ready;
}
