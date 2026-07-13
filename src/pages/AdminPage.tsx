import { useEffect, useState, useMemo } from 'react';
import {
  LayoutGrid, Package, ShoppingBag, Tag, Plus, X, Loader2, TrendingUp,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Order, ProductWithDetails, DiscountCode, Category } from '../lib/supabase';
import { formatPrice, formatDate } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';

type AdminTab = 'dashboard' | 'products' | 'orders' | 'discounts';

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;
const STATUS_FILTERS = ['all', ...ORDER_STATUSES] as const;
const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};
const PAYMENT_STYLES: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-stone-200 text-stone-700',
};

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('dashboard');

  const navItems: { key: AdminTab; label: string; icon: typeof LayoutGrid }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'orders', label: 'Orders', icon: ShoppingBag },
    { key: 'discounts', label: 'Discounts', icon: Tag },
  ];

  return (
    <div className="min-h-screen flex bg-stone-50">
      {/* Fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 w-60 bg-stone-900 text-white flex flex-col z-20">
        <div className="px-6 py-6 border-b border-stone-800">
          <h1 className="font-display text-lg font-bold tracking-tight">DENIM &amp; CO</h1>
          <p className="text-xs text-stone-400 mt-1">Admin Dashboard</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors rounded ${
                tab === key ? 'bg-stone-800 text-white font-medium' : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content — offset for fixed sidebar */}
      <main className="flex-1 ml-60 min-w-0">
        <div className="p-8">
          {tab === 'dashboard' && <DashboardTab />}
          {tab === 'products' && <ProductsTab />}
          {tab === 'orders' && <OrdersTab />}
          {tab === 'discounts' && <DiscountsTab />}
        </div>
      </main>
    </div>
  );
}

/* ============================ Dashboard tab ============================ */

function DashboardTab() {
  const [stats, setStats] = useState({ orders: 0, revenue: 0, products: 0, lowStock: 0 });
  const [recent, setRecent] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ count: orderCount }, { data: revenueData }, { count: productCount }, { data: lowStock }, { data: recentOrders }] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total'),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('product_variants').select('id').lt('inventory_count', 5),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10),
      ]);
      if (cancelled) return;
      setStats({
        orders: orderCount ?? 0,
        revenue: (revenueData ?? []).reduce((sum, r) => sum + (r.total ?? 0), 0),
        products: productCount ?? 0,
        lowStock: lowStock?.length ?? 0,
      });
      setRecent((recentOrders as Order[]) ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <LoadingState />;

  const cards = [
    { label: 'Total Orders', value: String(stats.orders) },
    { label: 'Revenue', value: formatPrice(stats.revenue) },
    { label: 'Products', value: String(stats.products) },
    { label: 'Low Stock Alerts', value: String(stats.lowStock) },
  ];

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-stone-900 mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-stone-200 shadow-sm p-6">
            <p className="text-xs uppercase tracking-wide text-stone-500 mb-2">{c.label}</p>
            <p className="font-display text-3xl font-bold text-stone-900">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-stone-200">
        <div className="px-6 py-4 border-b border-stone-200">
          <h3 className="font-display text-lg font-semibold text-stone-900">Recent Orders</h3>
        </div>
        {recent.length === 0 ? (
          <p className="px-6 py-10 text-sm text-stone-500 text-center">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-stone-500 border-b border-stone-200">
                  <th className="px-6 py-3 font-medium">Order #</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recent.map((o) => (
                  <tr key={o.id} className="hover:bg-stone-50">
                    <td className="px-6 py-3 font-medium text-stone-900">#{o.order_number}</td>
                    <td className="px-6 py-3 text-stone-600">{formatDate(o.created_at)}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full capitalize ${STATUS_STYLES[o.status] ?? 'bg-stone-100 text-stone-700'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-stone-900">{formatPrice(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================= Products tab =========================== */

function ProductsTab() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, product_variants(*), product_images(*)')
      .eq('is_active', true);
    setProducts((data as ProductWithDetails[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [prod, cats] = await Promise.all([
        supabase.from('products').select('*, product_variants(*), product_images(*)').eq('is_active', true),
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
      ]);
      if (cancelled) return;
      setProducts((prod.data as ProductWithDetails[]) ?? []);
      setCategories((cats.data as Category[]) ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold text-stone-900">Products</h2>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="bg-white border border-stone-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-stone-500 border-b border-stone-200">
                <th className="px-6 py-3 font-medium">Image</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Brand</th>
                <th className="px-6 py-3 font-medium text-center">Variants</th>
                <th className="px-6 py-3 font-medium">Price Range</th>
                <th className="px-6 py-3 font-medium text-right">Total Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {products.map((p) => {
                const variants = p.product_variants ?? [];
                const prices = variants.map((v) => v.price);
                const minPrice = prices.length ? Math.min(...prices) : 0;
                const maxPrice = prices.length ? Math.max(...prices) : 0;
                const stock = variants.reduce((s, v) => s + (v.inventory_count ?? 0), 0);
                const image = p.product_images?.find((i) => i.is_primary) ?? p.product_images?.[0];
                return (
                  <tr key={p.id} className="hover:bg-stone-50">
                    <td className="px-6 py-3">
                      <div className="w-12 h-12 bg-stone-100 overflow-hidden">
                        {image && <img src={image.url} alt={p.name} className="w-full h-full object-cover" />}
                      </div>
                    </td>
                    <td className="px-6 py-3 font-medium text-stone-900">{p.name}</td>
                    <td className="px-6 py-3 text-stone-600">{p.brand}</td>
                    <td className="px-6 py-3 text-center text-stone-600">{variants.length}</td>
                    <td className="px-6 py-3 text-stone-900">
                      {variants.length
                        ? minPrice === maxPrice ? formatPrice(minPrice) : `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
                        : '—'}
                    </td>
                    <td className="px-6 py-3 text-right text-stone-900">{stock}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {products.length === 0 && <p className="px-6 py-10 text-sm text-stone-500 text-center">No products found.</p>}
      </div>

      {showModal && (
        <AddProductModal
          categories={categories}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchProducts(); toast('Product added'); }}
        />
      )}
    </div>
  );
}

function AddProductModal({ categories, onClose, onSaved }: { categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [material, setMaterial] = useState('');
  const [saving, setSaving] = useState(false);

  const slug = useMemo(() => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''), [name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('products').insert({
      name, slug, description, category_id: categoryId || null, brand, material,
      is_featured: false, is_active: true,
    });
    setSaving(false);
    if (error) { toast('Could not add product', 'error'); return; }
    onSaved();
  };

  return (
    <Modal title="Add Product" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name"><input className="input-base" value={name} onChange={(e) => setName(e.target.value)} required /></Field>
        <Field label="Slug"><input className="input-base bg-stone-100 text-stone-500" value={slug} readOnly /></Field>
        <Field label="Description"><textarea className="input-base min-h-[80px]" value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
        <Field label="Category">
          <select className="input-base" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Brand"><input className="input-base" value={brand} onChange={(e) => setBrand(e.target.value)} /></Field>
          <Field label="Material"><input className="input-base" value={material} onChange={(e) => setMaterial(e.target.value)} /></Field>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Product'}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ============================== Orders tab ============================ */

function OrdersTab() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (cancelled) return;
      setOrders((data as Order[]) ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <LoadingState />;

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const updateStatus = async (orderId: string, status: string) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) { toast('Update failed', 'error'); return; }
    toast('Order status updated');
  };

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-stone-900 mb-6">Orders</h2>

      <div className="flex flex-wrap gap-1 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm capitalize transition-colors rounded ${
              filter === f ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white border border-stone-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-stone-500 border-b border-stone-200">
                <th className="px-6 py-3 font-medium">Order #</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Total</th>
                <th className="px-6 py-3 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-stone-50">
                  <td className="px-6 py-3 font-medium text-stone-900">#{o.order_number}</td>
                  <td className="px-6 py-3 text-stone-600">{formatDate(o.created_at)}</td>
                  <td className="px-6 py-3 text-stone-600">{o.shipping_address?.full_name ?? '—'}</td>
                  <td className="px-6 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="border border-stone-300 px-2 py-1 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                    >
                      {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-3 text-right font-medium text-stone-900">{formatPrice(o.total)}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full capitalize ${PAYMENT_STYLES[o.payment_status] ?? 'bg-stone-100 text-stone-700'}`}>
                      {o.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="px-6 py-10 text-sm text-stone-500 text-center">No orders match this filter.</p>}
      </div>
    </div>
  );
}

/* ============================ Discounts tab =========================== */

function DiscountsTab() {
  const { toast } = useToast();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchCodes = async () => {
    const { data } = await supabase.from('discount_codes').select('*');
    setCodes((data as DiscountCode[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCodes(); }, []);

  if (loading) return <LoadingState />;

  const toggleActive = async (code: DiscountCode) => {
    setCodes((prev) => prev.map((c) => (c.id === code.id ? { ...c, is_active: !c.is_active } : c)));
    const { error } = await supabase.from('discount_codes').update({ is_active: !code.is_active }).eq('id', code.id);
    if (error) { toast('Update failed', 'error'); return; }
    toast(`Code ${code.code} ${!code.is_active ? 'activated' : 'deactivated'}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold text-stone-900">Discounts</h2>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Code
        </button>
      </div>

      <div className="bg-white border border-stone-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-stone-500 border-b border-stone-200">
                <th className="px-6 py-3 font-medium">Code</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium text-right">Value</th>
                <th className="px-6 py-3 font-medium">Used / Limit</th>
                <th className="px-6 py-3 font-medium text-center">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {codes.map((c) => (
                <tr key={c.id} className="hover:bg-stone-50">
                  <td className="px-6 py-3 font-mono font-medium text-stone-900">{c.code}</td>
                  <td className="px-6 py-3 text-stone-600 capitalize">{c.type.replace('_', ' ')}</td>
                  <td className="px-6 py-3 text-right text-stone-900">
                    {c.type === 'percent' ? `${c.value}%` : c.type === 'free_shipping' ? 'Free ship' : formatPrice(c.value)}
                  </td>
                  <td className="px-6 py-3 text-stone-600">
                    {c.used_count} / {c.usage_limit ?? '∞'}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => toggleActive(c)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${c.is_active ? 'bg-stone-900' : 'bg-stone-300'}`}
                      aria-label="Toggle active"
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${c.is_active ? 'translate-x-4' : 'translate-x-1'}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {codes.length === 0 && <p className="px-6 py-10 text-sm text-stone-500 text-center">No discount codes yet.</p>}
      </div>

      {showModal && (
        <AddDiscountModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchCodes(); toast('Discount code added'); }} />
      )}
    </div>
  );
}

function AddDiscountModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percent' | 'fixed' | 'free_shipping'>('percent');
  const [value, setValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('discount_codes').insert({
      code: code.toUpperCase(),
      type,
      value: type === 'free_shipping' ? 0 : Number(value) || 0,
      min_order_amount: minOrderAmount ? Number(minOrderAmount) : null,
      usage_limit: usageLimit ? Number(usageLimit) : null,
      used_count: 0,
      is_active: true,
    });
    setSaving(false);
    if (error) { toast('Could not add code', 'error'); return; }
    onSaved();
  };

  return (
    <Modal title="Add Discount Code" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Code"><input className="input-base font-mono uppercase" value={code} onChange={(e) => setCode(e.target.value)} required /></Field>
        <Field label="Type">
          <select className="input-base" value={type} onChange={(e) => setType(e.target.value as 'percent' | 'fixed' | 'free_shipping')}>
            <option value="percent">Percent off</option>
            <option value="fixed">Fixed amount off</option>
            <option value="free_shipping">Free shipping</option>
          </select>
        </Field>
        {type !== 'free_shipping' && (
          <Field label={type === 'percent' ? 'Percent (%)' : 'Amount'}>
            <input type="number" min="0" className="input-base" value={value} onChange={(e) => setValue(e.target.value)} required />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Min order amount"><input type="number" min="0" className="input-base" value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)} /></Field>
          <Field label="Usage limit"><input type="number" min="0" className="input-base" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} /></Field>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Code'}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ============================== Shared bits =========================== */

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium uppercase tracking-wide text-stone-500 mb-2">{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40" onClick={onClose}>
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-xl font-bold text-stone-900">{title}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
