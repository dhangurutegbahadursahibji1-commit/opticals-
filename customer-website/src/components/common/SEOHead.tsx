import { useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';

interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
}

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export default function SEOHead({ title, description, image, url }: SEOHeadProps) {
  const { storeName } = useSettings();
  const fullTitle = storeName ? `${title} — ${storeName}` : title;

  useEffect(() => {
    document.title = fullTitle;
    setMeta('description', description);
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', description, true);
    if (image) setMeta('og:image', image, true);
    if (url) setMeta('og:url', url, true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    if (image) setMeta('twitter:image', image);
  }, [fullTitle, description, image, url]);

  return null;
}