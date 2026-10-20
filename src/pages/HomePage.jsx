<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Upload, QrCode, Clock, ArrowRight, Loader2, AlertCircle, Check } from 'lucide-react';
import api from '../services/api';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { NumberTicker } from '../components/magicui/number-ticker';

const STATUS = {
  PROCESSING: { icon: Loader2, text: 'Processing', variant: 'warning' },
  COMPLETED:  { icon: Check, text: 'Completed', variant: 'success' },
  FAILED:     { icon: AlertCircle, text: 'Failed', variant: 'destructive' },
};

function StatusBadge({ status }) {
  if (!status) return <Badge variant="success"><Check /> QR ready</Badge>;
  const cfg = STATUS[status] || STATUS.COMPLETED;
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant}>
      <Icon className={status === 'PROCESSING' ? 'animate-spin' : ''} />
      {cfg.text}
    </Badge>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState({ total: 0, recent: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/documents?limit=5').then((res) => {
      setStats({ total: res.data.total, recent: res.data.documents });
    }).finally(() => setLoading(false));
  }, []);

  const todayCount = stats.recent.filter((d) => {
    const today = new Date().toDateString();
    return new Date(d.createdAt).toDateString() === today;
  }).length;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header — left aligned, display face */}
      <div>
        <h1 className="heading text-3xl">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          Your PDF QR system at a glance
        </p>
      </div>

      {/* Stats — offset 2+1 asymmetric grid instead of three equal cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBlock label="Documents" value={stats.total} loading={loading} delay={0} />
        <StatBlock label="QR codes generated" value={stats.total} loading={loading} delay={0.15} accent />
        <StatBlock label="Added today" value={todayCount} loading={loading} delay={0.3} />
      </div>

      {/* Quick actions — text rows, not twin cards */}
      <Card className="p-2">
        <Link
          to="/dashboard/upload"
          className="group flex items-center gap-4 px-4 py-3.5 rounded-lg hover:bg-accent/70 transition-colors duration-200"
        >
          <span className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center flex-shrink-0">
            <Upload size={16} className="text-primary" strokeWidth={1.9} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-medium text-sm text-foreground">Upload PDFs</span>
            <span className="block text-xs text-muted-foreground mt-0.5">Up to two PDFs per batch, QR codes added automatically</span>
          </span>
          <ArrowRight size={16} className="text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
        </Link>
        <div className="mx-4 my-1 h-px bg-border" />
        <Link
          to="/dashboard/documents"
          className="group flex items-center gap-4 px-4 py-3.5 rounded-lg hover:bg-accent/70 transition-colors duration-200"
        >
          <span className="w-9 h-9 rounded-lg bg-accent border border-border flex items-center justify-center flex-shrink-0">
            <FileText size={16} className="text-foreground/80" strokeWidth={1.9} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-medium text-sm text-foreground">All documents</span>
            <span className="block text-xs text-muted-foreground mt-0.5">Browse, download, and manage every PDF</span>
          </span>
          <ArrowRight size={16} className="text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-1 transition-all duration-200" />
        </Link>
      </Card>

      {/* Recent uploads */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h2 className="heading text-base">Recent uploads</h2>
          <Link to="/dashboard/documents" className="text-xs text-primary hover:underline underline-offset-4 flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : stats.recent.length === 0 ? (
          <div className="text-center py-10">
            <FileText size={30} className="text-muted-foreground/40 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-muted-foreground text-sm mb-4">No documents yet — your first upload will appear here</p>
            <Link to="/dashboard/upload" className="btn-primary inline-flex">
              Upload your first PDF
            </Link>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {stats.recent.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/70 hover:bg-accent transition-colors duration-200">
                <span className="w-8 h-8 bg-accent border border-border rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText size={14} className="text-foreground/70" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <StatusBadge status={doc.processingStatus} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StatBlock({ label, value, loading, delay, accent = false }) {
  return (
    <div className={`
      relative rounded-xl border p-5 overflow-hidden
      ${accent
        ? 'bg-primary/[0.07] border-primary/30 sm:translate-y-2'
        : 'bg-card border-border'}
      ${accent ? 'sm:rounded-2xl' : ''}
    `}>
      <p className="text-xs text-muted-foreground mb-3">{label}</p>
      {loading ? (
        <Skeleton className="h-8 w-14" />
      ) : (
        <p className={`num text-3xl font-semibold ${accent ? 'text-primary' : 'text-foreground'}`}>
          <NumberTicker value={value} delay={delay} />
        </p>
      )}
    </div>
  );
}
=======
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Upload, QrCode, Clock, ArrowRight, Loader2, AlertCircle, Check } from 'lucide-react';
import api from '../services/api';

function StatusBadge({ status }) {
  if (!status) return (
    <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
      <Check size={10} />
      QR Ready
    </span>
  );

  const config = {
    PROCESSING: { icon: Loader2, text: 'Processing', classes: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    COMPLETED:  { icon: Check,    text: 'Completed',  classes: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    FAILED:     { icon: AlertCircle, text: 'Failed',  classes: 'bg-red-500/20 text-red-400 border-red-500/30' },
  };
  const cfg = config[status] || config.COMPLETED;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.classes}`}>
      <Icon size={10} className={status === 'PROCESSING' ? 'animate-spin' : ''} />
      {cfg.text}
    </span>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState({ total: 0, recent: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/documents?limit=5').then((res) => {
      setStats({ total: res.data.total, recent: res.data.documents });
    }).finally(() => setLoading(false));
  }, []);

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Overview of your PDF QR system</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={FileText} label="Total Documents" value={loading ? '—' : stats.total} color="bg-brand-600" />
        <StatCard icon={QrCode} label="QR Codes Generated" value={loading ? '—' : stats.total} color="bg-emerald-600" />
        <StatCard icon={Clock} label="Recent (Today)" value={loading ? '—' : stats.recent.filter(d => {
          const today = new Date().toDateString();
          return new Date(d.createdAt).toDateString() === today;
        }).length} color="bg-violet-600" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/dashboard/upload" className="card hover:border-brand-500/50 transition-all duration-200 group cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-600/20 rounded-xl flex items-center justify-center">
                <Upload size={18} className="text-brand-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-100 text-sm">Upload PDFs</p>
                <p className="text-xs text-slate-500">Upload up to 2 PDFs at once</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link to="/dashboard/documents" className="card hover:border-brand-500/50 transition-all duration-200 group cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                <FileText size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-100 text-sm">All Documents</p>
                <p className="text-xs text-slate-500">Browse and manage your PDFs</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>

      {/* Recent uploads */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-100">Recent Uploads</h2>
          <Link to="/dashboard/documents" className="text-xs text-brand-400 hover:text-brand-300">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-12 bg-surface-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : stats.recent.length === 0 ? (
          <div className="text-center py-8">
            <FileText size={32} className="text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No documents yet</p>
            <Link to="/dashboard/upload" className="btn-primary mt-3 inline-flex">
              Upload your first PDF
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recent.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-800/50 hover:bg-surface-800 transition-colors">
                <div className="w-8 h-8 bg-brand-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText size={14} className="text-brand-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-200 truncate">{doc.title}</p>
                  <p className="text-xs text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={doc.processingStatus} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
>>>>>>> 1a2fb271cb5e7348ed7c7d2499217915b7e2ea01
