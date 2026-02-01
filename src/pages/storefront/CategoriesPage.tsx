import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import { Loader } from '@/components/ui/Loader';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/types';

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('position');

      // Build tree structure
      const categoryMap = new Map<string, Category>();
      const rootCategories: Category[] = [];

      (data || []).forEach((cat: Category) => {
        categoryMap.set(cat.id, { ...cat, children: [] });
      });

      categoryMap.forEach((cat) => {
        if (cat.parent_id && categoryMap.has(cat.parent_id)) {
          categoryMap.get(cat.parent_id)!.children!.push(cat);
        } else if (!cat.parent_id) {
          rootCategories.push(cat);
        }
      });

      setCategories(rootCategories);
      setLoading(false);
    }

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">التصنيفات</h1>

      {categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <Link
                to={`/category/${category.slug}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                      <FolderOpen className="w-8 h-8 text-primary-600" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{category.name}</h2>
                    {category.description && (
                      <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                    )}
                  </div>
                </div>
              </Link>

              {/* Subcategories */}
              {category.children && category.children.length > 0 && (
                <div className="border-t px-6 py-4 bg-gray-50">
                  <p className="text-xs text-gray-500 mb-2">التصنيفات الفرعية:</p>
                  <div className="flex flex-wrap gap-2">
                    {category.children.map((child) => (
                      <Link
                        key={child.id}
                        to={`/category/${child.slug}`}
                        className="text-sm bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:border-primary-300 hover:text-primary-600 transition-colors"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl">
          <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد تصنيفات</h3>
          <p className="text-gray-500">لم يتم إضافة تصنيفات بعد</p>
        </div>
      )}
    </div>
  );
}
