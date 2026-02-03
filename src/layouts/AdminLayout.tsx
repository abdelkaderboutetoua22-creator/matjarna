import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  FolderTree, 
  Truck, 
  Tag, 
  Star, 
  ShoppingBag,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Target,
  BarChart3
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/utils/cn';

const navItems = [
  { path: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, end: true },
  { path: '/dashboard/orders', label: 'الطلبيات', icon: ShoppingCart },
  { path: '/dashboard/products', label: 'المنتجات', icon: Package },
  { path: '/dashboard/categories', label: 'التصنيفات', icon: FolderTree },
  { path: '/dashboard/shipping', label: 'أسعار التوصيل', icon: Truck },
  { path: '/dashboard/coupons', label: 'الكوبونات', icon: Tag },
  { path: '/dashboard/reviews', label: 'التقييمات', icon: Star },
  { path: '/dashboard/abandoned-carts', label: 'السلات المتروكة', icon: ShoppingBag },
  { path: '/dashboard/upsell', label: 'العروض والبيع المتقاطع', icon: Target },
  { path: '/dashboard/analytics', label: 'التحليلات', icon: BarChart3 },
  { path: '/dashboard/settings', label: 'الإعدادات', icon: Settings },
];

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">م</span>
            </div>
            <span className="font-bold text-gray-900">لوحة التحكم</span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 right-0 h-full w-72 bg-white shadow-xl z-50 transform transition-transform duration-300',
          'lg:translate-x-0 lg:shadow-none lg:border-l lg:border-gray-200',
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-6 h-16 border-b">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">م</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">متجرنا</h1>
              <p className="text-xs text-gray-500">لوحة التحكم</p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              <ChevronLeft className="w-4 h-4 mr-auto opacity-50" />
            </NavLink>
          ))}
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-700 font-bold">
                {user?.name?.charAt(0) || 'م'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user?.name || 'مدير'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:mr-72 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
