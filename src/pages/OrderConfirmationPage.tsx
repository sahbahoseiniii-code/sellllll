import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CheckCircle, Loader2, AlertCircle, Home, Package, Truck, CreditCard, ArrowRight,
} from 'lucide-react';
import { supabase, type Order, type OrderItem } from '../lib/supabase';
import { formatPrice, formatDate } from '../lib/utils';

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg';

type OrderWithItems = Order & { order_items: OrderItem[] };

export default function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .maybeSingle();
      if (!mounted) return;
      if (error) {
        setError(error.message);
      } else if (!data) {
        setError('Order not found.');
      } else {
        setOrder(data as OrderWithItems);
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <Loader2 size={40} className="mx-auto text-stone-400 animate-spin mb-4" />
        <p className="text-stone-500">Loading your order…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <AlertCircle size={48} className="mx-auto text-stone-300 mb-6" strokeWidth={1.5} />
        <h1 className="font-display text-2xl font-semibold text-stone-900 mb-3">
          {error === 'Order not found.' ? 'Order not found' : 'Something went wrong'}
        </h1>
        <p className="text-stone-500 mb-8">{error || 'We could not find this order.'}</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <Home size={16} /> Return Home
        </Link>
      </div>
    );
  }

  const items = order.order_items ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-10">
        <CheckCircle size={64} className="mx-auto text-stone-900 mb-5 animate-fade-in" strokeWidth={1.5} />
        <h1 className="font-display text-3xl font-semibold text-stone-900 mb-3 animate-fade-in">
          Thank you for your order!
        </h1>
        <p className="text-lg font-mono text-stone-900 mb-2">{order.order_number || order.id}</p>
        <p className="text-sm text-stone-500">
          {formatDate(order.created_at)} · A confirmation email has been sent.
        </p>
      </div>

      {/* Order items */}
      <section className="border border-stone-200 mb-6">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-stone-200 bg-stone-50">
          <Package size={18} className="text-stone-500" />
          <h2 className="font-display text-lg font-semibold text-stone-900">Items in your order</h2>
        </div>
        <div className="divide-y divide-stone-200">
          {items.map(item => {
            const snap = item.product_snapshot;
            const img = snap.image_url ?? FALLBACK_IMAGE;
            return (
              <div key={item.id} className="flex gap-4 p-5">
                <img src={img} alt={snap.name} className="w-16 h-20 object-cover bg-stone-100 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-900">{snap.name}</p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {snap.color}{snap.size ? ` · ${snap.size}` : ''}{snap.fit ? ` · ${snap.fit}` : ''}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    {item.quantity} × {formatPrice(item.unit_price)}
                  </p>
                </div>
                <p className="font-medium text-stone-900 whitespace-nowrap">
                  {formatPrice(item.total_price)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Delivery + Payment */}
      <div className="grid sm:grid-cols-2 gap-6 mb-6">
        <section className="border border-stone-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Truck size={18} className="text-stone-500" />
            <h2 className="font-display text-lg font-semibold text-stone-900">Delivery</h2>
          </div>
          <address className="not-italic text-sm text-stone-700 leading-relaxed">
            {order.shipping_address.full_name}<br />
            {order.shipping_address.line1}<br />
            {order.shipping_address.line2 && <>{order.shipping_address.line2}<br /></>}
            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}<br />
            {order.shipping_address.country}
          </address>
          <p className="text-sm text-stone-500 mt-3 pt-3 border-t border-stone-200">
            Estimated delivery: <span className="font-medium text-stone-900">5-7 business days</span>
          </p>
        </section>

        <section className="border border-stone-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={18} className="text-stone-500" />
            <h2 className="font-display text-lg font-semibold text-stone-900">Payment</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-600">Subtotal</span>
              <span className="font-medium text-stone-900">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">Shipping</span>
              <span className="font-medium text-stone-900">
                {order.shipping_cost === 0 ? 'Free' : formatPrice(order.shipping_cost)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">Tax</span>
              <span className="font-medium text-stone-900">{formatPrice(order.tax_amount)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-2 mt-2 border-t border-stone-200">
              <span className="text-stone-900">Total</span>
              <span className="text-stone-900">{formatPrice(order.total)}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-200">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-100 text-green-700 px-3 py-1">
              <CheckCircle size={14} /> {order.payment_status === 'paid' ? 'Paid' : order.payment_status}
            </span>
          </div>
        </section>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/" className="btn-primary inline-flex items-center justify-center gap-2">
          <Home size={16} /> Continue Shopping
        </Link>
        <Link to="/account" className="btn-secondary inline-flex items-center justify-center gap-2">
          View All Orders <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
