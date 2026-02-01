import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Loader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types';

export function ProductsPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  const searchQuery = searchParams.get('q') || '';
  const categoryFilter = slug || searchParams.get('category') || '';
  const sortBy = searchParams.get('sort') || 'newest';

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch categories
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .is('parent_id', null)
          .order('position');
        
        setCategories(categoriesData || []);

        // Build products query
        let query = supabase
          .from('products')
          .select(`
            *,
            images:product_images(*),
            category:categories(id, name, slug)
          `)
          .eq('is_published', true);

        // Apply category filter
        if (categoryFilter) {
          const { data: categoryData } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', categoryFilter)
            .single();
          
          if (categoryData) {
            query = query.eq('category_id', categoryData.id);
          }
        }

        // Apply search
        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`);
        }

        // Apply sorting
        switch (sortBy) {
          case 'price-asc':
            query = query.order('price', { ascending: true });
            break;
          case 'price-desc':
            query = query.order('price', { ascending: false });
            break;
          case 'oldest':
            query = query.order('created_at', { ascending: true });
            break;
          default:
            query = query.order('created_at', { ascending: false });
        }

        const { data: productsData } = await query;
        setProducts(productsData || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [categoryFilter, searchQuery, sortBy]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get('q') as string;
    setSearchParams((prev) => {
      if (q) prev.set('q', q);
      else prev.delete('q');
      return prev;
    });
  };

  const handleSort = (value: string) => {
    setSearchParams((prev) => {
      prev.set('sort', value);
      return prev;
    });
  };

  const handleCategoryFilter = (categorySlug: string) => {
    setSearchParams((prev) => {
      if (categorySlug) prev.set('category', categorySlug);
      else prev.delete('category');
      return prev;
    });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const activeFiltersCount = [searchQuery, categoryFilter].filter(Boolean).length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          {categoryFilter ? categories.find(c => c.slug === categoryFilter)?.name || 'المنتجات' : 'جميع المنتجات'}
        </h1>
        <p className="text-gray-500">
          {products.length} منتج متاح
        </p>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder="ابحث عن منتج..."
                className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </form>

          {/* Sort & Filter Buttons */}
          <div className="flex gap-3">
            <select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="newest">الأحدث</option>
              <option value="oldest">الأقدم</option>
              <option value="price-asc">السعر: من الأقل</option>
              <option value="price-desc">السعر: من الأعلى</option>
            </select>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="mr-2 hidden md:inline">تصفية</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -left-2 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">التصنيفات</h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  مسح الفلاتر
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryFilter('')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !categoryFilter
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                الكل
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryFilter(category.slug)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    categoryFilter === category.slug
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader size="lg" />
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد منتجات</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? `لم يتم العثور على نتائج لـ "${searchQuery}"` : 'لا توجد منتجات في هذا التصنيف'}
          </p>
          {(searchQuery || categoryFilter) && (
            <Button variant="outline" onClick={clearFilters}>
              مسح الفلاتر
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
