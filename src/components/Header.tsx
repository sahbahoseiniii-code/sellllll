import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User, Menu, X, Heart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const navLinks = [
  { label: "Women's Jeans", path: '/category/womens-jeans' },
  { label: "Men's Jeans", path: '/category/mens-jeans' },
  { label: "Women's Coats", path: '/category/womens-coats' },
  { label: "Men's Coats", path: '/category/mens-coats' },
  { label: 'Sale', path: '/sale' },
];

export default function Header({ onCartOpen }: { onCartOpen: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { itemCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-stone-200 transition-shadow duration-200 ${scrolled ? 'shadow-sm' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button className="lg:hidden p-2 -ml-2" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>

            <Link to="/" className="font-display text-xl font-bold tracking-widest text-stone-900">
              DENIM & CO
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map(link => (
                <Link key={link.path} to={link.path}
                  className={`text-sm font-medium transition-colors ${link.label === 'Sale' ? 'text-red-600 hover:text-red-700' : 'text-stone-600 hover:text-stone-900'}`}>
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 hover:bg-stone-100 rounded-full transition-colors" aria-label="Search">
                <Search size={20} />
              </button>
              <Link to="/account" className="p-2 hover:bg-stone-100 rounded-full transition-colors hidden sm:block" aria-label="Account">
                <User size={20} />
              </Link>
              <Link to="/account" className="p-2 hover:bg-stone-100 rounded-full transition-colors hidden sm:block" aria-label="Wishlist">
                <Heart size={20} />
              </Link>
              <button onClick={onCartOpen} className="p-2 hover:bg-stone-100 rounded-full transition-colors relative" aria-label="Cart">
                <ShoppingBag size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-stone-900 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-stone-200 bg-white animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <form onSubmit={handleSearch} className="flex items-center gap-3">
                <Search size={20} className="text-stone-400" />
                <input autoFocus type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search for jeans, coats, colors..." className="flex-1 text-sm outline-none bg-transparent" />
                <button type="button" onClick={() => setSearchOpen(false)} className="p-1 hover:bg-stone-100 rounded">
                  <X size={18} />
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl animate-slide-in-right">
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <span className="font-display text-lg font-bold tracking-wider">DENIM & CO</span>
              <button onClick={() => setMobileOpen(false)} className="p-2"><X size={22} /></button>
            </div>
            <nav className="p-4 flex flex-col gap-1">
              {navLinks.map(link => (
                <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)}
                  className={`py-3 px-3 text-sm font-medium hover:bg-stone-100 rounded ${link.label === 'Sale' ? 'text-red-600' : 'text-stone-700'}`}>
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-stone-200 my-2" />
              <Link to="/account" onClick={() => setMobileOpen(false)} className="py-3 px-3 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded">My Account</Link>
              <Link to="/size-guide" onClick={() => setMobileOpen(false)} className="py-3 px-3 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded">Size Guide</Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
