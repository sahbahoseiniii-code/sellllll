import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { supabase, type ProductWithDetails } from '../lib/supabase';
import ProductCard from '../components/ProductCard';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setQuery(q); }, [q]);

  useEffect(() => {
    if (!q) { setResults([]); return; }
    setLoading(true);
    (async () => {
      const { data } = await supabase.from('products')
        .select('*, product_variants(*), product_images(*), categories(*)')
        .ilike('name', `%${q}%`).eq('is_active', true);
      setResults(data ?? []);
      setLoading(false);
    })();
  }, [q]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(query ? { q: query } : {});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <form onSubmit={handleSearch} className="flex items-center gap-3 border-b border-stone-300 pb-3 mb-8 max-w-2xl">
        <SearchIcon size={20} className="text-stone-400" />
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search for jeans, coats, colors..." className="flex-1 text-lg outline-none bg-transparent" autoFocus />
        <button type="submit" className="btn-primary">Search</button>
      </form>

      {q && (
        <h1 className="font-display text-2xl font-bold mb-6">
          {loading ? 'Searching...' : `${results.length} ${results.length === 1 ? 'result' : 'results'} for "${q}"`}
        </h1>
      )}

      {!q && (
        <div className="text-center py-16">
          <SearchIcon size={48} className="mx-auto text-stone-300 mb-4" />
          <p className="text-stone-500 mb-6">Search for your favorite jeans and coats</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {['Slim Jeans', 'Wool Coat', 'Black Denim', 'Puffer', 'Trench'].map(s => (
              <button key={s} onClick={() => setSearchParams({ q: s })} className="px-4 py-2 border border-stone-300 text-sm hover:border-stone-900 transition-colors">{s}</button>
            ))}
          </div>
        </div>
      )}

      {q && !loading && results.length === 0 && (
        <div className="text-center py-16">
          <p className="text-stone-500 mb-6">No results found. Try a different search term.</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {["Women's Jeans", "Men's Coats", 'Sale'].map(s => (
              <Link key={s} to={s === 'Sale' ? '/sale' : `/category/${s.toLowerCase().replace("'s ", 's-').replace(' ', '-')}`} className="px-4 py-2 border border-stone-300 text-sm hover:border-stone-900 transition-colors">{s}</Link>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {results.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
