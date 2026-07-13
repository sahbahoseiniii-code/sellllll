import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import AuthPage from './pages/AuthPage';
import AccountPage from './pages/AccountPage';
import SearchPage from './pages/SearchPage';
import SalePage from './pages/SalePage';
import SizeGuidePage from './pages/SizeGuidePage';
import AdminPage from './pages/AdminPage';

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isCheckout = location.pathname === '/checkout';

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdmin && <Header onCartOpen={() => setCartOpen(true)} />}
      <main className={`flex-1 ${!isAdmin ? 'pt-16' : ''}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/sale" element={<SalePage />} />
          <Route path="/size-guide" element={<SizeGuidePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdmin && !isCheckout && <Footer />}
      {!isAdmin && <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />}
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-8xl font-display font-bold text-stone-200 mb-4">404</p>
      <h1 className="text-2xl font-display font-semibold text-stone-900 mb-2">Page Not Found</h1>
      <p className="text-stone-500 mb-8">The page you're looking for doesn't exist.</p>
      <a href="/" className="btn-primary">Back to Home</a>
    </div>
  );
}
