import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Factory, Wind, ArrowRight } from 'lucide-react';
import { supabase, type ProductWithDetails } from '../lib/supabase';
import ProductCard from '../components/ProductCard';

export default function HomePage() {
  const [featured, setFeatured] = useState<ProductWithDetails[]>([]);
  const [newArrivals, setNewArrivals] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: feat }, { data: recent }] = await Promise.all([
        supabase.from('products').select('*, product_variants(*), product_images(*), categories(*)')
          .eq('is_featured', true).eq('is_active', true).limit(8),
        supabase.from('products').select('*, product_variants(*), product_images(*), categories(*)')
          .eq('is_active', true).order('created_at', { ascending: false }).limit(4),
      ]);
      setFeatured(feat ?? []);
      setNewArrivals(recent ?? []);
      setLoading(false);
    })();
  }, []);

  const categories = [
    { name: "Women's Jeans", slug: 'womens-jeans', img: 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg' },
    { name: "Men's Jeans", slug: 'mens-jeans', img: 'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg' },
    { name: "Women's Coats", slug: 'womens-coats', img: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg' },
    { name: "Men's Coats", slug: 'mens-coats', img: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="min-h-[calc(100vh-4rem)] grid md:grid-cols-2">
        <div className="flex flex-col justify-center px-6 md:px-12 lg:px-20 py-16 bg-stone-50">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500 mb-6">Premium Denim & Outerwear</p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-stone-900 leading-tight mb-6">
            Quality Jeans & Coats for Every Season
          </h1>
          <p className="text-stone-600 text-lg mb-8 max-w-md">
            Expertly crafted denim and outerwear designed to last. Sustainable materials, ethical manufacturing, timeless style.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/category/womens-jeans" className="btn-primary">Shop Women's</Link>
            <Link to="/category/mens-jeans" className="btn-secondary">Shop Men's</Link>
          </div>
        </div>
        <div className="relative min-h-[400px] md:min-h-full">
          <img src="https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg" alt="Model wearing denim"
            className="absolute inset-0 w-full h-full object-cover" />
        </div>
      </section>

      {/* Category Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map(cat => (
            <Link key={cat.slug} to={`/category/${cat.slug}`} className="group relative aspect-[3/4] overflow-hidden">
              <img src={cat.img} alt={cat.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                <h3 className="font-display text-lg md:text-xl font-semibold text-white">{cat.name}</h3>
                <p className="text-sm text-white/80 mt-1 flex items-center gap-1">Shop Now <ArrowRight size={14} /></p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold text-stone-900">New Arrivals</h2>
            <p className="text-stone-500 mt-2">Fresh styles just landed</p>
          </div>
          <Link to="/category/womens-jeans" className="text-sm font-medium text-stone-900 hover:underline hidden sm:block">View All →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-product bg-stone-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Promo Banner */}
      <section className="bg-stone-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-4">Limited Time</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">End of Season Sale</h2>
          <p className="text-stone-300 text-lg mb-8">Up to 40% off selected styles</p>
          <Link to="/sale" className="inline-block bg-white text-stone-900 px-8 py-3.5 font-medium text-sm tracking-wide hover:bg-stone-200 transition-colors">Shop Sale</Link>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="font-display text-3xl font-bold text-stone-900 mb-8">Best Sellers</h2>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-product bg-stone-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Sustainability */}
      <section className="bg-stone-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Leaf, title: 'Sustainable Materials', text: 'Organic cotton and recycled fibers in every garment.' },
              { icon: Factory, title: 'Ethical Manufacturing', text: 'Fair wages and safe conditions at every facility.' },
              { icon: Wind, title: 'Carbon Neutral Shipping', text: 'Every order ships carbon-neutral at no extra cost.' },
            ].map((f, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-white rounded-full shadow-sm">
                  <f.icon size={24} className="text-stone-700" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-stone-500">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 text-center px-4">
        <h2 className="font-display text-3xl font-bold mb-3">Join Our Newsletter</h2>
        <p className="text-stone-500 mb-6">Get 10% off your first order plus early access to new collections.</p>
        <NewsletterForm />
      </section>
    </div>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  if (done) return <p className="text-green-600 font-medium">Thanks for subscribing! Check your inbox for 10% off.</p>;
  return (
    <form onSubmit={e => { e.preventDefault(); if (email) setDone(true); }} className="flex max-w-md mx-auto gap-3">
      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" className="input-base flex-1" />
      <button type="submit" className="btn-primary">Subscribe</button>
    </form>
  );
}
