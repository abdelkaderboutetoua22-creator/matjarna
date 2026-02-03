import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { supabase } from '@/lib/supabase';
import { config } from '@/config';

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  cf_image_id: string | null;
  position: number;
  is_primary: boolean;
}

export function AdminProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [{ data: productsData }, { data: categoriesData }] = await Promise.all([
      supabase.from('products').select('*, images:product_images(*), category:categories(id, name)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').eq('is_active', true)
    ]);
    setProducts(productsData || []);
    setCategories(categoriesData || []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      showToast('حدث خطأ أثناء الحذف', 'error');
    } else {
      showToast('تم حذف المنتج بنجاح', 'success');
      fetchData();
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.includes(searchQuery) || p.sku?.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">المنتجات</h1>
        <Button onClick={() => { setEditingProduct(null); setShowModal(true); }}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة منتج
        </Button>
      </div>

      <Card>
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو الرمز..."
              className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12"><Loader size="lg" className="mx-auto" /></div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-right border-b">
                  <th className="pb-3 font-medium text-gray-500 text-sm">المنتج</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm">التصنيف</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm">السعر</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm">المخزون</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm">الحالة</th>
                  <th className="pb-3 font-medium text-gray-500 text-sm">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images?.[0]?.image_url || 'https://placehold.co/60x60/e2e8f0/64748b?text=منتج'}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.sku && <p className="text-xs text-gray-500">{product.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-sm">{product.category?.name || '-'}</td>
                    <td className="py-4">
                      <div>
                        <span className="font-medium">{(product.sale_price || product.price).toLocaleString()} {config.store.currency}</span>
                        {product.sale_price && (
                          <span className="text-xs text-gray-400 line-through mr-1">{product.price.toLocaleString()}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={product.stock <= 5 ? 'text-red-600 font-medium' : ''}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-4">
                      <Badge variant={product.is_published ? 'success' : 'default'}>
                        {product.is_published ? 'منشور' : 'مسودة'}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingProduct(product); setShowModal(true); }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-12">لا توجد منتجات</p>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'} size="lg">
        <ProductForm
          product={editingProduct}
          categories={categories}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchData(); }}
        />
      </Modal>
    </div>
  );
}

function ProductForm({ product, categories, onClose, onSuccess }: any) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [savedProductId, setSavedProductId] = useState<string | null>(product?.id || null);
  const [images, setImages] = useState<ProductImage[]>(product?.images || []);
  const [formData, setFormData] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    price: product?.price || '',
    sale_price: product?.sale_price || '',
    sku: product?.sku || '',
    stock: product?.stock || 0,
    category_id: product?.category_id || '',
    is_published: product?.is_published ?? false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    
    const data = {
      ...formData,
      slug,
      price: parseFloat(formData.price as string) || 0,
      sale_price: formData.sale_price ? parseFloat(formData.sale_price as string) : null,
      stock: parseInt(formData.stock as string) || 0,
      category_id: formData.category_id || null
    };

    let error;
    let newProductId: string | null = null;

    if (product) {
      ({ error } = await supabase.from('products').update(data).eq('id', product.id));
    } else {
      const { data: insertedData, error: insertError } = await supabase
        .from('products')
        .insert(data)
        .select('id')
        .single();
      error = insertError;
      newProductId = insertedData?.id || null;
    }

    if (error) {
      showToast('حدث خطأ أثناء الحفظ', 'error');
    } else {
      showToast(product ? 'تم تحديث المنتج بنجاح' : 'تم إضافة المنتج بنجاح', 'success');
      
      // If new product was created, update savedProductId to allow image upload
      if (newProductId) {
        setSavedProductId(newProductId);
        // Don't close modal - let user upload images
        showToast('يمكنك الآن رفع صور للمنتج', 'info');
      } else {
        onSuccess();
      }
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="اسم المنتج"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <Input
          label="الرابط (slug)"
          name="slug"
          value={formData.slug}
          onChange={handleChange}
          placeholder="يُنشأ تلقائياً"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="السعر"
          name="price"
          type="number"
          value={formData.price}
          onChange={handleChange}
          required
        />
        <Input
          label="سعر التخفيض"
          name="sale_price"
          type="number"
          value={formData.sale_price}
          onChange={handleChange}
        />
        <Input
          label="المخزون"
          name="stock"
          type="number"
          value={formData.stock}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="رمز المنتج (SKU)"
          name="sku"
          value={formData.sku}
          onChange={handleChange}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">بدون تصنيف</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_published"
          name="is_published"
          checked={formData.is_published}
          onChange={handleChange}
          className="w-4 h-4 rounded border-gray-300"
        />
        <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
          نشر المنتج
        </label>
      </div>

      {/* Image Uploader - only show if product is saved */}
      {savedProductId && (
        <div className="border-t pt-4 mt-4">
          <ImageUploader
            productId={savedProductId}
            images={images}
            onImagesChange={setImages}
            disabled={loading}
          />
        </div>
      )}

      {!savedProductId && (
        <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
          💡 احفظ المنتج أولاً لتتمكن من رفع الصور
        </p>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="submit" isLoading={loading}>
          {product ? 'تحديث' : 'إضافة'}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}
