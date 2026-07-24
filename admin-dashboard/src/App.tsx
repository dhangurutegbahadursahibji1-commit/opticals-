import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import RequireAuth from './components/layout/RequireAuth';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ProductsPage from './pages/Products/ProductsPage';
import BrandsPage from './pages/Brands/BrandsPage';
import CategoriesPage from './pages/Categories/CategoriesPage';
import BlogsPage from './pages/Blogs/BlogsPage';
import OffersPage from './pages/Offers/OffersPage';
import TestimonialsPage from './pages/Testimonials/TestimonialsPage';
import GalleryPage from './pages/Gallery/GalleryPage';

import BookingsPage from './pages/Bookings/BookingsPage';
import EnquiriesPage from './pages/Enquiries/EnquiriesPage';
import UsersPage from './pages/Users/UsersPage';
import AuditLogsPage from './pages/AuditLogs/AuditLogsPage';
import SettingsPage from './pages/Settings/SettingsPage';
const OrdersPage = lazy(() => import('./pages/Orders/OrdersPage'));
const OpticalEnginePage = lazy(() => import('./pages/OpticalEngine/OpticalEnginePage'));
const ConsultationHubPage = lazy(() => import('./pages/Consultations/ConsultationHubPage'));
const FaqsPage = lazy(() => import('./pages/Faqs/FaqsPage'));

export default function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
    
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireAuth min="VIEWER" />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/brands" element={<BrandsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/blogs" element={<BlogsPage />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/testimonials" element={<TestimonialsPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/faqs" element={<FaqsPage />} />

            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/enquiries" element={<EnquiriesPage />} />

            <Route element={<RequireAuth min="ADMIN" />}>
              <Route path="/users" element={<UsersPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              <Route path="/optical-engine/*" element={<OpticalEnginePage />} />
              <Route path="/consultations" element={<ConsultationHubPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Suspense>
    );
  }
