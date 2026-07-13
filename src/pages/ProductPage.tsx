import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Star, Minus, Plus, ChevronDown, Heart } from 'lucide-react';
import { supabase, type ProductWithDetails, type Review } from '../lib/supabase';
import { formatPrice, formatDate } from '../lib/utils';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import ProductCard from '../components/ProductCard';

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg';

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(rating) ? 'fill-stone-900 text-stone-900' : 'text-stone-300'}
        />
      ))}
    </div>
  );
}

export default function ProductPage() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedFit, setSelectedFit] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [openSection, setOpenSection] = useState<string | null>('description');

  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      if (!slug) return;
      const { data } = await supabase
        .from('products')
        .select('*, product_variants(*), product_images(*), categories(*)')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (!data || !mounted) {
        setLoading(false);
        return;
      }
      const p = data as ProductWithDetails;
      setProduct(p);
      setSelectedImageIndex(0);
      setQuantity(1);

      const variants = p.product_variants ?? [];
      const colors = [...new Set(variants.map(v => v.color))];
      const sizes = [...new Set(variants.map(v => v.size))];
      const fits = [...new Set(variants.map(v => v.fit).filter(Boolean))] as string[];
      setSelectedColor(colors[0] ?? '');
      setSelectedSize(sizes[0] ?? '');
      setSelectedFit(fits[0] ?? '');

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', p.id)
        .order('created_at', { ascending: false });
      if (mounted) setReviews((reviewsData as Review[]) ?? []);

      const { data: relatedData } = await supabase
        .from('products')
        .select('*, product_variants(*), product_images(*), categories(*)')
        .eq('category_id', p.category_id)
        .neq('id', p.id)
        .limit(4);
      if (mounted) setRelated((relatedData as ProductWithDetails[]) ?? []);

      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="aspect-[3/4] bg-stone-100 animate-pulse" />
          <div className="space-y-4">
            <div className="h-4 w-24 bg-stone-100 animate-pulse" />
            <div className="h-8 w-3/4 bg-stone-100 animate-pulse" />
            <div className="h-6 w-32 bg-stone-100 animate-pulse" />
            <div className="h-40 bg-stone-100 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-stone-900 mb-3">Product not found</h1>
        <p className="text-stone-500 mb-8">The item you're looking for is no longer available.</p>
        <Link to="/" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  const variants = product.product_variants ?? [];
  const images = product.product_images ?? [];
  const mainImage = images[selectedImageIndex]?.url ?? FALLBACK_IMAGE;

  const colors = [...new Map(variants.map(v => [v.color, v.color_hex]))];
  const sizes = [...new Set(variants.map(v => v.size))];
  const fits = [...new Set(variants.map(v => v.fit).filter(Boolean))] as string[];

  const selectedVariant = variants.find(
    v => v.color === selectedColor && v.size === selectedSize && (!fits.length || v.fit === selectedFit)
  );
  const maxQty = selectedVariant?.inventory_count ?? 0;

  const sizeAvailable = (size: string) =>
    variants.some(
      v => v.color === selectedColor && v.size === size && (!fits.length || v.fit === selectedFit) && v.inventory_count > 0
    );

  const prices = variants.map(v => v.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const hasRange = minPrice !== maxPrice;

  const displayPrice = selectedVariant?.price ?? minPrice;
  const displayCompare = selectedVariant?.compare_at_price;
  const onSale = !!(displayCompare && displayCompare > displayPrice);

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const handleAddToBag = async () => {
    if (!selectedVariant) {
      toast('Please select a size', 'error');
      return;
    }
    await addToCart(selectedVariant.id, quantity);
    toast('Added to bag');
  };

  const handleWishlist = () => toast('Saved to wishlist');

  const toggle = (s: string) => setOpenSection(openSection === s ? null : s);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !reviewName.trim() || !reviewBody.trim()) return;
    await supabase.from('reviews').insert({
      product_id: product.id,
      reviewer_name: reviewName,
      rating: reviewRating,
      title: reviewTitle,
      body: reviewBody,
    });
    const { data: refreshed } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false });
    setReviews((refreshed as Review[]) ?? []);
    setReviewName('');
    setReviewTitle('');
    setReviewBody('');
    setReviewRating(5);
    toast('Review submitted');
  };

  const sections = [
    { key: 'description', title: 'Description', content: product.description },
    {
      key: 'material',
      title: 'Material & Care',
      content: [product.material, product.care_instructions].filter(Boolean).join('\n'),
    },
    {
      key: 'shipping',
      title: 'Shipping & Returns',
      content:
        'Enjoy free standard shipping on all orders over $100. Orders ship within 1-2 business days. We offer 30-day returns on unworn items with original tags attached.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <nav className="text-xs text-stone-500 mb-6 flex items-center gap-2">
        <Link to="/" className="hover:text-stone-900">Home</Link>
        <span>/</span>
        {product.categories && (
          <>
            <Link to={`/category/${product.categories.slug}`} className="hover:text-stone-900">
              {product.categories.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-stone-900">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* LEFT: gallery */}
        <div className="space-y-3">
          <div className="aspect-[3/4] bg-stone-100 overflow-hidden">
            <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIndex(i)}
                  className={`flex-shrink-0 w-20 h-24 bg-stone-100 overflow-hidden border-2 transition-colors ${
                    i === selectedImageIndex ? 'border-stone-900' : 'border-transparent hover:border-stone-300'
                  }`}
                >
                  <img src={img.url} alt={img.alt_text ?? product.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: details */}
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-stone-500 mb-2">{product.brand}</p>
            <h1 className="font-display text-2xl md:text-3xl font-semibold text-stone-900">{product.name}</h1>
            <div className="flex items-center gap-2 mt-3">
              <Stars rating={avgRating} />
              <a href="#reviews-section" className="text-sm text-stone-500 hover:text-stone-900 underline">
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </a>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            {onSale ? (
              <>
                <span className="text-2xl font-semibold text-red-600">{formatPrice(displayPrice)}</span>
                <span className="text-lg text-stone-400 line-through">{formatPrice(displayCompare!)}</span>
              </>
            ) : hasRange && !selectedVariant ? (
              <span className="text-2xl font-semibold text-stone-900">From {formatPrice(minPrice)}</span>
            ) : (
              <span className="text-2xl font-semibold text-stone-900">{formatPrice(displayPrice)}</span>
            )}
          </div>

          {/* Color swatches */}
          <div>
            <p className="text-sm text-stone-600 mb-2">
              Color: <span className="text-stone-900 font-medium">{selectedColor}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {colors.map(([color, hex]) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  title={color}
                  aria-label={color}
                  className={`w-9 h-9 rounded-full border transition-all ${
                    selectedColor === color
                      ? 'ring-2 ring-stone-900 ring-offset-2 border-stone-900'
                      : 'border-stone-300 hover:border-stone-500'
                  }`}
                  style={{ backgroundColor: hex ?? '#ccc' }}
                />
              ))}
            </div>
          </div>

          {/* Size buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-stone-600">Size</p>
              <Link to="/size-guide" className="text-xs text-stone-500 underline hover:text-stone-900">
                Size Guide
              </Link>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {sizes.map(size => {
                const available = sizeAvailable(size);
                return (
                  <button
                    key={size}
                    disabled={!available}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 text-sm font-medium border transition-colors ${
                      selectedSize === size
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : available
                        ? 'border-stone-300 hover:border-stone-900'
                        : 'border-stone-200 text-stone-300 line-through cursor-not-allowed'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fit pills */}
          {fits.length > 0 && (
            <div>
              <p className="text-sm text-stone-600 mb-2">Fit</p>
              <div className="flex flex-wrap gap-2">
                {fits.map(fit => (
                  <button
                    key={fit}
                    onClick={() => setSelectedFit(fit)}
                    className={`px-4 py-2 text-sm font-medium border rounded-full transition-colors ${
                      selectedFit === fit
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-300 hover:border-stone-900'
                    }`}
                  >
                    {fit}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <p className="text-sm text-stone-600 mb-2">Quantity</p>
            <div className="inline-flex items-center border border-stone-300">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-10 h-10 flex items-center justify-center hover:bg-stone-100 disabled:opacity-40"
              >
                <Minus size={16} />
              </button>
              <span className="w-12 text-center text-sm font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                disabled={quantity >= maxQty}
                className="w-10 h-10 flex items-center justify-center hover:bg-stone-100 disabled:opacity-40"
              >
                <Plus size={16} />
              </button>
            </div>
            {selectedVariant && maxQty > 0 && maxQty <= 5 && (
              <p className="text-xs text-red-600 mt-1.5">Only {maxQty} left in stock</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button onClick={handleAddToBag} className="btn-primary w-full">
              Add to Bag
            </button>
            <button onClick={handleWishlist} className="btn-secondary w-full flex items-center justify-center gap-2">
              <Heart size={16} /> Save to Wishlist
            </button>
          </div>

          {/* Accordions */}
          <div className="border-t border-stone-200">
            {sections.map(section => (
              <div key={section.key} className="border-b border-stone-200">
                <button
                  onClick={() => toggle(section.key)}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <span className="text-sm font-medium text-stone-900">{section.title}</span>
                  <ChevronDown
                    size={18}
                    className={`text-stone-500 transition-transform ${openSection === section.key ? 'rotate-180' : ''}`}
                  />
                </button>
                {openSection === section.key && section.content && (
                  <div className="pb-5 text-sm text-stone-600 whitespace-pre-line leading-relaxed">
                    {section.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-xl font-semibold text-stone-900 mb-6">You May Also Like</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
            {related.map(p => (
              <div key={p.id} className="flex-shrink-0 w-60 snap-start">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      <section id="reviews-section" className="mt-16 scroll-mt-20">
        <h2 className="font-display text-xl font-semibold text-stone-900 mb-6">
          Reviews ({reviews.length})
        </h2>

        <div className="flex items-center gap-4 mb-8">
          <div className="text-4xl font-display font-semibold text-stone-900">{avgRating.toFixed(1)}</div>
          <div>
            <Stars rating={avgRating} size={20} />
            <p className="text-sm text-stone-500 mt-1">
              Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </p>
          </div>
        </div>

        {reviews.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {reviews.map(r => (
              <div key={r.id} className="border border-stone-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <Stars rating={r.rating} />
                  <span className="text-xs text-stone-400">{formatDate(r.created_at)}</span>
                </div>
                {r.title && <h3 className="font-medium text-stone-900 mb-1">{r.title}</h3>}
                {r.body && <p className="text-sm text-stone-600 leading-relaxed">{r.body}</p>}
                <p className="text-xs text-stone-400 mt-3">
                  {r.reviewer_name}
                  {r.verified_purchase && ' · Verified Purchase'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-500 mb-12">No reviews yet. Be the first to share your thoughts.</p>
        )}

        <form onSubmit={submitReview} className="border-t border-stone-200 pt-8 max-w-xl">
          <h3 className="font-display text-lg font-semibold text-stone-900 mb-4">Write a Review</h3>
          <div className="space-y-4">
            <input
              className="input-base"
              placeholder="Your name"
              value={reviewName}
              onChange={e => setReviewName(e.target.value)}
              required
            />
            <div>
              <p className="text-sm text-stone-600 mb-2">Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <button key={i} type="button" onClick={() => setReviewRating(i)} aria-label={`${i} stars`}>
                    <Star
                      size={24}
                      className={i <= reviewRating ? 'fill-stone-900 text-stone-900' : 'text-stone-300'}
                    />
                  </button>
                ))}
              </div>
            </div>
            <input
              className="input-base"
              placeholder="Review title"
              value={reviewTitle}
              onChange={e => setReviewTitle(e.target.value)}
            />
            <textarea
              className="input-base min-h-[100px]"
              placeholder="Share your thoughts on this product..."
              value={reviewBody}
              onChange={e => setReviewBody(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary">
              Submit Review
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
