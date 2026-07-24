import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import MarketingLayout from './components/layout/MarketingLayout';
import CommerceLayout from './components/layout/CommerceLayout';

const HomePage              = lazy(() => import('./pages/Home/HomePage'));
const ShopPage              = lazy(() => import('./pages/Shop/ShopPage'));
const ProductPage           = lazy(() => import('./pages/Product/ProductPage'));
const EyeTestPage           = lazy(() => import('./pages/EyeTest/EyeTestPage'));
const BrandsPage            = lazy(() => import('./pages/Brands/BrandsPage'));
const LensPage              = lazy(() => import('./pages/Lens/LensPage'));
const OffersPage            = lazy(() => import('./pages/Offers/OffersPage'));
const BlogPage              = lazy(() => import('./pages/Blog/BlogPage'));
const BlogPostPage          = lazy(() => import('./pages/Blog/BlogPostPage'));
const AboutPage             = lazy(() => import('./pages/About/AboutPage'));
const GalleryPage           = lazy(() => import('./pages/Gallery/GalleryPage'));
const FAQPage               = lazy(() => import('./pages/FAQ/FAQPage'));
const ContactPage           = lazy(() => import('./pages/Contact/ContactPage'));
const WishlistPage          = lazy(() => import('./pages/Wishlist/WishlistPage'));
const CartPage              = lazy(() => import('./pages/Cart/CartPage'));
const CheckoutPage          = lazy(() => import('./pages/Checkout/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmation/OrderConfirmationPage'));
const TrackOrderPage        = lazy(() => import('./pages/TrackOrder/TrackOrderPage'));
const NotFoundPage          = lazy(() => import('./pages/NotFound/NotFoundPage'));
const ConfiguratorLayout    = lazy(() => import('./pages/Configurator/ConfiguratorLayout'));

export const routes: RouteObject[] = [
  {
    path: '/configurator/:productId',
    element: <ConfiguratorLayout />,
  },
  {
    element: <MarketingLayout />,
    children: [
      { index: true,           element: <HomePage /> },
      { path: 'brands',        element: <BrandsPage /> },
      { path: 'about',         element: <AboutPage /> },
      { path: 'contact',       element: <ContactPage /> },
      { path: 'faq',           element: <FAQPage /> },
      { path: 'gallery',       element: <GalleryPage /> },
      { path: 'blog',          element: <BlogPage /> },
      { path: 'blog/:slug',    element: <BlogPostPage /> },
    ],
  },
  {
    element: <CommerceLayout />,
    children: [
      { path: 'shop',          element: <ShopPage /> },
      { path: 'shop/:slug',    element: <ProductPage /> },
      { path: 'eye-test',      element: <EyeTestPage /> },
      { path: 'lenses',        element: <LensPage /> },
      { path: 'offers',        element: <OffersPage /> },
      { path: 'wishlist',      element: <WishlistPage /> },
      { path: 'cart',          element: <CartPage /> },
      { path: 'checkout',      element: <CheckoutPage /> },
      { path: 'order-confirmation', element: <OrderConfirmationPage /> },
      { path: 'track-order',   element: <TrackOrderPage /> },
      { path: '*',             element: <NotFoundPage /> },
    ],
  },
];
