import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, X, CheckCircle2, Loader2,
  ExternalLink, Download, Copy, Check, AlertCircle, ArrowRight,
  FileUp, Files, Lock,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { copyToClipboard } from '../utils/clipboard';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { BorderBeam } from '../components/magicui/border-beam';
import { BRAND } from '../lib/colors';

const QR_SETTINGS_NOTE = 'Fixed: size 50px, custom placement (x 48 / y 620 from bottom), applied to all pages.';

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

export default function UploadPage() {
  const navigate = useNavigate();

  // Multi-file state — array of File objects
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const dropInputRef = useRef(null);

  // Per-file upload status keyed by array index: { [position]: 'uploading' | 'completed' | 'failed' }
  const [fileStatuses, setFileStatuses] = useState({});

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const hasFiles = files.length > 0;

  const isValidPDF = (file) => file.type === 'application/pdf';

  const addFiles = useCallback((incoming) => {
    const valid = Array.from(incoming).filter(isValidPDF);
    const invalidCount = incoming.length - valid.length;
    if (invalidCount > 0) toast.error(`${invalidCount} file(s) skipped — only PDFs are accepted`);

    setFiles((prev) => {
      const existingKeys = new Set(prev.map((f) => `${f.name}-${f.size}`));
      const newFiles = valid.filter((f) => !existingKeys.has(`${f.name}-${f.size}`));
      return [...prev, ...newFiles];
    });
  }, []);

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => setFiles([]);

  const handleBrowse = (e) => {
    if (e.target.files?.length) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one PDF file');
      return;
    }

    const initialStatuses = {};
    files.forEach((_, i) => { initialStatuses[i] = 'uploading'; });
    setFileStatuses(initialStatuses);
    setResults(null);

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    setLoading(true);
    setUploadProgress(0);

    try {
      const res = await api.post('/documents/upload', formData, {
        timeout: 300000,
        onUploadProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(pct);
        },
      });

      // FormData preserves file order, so response docs map positionally to
      // files. Anything without a returned document counts as failed.
      const newStatuses = {};
      const docs = res.data.documents || [];
      docs.forEach((doc, i) => {
        if (i < files.length) {
          newStatuses[i] = doc.processingStatus === 'COMPLETED' ? 'completed' : 'failed';
        }
      });
      for (let i = docs.length; i < files.length; i++) newStatuses[i] = 'failed';
      setFileStatuses(newStatuses);

      setResults(docs);
      toast.success(`${docs.length} document(s) uploaded`);
    } catch (err) {
      const serverMsg = err.response?.data?.error || err.response?.data?.message;
      const status = err.response?.status;
      console.error(`[Upload] Error (${status}):`, serverMsg || err.message);
      toast.error(serverMsg || `Upload failed (${status || 'network error'})`);

      const failedStatuses = {};
      for (let i = 0; i < files.length; i++) failedStatuses[i] = 'failed';
      setFileStatuses(failedStatuses);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleViewDocument = (doc) => {
    window.open(doc.qrUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadDocument = async (doc) => {
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
    } catch {
      toast.error('Download failed');
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

  // Result-card tone depends on actual outcomes, not a blanket "success"
  const completedCount = results ? results.filter((d) => d.processingStatus === 'COMPLETED').length : 0;
  const failedCount = results ? results.length - completedCount : 0;
  const allCompleted = !!results && failedCount === 0;

  const statusIcon = (status) => {
    switch (status) {
      case 'uploading': return <Loader2 size={14} className="animate-spin text-primary" />;
      case 'completed': return <CheckCircle2 size={14} className="text-success" />;
      case 'failed': return <AlertCircle size={14} className="text-destructive" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="heading text-3xl">Upload PDFs</h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          Drop PDFs and QR codes are generated automatically — one or several at a time
        </p>
      </div>

      {/* Drop zone */}
      <Card className="space-y-4 p-5 sm:p-6">
        <h2 className="heading text-base flex items-center gap-2">
          <FileUp size={16} className="text-primary" />
          Select PDF files
        </h2>

        <div
          role="button"
          tabIndex={0}
          aria-label="Drop PDF files here or press Enter to browse"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => dropInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') dropInputRef.current?.click(); }}
          className={`
            relative border-2 border-dashed rounded-xl py-10 sm:py-12 px-6 transition-all duration-200 cursor-pointer text-center
            focus-visible:outline-none focus-visible:border-primary
            ${dragOver
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50 hover:bg-primary/[0.03]'
            }
          `}
        >
          <input
            ref={dropInputRef}
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={handleBrowse}
          />
          <div className={`
            w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border transition-colors duration-200
            ${dragOver ? 'bg-primary/15 border-primary/40' : 'bg-secondary border-border'}
          `}>
            <Upload size={22} className={dragOver ? 'text-primary' : 'text-muted-foreground'} strokeWidth={1.8} />
          </div>
          <p className="text-base font-medium text-foreground">
            Drop PDF files here, or click to browse
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            One PDF or a batch — each is processed independently
          </p>
        </div>

        {/* Locked QR placement note */}
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Lock size={12} className="flex-shrink-0 mt-0.5 text-primary/60" />
          {QR_SETTINGS_NOTE}
        </p>
      </Card>

      {/* File list */}
      {hasFiles && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Files size={14} className="text-primary" />
              {files.length} {files.length === 1 ? 'file' : 'files'} selected
            </p>
            <Button variant="ghost" size="sm" onClick={clearAll} disabled={loading} className="h-8 px-3">
              Clear all
            </Button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {files.map((file, idx) => {
              const status = fileStatuses[idx];
              return (
                <div
                  key={`${file.name}-${file.size}`}
                  className="flex items-center gap-3 p-3 bg-secondary/70 rounded-lg group"
                >
                  <div className="w-8 h-8 bg-accent border border-border rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-foreground/70" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate leading-tight">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                  </div>
                  {loading && status ? (
                    <div className="flex-shrink-0">{statusIcon(status)}</div>
                  ) : (
                    <button
                      onClick={() => removeFile(idx)}
                      disabled={loading}
                      aria-label={`Remove ${file.name}`}
                      className="text-muted-foreground hover:text-destructive transition-colors p-2 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress */}
      {loading && uploadProgress > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" />
              {uploadProgress >= 100 ? 'Processing QR codes' : 'Uploading'}
            </span>
            {uploadProgress < 100 && <span className="num">{uploadProgress}%</span>}
          </div>
          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload action */}
      <Button
        onClick={handleUpload}
        disabled={loading || !hasFiles}
        size="lg"
        className="h-11 px-6 text-[15px] w-full sm:w-auto"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {loading ? 'Processing' : 'Upload and generate QR codes'}
      </Button>

      {/* Results */}
      {results && (
        <Card className={`relative overflow-hidden space-y-4 p-5 sm:p-6 ${allCompleted ? 'border-success/25' : 'border-warning/30'}`}>
          {allCompleted ? (
            <BorderBeam size={70} duration={8} colorFrom={BRAND.sageBeamFrom} colorTo={BRAND.sageBeamTo} />
          ) : (
            <BorderBeam size={70} duration={8} colorFrom={BRAND.warning} colorTo={BRAND.blueBeamTo} />
          )}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`heading text-base flex items-center gap-2 ${allCompleted ? 'text-success' : 'text-foreground'}`}>
                {allCompleted ? <CheckCircle2 size={16} /> : <AlertCircle size={16} className="text-warning" />}
                Upload finished
              </h3>
              {failedCount > 0 && (
                <Badge variant="warning">
                  <AlertCircle />
                  {failedCount} of {results.length} failed
                </Badge>
              )}
            </div>
            <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard/documents')}>
              <ArrowRight size={12} />
              All documents
            </Button>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {results.map((doc) => {
              const isCopied = copiedId === doc.id;
              const isFailed = doc.processingStatus === 'FAILED';
              return (
                <div key={doc.id} className={`p-3.5 bg-secondary/70 rounded-lg ${isFailed ? 'border border-destructive/20' : ''}`}>
                  <div className="flex items-start justify-between mb-2 gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground">{doc.title}</p>
                        {isFailed ? (
                          <Badge variant="destructive"><AlertCircle /> Failed</Badge>
                        ) : (
                          <Badge variant="success"><CheckCircle2 /> Completed</Badge>
                        )}
                        {doc.isDataFilled ? (
                          <Badge variant="default"><Check /> Contract data filled</Badge>
                        ) : (
                          <Badge variant="muted">Standard PDF · data not filled</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-1.5 truncate">{doc.qrUrl}</p>
                    </div>
                  </div>
                  {!isFailed && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border flex-wrap">
                      <Button size="sm" onClick={() => handleViewDocument(doc)} title="Open QR verification page">
                        <ExternalLink size={12} />
                        Verification page
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleDownloadDocument(doc)} title="Download PDF">
                        <Download size={12} />
                        Download PDF
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleCopyUrl(doc)} title="Copy QR URL">
                        {isCopied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                        {isCopied ? 'Copied' : 'Copy QR URL'}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
