import { Link } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '@/store/cart';
import { cn } from '@/utils/cn';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">م</span>
            </div>
            <span className="text-xl font-bold text-gray-900">متجرنا</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-600 hover:text-primary-600 transition-colors font-medium">
              الرئيسية
            </Link>
            <Link to="/products" className="text-gray-600 hover:text-primary-600 transition-colors font-medium">
              المنتجات
            </Link>
            <Link to="/categories" className="text-gray-600 hover:text-primary-600 transition-colors font-medium">
              التصنيفات
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <button className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Search className="w-5 h-5" />
            </button>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -left-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {itemCount > 9 ? '+9' : itemCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          'md:hidden overflow-hidden transition-all duration-300',
          isMenuOpen ? 'max-h-64' : 'max-h-0'
        )}
      >
        <nav className="container mx-auto px-4 py-4 flex flex-col gap-4 border-t">
          <Link
            to="/"
            onClick={() => setIsMenuOpen(false)}
            className="text-gray-600 hover:text-primary-600 py-2 font-medium"
          >
            الرئيسية
          </Link>
          <Link
            to="/products"
            onClick={() => setIsMenuOpen(false)}
            className="text-gray-600 hover:text-primary-600 py-2 font-medium"
          >
            المنتجات
          </Link>
          <Link
            to="/categories"
            onClick={() => setIsMenuOpen(false)}
            className="text-gray-600 hover:text-primary-600 py-2 font-medium"
          >
            التصنيفات
          </Link>
        </nav>
      </div>
    </header>
  );
}
