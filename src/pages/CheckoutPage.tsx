import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Plus, Minus, Trash2, Lock, Shield, Check, CheckCircle,
  ChevronRight, ArrowLeft, ArrowRight, Package, Truck, CreditCard,
  Loader2, AlertCircle, User, LogOut, Home, Tag,
} from 'lucide-react';
import { supabase, type Address } from '../lib/supabase';
import { formatPrice } from '../lib/utils';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg';
const TAX_RATE = 0.08;
const FREE_SHIPPING_THRESHOLD = 100;

const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France'];

interface ShippingMethodInfo {
  id: 'standard' | 'express' | 'overnight';
  name: string;
  price: number;
  eta: string;
}

const SHIPPING_METHODS: ShippingMethodInfo[] = [
  { id: 'standard', name: 'Standard', price: 8.99, eta: '5-7 business days' },
  { id: 'express', name: 'Express', price: 18.99, eta: '2-3 business days' },
  { id: 'overnight', name: 'Overnight', price: 29.99, eta: 'Next business day' },
];

interface FormFields {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const emptyForm: FormFields = {
  fullName: '', email: '', phone: '', addressLine1: '', addressLine2: '',
  city: '', state: '', postalCode: '', country: 'United States',
};

function toAddress(f: FormFields): Address {
  return {
    full_name: f.fullName.trim(),
    email: f.email.trim() || undefined,
    phone: f.phone.trim() || undefined,
    line1: f.addressLine1.trim(),
    line2: f.addressLine2.trim() || undefined,
    city: f.city.trim(),
    state: f.state.trim(),
    postal_code: f.postalCode.trim(),
    country: f.country,
  };
}

function AddressFields({
  form, setForm, prefix,
}: {
  form: FormFields;
  setForm: React.Dispatch<React.SetStateAction<FormFields>>;
  prefix: string;
}) {
  const update = (key: keyof FormFields, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-stone-600 mb-1.5">{prefix} Full Name</label>
        <input className="input-base" value={form.fullName} onChange={e => update('fullName', e.target.value)} autoComplete="name" />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1.5">Email</label>
        <input className="input-base" type="email" value={form.email} onChange={e => update('email', e.target.value)} autoComplete="email" />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1.5">Phone</label>
        <input className="input-base" value={form.phone} onChange={e => update('phone', e.target.value)} autoComplete="tel" />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-stone-600 mb-1.5">Address Line 1</label>
        <input className="input-base" value={form.addressLine1} onChange={e => update('addressLine1', e.target.value)} autoComplete="address-line1" />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-stone-600 mb-1.5">Address Line 2 (optional)</label>
        <input className="input-base" value={form.addressLine2} onChange={e => update('addressLine2', e.target.value)} autoComplete="address-line2" />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1.5">City</label>
        <input className="input-base" value={form.city} onChange={e => update('city', e.target.value)} autoComplete="address-level2" />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1.5">State / Province</label>
        <input className="input-base" value={form.state} onChange={e => update('state', e.target.value)} autoComplete="address-level1" />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1.5">Postal Code</label>
        <input className="input-base" value={form.postalCode} onChange={e => update('postalCode', e.target.value)} autoComplete="postal-code" />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1.5">Country</label>
        <select className="input-base" value={form.country} onChange={e => update('country', e.target.value)}>
          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [shippingForm, setShippingForm] = useState<FormFields>(emptyForm);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodInfo['id']>('standard');
  const [billingForm, setBillingForm] = useState<FormFields>(emptyForm);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [card, setCard] = useState({ cardNumber: '', cardName: '', expiry: '', cvc: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedMethod = SHIPPING_METHODS.find(m => m.id === shippingMethod)!;
  const shippingCost =
    shippingMethod === 'standard' && subtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : selectedMethod.price;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = subtotal + shippingCost + tax;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <ShoppingBag size={48} className="mx-auto text-stone-300 mb-6" strokeWidth={1.5} />
        <h1 className="font-display text-2xl font-semibold text-stone-900 mb-3">Your bag is empty</h1>
        <p className="text-stone-500 mb-8">You have nothing to check out yet.</p>
        <Link to="/" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  const goToPayment = () => {
    if (!shippingForm.fullName || !shippingForm.addressLine1 || !shippingForm.city ||
        !shippingForm.state || !shippingForm.postalCode) {
      setError('Please complete all required shipping fields.');
      return;
    }
    setError('');
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlaceOrder = async () => {
    setError('');
    if (!card.cardNumber || !card.cardName || !card.expiry || !card.cvc) {
      setError('Please complete all payment fields.');
      return;
    }
    if (!billingSameAsShipping &&
        (!billingForm.fullName || !billingForm.addressLine1 || !billingForm.city ||
         !billingForm.state || !billingForm.postalCode)) {
      setError('Please complete all required billing fields.');
      return;
    }
    setLoading(true);
    try {
      const shipping_address = toAddress(shippingForm);
      const billing_address = billingSameAsShipping ? shipping_address : toAddress(billingForm);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id ?? null,
          shipping_address,
          billing_address,
          subtotal,
          shipping_cost: shippingCost,
          tax_amount: Math.round(subtotal * TAX_RATE * 100) / 100,
          discount_amount: 0,
          total,
          payment_method: 'card',
          payment_status: 'paid',
          status: 'confirmed',
        })
        .select()
        .single();

      if (orderError || !order) throw orderError ?? new Error('Failed to create order');

      const orderItems = items.map(item => {
        const v = item.product_variants;
        const p = v?.products;
        const img = p?.product_images?.find(i => i.is_primary)?.url ??
          p?.product_images?.[0]?.url ?? FALLBACK_IMAGE;
        return {
          order_id: order.id,
          variant_id: item.variant_id,
          product_snapshot: {
            name: p?.name ?? '',
            sku: v?.sku ?? '',
            color: v?.color ?? '',
            size: v?.size ?? '',
            fit: v?.fit ?? undefined,
            image_url: img,
          },
          quantity: item.quantity,
          unit_price: v?.price ?? 0,
          total_price: (v?.price ?? 0) * item.quantity,
        };
      });

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      await clearCart();
      toast('Order placed successfully!');
      navigate(`/order-confirmation/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong placing your order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-3xl font-semibold text-stone-900 mb-8">Checkout</h1>

      {/* Step indicator */}
      <div className="flex items-center justify-center mb-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium border ${
              step >= 1 ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-400 border-stone-300'
            }`}>
              {step > 1 ? <Check size={16} /> : '1'}
            </div>
            <span className={`text-sm font-medium ${step >= 1 ? 'text-stone-900' : 'text-stone-400'}`}>Shipping</span>
          </div>
          <div className={`w-16 h-px ${step > 1 ? 'bg-stone-900' : 'bg-stone-300'}`} />
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium border ${
              step >= 2 ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-400 border-stone-300'
            }`}>
              {step > 2 ? <Check size={16} /> : '2'}
            </div>
            <span className={`text-sm font-medium ${step >= 2 ? 'text-stone-900' : 'text-stone-400'}`}>Payment</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2">
          {step === 1 && (
            <div className="space-y-8">
              <section>
                <h2 className="font-display text-xl font-semibold text-stone-900 mb-5">Shipping Address</h2>
                <AddressFields form={shippingForm} setForm={setShippingForm} prefix="Shipping" />
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-stone-900 mb-5">Shipping Method</h2>
                <div className="space-y-3">
                  {SHIPPING_METHODS.map(method => {
                    const isFree = method.id === 'standard' && subtotal >= FREE_SHIPPING_THRESHOLD;
                    const cost = isFree ? 0 : method.price;
                    return (
                      <label
                        key={method.id}
                        className={`flex items-center gap-4 p-4 border cursor-pointer transition-colors ${
                          shippingMethod === method.id ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shippingMethod"
                          className="sr-only"
                          checked={shippingMethod === method.id}
                          onChange={() => setShippingMethod(method.id)}
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          shippingMethod === method.id ? 'border-stone-900' : 'border-stone-300'
                        }`}>
                          {shippingMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-stone-900" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Truck size={16} className="text-stone-500" />
                            <span className="font-medium text-stone-900">{method.name}</span>
                            {isFree && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 font-medium">FREE</span>
                            )}
                          </div>
                          <p className="text-sm text-stone-500 mt-0.5">{method.eta}</p>
                        </div>
                        <span className="font-medium text-stone-900 whitespace-nowrap">
                          {cost === 0 ? 'Free' : formatPrice(cost)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>

              <button onClick={goToPayment} className="btn-primary inline-flex items-center gap-2">
                Continue to Payment <ArrowRight size={16} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-xl font-semibold text-stone-900">Payment</h2>
                  <button
                    onClick={() => { setStep(1); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="inline-flex items-center text-sm text-stone-600 hover:text-stone-900"
                  >
                    <ArrowLeft size={14} className="mr-1" /> Edit shipping
                  </button>
                </div>

                <div className="bg-stone-50 border border-stone-200 p-5">
                  <div className="flex items-center gap-2 text-sm text-stone-600 mb-4">
                    <Lock size={16} /> <span>Secure payment — your card details are encrypted.</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1.5">Card Number</label>
                      <input
                        className="input-base" placeholder="1234 5678 9012 3456"
                        value={card.cardNumber} onChange={e => setCard({ ...card, cardNumber: e.target.value })}
                        autoComplete="cc-number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1.5">Name on Card</label>
                      <input
                        className="input-base"
                        value={card.cardName} onChange={e => setCard({ ...card, cardName: e.target.value })}
                        autoComplete="cc-name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1.5">Expiry (MM/YY)</label>
                        <input
                          className="input-base" placeholder="MM/YY"
                          value={card.expiry} onChange={e => setCard({ ...card, expiry: e.target.value })}
                          autoComplete="cc-exp"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1.5">CVC</label>
                        <input
                          className="input-base" placeholder="123"
                          value={card.cvc} onChange={e => setCard({ ...card, cvc: e.target.value })}
                          autoComplete="cc-csc"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox" checked={billingSameAsShipping}
                    onChange={e => setBillingSameAsShipping(e.target.checked)}
                    className="w-4 h-4 accent-stone-900"
                  />
                  <span className="text-sm text-stone-700">Billing address same as shipping</span>
                </label>
                {!billingSameAsShipping && (
                  <div className="pt-2">
                    <h3 className="font-display text-lg font-semibold text-stone-900 mb-4">Billing Address</h3>
                    <AddressFields form={billingForm} setForm={setBillingForm} prefix="Billing" />
                  </div>
                )}
              </section>

              <button
                onClick={handlePlaceOrder} disabled={loading}
                className="btn-primary w-full inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Placing Order…</>
                ) : (
                  <><Lock size={16} /> Place Order — {formatPrice(total)}</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-20 bg-stone-50 p-6 border border-stone-200">
            <h2 className="font-display text-lg font-semibold text-stone-900 mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
              {items.map(item => {
                const v = item.product_variants;
                const p = v?.products;
                const img = p?.product_images?.find(i => i.is_primary)?.url ??
                  p?.product_images?.[0]?.url ?? FALLBACK_IMAGE;
                return (
                  <div key={item.id} className="flex gap-3">
                    <img src={img} alt={p?.name} className="w-14 h-16 object-cover bg-stone-100 flex-shrink-0" />
                    <div className="flex-1 min-w-0 text-sm">
                      <p className="font-medium text-stone-900 truncate">{p?.name}</p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {v?.color}{v?.size ? ` · ${v.size}` : ''}{v?.fit ? ` · ${v.fit}` : ''}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">Qty {item.quantity} × {formatPrice(v?.price ?? 0)}</p>
                    </div>
                    <p className="text-sm font-medium text-stone-900 whitespace-nowrap">
                      {formatPrice((v?.price ?? 0) * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 text-sm pt-4 border-t border-stone-200">
              <div className="flex justify-between">
                <span className="text-stone-600">Subtotal</span>
                <span className="font-medium text-stone-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Shipping</span>
                <span className="font-medium text-stone-900">
                  {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Tax (8%)</span>
                <span className="font-medium text-stone-900">{formatPrice(tax)}</span>
              </div>
            </div>

            <div className="flex justify-between font-semibold text-base mt-4 pt-4 border-t border-stone-200">
              <span className="text-stone-900">Total</span>
              <span className="text-stone-900">{formatPrice(total)}</span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-stone-600">
                <Shield size={18} className="text-stone-500" /><span>Secure Checkout</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-stone-600">
                <Truck size={18} className="text-stone-500" /><span>Fast & Tracked Shipping</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-stone-600">
                <CheckCircle size={18} className="text-stone-500" /><span>Free Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
