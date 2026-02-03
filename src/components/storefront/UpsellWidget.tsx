import { useState, useEffect } from 'react';
import { ShoppingCart, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/store/cart';
import { useToast } from '@/components/ui/Toast';
import { config } from '@/config';
import type { Product } from '@/types';

interface UpsellRule {
  id: string;
  name: string;
  type: 'upsell' | 'downsell' | 'cross_sell';
  trigger_type: 'product' | 'category' | 'cart_total';
  trigger_id: string | null;
  trigger_min_amount: number | null;
  target_product_ids: string[];
  display_location: 'product_page' | 'cart' | 'checkout' | 'order_success';
  discount_percent: number | null;
  message_ar: string | null;
  is_active: boolean;
  priority: number;
}

interface UpsellWidgetProps {
  location: 'product_page' | 'cart' | 'checkout' | 'order_success';
  productId?: string;
  categoryId?: string;
  cartTotal?: number;
}

export function UpsellWidget({ location, productId, categoryId, cartTotal = 0 }: UpsellWidgetProps) {
  const { showToast } = useToast();
  const addItem = useCartStore((s) => s.addItem);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const cartItems = useCartStore((s) => s.items);
  
  const [rules, setRules] = useState<UpsellRule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const effectiveCartTotal = cartTotal || getSubtotal();

  useEffect(() => {
    fetchUpsellData();
  }, [location, productId, categoryId, effectiveCartTotal]);

  async function fetchUpsellData() {
    setLoading(true);
    try {
      // Fetch active upsell rules for this location
      let query = supabase
        .from('upsell_rules')
        .select('*')
        .eq('is_active', true)
        .eq('display_location', location)
        .order('priority', { ascending: true });

      const { data: rulesData, error: rulesError } = await query;
      
      if (rulesError) {
        console.error('Error fetching upsell rules:', rulesError);
        setLoading(false);
        return;
      }

      if (!rulesData || rulesData.length === 0) {
        setRules([]);
        setProducts([]);
        setLoading(false);
        return;
      }

      // Filter rules based on trigger conditions
      const applicableRules = rulesData.filter((rule: UpsellRule) => {
        switch (rule.trigger_type) {
          case 'product':
            return rule.trigger_id === productId;
          case 'category':
            return rule.trigger_id === categoryId;
          case 'cart_total':
            return rule.trigger_min_amount ? effectiveCartTotal >= rule.trigger_min_amount : true;
          default:
            return false;
        }
      });

      if (applicableRules.length === 0) {
        setRules([]);
        setProducts([]);
        setLoading(false);
        return;
      }

      // Collect all target product IDs
      const allProductIds = new Set<string>();
      applicableRules.forEach((rule: UpsellRule) => {
        if (rule.target_product_ids) {
          rule.target_product_ids.forEach((id: string) => allProductIds.add(id));
        }
      });

      if (allProductIds.size === 0) {
        setRules(applicableRules);
        setProducts([]);
        setLoading(false);
        return;
      }

      // Fetch target products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(*)
        `)
        .eq('is_published', true)
        .in('id', Array.from(allProductIds));

      if (productsError) {
        console.error('Error fetching upsell products:', productsError);
      }

      // Filter out products already in cart
      const cartProductIds = new Set(cartItems.map(item => item.product_id));
      const availableProducts = (productsData || []).filter(
        (p: Product) => !cartProductIds.has(p.id) && p.stock > 0
      );

      setRules(applicableRules);
      setProducts(availableProducts);
    } catch (error) {
      console.error('Error in fetchUpsellData:', error);
    }
    setLoading(false);
  }

  const handleAddToCart = (product: Product, discountPercent?: number | null) => {
    // Calculate discounted price if applicable
    const originalPrice = product.sale_price || product.price;
    let finalPrice = originalPrice;
    
    if (discountPercent && discountPercent > 0) {
      finalPrice = Math.floor(originalPrice * (1 - discountPercent / 100));
    }

    // Create a modified product with the discounted price
    const modifiedProduct = discountPercent && discountPercent > 0
      ? { ...product, sale_price: finalPrice, price: originalPrice }
      : product;

    addItem(modifiedProduct, 1, {});
    showToast('تمت إضافة المنتج للسلة', 'success');
  };

  const handleDismiss = (ruleId: string) => {
    setDismissed(prev => new Set(prev).add(ruleId));
  };

  // Filter out dismissed rules
  const visibleRules = rules.filter(rule => !dismissed.has(rule.id));

  // Get products for each visible rule
  const getProductsForRule = (rule: UpsellRule): Product[] => {
    if (!rule.target_product_ids) return [];
    return products.filter(p => rule.target_product_ids.includes(p.id));
  };

  if (loading || visibleRules.length === 0) {
    return null;
  }

  // Get first applicable rule with available products
  const activeRule = visibleRules.find(rule => getProductsForRule(rule).length > 0);
  if (!activeRule) return null;

  const ruleProducts = getProductsForRule(activeRule);
  if (ruleProducts.length === 0) return null;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'upsell': return 'ترقية مقترحة';
      case 'downsell': return 'بديل مناسب';
      case 'cross_sell': return 'منتجات مكمّلة';
      default: return 'قد يعجبك أيضاً';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'upsell': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'downsell': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'cross_sell': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary-50 to-white rounded-xl border border-primary-100 p-4 md:p-6 my-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(activeRule.type)}`}>
            {getTypeLabel(activeRule.type)}
          </span>
          {activeRule.discount_percent && activeRule.discount_percent > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              <Tag className="w-3 h-3" />
              خصم {activeRule.discount_percent}%
            </span>
          )}
        </div>
        <button
          onClick={() => handleDismiss(activeRule.id)}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Custom Message */}
      {activeRule.message_ar && (
        <p className="text-sm text-gray-700 mb-4 bg-white/60 p-3 rounded-lg">
          {activeRule.message_ar}
        </p>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {ruleProducts.slice(0, 4).map((product) => {
          const primaryImage = product.images?.find((img) => img.is_primary)?.image_url
            || product.images?.[0]?.image_url
            || 'https://placehold.co/200x200/e2e8f0/64748b?text=منتج';

          const originalPrice = product.sale_price || product.price;
          const hasDiscount = activeRule.discount_percent && activeRule.discount_percent > 0;
          const discountedPrice = hasDiscount
            ? Math.floor(originalPrice * (1 - activeRule.discount_percent! / 100))
            : originalPrice;

          return (
            <div
              key={product.id}
              className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="aspect-square relative">
                <img
                  src={primaryImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {hasDiscount && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded">
                    -{activeRule.discount_percent}%
                  </span>
                )}
              </div>
              <div className="p-3">
                <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                  {product.name}
                </h4>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-primary-600 font-bold text-sm">
                    {discountedPrice.toLocaleString()} {config.store.currency}
                  </span>
                  {hasDiscount && (
                    <span className="text-gray-400 text-xs line-through">
                      {originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  className="w-full text-xs"
                  onClick={() => handleAddToCart(product, activeRule.discount_percent)}
                >
                  <ShoppingCart className="w-3 h-3 ml-1" />
                  أضف للسلة
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
