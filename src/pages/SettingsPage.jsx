import React, { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, Loader2, User, Info, Check, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { QRPlacementEditor, DEFAULT_QR_SETTINGS } from '../components/qr-placement-editor';

function ReqChip({ met, label }) {
  return (
    <span
      aria-live="polite"
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
        met
          ? 'border-success/25 bg-success/15 text-success'
          : 'border-border bg-secondary text-muted-foreground'
      }`}
    >
      {met ? <Check size={10} /> : <X size={10} />}
      {label}
    </span>
  );
}

export default function SettingsPage() {
  const { admin } = useAuth();

  // QR Settings state
  const [qrSettings, setQrSettings] = useState(DEFAULT_QR_SETTINGS);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrSaving, setQrSaving] = useState(false);

  // Password state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadSettings() {
      try {
        const res = await api.get('/settings');
        if (mounted && res.data) {
          setQrSettings({
            qrPosition: res.data.qrPosition || 'custom',
            qrSize: Number(res.data.qrSize) || 65,
            customX: res.data.customX !== undefined && res.data.customX !== null ? Number(res.data.customX) : 464,
            customY: res.data.customY !== undefined && res.data.customY !== null ? Number(res.data.customY) : 175,
            applyTo: res.data.applyTo || 'first',
          });
        }
      } catch (err) {
        console.warn('Could not load settings from server, using defaults:', err);
      } finally {
        if (mounted) setQrLoading(false);
      }
    }
    loadSettings();
    return () => { mounted = false; };
  }, []);

  const handleSaveQRSettings = async () => {
    setQrSaving(true);
    try {
      const res = await api.put('/settings', qrSettings);
      if (res.data) {
        setQrSettings({
          qrPosition: res.data.qrPosition || qrSettings.qrPosition,
          qrSize: Number(res.data.qrSize) || qrSettings.qrSize,
          customX: Number(res.data.customX) !== undefined ? Number(res.data.customX) : qrSettings.customX,
          customY: Number(res.data.customY) !== undefined ? Number(res.data.customY) : qrSettings.customY,
          applyTo: res.data.applyTo || qrSettings.applyTo,
        });
      }
      toast.success('QR placement settings saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save QR settings');
    } finally {
      setQrSaving(false);
    }
  };

  const handleResetQRSettings = () => {
    setQrSettings(DEFAULT_QR_SETTINGS);
    toast.success('Reset to default Fujairah contract placement');
  };

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
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {show[field] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="heading text-3xl">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          Account details and client-side QR placement customization
        </p>
      </div>

      {/* QR Placement Settings — Client Configurable */}
      <Card className="p-5 sm:p-6">
        {qrLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Loader2 size={24} className="animate-spin text-primary" />
            <span className="text-xs">Loading QR placement settings...</span>
          </div>
        ) : (
          <QRPlacementEditor
            value={qrSettings}
            onChange={setQrSettings}
            onSave={handleSaveQRSettings}
            onReset={handleResetQRSettings}
            saving={qrSaving}
          />
        )}
      </Card>

      {/* Account info */}
      <Card className="p-5 sm:p-6">
        <h2 className="heading text-base mb-5 flex items-center gap-2.5">
          <User size={16} className="text-primary" />
          Account information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="email-setting">Email</label>
            <Input id="email-setting" type="email" value={admin?.email || ''} readOnly
              className="h-10 text-muted-foreground cursor-not-allowed" aria-describedby="email-note" />
            <p id="email-note" className="mt-1.5 text-[11px] text-muted-foreground">Managed by the backend — read only</p>
          </div>
          <div>
            <label className="label" htmlFor="role-setting">Role</label>
            <Input id="role-setting" type="text" value="Administrator" readOnly className="h-10 text-muted-foreground cursor-not-allowed" />
          </div>
        </div>
      </Card>

      {/* Change password */}
      <Card className="p-5 sm:p-6">
        <h2 className="heading text-base mb-5 flex items-center gap-2.5">
          <span className="text-primary font-bold text-sm">#</span>
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
          <div className="flex flex-wrap gap-2">
            <ReqChip met={pwForm.newPassword.length >= 8} label="At least 8 characters" />
            {pwForm.confirmPassword.length > 0 && (
              <ReqChip met={pwForm.newPassword === pwForm.confirmPassword} label="Passwords match" />
            )}
          </div>
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
