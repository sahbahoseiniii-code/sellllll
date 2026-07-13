import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) { navigate(redirect); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (mode === 'signup' && password.length < 8) { setError('Password must be at least 8 characters'); setLoading(false); return; }
    const { error } = mode === 'signin' ? await signIn(email, password) : await signUp(email, password, fullName);
    setLoading(false);
    if (error) { setError(error); return; }
    navigate(redirect);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 bg-stone-50">
      <div className="w-full max-w-md bg-white p-8 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-center mb-2">{mode === 'signin' ? 'Welcome Back' : 'Create Account'}</h1>
        <p className="text-sm text-stone-500 text-center mb-8">{mode === 'signin' ? 'Sign in to your account' : 'Join us for premium denim and outerwear'}</p>

        <div className="flex border-b border-stone-200 mb-6">
          <button onClick={() => { setMode('signin'); setError(null); }} className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'signin' ? 'border-b-2 border-stone-900 text-stone-900' : 'text-stone-500'}`}>Sign In</button>
          <button onClick={() => { setMode('signup'); setError(null); }} className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'signup' ? 'border-b-2 border-stone-900 text-stone-900' : 'text-stone-500'}`}>Create Account</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">Full Name</label>
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="input-base" placeholder="Jane Doe" />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-base" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} className="input-base pr-10" placeholder={mode === 'signup' ? 'Min 8 characters' : '••••••••'} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}</button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/checkout" className="text-sm text-stone-500 hover:text-stone-900 underline">Continue as Guest</Link>
        </div>
      </div>
    </div>
  );
}
