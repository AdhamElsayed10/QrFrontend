<<<<<<< HEAD
import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { QRMark } from '../components/qrcode-mark';
import { BorderBeam } from '../components/magicui/border-beam';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      // PublicRoute redirects to /dashboard when admin state updates
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh flex items-center justify-center p-4 bg-background">
      {/* Ambient light — warm, off-axis, not a centered purple glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-1/4 -right-1/4 w-[42rem] h-[42rem] bg-primary/[0.06] rounded-full blur-3xl" />
        <div className="absolute -bottom-1/3 -left-1/4 w-[30rem] h-[30rem] bg-[#3d2b1a]/40 rounded-full blur-3xl" />
      </div>

      {/* Oversized wordmark bleeding off-screen, editorial style */}
      <p
        aria-hidden="true"
        className="absolute bottom-[-2.5rem] left-1/2 -translate-x-1/2 font-display font-bold text-[16vw] leading-none tracking-tight text-foreground/[0.025] select-none pointer-events-none whitespace-nowrap"
      >
        PDF · QR
      </p>

      <div className="w-full max-w-sm relative">
        <Card className="relative overflow-hidden shadow-2xl shadow-black/50">
          <BorderBeam size={80} duration={9} />
          <div className="p-8">
            <div className="mb-6">
              <QRMark className="w-11 h-11 mb-4" />
              <h1 className="heading text-xl">Sign in</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Administrator access to PDF QR Manager
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="pl-9 h-10"
                    placeholder="admin@company.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="password">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                  <Input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="pl-9 pr-10 h-10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground transition-colors"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-10 mt-1 text-[15px]">
                {loading ? (
                  <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>Sign in <ArrowRight size={15} /></>
                )}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
=======
import React, { useState } from 'react';
import { QrCode, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      // PublicRoute will redirect to /dashboard when admin state updates
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-brand-900/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl mb-4 shadow-lg shadow-brand-900/50">
            <QrCode size={26} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">PDF QR Manager</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to your admin account</p>
        </div>

        {/* Form */}
        <div className="card shadow-2xl shadow-black/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input pl-9"
                  placeholder="admin@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input pl-9 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
>>>>>>> 1a2fb271cb5e7348ed7c7d2499217915b7e2ea01
