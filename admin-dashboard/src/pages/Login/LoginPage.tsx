import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStoreBranding } from '../../hooks/useStoreBranding';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const branding = useStoreBranding();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="font-semibold text-2xl text-primary mb-1">{branding.storeName}</h1>
        <p className="text-sm text-slate-500 mb-6">Admin Dashboard</p>

        <label className="block text-xs font-mono uppercase text-slate-500 mb-1" htmlFor="email">Email</label>
        <input
          id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm mb-4 outline-none focus:border-accent"
        />

        <label className="block text-xs font-mono uppercase text-slate-500 mb-1" htmlFor="password">Password</label>
        <input
          id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm mb-4 outline-none focus:border-accent"
        />

        {error && <p className="text-xs text-red-600 mb-4">{error}</p>}

        <button
          type="submit" disabled={loading}
          className="w-full rounded-lg bg-primary text-white py-2.5 text-sm font-medium disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
