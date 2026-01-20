
import { useEffect } from 'react';

/**
 * Hook to update the document title
 */
export function useAutoTitle(title: string) {
    useEffect(() => {
        const prevTitle = document.title;
        document.title = `${title} | Medev.ai`;
        return () => {
            document.title = prevTitle;
        };
    }, [title]);
}
