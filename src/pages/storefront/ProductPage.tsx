import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { ShoppingCart, Minus, Plus, Star, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ProductCard } from '@/components/storefront/ProductCard';
import { useCartStore } from '@/store/cart';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { config } from '@/config';
import { trackViewItem, trackAddToCart } from '@/lib/tracking';
import type { Product, Review } from '@/types';

export function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      if (!slug) return;
      
      setLoading(true);
      try {
        // Fetch product
        const { data: productData, error } = await supabase
          .from('products')
          .select(`
            *,
            images:product_images(*),
            options:product_options(*),
            variants:product_variants(*),
            category:categories(id, name, slug)
          `)
          .eq('slug', slug)
          .eq('is_published', true)
          .single();

        if (error || !productData) {
          navigate('/products');
          return;
        }

        setProduct(productData);

        // Track view_item event
        trackViewItem({
          id: productData.id,
          name: productData.name,
          price: productData.price,
          salePrice: productData.sale_price || undefined,
          category: productData.category?.name,
        });

        // Initialize selected options
        if (productData.options?.length > 0) {
          const initialOptions: Record<string, string> = {};
          productData.options.forEach((opt: { name: string; values: string[] }) => {
            if (opt.values?.length > 0) {
              initialOptions[opt.name] = opt.values[0];
            }
          });
          setSelectedOptions(initialOptions);
        }

        // Fetch related products
        if (productData.category_id) {
          const { data: relatedData } = await supabase
            .from('products')
            .select(`
              *,
              images:product_images(*),
              category:categories(id, name, slug)
            `)
            .eq('is_published', true)
            .eq('category_id', productData.category_id)
            .neq('id', productData.id)
            .limit(4);
          
          setRelatedProducts(relatedData || []);
        }

        // Fetch reviews
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', productData.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });
        
        setReviews(reviewsData || []);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
    setQuantity(1);
    window.scrollTo(0, 0);
  }, [slug, navigate]);

  const handleAddToCart = () => {
    if (!product) return;
    
    // Check if all options are selected
    const requiredOptions = product.options?.length || 0;
    if (requiredOptions > 0 && Object.keys(selectedOptions).length < requiredOptions) {
      showToast('يرجى اختيار جميع الخيارات', 'error');
      return;
    }

    addItem(product, quantity, selectedOptions);
    
    // Track add_to_cart event
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.sale_price || undefined,
      category: product.category?.name,
      quantity,
      variant: Object.values(selectedOptions).join(' / ') || undefined,
    });
    
    showToast('تمت الإضافة إلى السلة', 'success');
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const images = product.images?.sort((a, b) => a.position - b.position) || [];
  const finalPrice = product.sale_price || product.price;
  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.sale_price!) / product.price) * 100)
    : 0;
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary-600">الرئيسية</Link>
        <ChevronLeft className="w-4 h-4" />
        <Link to="/products" className="hover:text-primary-600">المنتجات</Link>
        {product.category && (
          <>
            <ChevronLeft className="w-4 h-4" />
            <Link to={`/category/${product.category.slug}`} className="hover:text-primary-600">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronLeft className="w-4 h-4" />
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Images Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="bg-white rounded-xl overflow-hidden">
            <Swiper
              modules={[Navigation, Pagination, Thumbs]}
              navigation
              pagination={{ clickable: true }}
              thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
              className="aspect-square"
              dir="rtl"
            >
              {images.length > 0 ? images.map((image) => (
                <SwiperSlide key={image.id}>
                  <img
                    src={image.image_url}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                </SwiperSlide>
              )) : (
                <SwiperSlide>
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">لا توجد صورة</span>
                  </div>
                </SwiperSlide>
              )}
            </Swiper>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <Swiper
              onSwiper={setThumbsSwiper}
              modules={[Thumbs]}
              slidesPerView={4}
              spaceBetween={12}
              watchSlidesProgress
              className="!h-20"
              dir="rtl"
            >
              {images.map((image) => (
                <SwiperSlide key={image.id} className="cursor-pointer">
                  <img
                    src={image.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg border-2 border-transparent hover:border-primary-500"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Category */}
          {product.category && (
            <Link
              to={`/category/${product.category.slug}`}
              className="inline-block text-sm text-primary-600 font-medium hover:underline"
            >
              {product.category.name}
            </Link>
          )}

          {/* Name */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h1>

          {/* Rating */}
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= avgRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">({reviews.length} تقييم)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-primary-600">
              {finalPrice.toLocaleString()} {config.store.currency}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xl text-gray-400 line-through">
                  {product.price.toLocaleString()} {config.store.currency}
                </span>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-sm font-medium">
                  -{discountPercent}%
                </span>
              </>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          )}

          {/* Options */}
          {product.options && product.options.length > 0 && (
            <div className="space-y-4">
              {product.options.map((option) => (
                <div key={option.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {option.name}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(option.values as string[]).map((value) => (
                      <button
                        key={value}
                        onClick={() => setSelectedOptions((prev) => ({ ...prev, [option.name]: value }))}
                        className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                          selectedOptions[option.name] === value
                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الكمية</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-3 hover:bg-gray-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 font-medium min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="p-3 hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-gray-500">
                {product.stock > 0 ? `${product.stock} قطعة متاحة` : 'نفذت الكمية'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleBuyNow}
              size="lg"
              className="flex-1"
              disabled={product.stock <= 0}
            >
              اطلب الآن
            </Button>
            <Button
              onClick={handleAddToCart}
              variant="outline"
              size="lg"
              className="flex-1"
              disabled={product.stock <= 0}
            >
              <ShoppingCart className="w-5 h-5 ml-2" />
              أضف إلى السلة
            </Button>
          </div>

          {/* SKU */}
          {product.sku && (
            <p className="text-sm text-gray-500">
              رمز المنتج: <span className="font-medium">{product.sku}</span>
            </p>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">تقييمات العملاء</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900">{review.customer_name}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600">{review.text}</p>
                {review.images && (review.images as string[]).length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {(review.images as string[]).slice(0, 3).map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt=""
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-6">منتجات مشابهة</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
