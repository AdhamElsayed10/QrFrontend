import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { QRMark } from '../components/qrcode-mark';
import { BorderBeam } from '../components/magicui/border-beam';
import { BRAND } from '../lib/colors';

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
        <div
          className="absolute -bottom-1/3 -left-1/4 w-[30rem] h-[30rem] rounded-full blur-3xl"
          style={{ background: BRAND.loginGlowWash }}
        />
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
