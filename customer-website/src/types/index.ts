// ── Product ──────────────────────────────────────────────────────────────────

export interface ProductImage {
  url: string;
  webp: string;
  avif: string;
  thumbnail: string;
  blurPlaceholder: string;
  angle: 'front' | 'left' | 'right' | '45' | 'folded' | 'on-face' | 'box' | 'accessories';
  alt: string;
}

export interface ProductVariant {
  id: string;
  color: string;
  colorHex: string;
  images: ProductImage[];
  video?: string;
  spin360?: string[];
  availability: 'in-stock' | 'limited-stock' | 'out-of-stock' | 'store-only' | 'pre-order';
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  variants: ProductVariant[];
  defaultVariantId: string;
  category: 'frames' | 'sunglasses' | 'computer' | 'kids' | 'reading';
  gender: 'men' | 'women' | 'unisex' | 'kids';
  material: string;
  frameShape: 'oval' | 'round' | 'square' | 'rectangle' | 'aviator' | 'cat-eye' | 'wayfarer' | 'browline';
  frameWidth: number;
  lensWidth: number;
  bridgeWidth: number;
  templeLength: number;
  weight: number;
  warranty: string;
  suitableFaceShapes: string[];
  recommendedLens: string[];
  frequentlyBoughtWith: string[];
  isNew?: boolean;
  isBestseller?: boolean;
  tags: string[];
  description: string;
  lensSupport?: LensSupport;
}

// ── Face / Try-On ─────────────────────────────────────────────────────────────

export type FaceShape = 'oval' | 'square' | 'round' | 'heart' | 'diamond' | 'rectangle' | 'triangle';

export interface FaceShapeAnalysis {
  faceShape: FaceShape;
  faceWidthMm: number;
  faceHeightMm: number;
  recommendedFrameWidthMm: [number, number];
  recommendedBridgeWidthMm: [number, number];
  recommendedLensShapes: string[];
  recommendedBrands: string[];
  framesToAvoid: string[];
  reason: string;
}

// ── Lens ──────────────────────────────────────────────────────────────────────

export type LensType =
  | 'frame-only'
  | 'single-vision'
  | 'blue-cut'
  | 'progressive'
  | 'photochromic'
  | 'reading'
  | 'computer'
  | 'driving';

export interface LensInfo {
  type: LensType;
  name: string;
  description: string;
  whoFor: string;
}

export interface LensSupport {
  singleVision: boolean;
  progressive: boolean;
  photochromic: boolean;
  blueCut: boolean;
}

export interface LensConfiguration {
  productId: string;
  variantId: string;
  lensTypeId: LensType | null;
  coatingIds: string[];
  prescriptionId?: string; // Stored if backend uploaded
  prescription?: {
    status: 'uploaded' | 'enter_later' | 'pending' | 'manual' | 'plano';
    fileMeta?: { name: string; size: number; type: string };
    manualData?: ManualPrescription;
  };
  expertAssistance?: boolean;
  customerNotes?: string;
}

export interface PriceBreakdown {
  frame: number;
  lens: number;
  coating: number;
  discount: number;
  subtotal: number;
}

// ── Prescription ─────────────────────────────────────────────────────────────

export type PrescriptionMode = 'standard' | 'upload' | 'manual';

export interface PrescriptionUpload {
  fileUrl: string;
  fileType: 'pdf' | 'image';
  fileName: string;
}

export interface ManualPrescription {
  rightEyeSphere: string;
  rightEyeCylinder: string;
  rightEyeAxis: string;
  leftEyeSphere: string;
  leftEyeCylinder: string;
  leftEyeAxis: string;
  pdValue: string;
}

export interface PrescriptionData {
  mode: PrescriptionMode;
  selectedPower?: string;        // for mode = 'standard'
  upload?: PrescriptionUpload;   // for mode = 'upload'
  manual?: ManualPrescription;   // for mode = 'manual'
}

// ── Cart ──────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;            // uuid generated client-side
  product: Product;
  variant: ProductVariant;
  quantity: number;
  configurationSnapshot?: {
    lensConfig: LensConfiguration;
    priceBreakdown: PriceBreakdown;
  };
}

// ── Order ─────────────────────────────────────────────────────────────────────

export interface CreateOrderPayload {
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  fulfilment: 'home-delivery' | 'store-pickup';

  productId?: string;
  productName: string;
  variantColor?: string;
  quantity: number;
  framePrice: number;
  lensType?: string;
  lensPrice: number;
  totalAmount: number;

  // Matches config.prescription.status from LensConfiguration, plus 'upload'
  // as an alias for 'uploaded' — the backend DTO accepts any string here.
  prescriptionMode?: PrescriptionMode | 'uploaded' | 'enter_later' | 'pending' | 'plano';
  selectedPower?: string;
  prescriptionUrl?: string;
  // Numbers: the backend's CreateConsultationDto validates these with
  // @IsNumber(), not strings.
  rightEyeSphere?: number;
  rightEyeCylinder?: number;
  rightEyeAxis?: number;
  leftEyeSphere?: number;
  leftEyeCylinder?: number;
  leftEyeAxis?: number;
  pdValue?: number;

  paymentMethod: 'upi' | 'bank';
  utrNumber?: string;
  paymentProofUrl?: string;
  notes?: string;

  expertAssistance?: boolean;
  customerNotes?: string;
  commercialSnapshot?: unknown;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: string;
  createdAt: string;
}

export interface CreateEnquiryPayload {
  name: string;
  phone: string;
  email?: string;
  message: string;

  productId?: string;
  productName?: string;
  lensType?: string;

  prescriptionMode?: PrescriptionMode;
  selectedPower?: string;
  prescriptionUrl?: string;
  rightEyeSphere?: string;
  rightEyeCylinder?: string;
  rightEyeAxis?: string;
  leftEyeSphere?: string;
  leftEyeCylinder?: string;
  leftEyeAxis?: string;
  pdValue?: string;
}

// ── Other Domain Types ────────────────────────────────────────────────────────

export interface Brand {
  id: string;
  name: string;
  logo: string;
  story: string;
  collections: string[];
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
  validUntil: string;
  image: string;
  code?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  publishedAt: string;
  readTime: number;
}

export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  review: string;
  image?: string;
  date: string;
  source: 'google' | 'direct';
}

export interface GalleryImage {
  id: string;
  url: string;
  category: 'Store' | 'Frames' | 'Customers' | 'Events';
  alt: string;
}

export interface Settings {
  storeName: string;
  tagline?: string;
  introLine1?: string; // Left lens text in welcome animation
  introLine2?: string; // Right lens text in welcome animation
  logoUrl?: string;
  faviconUrl?: string;
  address: string;
  phone: string;
  email?: string;
  hours: string;
  mapEmbedUrl: string;
  rating: number;
  reviewCount: number;
  gstNumber?: string;
  partnerCredentials?: {
    id: string;
    brandName: string;
    badgeImageUrl: string;
    note?: string;
  }[];
  socials?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
  };
  colors?: {
    primary?: string;
    accent?: string;
  };
  // Payment settings (admin sets these in the Settings page — never hardcode these)
  paymentUpiId?: string;
  paymentUpiName?: string;
  paymentUpiQrUrl?: string;
  paymentInstructions?: string;
  paymentBankName?: string;
  paymentAccountNumber?: string;
  paymentIfsc?: string;
  paymentAccountHolder?: string;
  featureFlags: {
    enable360Spin: boolean;
    enableVirtualTryOn: boolean;
  };
}

// Kept for backward-compatibility with EyeTestPage
export interface EyeTestBooking {
  name: string;
  phone: string;
  date: string;
  time: string;
  branch?: string;
}