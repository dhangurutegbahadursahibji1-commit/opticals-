import productsData from '../data/products/frames.json';
import brandsData from '../data/brands.json';
import lensesData from '../data/lenses.json';
import offersData from '../data/offers.json';
import galleryData from '../data/gallery.json';
import reviewsData from '../data/reviews.json';
import settingsData from '../data/settings.json';
import blogsData from '../data/blogs.json';
import type {
  Product,
  Brand,
  LensInfo,
  Offer,
  GalleryImage,
  Testimonial,
  Settings,
  BlogPost,
} from '../types';

// Single data-access layer. Swapping these for real API calls later (v2 — see FUTURE.md)
// should not require touching any component.
export const getProducts = (): Product[] => productsData as Product[];

export const getProductBySlug = (slug: string): Product | undefined =>
  (productsData as Product[]).find((p) => p.slug === slug);

export const getProductById = (id: string): Product | undefined =>
  (productsData as Product[]).find((p) => p.id === id);

export const getRelatedProducts = (product: Product, limit = 4): Product[] =>
  (productsData as Product[])
    .filter((p) => p.id !== product.id && (p.category === product.category || p.brand === product.brand))
    .slice(0, limit);

export const getFrequentlyBoughtWith = (product: Product): Product[] =>
  product.frequentlyBoughtWith
    .map((id) => getProductById(id))
    .filter((p): p is Product => Boolean(p));

export const getBrands = (): Brand[] => brandsData as Brand[];
export const getBrandByName = (name: string): Brand | undefined =>
  (brandsData as Brand[]).find((b) => b.name === name);

export const getLenses = (): LensInfo[] => lensesData as LensInfo[];
export const getOffers = (): Offer[] => offersData as Offer[];
export const getGallery = (): GalleryImage[] => galleryData as GalleryImage[];
export const getReviews = (): Testimonial[] => reviewsData as Testimonial[];
// Settings is special: it starts from the local JSON placeholder but is
// overwritten with live data from GET /settings as soon as the app boots
// (see hooks/useStoreSettings.ts). Every caller of getSettings() — including
// ones outside React, like buildTitle() — benefits without needing to know
// about the fetch. Nothing here should ever be a real store's hardcoded data.
let liveSettings: Settings | null = null;
export const getSettings = (): Settings => liveSettings ?? (settingsData as Settings);
export const setLiveSettings = (s: Settings): void => {
  liveSettings = s;
};
export const getBlogs = (): BlogPost[] => blogsData as BlogPost[];
export const getBlogBySlug = (slug: string): BlogPost | undefined =>
  (blogsData as BlogPost[]).find((b) => b.slug === slug);
