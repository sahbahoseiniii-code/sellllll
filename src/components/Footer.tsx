import { Link } from 'react-router-dom';
import { Globe, Share2, Mail } from 'lucide-react';
import { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="bg-stone-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider mb-4">Shop</h3>
            <ul className="space-y-3">
              <li><Link to="/category/womens-jeans" className="text-stone-400 hover:text-white text-sm transition-colors">Women's Jeans</Link></li>
              <li><Link to="/category/mens-jeans" className="text-stone-400 hover:text-white text-sm transition-colors">Men's Jeans</Link></li>
              <li><Link to="/category/womens-coats" className="text-stone-400 hover:text-white text-sm transition-colors">Women's Coats</Link></li>
              <li><Link to="/category/mens-coats" className="text-stone-400 hover:text-white text-sm transition-colors">Men's Coats</Link></li>
              <li><Link to="/sale" className="text-stone-400 hover:text-white text-sm transition-colors">Sale</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider mb-4">Help</h3>
            <ul className="space-y-3">
              <li><Link to="/size-guide" className="text-stone-400 hover:text-white text-sm transition-colors">Size Guide</Link></li>
              <li><Link to="/shipping" className="text-stone-400 hover:text-white text-sm transition-colors">Shipping Info</Link></li>
              <li><Link to="/returns" className="text-stone-400 hover:text-white text-sm transition-colors">Returns</Link></li>
              <li><Link to="/faq" className="text-stone-400 hover:text-white text-sm transition-colors">FAQ</Link></li>
              <li><Link to="/contact" className="text-stone-400 hover:text-white text-sm transition-colors">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-stone-400 hover:text-white text-sm transition-colors">About Us</a></li>
              <li><a href="#" className="text-stone-400 hover:text-white text-sm transition-colors">Sustainability</a></li>
              <li><a href="#" className="text-stone-400 hover:text-white text-sm transition-colors">Careers</a></li>
              <li><a href="#" className="text-stone-400 hover:text-white text-sm transition-colors">Blog</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider mb-4">Join Our Newsletter</h3>
            <p className="text-stone-400 text-sm mb-4">Get 10% off your first order plus exclusive offers.</p>
            {subscribed ? (
              <p className="text-sm text-green-400">Thanks for subscribing!</p>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); if (email) setSubscribed(true); }} className="flex gap-2">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
                  className="flex-1 bg-stone-800 border border-stone-700 px-3 py-2 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-stone-500" />
                <button type="submit" className="bg-white text-stone-900 px-4 py-2 text-sm font-medium hover:bg-stone-200 transition-colors">Join</button>
              </form>
            )}
            <div className="flex gap-3 mt-6">
              {[Share2, Globe, Mail].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 border border-stone-700 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:border-stone-500 transition-colors">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-stone-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-stone-500 text-xs">© 2026 DENIM & CO. All rights reserved.</p>
          <div className="flex gap-2">
            {['Visa', 'Mastercard', 'PayPal', 'Apple Pay', 'Klarna'].map(p => (
              <span key={p} className="text-[10px] font-medium text-stone-400 border border-stone-700 rounded px-2 py-1">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
