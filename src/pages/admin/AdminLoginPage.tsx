import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { authService } from '../../services/authService';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await authService.login(username, password);
    setLoading(false);

    if (res.success) {
      navigate('/admin');
    } else {
      setError(res.error || 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#030a06] text-[#eaf3ed] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#7a9987] hover:text-[#10b981] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Portfolio</span>
          </Link>
        </div>

        <div className="rounded-2xl bg-[#06140d] border border-[#143221] p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-[#0a2618] border border-[#17442a] text-[#10b981] flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-[#f0f6f2]">
              Khubaib Salafi CMS
            </h1>
            <p className="text-xs text-[#7d9a88] mt-1 font-mono">
              Portfolio Content Management System
            </p>
          </div>

          {/* Prototype Security Notice */}
          <div className="mb-6 p-3 rounded-lg bg-[#0a1e13] border border-[#1b492f] text-[11px] text-[#93b3a0] flex items-start gap-2.5 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#10b981]">Prototype Authentication:</span>
              <p className="mt-0.5">
                Ready for Supabase Auth in production. For instant prototype access, use default credentials below.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-[#2a0f0f] border border-[#5a1e1e] text-xs text-[#ff9999] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-[#8ba494] mb-1.5">
                Username / Email
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#040e08] border border-[#143322] focus:border-[#10b981] text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#8ba494] mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#040e08] border border-[#143322] focus:border-[#10b981] text-sm text-white outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-[#10b981] hover:bg-[#05df72] text-[#022013] font-bold text-xs uppercase tracking-wider transition-colors mt-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? 'Authenticating...' : 'Sign In to Admin Panel'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#12281a] text-center text-[11px] font-mono text-[#587563]">
            Demo credentials: admin / admin123
          </div>
        </div>

      </div>
    </div>
  );
};
