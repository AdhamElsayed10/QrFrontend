<<<<<<< HEAD
import React, { useState } from 'react';
import { Save, Eye, EyeOff, Loader2, Lock, User, Info } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { QRMark } from '../components/qrcode-mark';

const FIXED_QR = [
  { label: 'Position', value: 'Custom' },
  { label: 'Size (px)', value: '50' },
  { label: 'X from left', value: '48' },
  { label: 'Y from bottom', value: '620' },
  { label: 'Applied to', value: 'All pages' },
];

export default function SettingsPage() {
  const { admin } = useAuth();

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setPwLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const PasswordField = ({ label, field, value, onChange }) => (
    <div>
      <label className="label" htmlFor={`pw-${field}`}>{label}</label>
      <div className="relative">
        <Input
          id={`pw-${field}`}
          type={show[field] ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className="pr-10 h-10"
          placeholder="At least 8 characters"
          required
        />
        <button
          type="button"
          onClick={() => setShow({ ...show, [field]: !show[field] })}
          aria-label={show[field] ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground transition-colors"
        >
          {show[field] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="heading text-3xl">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          Account details and QR placement defaults
        </p>
      </div>

      {/* QR placement — locked */}
      <Card className="relative">
        <div
          className="absolute inset-0 rounded-xl opacity-[0.35] pointer-events-none [background:repeating-linear-gradient(-45deg,transparent,transparent_6px,hsl(var(--muted))_6px,hsl(var(--muted))_7px)]"
          aria-hidden="true"
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <QRMark className="w-5 h-5 opacity-70" />
            <h2 className="heading text-base">QR code placement</h2>
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground border border-border rounded-full px-2 py-0.5">
              <Lock size={10} /> Fixed
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            Placement is configured server-side and cannot be changed from here.
          </p>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {FIXED_QR.map(({ label, value }) => (
              <div key={label} className="bg-secondary/70 border border-border rounded-lg px-3.5 py-3">
                <dt className="text-[11px] text-muted-foreground mb-1">{label}</dt>
                <dd className="num text-base text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>

      {/* Account info */}
      <Card>
        <h2 className="heading text-base mb-5 flex items-center gap-2.5">
          <User size={16} className="text-primary" />
          Account information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="email-setting">Email</label>
            <Input id="email-setting" type="email" value={admin?.email || ''} readOnly
              className="h-10 opacity-70" aria-describedby="email-note" />
            <p id="email-note" className="mt-1.5 text-[11px] text-muted-foreground">Managed by the backend — read only</p>
          </div>
          <div>
            <label className="label" htmlFor="role-setting">Role</label>
            <Input id="role-setting" type="text" value="Administrator" readOnly className="h-10 opacity-70" />
          </div>
        </div>
      </Card>

      {/* Change password */}
      <Card>
        <h2 className="heading text-base mb-5 flex items-center gap-2.5">
          <Lock size={16} className="text-primary" />
          Change password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <PasswordField
            label="Current password"
            field="current"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
          />
          <PasswordField
            label="New password"
            field="new"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
          />
          <PasswordField
            label="Confirm new password"
            field="confirm"
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <Info size={12} className="flex-shrink-0" />
            Minimum 8 characters. You will need to sign in again after changing it.
          </div>
          <Button type="submit" disabled={pwLoading} className="mt-1">
            {pwLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {pwLoading ? 'Saving' : 'Update password'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
=======
import React, { useState } from 'react';
import { Settings, Save, Eye, EyeOff, Loader2, QrCode } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { admin } = useAuth();

  // ── Password state ──
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);

  // ── Password Handler ──
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setPwLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const PasswordField = ({ label, field, value, onChange }) => (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input
          type={show[field] ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className="input pr-10"
          placeholder="••••••••"
          required
        />
        <button
          type="button"
          onClick={() => setShow({ ...show, [field]: !show[field] })}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
        >
          {show[field] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account and QR placement defaults</p>
      </div>

      {/* ── QR PLACEMENT SETTINGS (Disabled) ── */}
      <div className="card opacity-60">
        <h2 className="font-semibold text-slate-400 mb-4 flex items-center gap-2">
          <QrCode size={16} className="text-slate-500" />
          QR Code Placement (Fixed)
        </h2>

        <div className="space-y-5">
          <div>
            <label className="label">Position</label>
            <input
              type="text"
              value="Custom"
              readOnly
              className="input bg-surface-950/50 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="label">QR Code Size (px)</label>
            <input
              type="text"
              value="50"
              readOnly
              className="input bg-surface-950/50 cursor-not-allowed w-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">X Position (from left)</label>
              <input
                type="text"
                value="48"
                readOnly
                className="input bg-surface-950/50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="label">Y Position (from bottom)</label>
              <input
                type="text"
                value="620"
                readOnly
                className="input bg-surface-950/50 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="label">Apply To</label>
            <input
              type="text"
              value="All pages"
              readOnly
              className="input bg-surface-950/50 cursor-not-allowed"
            />
          </div>

          <p className="text-xs text-slate-500">QR placement settings are fixed and cannot be changed.</p>
        </div>
      </div>

      {/* ── ACCOUNT INFO ── */}
      <div className="card">
        <h2 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Settings size={16} className="text-brand-400" />
          Account Information
        </h2>
        <div className="space-y-3">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={admin?.email || ''}
              readOnly
              className="input bg-surface-950/50 cursor-not-allowed opacity-60"
            />
          </div>
          <div>
            <label className="label">Role</label>
            <input
              type="text"
              value="Administrator"
              readOnly
              className="input bg-surface-950/50 cursor-not-allowed opacity-60"
            />
          </div>
        </div>
      </div>

      {/* ── CHANGE PASSWORD ── */}
      <div className="card">
        <h2 className="font-semibold text-slate-200 mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <PasswordField
            label="Current Password"
            field="current"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
          />
          <PasswordField
            label="New Password"
            field="new"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
          />
          <PasswordField
            label="Confirm New Password"
            field="confirm"
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
          />
          <button type="submit" disabled={pwLoading} className="btn-primary">
            {pwLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {pwLoading ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
>>>>>>> 1a2fb271cb5e7348ed7c7d2499217915b7e2ea01
