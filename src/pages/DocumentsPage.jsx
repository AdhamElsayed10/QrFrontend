<<<<<<< HEAD
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Search, FileText, Trash2, Download, Copy, Check,
  ExternalLink, Loader2, RefreshCw, QrCode, LayoutGrid, List,
  Clock, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { copyToClipboard } from '../utils/clipboard';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { DeleteAlertDialog } from '../components/ui/alert-dialog';

// ─── Status Badge ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PROCESSING: { icon: Loader2, text: 'Processing', variant: 'warning' },
  COMPLETED:  { icon: Check,    text: 'Completed',  variant: 'success' },
  FAILED:     { icon: AlertCircle, text: 'Failed',  variant: 'destructive' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PROCESSING;
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant}>
      <Icon className={status === 'PROCESSING' ? 'animate-spin' : ''} />
      {cfg.text}
    </Badge>
  );
}

const DATA_FILLED_BADGE = (
  <Badge variant="success"><CheckCircle2 /> Filled from PDF</Badge>
);
const NOT_FILLED_BADGE = <Badge variant="muted">Not filled</Badge>;

// ─── Icon-only action button ───────────────────────────────────────────
function ActionBtn({ icon: Icon, label, onClick, loading, disabled, destructive = false }) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        p-2 rounded-lg transition-all duration-150 active:scale-90
        disabled:opacity-30 disabled:cursor-not-allowed
        ${destructive
          ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'}
      `}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Icon size={15} strokeWidth={1.9} />}
    </button>
  );
}

// ─── Document Card (Grid View) ─────────────────────────────────────────
function DocumentCard({ doc, onView, onDownload, onCopyUrl, onDelete, actionState }) {
  const copied = actionState.copiedId === doc.id;

  return (
    <Card className="group hover:border-primary/30 transition-all duration-200 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-accent border border-border rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText size={16} className="text-foreground/70" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate max-w-[200px]">
              {doc.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(doc.createdAt || doc.uploadDate).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <StatusBadge status={doc.processingStatus} />
          {doc.isDataFilled ? DATA_FILLED_BADGE : NOT_FILLED_BADGE}
        </div>
      </div>

      {/* QR URL */}
      <div className="flex items-center gap-2 bg-secondary/70 border border-border rounded-lg px-3 py-2 mb-4 min-w-0">
        <QrCode size={13} className="text-muted-foreground flex-shrink-0" />
        <span className="text-xs font-mono text-muted-foreground truncate">{doc.qrUrl}</span>
        <button
          onClick={() => onCopyUrl(doc)}
          className="ml-auto flex-shrink-0 p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title={copied ? 'Copied' : 'Copy QR URL'}
          aria-label={copied ? 'Copied' : 'Copy QR URL'}
        >
          {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-3.5 border-t border-border">
        <Button variant="secondary" size="sm" onClick={() => onView(doc)} title="View PDF">
          <ExternalLink size={13} />
          View
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDownload(doc)}
          title="Download PDF" disabled={actionState.downloadingId === doc.id}>
          {actionState.downloadingId === doc.id
            ? <Loader2 size={13} className="animate-spin" />
            : <Download size={13} />}
          Download
        </Button>
        <div className="flex-1" />
        <ActionBtn icon={Trash2} label="Delete PDF" destructive onClick={() => onDelete(doc)} />
      </div>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const [docs, setDocs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const limit = 12;
  const searchTimeout = useRef(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/documents', { params: { search, page, limit } });
      setDocs(res.data.documents);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // Debounced search
  const handleSearch = (value) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setPage(1), 300);
  };

  const handleView = (doc) => {
    const viewUrl = doc?.qrToken ? `/pdf/${doc.qrToken}` : doc?.qrUrl;
    window.open(viewUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = async (doc) => {
    setDownloadingId(doc.id);
    try {
      const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCopyUrl = async (doc) => {
    const urlToCopy = doc?.qrUrl || (doc?.qrToken ? `${window.location.origin}/pdf/${doc.qrToken}` : '');
    if (!urlToCopy) {
      toast.error('No QR URL available to copy');
      return;
    }

    const ok = await copyToClipboard(urlToCopy);
    if (ok) {
      setCopiedId(doc.id);
      toast.success('QR URL copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      toast.error('Failed to copy URL to clipboard');
    }
  };

  // Optimistic delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;

    setDocs((prev) => prev.filter((d) => d.id !== targetId));
    setTotal((prev) => Math.max(0, prev - 1));
    setDeleteTarget(null);
    setDeleting(true);

    try {
      await api.delete(`/documents/${targetId}`);
      toast.success('Document deleted');
    } catch {
      toast.error('Failed to delete document');
      fetchDocs();
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-7 max-w-7xl">
      {/* Delete confirmation */}
      <DeleteAlertDialog
        open={!!deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { if (!deleting) setDeleteTarget(null); }}
        loading={deleting}
        title="Delete document"
        description={
          <>
            Delete <span className="text-foreground font-medium">&ldquo;{deleteTarget?.title}&rdquo;</span> permanently?
            This removes the PDF files and its database record — the QR link will stop working.
          </>
        }
        confirmLabel="Delete"
      />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="heading text-3xl">Documents</h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            {total} document{total !== 1 ? 's' : ''} in the library
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-secondary border border-border rounded-lg p-0.5" role="group" aria-label="View mode">
            <button
              aria-label="Table view"
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'table'
                ? 'bg-accent text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List size={15} />
            </button>
            <button
              aria-label="Card grid view"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'grid'
                ? 'bg-accent text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid size={15} />
            </button>
          </div>
          <Button variant="secondary" onClick={fetchDocs} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none" />
        <Input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search documents by name"
          className="pl-9 h-10"
          aria-label="Search documents"
        />
      </div>

      {/* Empty state */}
      {!loading && docs.length === 0 && (
        <Card className="text-center py-16">
          <div className="w-16 h-16 bg-secondary border border-border rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={26} className="text-muted-foreground/50" strokeWidth={1.5} />
          </div>
          <p className="text-foreground font-display font-semibold mb-1">No documents found</p>
          <p className="text-muted-foreground text-sm mb-5">
            {search ? 'Try a different search term' : 'Upload your first PDF to get started'}
          </p>
          {!search && <a href="/dashboard/upload" className="btn-primary inline-flex">Go to upload</a>}
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <div>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="space-y-3">
                  <div className="flex gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="flex-1 space-y-2 py-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-8" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="space-y-2.5">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12" />)}
            </Card>
          )}
        </div>
      )}

      {/* Table view */}
      {!loading && docs.length > 0 && viewMode === 'table' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/80">
                  <th scope="col" className="text-left text-[11px] font-medium text-muted-foreground uppercase tracking-[0.1em] px-5 py-3">Document</th>
                  <th scope="col" className="text-left text-[11px] font-medium text-muted-foreground uppercase tracking-[0.1em] px-5 py-3 hidden sm:table-cell">QR URL</th>
                  <th scope="col" className="text-left text-[11px] font-medium text-muted-foreground uppercase tracking-[0.1em] px-5 py-3 hidden md:table-cell">Date</th>
                  <th scope="col" className="text-left text-[11px] font-medium text-muted-foreground uppercase tracking-[0.1em] px-5 py-3">Data</th>
                  <th scope="col" className="text-left text-[11px] font-medium text-muted-foreground uppercase tracking-[0.1em] px-5 py-3 hidden lg:table-cell">Status</th>
                  <th scope="col" className="text-right text-[11px] font-medium text-muted-foreground uppercase tracking-[0.1em] px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {docs.map((doc) => {
                  const copied = copiedId === doc.id;
                  return (
                    <tr key={doc.id} className="hover:bg-accent/40 transition-colors duration-150">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-accent border border-border rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText size={14} className="text-foreground/70" />
                          </div>
                          <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
                            {doc.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono text-muted-foreground truncate max-w-[200px] block">
                            {doc.qrUrl}
                          </span>
                          <button
                            title={copied ? 'Copied' : 'Copy URL'}
                            aria-label={copied ? 'Copied' : 'Copy URL'}
                            onClick={() => handleCopyUrl(doc)}
                            className="p-1 rounded hover:bg-accent transition-colors flex-shrink-0 text-muted-foreground hover:text-foreground"
                          >
                            {copied
                              ? <Check size={12} className="text-success" />
                              : <Copy size={12} />}
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock size={12} />
                          {new Date(doc.createdAt || doc.uploadDate).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {doc.isDataFilled ? DATA_FILLED_BADGE : NOT_FILLED_BADGE}
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <StatusBadge status={doc.processingStatus} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <ActionBtn icon={ExternalLink} label="Open verification page" onClick={() => handleView(doc)} />
                          <ActionBtn icon={Download} label="Download PDF"
                            onClick={() => handleDownload(doc)} loading={downloadingId === doc.id} />
                          <ActionBtn icon={Trash2} label="Delete PDF" destructive onClick={() => setDeleteTarget(doc)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Grid view */}
      {!loading && docs.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onView={handleView}
              onDownload={handleDownload}
              onCopyUrl={handleCopyUrl}
              onDelete={setDeleteTarget}
              actionState={{ downloadingId, copiedId }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground num">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <ArrowLeft size={13} /> Previous
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next <ArrowRight size={13} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
=======
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Search, FileText, Trash2, Download, Copy, Check,
  ExternalLink, Loader2, RefreshCw, QrCode, LayoutGrid, List,
  Clock, AlertCircle
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

// ─── Confirm Delete Modal ──────────────────────────────────────────────
function ConfirmDeleteModal({ doc, loading, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-900 border border-white/10 rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="w-11 h-11 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
          <Trash2 size={20} className="text-red-400" />
        </div>
        <h3 className="font-semibold text-slate-100 mb-1">Delete Document</h3>
        <p className="text-sm text-slate-400 mb-6">
          Are you sure you want to delete{' '}
          <span className="text-slate-200 font-medium">"{doc?.title}"</span>?
          This will permanently remove the PDF files and database record.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary flex-1 justify-center disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="btn-danger flex-1 justify-center disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PROCESSING: { icon: Loader2, text: 'Processing', classes: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  COMPLETED:  { icon: Check,    text: 'Completed',  classes: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  FAILED:     { icon: AlertCircle, text: 'Failed',  classes: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PROCESSING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.classes}`}>
      <Icon size={12} className={status === 'PROCESSING' ? 'animate-spin' : ''} />
      {cfg.text}
    </span>
  );
}

// ─── Action Button ─────────────────────────────────────────────────────
function ActionBtn({ icon: Icon, label, onClick, loading, disabled, color = 'slate' }) {
  const colorMap = {
    slate: 'text-slate-500 hover:text-slate-300 hover:bg-white/10',
    brand: 'text-slate-500 hover:text-brand-400 hover:bg-brand-500/10',
    emerald: 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10',
    sky: 'text-slate-500 hover:text-sky-400 hover:bg-sky-500/10',
    red: 'text-slate-500 hover:text-red-400 hover:bg-red-500/10',
  };

  return (
    <button
      title={label}
      onClick={onClick}
      disabled={disabled || loading}
      className={`p-2 rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed ${colorMap[color]}`}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Icon size={15} />}
    </button>
  );
}

// ─── Document Card (Grid View) ─────────────────────────────────────────
function DocumentCard({ doc, onView, onDownload, onCopyUrl, onDelete, actionState }) {
  const copied = actionState.copiedId === doc.id;

  return (
    <div className="card group hover:border-white/20 transition-all duration-200 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-brand-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText size={16} className="text-brand-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate max-w-[200px]">
              {doc.title}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {new Date(doc.createdAt || doc.uploadDate).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        <StatusBadge status={doc.processingStatus} />
      </div>

      {/* QR URL */}
      <div className="flex items-center gap-2 bg-surface-800/60 rounded-lg px-3 py-2 mb-4 min-w-0">
        <QrCode size={13} className="text-slate-500 flex-shrink-0" />
        <span className="text-xs font-mono text-slate-500 truncate">{doc.qrUrl}</span>
        <button
          onClick={() => onCopyUrl(doc)}
          className="ml-auto flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
          title={copied ? 'Copied!' : 'Copy QR URL'}
        >
          {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} className="text-slate-500" />}
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 mt-auto pt-3 border-t border-white/5">
        <ActionBtn icon={ExternalLink} label="View PDF" color="emerald"
          onClick={() => onView(doc)} />
        <ActionBtn icon={Download} label="Download PDF" color="sky"
          onClick={() => onDownload(doc)} loading={actionState.downloadingId === doc.id} />
        <div className="flex-1" />
        <ActionBtn icon={Trash2} label="Delete PDF" color="red"
          onClick={() => onDelete(doc)} />
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const [docs, setDocs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const limit = 12;
  const searchTimeout = useRef(null);

  // Fetch documents
  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/documents', { params: { search, page, limit } });
      setDocs(res.data.documents);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // Debounced search
  const handleSearch = (value) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setPage(1), 300);
  };

  // ── View ──
  const handleView = (doc) => {
    window.open(doc.qrUrl, '_blank', 'noopener,noreferrer');
  };

  // ── Download ──
  const handleDownload = async (doc) => {
    setDownloadingId(doc.id);
    try {
      const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Copy QR URL ──
  const handleCopyUrl = async (doc) => {
    try {
      await navigator.clipboard.writeText(doc.qrUrl);
      setCopiedId(doc.id);
      toast.success('QR URL copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  // ── Delete (optimistic) ──
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;

    // Optimistic removal
    setDocs((prev) => prev.filter((d) => d.id !== targetId));
    setTotal((prev) => Math.max(0, prev - 1));
    setDeleteTarget(null);
    setDeleting(true);

    try {
      await api.delete(`/documents/${targetId}`);
      toast.success('Document deleted successfully');
    } catch {
      // Rollback: re-fetch to restore actual state
      toast.error('Failed to delete document');
      fetchDocs();
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  // ── Render ──
  return (
    <div className="space-y-6 max-w-7xl">
      {/* Delete confirmation modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          doc={deleteTarget}
          loading={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { if (!deleting) setDeleteTarget(null); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Documents</h1>
          <p className="text-slate-400 text-sm mt-1">{total} document{total !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-surface-800 rounded-lg border border-white/10 p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-brand-600/20 text-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
              title="Table view"
            >
              <List size={15} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-brand-600/20 text-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
              title="Card grid view"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
          <button onClick={fetchDocs} className="btn-secondary" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search documents by name..."
          className="input pl-9"
        />
      </div>

      {/* Empty state */}
      {!loading && docs.length === 0 && (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-surface-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-slate-600" />
          </div>
          <p className="text-slate-300 font-semibold mb-1">No documents found</p>
          <p className="text-slate-500 text-sm">
            {search ? 'Try a different search term' : 'Upload your first PDF to get started'}
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="card">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse space-y-3">
                  <div className="h-4 bg-surface-800 rounded w-3/4" />
                  <div className="h-3 bg-surface-800 rounded w-1/2" />
                  <div className="h-8 bg-surface-800 rounded" />
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-surface-800 rounded-lg" />
                    <div className="h-8 w-8 bg-surface-800 rounded-lg" />
                    <div className="flex-1" />
                    <div className="h-8 w-8 bg-surface-800 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-surface-800 rounded-lg animate-pulse" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Table View ── */}
      {!loading && docs.length > 0 && viewMode === 'table' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-surface-800/50">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">Document</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">QR URL</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Date</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Status</th>
                  <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {docs.map((doc) => {
                  const copied = copiedId === doc.id;
                  return (
                    <tr key={doc.id} className="hover:bg-white/5 transition-colors">
                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-brand-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText size={14} className="text-brand-400" />
                          </div>
                          <span className="text-sm font-medium text-slate-200 truncate max-w-[180px]">
                            {doc.title}
                          </span>
                        </div>
                      </td>
                      {/* QR URL */}
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono text-slate-500 truncate max-w-[200px] block">
                            {doc.qrUrl}
                          </span>
                          <button
                            title={copied ? 'Copied!' : 'Copy URL'}
                            onClick={() => handleCopyUrl(doc)}
                            className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
                          >
                            {copied
                              ? <Check size={12} className="text-emerald-400" />
                              : <Copy size={12} className="text-slate-500" />
                            }
                          </button>
                        </div>
                      </td>
                      {/* Date */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock size={12} />
                          {new Date(doc.createdAt || doc.uploadDate).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <StatusBadge status={doc.processingStatus} />
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <ActionBtn icon={ExternalLink} label="View PDF" color="emerald" onClick={() => handleView(doc)} />
                          <ActionBtn icon={Download} label="Download PDF" color="sky"
                            onClick={() => handleDownload(doc)} loading={downloadingId === doc.id} />
                          <ActionBtn icon={Trash2} label="Delete PDF" color="red"
                            onClick={() => setDeleteTarget(doc)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Grid / Card View ── */}
      {!loading && docs.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onView={handleView}
              onDownload={handleDownload}
              onCopyUrl={handleCopyUrl}
              onDelete={setDeleteTarget}
              actionState={{ downloadingId, copiedId }}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-500">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
>>>>>>> 1a2fb271cb5e7348ed7c7d2499217915b7e2ea01
