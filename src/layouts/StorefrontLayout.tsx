import { Outlet } from 'react-router-dom';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';

export function StorefrontLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
