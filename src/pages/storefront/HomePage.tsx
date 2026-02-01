import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { Truck, CreditCard, RotateCcw, Headphones, ArrowLeft } from 'lucide-react';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Loader } from '@/components/ui/Loader';
import { supabase } from '@/lib/supabase';
import type { Product, Banner } from '@/types';

const features = [
  { icon: Truck, title: 'توصيل سريع', description: 'توصيل لجميع 58 ولاية' },
  { icon: CreditCard, title: 'الدفع عند الاستلام', description: 'ادفع عند استلام طلبك' },
  { icon: RotateCcw, title: 'إرجاع مجاني', description: 'إرجاع مجاني خلال 7 أيام' },
  { icon: Headphones, title: 'دعم مستمر', description: 'دعم فني على مدار الساعة' },
];

export function HomePage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch banners
        const { data: bannersData } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('position');
        
        // Fetch products with images
        const { data: productsData } = await supabase
          .from('products')
          .select(`
            *,
            images:product_images(*),
            category:categories(id, name, slug)
          `)
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(8);

        setBanners(bannersData || []);
        setProducts(productsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Hero Banners */}
      {banners.length > 0 && (
        <section className="mb-8">
          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            loop={banners.length > 1}
            className="aspect-[3/1] md:aspect-[4/1]"
            dir="rtl"
          >
            {banners.map((banner) => (
              <SwiperSlide key={banner.id}>
                <Link to={banner.link || '/products'} className="block relative h-full">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-black/60 to-transparent flex items-center">
                    <div className="container mx-auto px-4 md:px-8">
                      <div className="max-w-md">
                        <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">
                          {banner.title}
                        </h2>
                        {banner.subtitle && (
                          <p className="text-white/90 text-sm md:text-lg mb-4">
                            {banner.subtitle}
                          </p>
                        )}
                        <span className="inline-flex items-center gap-2 bg-white text-primary-600 px-4 py-2 rounded-lg font-medium text-sm md:text-base">
                          تسوق الآن
                          <ArrowLeft className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      )}

      {/* Features */}
      <section className="container mx-auto px-4 mb-12">
        <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                    {feature.title}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="container mx-auto px-4 mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">الأكثر طلباً</h2>
          <Link
            to="/products"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
          >
            عرض الكل
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
        
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500">لا توجد منتجات متاحة حالياً</p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 mb-12">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 md:p-10 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            تسوق بثقة من متجرنا
          </h2>
          <p className="text-white/90 mb-6 max-w-xl mx-auto">
            نوفر لك أفضل المنتجات بأسعار منافسة مع ضمان الجودة والتوصيل السريع لجميع ولايات الجزائر
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            تصفح المنتجات
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
