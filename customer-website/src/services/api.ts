import axios from 'axios';
import type { CreateOrderPayload, OrderResponse, CreateEnquiryPayload } from '../types';

const rawUrl = import.meta.env.VITE_API_URL;
if (!rawUrl && import.meta.env.PROD) {
  throw new Error('VITE_API_URL must be set in production. Check your Vercel environment variables.');
}
export const API_URL = rawUrl ?? 'http://localhost:3000/api/v1';

export const apiClient = axios.create({ baseURL: API_URL });

export interface PaginatedResponse<T> {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface Envelope<T> {
  success: true;
  data: T;
}

async function get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await apiClient.get<Envelope<T>>(path, { params });
  return data.data;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const { data } = await apiClient.post<Envelope<T>>(path, body);
  return data.data;
}

// ── Backend entity shapes ─────────────────────────────────────────────────────

export interface ApiProductImage {
  id: string;
  url: string;
  webpUrl?: string;
  avifUrl?: string;
  thumbUrl?: string;
  angle: string;
  altText?: string;
  isPrimary: boolean;
}

export interface ApiProductVariant {
  id: string;
  color: string;
  colorHex?: string;
  stock: number;
  availability: string;
  images: ApiProductImage[];
}

export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: string;
  originalPrice?: string;
  status: string;
  stock: number;
  gender?: string;
  material?: string;
  frameShape?: string;
  frameWidth?: number;
  lensWidth?: number;
  bridgeWidth?: number;
  templeLength?: number;
  weight?: number;
  warranty?: string;
  isNew: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
  brand?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
  variants: ApiProductVariant[];
  images: ApiProductImage[];
}

export interface ApiBrand {
  id: string;
  name: string;
  logoUrl?: string;
  country?: string;
  description?: string;
  website?: string;
}

export interface ApiOffer {
  id: string;
  title: string;
  description?: string;
  discountType: string;
  discountValue: string;
  couponCode?: string;
  bannerUrl?: string;
  validUntil: string;
}

export interface ApiBlog {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  category?: string;
  publishedAt?: string;
  readTime?: number;
}

// ── Product API ───────────────────────────────────────────────────────────────

export const fetchProducts = (params?: {
  page?: number; limit?: number; search?: string;
  brandId?: string; categoryId?: string; ids?: string[];
  isFeatured?: boolean; isNew?: boolean; isBestseller?: boolean;
}) => get<PaginatedResponse<ApiProduct>>('/products', {
  ...params,
  // Backend takes a comma-separated string, not a repeated query param —
  // join here so axios doesn't serialize the array as ids[]=a&ids[]=b.
  ids: params?.ids?.length ? params.ids.join(',') : undefined,
});

export const fetchProductBySlug = (slug: string) => get<ApiProduct>(`/products/${slug}`);

// ── Other public APIs ─────────────────────────────────────────────────────────

export const fetchBrands       = () => get<ApiBrand[]>('/brands');
export const fetchOffers       = () => get<ApiOffer[]>('/offers');
export const fetchBlogs        = (params?: { page?: number; limit?: number }) =>
  get<PaginatedResponse<ApiBlog>>('/blogs', params);
export const fetchBlogBySlug   = (slug: string) => get<ApiBlog>(`/blogs/${slug}`);
export const fetchTestimonials = () =>
  get<{ id: string; customerName: string; rating: number; review: string }[]>('/testimonials');
export const fetchGallery      = (category?: string) =>
  get<{ id: string; url: string; type: 'image' | 'video'; category: string; altText?: string }[]>('/gallery', { category });
export const fetchStoreSettings = () => get<{ store?: Record<string, string> }>('/settings');

export interface ApiFaq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
}
// Public endpoint already returns only isPublished:true, pre-sorted by
// sortOrder — see backend faqs.service.ts. No client-side sorting needed.
export const fetchFaqs = () => get<ApiFaq[]>('/faqs');

export interface OpticalCatalogueResponse {
  lenses: any[];
  addOns: any[];
  categories: any[];
}
export const fetchOpticalCatalogue = () => get<OpticalCatalogueResponse>('/optical-engine/catalogue');

export interface CalculatePricingPayload {
  productId?: string;
  variantId?: string;
  lensTypeId?: string;
  addOnIds?: string[];
}

export const calculatePricing = (payload: CalculatePricingPayload) => post<any>('/pricing/calculate', payload);

export interface ConsultationPolicy {
  consultationFee: number;
  currency: string;
  isRefundable: boolean;
  isAdjustableAgainstFinalBill: boolean;
  description: string;
}

export const fetchConsultationPolicy = () => get<ConsultationPolicy>('/consultation-policy');

// ── Booking (eye-test) ────────────────────────────────────────────────────────

export const submitEyeTestBooking = (body: {
  customerName: string; phone: string; date: string; time: string; concern?: string;
}) => post('/bookings', body);

// ── Contact Enquiry ───────────────────────────────────────────────────────────

export const submitContactEnquiry = (body: CreateEnquiryPayload) => post('/enquiries', body);

// ── Orders ────────────────────────────────────────────────────────────────────

export const placeOrder = (payload: CreateOrderPayload) =>
  post<OrderResponse>('/orders', payload);

export const createConsultation = (payload: CreateOrderPayload) =>
  post<any>('/consultations', payload);

// ── Public file upload (prescription / payment proof) ────────────────────────

export async function uploadPublicFile(
  file: File,
  type: 'prescription' | 'payment-proof',
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  const { data } = await apiClient.post<Envelope<{ url: string }>>(
    '/upload/public',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.data.url;
}
export interface TimelineStep {
  step: string;
  label: string;
  completed: boolean;
  completedAt: string | null;
  note: string | null;
}

export interface ReturnRequest {
  id: string;
  status: 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PICKUP_SCHEDULED' | 'REFUNDED';
  reason: string;
  photoUrls: string[];
  adminNote?: string | null;
  createdAt: string;
}

export interface OrderTrackingResponse {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  productName: string;
  totalAmount: string;
  createdAt: string;
  canCancel: boolean;
  canReturn: boolean;
  steps: TimelineStep[];
  returnRequest: ReturnRequest | null;
}

export async function trackOrder(orderNumber: string, phone: string) {
  return get<OrderTrackingResponse>(`/orders/track/${encodeURIComponent(orderNumber)}`, { phone });
}

export async function cancelOrder(orderId: string, phone: string) {
  return post<{ id: string; status: string }>(`/orders/${orderId}/cancel`, { phone });
}

export async function requestReturn(
  orderId: string,
  phone: string,
  payload: { reason: string; photoUrls?: string[] },
) {
  return post<ReturnRequest>(`/orders/${orderId}/return`, { phone, ...payload });
}
