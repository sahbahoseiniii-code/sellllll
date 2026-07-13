import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User, LogOut, Heart, ShoppingBag, Package, Home as HomeIcon, CheckCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Order, OrderItem } from '../lib/supabase';
import { formatPrice, formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

type Tab = 'profile' | 'orders' | 'wishlist' | 'addresses' | 'signout';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AccountPage() {
  const { user, signOut, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') as Tab | null;
  const activeTab: Tab = tabParam ?? 'profile';

  // Auth guard — redirect to /auth if signed out (and auth has resolved).
  if (!user && !loading) {
    return <Navigate to="/auth?redirect=/account" replace />;
  }
  if (loading || !user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-stone-50">
        <p className="text-sm text-stone-500">Loading…</p>
      </div>
    );
  }

  const setTab = (t: Tab) => setSearchParams(t === 'profile' ? {} : { tab: t });

  const navItems: { key: Tab; label: string; icon: typeof User }[] = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'orders', label: 'Orders', icon: ShoppingBag },
    { key: 'wishlist', label: 'Wishlist', icon: Heart },
    { key: 'addresses', label: 'Addresses', icon: HomeIcon },
    { key: 'signout', label: 'Sign Out', icon: LogOut },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-bold text-stone-900 mb-8">My Account</h1>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
          {/* Sidebar */}
          <nav className="border-r border-stone-200 pr-2">
            <ul className="space-y-1">
              {navItems.map(({ key, label, icon: Icon }) => {
                const isActive = activeTab === key;
                return (
                  <li key={key}>
                    <button
                      onClick={() => setTab(key)}
                      className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors ${
                        isActive ? 'bg-stone-100 text-stone-900 font-medium' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Content */}
          <div className="min-w-0">
            {activeTab === 'profile' && <ProfileTab userId={user.id} email={user.email ?? ''} toast={toast} />}
            {activeTab === 'orders' && <OrdersTab userId={user.id} />}
            {activeTab === 'wishlist' && <WishlistTab />}
            {activeTab === 'addresses' && <AddressesTab toast={toast} />}
            {activeTab === 'signout' && (
              <SignOutTab
                onConfirm={async () => {
                  await signOut();
                  navigate('/');
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Profile tab ----------------------------- */

function ProfileTab({ userId, email, toast }: { userId: string; email: string; toast: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (cancelled) return;
      setFullName((data as { full_name?: string } | null)?.full_name ?? '');
      setPhone((data as { phone?: string } | null)?.phone ?? '');
      setLoadingProfile(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, email, full_name: fullName, phone });
    setSaving(false);
    if (error) { toast('Could not save profile', 'error'); return; }
    toast('Profile updated');
  };

  if (loadingProfile) {
    return <p className="text-sm text-stone-500">Loading profile…</p>;
  }

  return (
    <section>
      <h2 className="font-display text-xl font-bold text-stone-900 mb-6">Profile</h2>
      <form onSubmit={handleSave} className="max-w-md space-y-5">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-stone-500 mb-2">Full name</label>
          <input className="input-base" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-stone-500 mb-2">Email</label>
          <input className="input-base bg-stone-100 text-stone-500 cursor-not-allowed" value={email} readOnly disabled />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-stone-500 mb-2">Phone</label>
          <input className="input-base" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
      </form>
    </section>
  );
}

/* ------------------------------ Orders tab ----------------------------- */

function OrdersTab({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<(Order & { order_items?: OrderItem[] })[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      setOrders((data as (Order & { order_items?: OrderItem[] })[]) ?? []);
      setLoadingOrders(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  if (loadingOrders) return <p className="text-sm text-stone-500">Loading orders…</p>;
  if (orders.length === 0) {
    return (
      <section>
        <h2 className="font-display text-xl font-bold text-stone-900 mb-6">Orders</h2>
        <div className="bg-white border border-stone-200 p-12 text-center">
          <Package className="w-10 h-10 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-600 mb-4">You haven't placed any orders yet.</p>
          <Link to="/" className="btn-primary inline-block">Start Shopping</Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-display text-xl font-bold text-stone-900 mb-6">Orders</h2>
      <div className="space-y-3">
        {orders.map((order) => {
          const isOpen = expanded === order.id;
          const items = order.order_items ?? [];
          return (
            <div key={order.id} className="bg-white border border-stone-200">
              <button
                onClick={() => setExpanded(isOpen ? null : order.id)}
                className="w-full flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 px-5 py-4 text-left hover:bg-stone-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-900">#{order.order_number}</p>
                  <p className="text-xs text-stone-500">{formatDate(order.created_at)}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full capitalize ${STATUS_STYLES[order.status] ?? 'bg-stone-100 text-stone-700'}`}>
                  {order.status}
                </span>
                <span className="text-sm font-medium text-stone-900">{formatPrice(order.total)}</span>
              </button>

              {isOpen && (
                <div className="border-t border-stone-200 px-5 py-4">
                  <ul className="divide-y divide-stone-100">
                    {items.map((item) => (
                      <li key={item.id} className="flex items-center gap-4 py-3">
                        <div className="w-14 h-14 bg-stone-100 flex-shrink-0 overflow-hidden">
                          {item.product_snapshot?.image_url && (
                            <img src={item.product_snapshot.image_url} alt={item.product_snapshot.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-900 truncate">{item.product_snapshot?.name ?? 'Item'}</p>
                          <p className="text-xs text-stone-500">
                            {item.product_snapshot?.color}{item.product_snapshot?.size ? ` · Size ${item.product_snapshot.size}` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-stone-500">Qty {item.quantity}</p>
                          <p className="text-sm font-medium text-stone-900">{formatPrice(item.total_price)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ----------------------------- Wishlist tab ---------------------------- */

function WishlistTab() {
  return (
    <section>
      <h2 className="font-display text-xl font-bold text-stone-900 mb-6">Wishlist</h2>
      <div className="bg-white border border-stone-200 p-12 text-center">
        <Heart className="w-10 h-10 text-stone-300 mx-auto mb-4" />
        <p className="text-stone-600 mb-4">Your wishlist is empty.</p>
        <Link to="/" className="btn-primary inline-block">Browse Products</Link>
      </div>
    </section>
  );
}

/* ---------------------------- Addresses tab --------------------------- */

function AddressesTab({ toast }: { toast: (m: string, t?: 'success' | 'error' | 'info') => void }) {
  const [fullName, setFullName] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast('Address saved');
  };

  return (
    <section>
      <h2 className="font-display text-xl font-bold text-stone-900 mb-6">Addresses</h2>
      <form onSubmit={handleSave} className="max-w-md space-y-5">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-stone-500 mb-2">Full name</label>
          <input className="input-base" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-stone-500 mb-2">Address line 1</label>
          <input className="input-base" value={line1} onChange={(e) => setLine1(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-stone-500 mb-2">Address line 2</label>
          <input className="input-base" value={line2} onChange={(e) => setLine2(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-stone-500 mb-2">City</label>
            <input className="input-base" value={city} onChange={(e) => setCity(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-stone-500 mb-2">State</label>
            <input className="input-base" value={state} onChange={(e) => setState(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-stone-500 mb-2">Postal code</label>
            <input className="input-base" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-stone-500 mb-2">Country</label>
            <input className="input-base" value={country} onChange={(e) => setCountry(e.target.value)} required />
          </div>
        </div>
        <button type="submit" className="btn-primary">Save Address</button>
      </form>
    </section>
  );
}

/* ---------------------------- Sign Out tab ----------------------------- */

function SignOutTab({ onConfirm }: { onConfirm: () => void }) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold text-stone-900 mb-6">Sign Out</h2>
      <div className="bg-white border border-stone-200 p-8 max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <LogOut className="w-5 h-5 text-stone-500" />
          <p className="text-stone-600">You'll be signed out and returned to the home page.</p>
        </div>
        <button onClick={onConfirm} className="btn-primary">Sign Out</button>
      </div>
    </section>
  );
}
