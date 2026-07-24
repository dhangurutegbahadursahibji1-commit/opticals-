import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export interface StoreBranding {
  storeName: string;
  logoUrl: string;
}

// Generic, non-store-specific fallback shown before the live settings load
// (or if the settings endpoint is unreachable). Never hardcode a real store
// name here — this is the placeholder every new white-label deployment sees
// until its owner fills in Admin → Settings.
export const DEFAULT_BRANDING: StoreBranding = {
  storeName: 'Admin Dashboard',
  logoUrl: '',
};

async function fetchBranding(): Promise<StoreBranding> {
  const { data } = await api.get('/settings');
  const store = data?.data?.store ?? {};
  return {
    storeName: store.storeName || DEFAULT_BRANDING.storeName,
    logoUrl: store.logoUrl || '',
  };
}

export function useStoreBranding(): StoreBranding {
  const { data } = useQuery({
    queryKey: ['store-branding'],
    queryFn: fetchBranding,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
  return data ?? DEFAULT_BRANDING;
}
