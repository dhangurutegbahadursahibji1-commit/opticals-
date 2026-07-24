import { getSettings } from '../services/products';

export interface SEOMeta {
  title: string;
  description: string;
  image?: string;
  url?: string;
}

export function buildTitle(page: string): string {
  return `${page} — ${getSettings().storeName}`;
}
