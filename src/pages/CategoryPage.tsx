import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronRight } from 'lucide-react';
import { supabase, type ProductWithDetails, type Category } from '../lib/supabase';
import ProductCard from '../components/ProductCard';
import FilterSidebar, { defaultFilters, type FilterValues } from '../components/FilterSidebar';

export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterValues>({ ...defaultFilters, sortBy: searchParams.get('sort') || 'featured' });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const { data: cat } = await supabase.from('categories').select('*').eq('slug', slug).maybeSingle();
      if (!cat) { setLoading(false); return; }
      setCategory(cat);
      const { data: prods } = await supabase.from('products')
        .select('*, product_variants(*), product_images(*), categories(*)')
        .eq('category_id', cat.id).eq('is_active', true);
      setProducts(prods ?? []);
      setLoading(false);
    })();
  }, [slug]);

  const filtered = useMemo(() => {
    let result = [...products];
    if (filters.colors.length) result = result.filter(p => p.product_variants?.some(v => filters.colors.includes(v.color)));
    if (filters.sizes.length) result = result.filter(p => p.product_variants?.some(v => filters.sizes.includes(v.size)));
    if (filters.fits.length) result = result.filter(p => p.product_variants?.some(v => v.fit && filters.fits.includes(v.fit)));
    result = result.filter(p => {
      const prices = p.product_variants?.map(v => v.price) ?? [];
      if (!prices.length) return false;
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return max >= filters.priceMin && min <= filters.priceMax;
    });
    switch (filters.sortBy) {
      case 'price_asc': result.sort((a, b) => Math.min(...(a.product_variants?.map(v => v.price) ?? [0])) - Math.min(...(b.product_variants?.map(v => v.price) ?? [0]))); break;
      case 'price_desc': result.sort((a, b) => Math.min(...(b.product_variants?.map(v => v.price) ?? [0])) - Math.min(...(a.product_variants?.map(v => v.price) ?? [0]))); break;
      case 'newest': result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
    }
    return result;
  }, [products, filters]);

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-16"><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-product bg-stone-100 animate-pulse" />)}</div></div>;
  if (!category) return <div className="max-w-7xl mx-auto px-4 py-16 text-center"><p>Category not found.</p><Link to="/" className="btn-primary mt-4 inline-block">Back Home</Link></div>;

  return (
    <div>
      {/* Header */}
      <div className="bg-stone-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-stone-500 mb-3">
            <Link to="/" className="hover:text-stone-900">Home</Link>
            <ChevronRight size={14} />
            <span className="text-stone-900">{category.name}</span>
          </nav>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-stone-900">{category.name}</h1>
          {category.description && <p className="text-stone-600 mt-2 max-w-2xl">{category.description}</p>}
          <p className="text-sm text-stone-500 mt-2">{filtered.length} {filtered.length === 1 ? 'product' : 'products'}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <FilterSidebar filters={filters} onChange={setFilters} totalCount={filtered.length} />
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <button onClick={() => setMobileFiltersOpen(true)} className="flex items-center gap-2 text-sm font-medium text-stone-900">
                <SlidersHorizontal size={16} /> Filters
              </button>
              <span className="text-sm text-stone-500">{filtered.length} items</span>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-stone-500 mb-4">No products match your filters.</p>
                <button onClick={() => setFilters(defaultFilters)} className="btn-secondary">Clear All Filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {filtered.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold">Filters</h2>
              <button onClick={() => setMobileFiltersOpen(false)}><X size={22} /></button>
            </div>
            <FilterSidebar filters={filters} onChange={setFilters} totalCount={filtered.length} />
            <button onClick={() => setMobileFiltersOpen(false)} className="btn-primary w-full mt-6">Show {filtered.length} Results</button>
          </div>
        </div>
      )}
    </div>
  );
}
