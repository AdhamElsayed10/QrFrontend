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
  // Same contract as DocumentsPage: unknown/null = still processing
  const cfg = STATUS[status] || STATUS.PROCESSING;
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant}>
      <Icon className={status === 'PROCESSING' ? 'animate-spin' : ''} />
      {cfg.text}
    </Badge>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState({ total: 0, all: [], recent: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // One fetch over the whole library: KPIs must count everything,
    // not just the latest-5 slice shown in Recent uploads.
    api.get('/documents?limit=1000').then((res) => {
      const all = res.data.documents;
      setStats({ total: res.data.total, all, recent: all.slice(0, 5) });
    }).finally(() => setLoading(false));
  }, []);

  const todayCount = stats.all.filter((d) => {
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
        <StatBlock label="QR codes ready" value={stats.all.filter((d) => d.processingStatus === 'COMPLETED').length} loading={loading} delay={0.15} accent />
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
      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
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
          <ul className="space-y-1">
            {stats.recent.map((doc) => (
                <li key={doc.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-secondary/70 hover:bg-accent transition-colors duration-200">
                <span className="w-8 h-8 bg-accent border border-border rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText size={14} className="text-foreground/70" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate leading-tight">{doc.title}</p>
                  <p className="text-xs text-muted-foreground leading-tight mt-0.5">
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
