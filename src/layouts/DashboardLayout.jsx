import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Upload, FileText, Settings,
  LogOut, Menu, ChevronRight, X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { QRMark } from '../components/qrcode-mark';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/dashboard/upload', icon: Upload, label: 'Upload PDFs' },
  { to: '/dashboard/documents', icon: FileText, label: 'Documents' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function DashboardLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const Sidebar = ({ mobile = false }) => (
    <nav
      aria-label="Main navigation"
      className={`flex flex-col h-full bg-secondary/60 border-r border-border
      ${mobile ? 'w-72' : 'w-64'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <QRMark className="w-8 h-8" />
        <div>
          <p className="font-display font-semibold text-sm leading-tight text-foreground">
            PDF QR Manager
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Admin workspace</p>
        </div>
        {mobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav — left-aligned rails, not pills */}
      <div className="flex-1 px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
          Manage
        </p>
        <ul className="space-y-0.5">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={() => mobile && setSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200 group relative
                  ${isActive
                    ? 'bg-accent text-foreground before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                  }
                `}
              >
                <Icon size={16} strokeWidth={1.9} />
                <span>{label}</span>
                <ChevronRight
                  size={14}
                  className="ml-auto opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all duration-200"
                />
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Admin info + logout */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-accent border border-border flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-primary">
              {admin?.email?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{admin?.email}</p>
            <p className="text-[11px] text-muted-foreground">Administrator</p>
          </div>
        </div>
        <Button variant="secondary" className="w-full text-muted-foreground" onClick={handleLogout}>
          <LogOut size={14} />
          Sign out
        </Button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-dvh overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu size={20} />
          </button>
          <QRMark className="w-5 h-5" />
          <span className="font-display font-semibold text-sm">PDF QR Manager</span>
        </div>

        <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
