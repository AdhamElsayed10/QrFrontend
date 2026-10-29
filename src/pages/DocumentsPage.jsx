import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Search, FileText, Trash2, Download, Copy, Check,
  ExternalLink, Loader2, RefreshCw, QrCode, LayoutGrid, List,
  Clock, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Pencil, Move,
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
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter,
} from '../components/ui/dialog';
import { ContractDataEditor } from '../components/contract-data-editor';
import { QRPlacementEditor, DEFAULT_QR_SETTINGS } from '../components/qr-placement-editor';
import { restampPdf } from '../utils/restampPdf';

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
function DocumentCard({ doc, onView, onDownload, onCopyUrl, onDelete, onEdit, onPlacement, actionState }) {
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
        <Button variant="ghost" size="sm" onClick={() => onEdit(doc)} title="Edit QR fields">
          <Pencil size={13} />
          Edit
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
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [editingDoc, setEditingDoc] = useState(null);
  const [savingContract, setSavingContract] = useState(false);
  const [placementDoc, setPlacementDoc] = useState(null);
  const [placementSettings, setPlacementSettings] = useState(DEFAULT_QR_SETTINGS);
  const [placementSaving, setPlacementSaving] = useState(false);
  const limit = 12;
  const searchTimeout = useRef(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/documents', { params: { search, page, limit } });
      setDocs(res.data.documents);
      setTotal(res.data.total);
    } catch {
      // Network/API hiccup — never collapse this into the empty state.
      setError(true);
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

  const handleSaveContractData = async (payload) => {
    if (!editingDoc) return;
    setSavingContract(true);
    try {
      const res = await api.put(`/documents/${editingDoc.id}/data`, payload);
      const updated = res?.data;
      setDocs((prev) => prev.map((d) => (d.id === editingDoc.id ? { ...d, ...updated } : d)));
      setEditingDoc(null);
      toast.success('QR fields updated');
    } catch {
      toast.error('Failed to update QR fields');
    } finally {
      setSavingContract(false);
    }
  };

  const openPlacement = (doc) => {
    setPlacementDoc(doc);
    setPlacementSettings(DEFAULT_QR_SETTINGS);
  };

  const handleRestamp = async () => {
    if (!placementDoc) return;
    setPlacementSaving(true);
    try {
      const res = await api.get('/documents/' + placementDoc.id + '/original', { responseType: 'arraybuffer' });
      const bytes = await restampPdf(res.data, placementDoc.qrUrl, placementSettings);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = placementDoc.title + '-restamped.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('QR re-stamped PDF downloaded');
      setPlacementDoc(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to re-stamp PDF');
    } finally {
      setPlacementSaving(false);
    }
  };

  const handleResetPlacement = () => {
    setPlacementSettings(DEFAULT_QR_SETTINGS);
    toast.success('Reset to default placement');
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

      {/* Error state — a fetch failure never reads as an empty library */}
      {!loading && error && (
        <Card className="text-center py-16">
          <div className="w-16 h-16 bg-destructive/10 border border-destructive/25 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={26} className="text-destructive" strokeWidth={1.5} />
          </div>
          <p className="text-foreground font-display font-semibold mb-1">Couldn&rsquo;t load documents</p>
          <p className="text-muted-foreground text-sm mb-5">
            The library could not be fetched. Your documents are safe — check the connection and try again.
          </p>
          <Button onClick={fetchDocs} disabled={loading}>
            <RefreshCw size={14} />
            Retry
          </Button>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && docs.length === 0 && (
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
                          {/* copy affordance for phone — QR URL column is hidden below sm */}
                          <span className="sm:hidden">
                            <ActionBtn icon={Copy} label="Copy QR URL" onClick={() => handleCopyUrl(doc)} />
                          </span>
                          <ActionBtn icon={ExternalLink} label="Open verification page" onClick={() => handleView(doc)} />
                          <ActionBtn icon={Download} label="Download PDF"
                            onClick={() => handleDownload(doc)} loading={downloadingId === doc.id} />
                          <ActionBtn icon={Pencil} label="Edit QR fields" onClick={() => setEditingDoc(doc)} />
                          <ActionBtn icon={Move} label="Re-stamp QR placement (client)" onClick={() => openPlacement(doc)} />
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
              onEdit={setEditingDoc}
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

      {/* Edit QR fields dialog */}
      <Dialog open={!!editingDoc} onOpenChange={(open) => { if (!open) setEditingDoc(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogTitle>Edit QR fields</DialogTitle>
          <DialogDescription>
            Update the fields behind this document&rsquo;s QR code. Saving re-marks the data as filled.
          </DialogDescription>
          {editingDoc && (
            <ContractDataEditor
              key={editingDoc.id}
              contractData={editingDoc.contractData}
              onSave={handleSaveContractData}
              saving={savingContract}
            />
          )}
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setEditingDoc(null)} disabled={savingContract}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



