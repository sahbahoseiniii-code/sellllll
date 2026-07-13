import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, type ProductWithDetails } from '../lib/supabase';
import ProductCard from '../components/ProductCard';

export default function SalePage() {
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('products')
        .select('*, product_variants(*), product_images(*), categories(*)').eq('is_active', true);
      const onSale = (data ?? []).filter(p => p.product_variants?.some(v => v.compare_at_price && v.compare_at_price > v.price));
      setProducts(onSale);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="bg-red-600 text-white py-16 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-white/70 mb-3">Limited Time</p>
        <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">SALE</h1>
        <p className="text-lg text-white/90">Up to 40% off selected styles</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-product bg-stone-100 animate-pulse" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-stone-500 mb-4">No sale items available right now.</p>
            <Link to="/" className="btn-primary">Continue Shopping</Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-stone-500 mb-6">{products.length} items on sale</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
