import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'ao-recently-viewed';
const MAX_ITEMS = 8;

export function useRecentlyViewed() {
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentIds));
  }, [recentIds]);

  const trackView = useCallback((productId: string) => {
    setRecentIds((prev) => [productId, ...prev.filter((id) => id !== productId)].slice(0, MAX_ITEMS));
  }, []);

  return { recentIds, trackView };
}
