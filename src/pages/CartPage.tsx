import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Minus, Plus, Trash2, Lock, RefreshCw, Truck } from 'lucide-react';
import { supabase, type DiscountCode } from '../lib/supabase';
import { formatPrice, calculateDiscount } from '../lib/utils';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg';

const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_FLAT = 8.99;
const TAX_RATE = 0.08;

const trustBadges = [
  { icon: Lock, label: 'Secure Checkout' },
  { icon: RefreshCw, label: 'Free Returns' },
  { icon: Truck, label: 'Fast Shipping' },
];

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, itemCount } = useCart();
  const { toast } = useToast();

  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<DiscountCode | null>(null);
  const [promoError, setPromoError] = useState('');

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    const { data } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', promoInput.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();
    if (!data) {
      setPromo(null);
      setPromoError('Invalid or expired code');
      return;
    }
    const code = data as DiscountCode;
    if (code.min_order_amount && subtotal < code.min_order_amount) {
      setPromo(null);
      setPromoError(`Requires a minimum order of ${formatPrice(code.min_order_amount)}`);
      return;
    }
    setPromo(code);
    setPromoError('');
    toast('Promo code applied');
  };

  const removePromo = () => {
    setPromo(null);
    setPromoInput('');
    setPromoError('');
  };

  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || promo?.type === 'free_shipping';
  const shipping = freeShipping ? 0 : SHIPPING_FLAT;
  const discount = promo ? calculateDiscount(subtotal, promo) : 0;
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * TAX_RATE * 100) / 100;
  const total = taxable + shipping + tax;
  const remainingForFreeShip = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <ShoppingBag size={48} className="mx-auto text-stone-300 mb-6" strokeWidth={1.5} />
        <h1 className="font-display text-2xl font-semibold text-stone-900 mb-3">Your bag is empty</h1>
        <p className="text-stone-500 mb-8">Looks like you haven't added anything yet.</p>
        <Link to="/" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-3xl font-semibold text-stone-900 mb-2">Shopping Bag</h1>
      <p className="text-sm text-stone-500 mb-8">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
        {/* LEFT: item list */}
        <div className="lg:col-span-2">
          {!freeShipping && remainingForFreeShip > 0 && (
            <div className="bg-stone-100 px-4 py-3 text-sm text-stone-700 mb-4">
              Add <span className="font-medium text-stone-900">{formatPrice(remainingForFreeShip)}</span> more to
              qualify for free shipping.
            </div>
          )}
          <div className="border-t border-stone-200">
            {items.map(item => {
              const v = item.product_variants;
              const p = v?.products;
              if (!v || !p) return null;
              const img =
                p.product_images?.find(i => i.is_primary)?.url ??
                p.product_images?.[0]?.url ??
                FALLBACK_IMAGE;
              const lineTotal = (v.price ?? 0) * item.quantity;
              return (
                <div key={item.id} className="flex gap-4 py-6 border-b border-stone-200">
                  <Link to={`/product/${p.slug}`} className="flex-shrink-0">
                    <img src={img} alt={p.name} className="w-20 h-24 object-cover bg-stone-100" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-4">
                      <div className="min-w-0">
                        <Link to={`/product/${p.slug}`} className="font-medium text-stone-900 hover:underline">
                          {p.name}
                        </Link>
                        <p className="text-xs text-stone-500 mt-0.5">{p.brand}</p>
                        <p className="text-xs text-stone-500 mt-1">
                          {v.color}
                          {v.size ? ` · ${v.size}` : ''}
                          {v.fit ? ` · ${v.fit}` : ''}
                        </p>
                      </div>
                      <p className="font-medium text-stone-900 whitespace-nowrap">{formatPrice(lineTotal)}</p>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="inline-flex items-center border border-stone-300">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-stone-100"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-stone-100"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-stone-400 hover:text-red-600 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Link to="/" className="inline-flex items-center text-sm text-stone-600 hover:text-stone-900 mt-6">
            ← Continue Shopping
          </Link>
        </div>

        {/* RIGHT: sticky summary */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-20 bg-stone-50 p-6 border border-stone-200">
            <h2 className="font-display text-lg font-semibold text-stone-900 mb-4">Order Summary</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-600">Subtotal</span>
                <span className="font-medium text-stone-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Shipping</span>
                <span className="font-medium text-stone-900">
                  {shipping === 0 ? 'Free' : formatPrice(shipping)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span className="font-medium">-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-stone-600">Tax (8%)</span>
                <span className="font-medium text-stone-900">{formatPrice(tax)}</span>
              </div>
            </div>

            {/* Promo code */}
            <div className="mt-4 pt-4 border-t border-stone-200">
              {promo ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700 font-medium">Code "{promo.code}" applied</span>
                  <button onClick={removePromo} className="text-xs text-stone-500 hover:text-stone-900 underline">
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      className="input-base"
                      placeholder="Promo code"
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value)}
                    />
                    <button onClick={applyPromo} className="btn-secondary whitespace-nowrap px-4">
                      Apply
                    </button>
                  </div>
                  {promoError && <p className="text-xs text-red-600 mt-1.5">{promoError}</p>}
                </>
              )}
            </div>

            <div className="flex justify-between font-semibold text-base mt-4 pt-4 border-t border-stone-200">
              <span className="text-stone-900">Total</span>
              <span className="text-stone-900">{formatPrice(total)}</span>
            </div>

            <Link to="/checkout" className="btn-primary w-full mt-5 text-center block">
              Proceed to Checkout
            </Link>

            {/* Trust badges */}
            <div className="mt-6 space-y-3">
              {trustBadges.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 text-sm text-stone-600">
                  <Icon size={18} className="text-stone-500" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
