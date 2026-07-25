import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

/**
 * Reads the store's Settings from the API and applies them globally:
 *   - Brand colors  → CSS variables (--color-primary, --color-accent)
 *   - Store name    → document.title
 *   - Favicon URL   → <link rel="icon">
 *
 * Wrap this around <App /> (inside QueryClientProvider) in main.tsx.
 * It shares the 'store-branding' query key with useStoreBranding() so
 * there is only one network request for both.
 */
export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { data } = useQuery({
    queryKey: ['store-branding'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data?.data ?? {};
    },
    staleTime: 1000 * 60 * 5, // re-fetch every 5 min
    retry: 1,
  });

  useEffect(() => {
    const store = data?.store ?? {};

    // --- Brand colors ---
    if (store.colors?.primary) {
      document.documentElement.style.setProperty('--color-primary', store.colors.primary);
    }
    if (store.colors?.accent) {
      document.documentElement.style.setProperty('--color-accent', store.colors.accent);
    }

    // --- Page title ---
    if (store.storeName) {
      document.title = `${store.storeName} — Admin`;
    }

    // --- Favicon ---
    if (store.faviconUrl) {
      let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = store.faviconUrl;
    }
  }, [data]);

  return <>{children}</>;
}