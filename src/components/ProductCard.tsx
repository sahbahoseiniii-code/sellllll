import { Link } from 'react-router-dom';
import { Heart, Plus } from 'lucide-react';
import { useState } from 'react';
import { formatPrice } from '../lib/utils';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import type { ProductWithDetails } from '../lib/supabase';

export default function ProductCard({ product }: { product: ProductWithDetails }) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [hovered, setHovered] = useState(false);
  const [showSizes, setShowSizes] = useState(false);

  const variants = product.product_variants ?? [];
  const images = product.product_images ?? [];
  const primaryImg = images.find(i => i.is_primary)?.url ?? images[0]?.url;
  const secondaryImg = images[1]?.url;
  const displayImg = hovered && secondaryImg ? secondaryImg : primaryImg;

  const prices = variants.map(v => v.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const onSale = variants.some(v => v.compare_at_price && v.compare_at_price > v.price);
  const comparePrice = variants.find(v => v.compare_at_price && v.compare_at_price > v.price)?.compare_at_price;

  const colors = [...new Map(variants.map(v => [v.color, v.color_hex])).entries()];
  const sizes = [...new Set(variants.map(v => v.size))];

  const handleQuickAdd = async (variantId: string) => {
    await addToCart(variantId);
    toast('Added to bag');
    setShowSizes(false);
  };

  return (
    <div className="group" onMouseEnter={() => setHovered(true)} onMouseLeave={() => { setHovered(false); setShowSizes(false); }}>
      <div className="relative aspect-product bg-stone-100 overflow-hidden">
        <Link to={`/product/${product.slug}`}>
          <img src={displayImg} alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        </Link>
        {onSale && (
          <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1">Sale</span>
        )}
        <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-sm">
          <Heart size={16} className="text-stone-600" />
        </button>
        {sizes.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            {!showSizes ? (
              <button onClick={() => setShowSizes(true)} className="w-full bg-white text-stone-900 text-xs font-medium py-2.5 hover:bg-stone-100 transition-colors">
                + Quick Add
              </button>
            ) : (
              <div className="flex flex-wrap gap-1.5 justify-center">
                {sizes.map(size => {
                  const variant = variants.find(v => v.size === size && v.inventory_count > 0);
                  return (
                    <button key={size} disabled={!variant}
                      onClick={() => variant && handleQuickAdd(variant.id)}
                      className={`min-w-[36px] px-2 py-1.5 text-xs font-medium ${variant ? 'bg-white text-stone-900 hover:bg-stone-900 hover:text-white' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}>
                      {size}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="pt-3">
        <p className="text-[10px] uppercase tracking-wider text-stone-500 mb-1">{product.brand}</p>
        <Link to={`/product/${product.slug}`}>
          <h3 className="text-sm font-medium text-stone-900 line-clamp-2 hover:underline">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-2 mt-1.5">
          {onSale ? (
            <>
              <span className="text-sm font-medium text-red-600">{formatPrice(minPrice)}</span>
              {comparePrice && <span className="text-xs text-stone-400 line-through">{formatPrice(comparePrice)}</span>}
            </>
          ) : (
            <span className="text-sm font-medium text-stone-900">{minPrice !== maxPrice ? `From ${formatPrice(minPrice)}` : formatPrice(minPrice)}</span>
          )}
        </div>
        {colors.length > 1 && (
          <div className="flex gap-1.5 mt-2">
            {Array.from(colors).slice(0, 4).map(([color, hex]) => (
              <span key={color} className="w-3 h-3 rounded-full border border-stone-300" style={{ backgroundColor: hex ?? '#ccc' }} title={color} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
