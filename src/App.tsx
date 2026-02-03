import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { detectAppMode, isDev, setDevMode } from '@/lib/host-router';
import { ToastProvider } from '@/components/ui/Toast';
import { TrackingProvider } from '@/components/TrackingProvider';

// Layouts
import { StorefrontLayout } from '@/layouts/StorefrontLayout';
import { AdminLayout } from '@/layouts/AdminLayout';

// Storefront Pages
import { HomePage } from '@/pages/storefront/HomePage';
import { ProductPage } from '@/pages/storefront/ProductPage';
import { ProductsPage } from '@/pages/storefront/ProductsPage';
import { CartPage } from '@/pages/storefront/CartPage';
import { CheckoutPage } from '@/pages/storefront/CheckoutPage';
import { OrderSuccessPage } from '@/pages/storefront/OrderSuccessPage';
import { CategoriesPage } from '@/pages/storefront/CategoriesPage';

// Admin Pages
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { OrdersPage } from '@/pages/admin/OrdersPage';
import { OrderDetailPage } from '@/pages/admin/OrderDetailPage';
import { AdminProductsPage } from '@/pages/admin/ProductsPage';
import { AdminCategoriesPage } from '@/pages/admin/CategoriesPage';
import { ShippingRatesPage } from '@/pages/admin/ShippingRatesPage';
import { CouponsPage } from '@/pages/admin/CouponsPage';
import { ReviewsPage } from '@/pages/admin/ReviewsPage';
import { AbandonedCartsPage } from '@/pages/admin/AbandonedCartsPage';
import { SettingsPage } from '@/pages/admin/SettingsPage';
import { UpsellPage } from '@/pages/admin/UpsellPage';
import { AnalyticsPage } from '@/pages/admin/AnalyticsPage';

// Auth Guard
import { useAuthStore } from '@/store/auth';

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function StorefrontRoutes() {
  return (
    <Routes>
      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/category/:slug" element={<ProductsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-success/:orderNumber" element={<OrderSuccessPage />} />
      </Route>
      {/* Block admin routes on storefront domain */}
      <Route path="/dashboard/*" element={<Navigate to="/" replace />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="shipping" element={<ShippingRatesPage />} />
        <Route path="coupons" element={<CouponsPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="abandoned-carts" element={<AbandonedCartsPage />} />
        <Route path="upsell" element={<UpsellPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export function App() {
  const appMode = detectAppMode();
  
  return (
    <ToastProvider>
      <BrowserRouter>
        <TrackingProvider>
        {/* Dev Mode Switcher */}
        {isDev() && (
          <div className="fixed bottom-4 right-4 z-50 flex gap-2">
            <button
              onClick={() => setDevMode(appMode === 'admin' ? 'storefront' : 'admin')}
              className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg hover:bg-gray-800"
            >
              {appMode === 'admin' ? '🏪 متجر' : '⚙️ لوحة التحكم'}
            </button>
            {appMode === 'admin' && (
              <button
                onClick={() => setDevMode(null)}
                className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg hover:bg-red-700"
              >
                ✕
              </button>
            )}
          </div>
        )}
        
        {/* Route based on detected mode */}
        {appMode === 'admin' ? <AdminRoutes /> : <StorefrontRoutes />}
        </TrackingProvider>
      </BrowserRouter>
    </ToastProvider>
  );
}
