import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, type CartItemWithDetails } from '../lib/supabase';
import { getSessionId } from '../lib/utils';
import { useAuth } from './AuthContext';

interface CartContextType {
  cartId: string | null;
  items: CartItemWithDetails[];
  itemCount: number;
  subtotal: number;
  loading: boolean;
  addToCart: (variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refetch: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cartId, setCartId] = useState<string | null>(null);
  const [items, setItems] = useState<CartItemWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  const getOrCreateCart = useCallback(async (): Promise<string | null> => {
    const sessionId = getSessionId();
    let query = supabase.from('carts').select('id');
    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      query = query.eq('session_id', sessionId).is('user_id', null);
    }
    const { data: existing } = await query.maybeSingle();
    if (existing) { setCartId(existing.id); return existing.id; }
    const { data: created, error } = await supabase
      .from('carts').insert({ user_id: user?.id ?? null, session_id: sessionId }).select('id').single();
    if (error || !created) return null;
    setCartId(created.id);
    return created.id;
  }, [user]);

  const fetchItems = useCallback(async (cid: string) => {
    const { data } = await supabase
      .from('cart_items')
      .select(`id, cart_id, variant_id, quantity, created_at,
        product_variants (id, sku, size, fit, color, color_hex, price, compare_at_price, inventory_count,
          products (id, name, slug, brand, categories(id, name, slug),
            product_images (id, url, alt_text, is_primary, sort_order)))`)
      .eq('cart_id', cid).order('created_at');
    setItems((data as unknown as CartItemWithDetails[]) ?? []);
  }, []);

  const refetch = useCallback(async () => {
    const cid = cartId ?? await getOrCreateCart();
    if (cid) await fetchItems(cid);
  }, [cartId, getOrCreateCart, fetchItems]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const cid = await getOrCreateCart();
      if (cid && mounted) await fetchItems(cid);
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [user, getOrCreateCart, fetchItems]);

  const addToCart = async (variantId: string, quantity = 1) => {
    const cid = cartId ?? await getOrCreateCart();
    if (!cid) return;
    const { data: existing } = await supabase
      .from('cart_items').select('id, quantity').eq('cart_id', cid).eq('variant_id', variantId).maybeSingle();
    if (existing) {
      await supabase.from('cart_items').update({ quantity: existing.quantity + quantity }).eq('id', existing.id);
    } else {
      await supabase.from('cart_items').insert({ cart_id: cid, variant_id: variantId, quantity });
    }
    await fetchItems(cid);
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) return removeItem(itemId);
    await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
    if (cartId) await fetchItems(cartId);
  };

  const removeItem = async (itemId: string) => {
    await supabase.from('cart_items').delete().eq('id', itemId);
    if (cartId) await fetchItems(cartId);
  };

  const clearCart = async () => {
    if (!cartId) return;
    await supabase.from('cart_items').delete().eq('cart_id', cartId);
    setItems([]);
  };

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + (i.product_variants?.price ?? 0) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ cartId, items, itemCount, subtotal, loading, addToCart, updateQuantity, removeItem, clearCart, refetch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
