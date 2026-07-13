import { X, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { formatPrice } from '../lib/utils';

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, itemCount, subtotal, updateQuantity, removeItem } = useCart();

  return (
    <>
      <div className={`fixed inset-0 z-[90] bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose} />
      <div className={`fixed right-0 top-0 bottom-0 z-[95] w-full max-w-md bg-white shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <h2 className="font-display text-lg font-semibold">Shopping Bag ({itemCount})</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full"><X size={20} /></button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <ShoppingBag size={48} className="text-stone-300 mb-4" />
            <p className="text-stone-500 mb-6">Your bag is empty</p>
            <button onClick={onClose} className="btn-primary">Continue Shopping</button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.map(item => {
                const v = item.product_variants;
                const p = v?.products;
                const img = p?.product_images?.[0]?.url;
                return (
                  <div key={item.id} className="flex gap-3">
                    <Link to={`/product/${p?.slug}`} onClick={onClose} className="flex-shrink-0">
                      <img src={img} alt={p?.name} className="w-16 h-20 object-cover bg-stone-100" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">{p?.name}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{v?.color} · Size {v?.size}{v?.fit ? ` · ${v.fit}` : ''}</p>
                      <p className="text-sm font-medium text-stone-900 mt-1">{formatPrice(v?.price ?? 0)}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center border border-stone-300">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-stone-100"><Minus size={14} /></button>
                          <span className="px-3 text-sm">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-stone-100"><Plus size={14} /></button>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-stone-400 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-stone-200 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-stone-500">Shipping and taxes calculated at checkout.</p>
              <Link to="/checkout" onClick={onClose} className="btn-primary w-full text-center block">Checkout</Link>
              <Link to="/cart" onClick={onClose} className="text-center text-sm text-stone-600 hover:text-stone-900 underline">View Full Bag</Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
