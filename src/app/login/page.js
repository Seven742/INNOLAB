'use client';

import { useState } from 'react';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { signIn } = await import('next-auth/react');
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-bg-main text-text-main flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 10%, rgba(0, 130, 144, 0.15) 0%, transparent 60%),
          radial-gradient(circle at 80% 80%, rgba(43, 120, 197, 0.10) 0%, transparent 50%),
          radial-gradient(circle at 20% 90%, rgba(0, 229, 153, 0.05) 0%, transparent 40%)
        `,
      }}
    >
      <div className="relative w-full max-w-sm z-10">
        {/* Official InnoLab Logo */}
        <div className="text-center mb-6">
          <div className="inline-block p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-border shadow-xl backdrop-blur-xl mb-3">
            <img
              src="/logo.png"
              alt="InnoLab"
              className="h-10 w-auto object-contain mx-auto"
            />
          </div>
          <h1 className="text-lg font-bold text-text-main tracking-tight mt-1">Inventory Management System</h1>
          <p className="text-xs text-text-secondary mt-0.5">InnoLab Kampong Thom, Cambodia</p>
        </div>

        {/* Login Card */}
        <div className="glass-strong rounded-2xl p-6 shadow-2xl border border-border">
          <div className="mb-5">
            <h2 className="text-base font-bold text-text-main">Sign In</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Enter your credentials to access the dashboard
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl">
              <p className="text-xs text-rose-500 dark:text-rose-300 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="admin@innolab.kh"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-text-muted hover:text-text-main transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              loading={loading}
            >
              Sign In
            </Button>
          </form>

          {/* Incubation Lab Footnote */}
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
            <Sparkles className="h-3 w-3 text-gold" />
            <span>InnoLab Innovation & Incubation Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
}
