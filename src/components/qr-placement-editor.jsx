import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Sliders, RotateCcw, Save, Move, Check, Layers, Loader2, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { QRMark } from './qrcode-mark';
import { cn } from '../lib/utils';

export const DEFAULT_QR_SETTINGS = {
  qrPosition: 'custom',
  qrSize: 65,
  customX: 464,
  customY: 175,
  applyTo: 'first',
};

const PAGE_WIDTH_PT = 595;
const PAGE_HEIGHT_PT = 842;

const PRESETS = [
  { id: 'custom', label: 'Custom' },
  { id: 'bottom-right', label: 'Bottom Right', x: 464, y: 175 },
  { id: 'bottom-left', label: 'Bottom Left', x: 40, y: 40 },
  { id: 'top-right', label: 'Top Right', x: 464, y: 735 },
  { id: 'top-left', label: 'Top Left', x: 40, y: 735 },
];

export function QRPlacementEditor({
  value = DEFAULT_QR_SETTINGS,
  onChange,
  onSave,
  onReset,
  saving = false,
  showSaveButton = true,
  compact = false,
  title = 'QR Code Placement',
  description = 'Configure default position, dimensions, and page targeting for QR codes',
}) {
  const settings = { ...DEFAULT_QR_SETTINGS, ...value };
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateSetting = (key, val) => {
    if (!onChange) return;
    onChange({
      ...settings,
      [key]: val,
    });
  };

  const selectPreset = (preset) => {
    if (!onChange) return;
    if (preset.id === 'custom') {
      onChange({ ...settings, qrPosition: 'custom' });
    } else {
      onChange({
        ...settings,
        qrPosition: preset.id,
        customX: preset.x,
        customY: preset.y,
      });
    }
  };

  // Convert pointer event coordinates on the canvas to PDF pt coordinates
  const handlePointerCanvas = useCallback((e) => {
    if (!canvasRef.current || !onChange) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const normX = Math.max(0, Math.min(1, clickX / rect.width));
    const normY = Math.max(0, Math.min(1, (rect.bottom - e.clientY) / rect.height));

    const qrSize = Number(settings.qrSize) || 65;
    const rawX = Math.round(normX * PAGE_WIDTH_PT - qrSize / 2);
    const rawY = Math.round(normY * PAGE_HEIGHT_PT - qrSize / 2);

    const clampedX = Math.max(0, Math.min(PAGE_WIDTH_PT - qrSize, rawX));
    const clampedY = Math.max(0, Math.min(PAGE_HEIGHT_PT - qrSize, rawY));

    onChange({
      ...settings,
      qrPosition: 'custom',
      customX: clampedX,
      customY: clampedY,
    });
  }, [settings, onChange]);

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    handlePointerCanvas(e);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e) => {
      handlePointerCanvas(e);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, handlePointerCanvas]);

  const qrSize = Math.max(20, Math.min(250, Number(settings.qrSize) || 65));
  const customX = Math.max(0, Math.min(PAGE_WIDTH_PT - qrSize, Number(settings.customX) || 0));
  const customY = Math.max(0, Math.min(PAGE_HEIGHT_PT - qrSize, Number(settings.customY) || 0));

  const leftPct = (customX / PAGE_WIDTH_PT) * 100;
  const bottomPct = (customY / PAGE_HEIGHT_PT) * 100;
  const widthPct = (qrSize / PAGE_WIDTH_PT) * 100;
  const heightPct = (qrSize / PAGE_HEIGHT_PT) * 100;

  return (
    <div className="space-y-5">
      {/* Header */}
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <QRMark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="heading text-base">{title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-normal border-primary/30 text-primary">
            Interactive Editor
          </Badge>
        </div>
      )}

      {/* Main Grid: Controls + Interactive Preview Canvas */}
      <div className={cn(
        'grid gap-6 items-start',
        compact ? 'grid-cols-1 md:grid-cols-12' : 'grid-cols-1 lg:grid-cols-12'
      )}>
        {/* Controls Column */}
        <div className={cn('space-y-4', compact ? 'md:col-span-7' : 'lg:col-span-7')}>
          {/* Preset Buttons */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-2">Position Preset</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESETS.map((p) => {
                const isActive = settings.qrPosition === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPreset(p)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-xs font-medium border text-center transition-all duration-150',
                      isActive
                        ? 'border-primary bg-primary/15 text-primary shadow-sm ring-1 ring-primary/40'
                        : 'border-border bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Coordinate Inputs: X & Y */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground" htmlFor="qr-custom-x">
                  X (from left, pt)
                </label>
                <span className="text-[11px] font-mono text-muted-foreground">{customX}</span>
              </div>
              <Input
                id="qr-custom-x"
                type="number"
                min="0"
                max={PAGE_WIDTH_PT - qrSize}
                value={customX}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onChange({ ...settings, customX: Number.isNaN(val) ? 0 : val, qrPosition: 'custom' });
                }}
                className="h-9 font-mono text-xs"
              />
              <input
                type="range"
                min="0"
                max={PAGE_WIDTH_PT - qrSize}
                value={customX}
                onChange={(e) => {
                  onChange({ ...settings, customX: parseInt(e.target.value, 10), qrPosition: 'custom' });
                }}
                className="w-full mt-1.5 accent-primary h-1 bg-secondary rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground" htmlFor="qr-custom-y">
                  Y (from bottom, pt)
                </label>
                <span className="text-[11px] font-mono text-muted-foreground">{customY}</span>
              </div>
              <Input
                id="qr-custom-y"
                type="number"
                min="0"
                max={PAGE_HEIGHT_PT - qrSize}
                value={customY}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onChange({ ...settings, customY: Number.isNaN(val) ? 0 : val, qrPosition: 'custom' });
                }}
                className="h-9 font-mono text-xs"
              />
              <input
                type="range"
                min="0"
                max={PAGE_HEIGHT_PT - qrSize}
                value={customY}
                onChange={(e) => {
                  onChange({ ...settings, customY: parseInt(e.target.value, 10), qrPosition: 'custom' });
                }}
                className="w-full mt-1.5 accent-primary h-1 bg-secondary rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Size & Page Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground" htmlFor="qr-size">
                  QR Code Size (px)
                </label>
                <span className="text-[11px] font-mono text-muted-foreground">{qrSize}px</span>
              </div>
              <Input
                id="qr-size"
                type="number"
                min="30"
                max="200"
                value={qrSize}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onChange({ ...settings, qrSize: Number.isNaN(val) ? 65 : val });
                }}
                className="h-9 font-mono text-xs"
              />
              <input
                type="range"
                min="30"
                max="180"
                value={qrSize}
                onChange={(e) => updateSetting('qrSize', parseInt(e.target.value, 10))}
                className="w-full mt-1.5 accent-primary h-1 bg-secondary rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Target Pages
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => updateSetting('applyTo', 'first')}
                  className={cn(
                    'h-9 px-2 rounded-lg text-xs font-medium border text-center transition-all flex items-center justify-center gap-1.5',
                    settings.applyTo === 'first'
                      ? 'border-primary bg-primary/15 text-primary ring-1 ring-primary/40'
                      : 'border-border bg-secondary/60 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {settings.applyTo === 'first' && <Check size={11} />}
                  First page
                </button>
                <button
                  type="button"
                  onClick={() => updateSetting('applyTo', 'all')}
                  className={cn(
                    'h-9 px-2 rounded-lg text-xs font-medium border text-center transition-all flex items-center justify-center gap-1.5',
                    settings.applyTo === 'all'
                      ? 'border-primary bg-primary/15 text-primary ring-1 ring-primary/40'
                      : 'border-border bg-secondary/60 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {settings.applyTo === 'all' && <Check size={11} />}
                  All pages
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {settings.applyTo === 'first' ? 'Stamps first page only (recommended for contracts)' : 'Stamps every page of the document'}
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Canvas Column */}
        <div className={cn(
          'flex flex-col items-center justify-center p-4 bg-secondary/40 border border-border rounded-xl',
          compact ? 'md:col-span-5' : 'lg:col-span-5'
        )}>
          <div className="w-full flex items-center justify-between text-[11px] text-muted-foreground mb-2 px-1">
            <span className="flex items-center gap-1">
              <Move size={11} className="text-primary" /> Drag QR or click to place
            </span>
            <span className="font-mono text-[10px]">A4 (595 × 842 pt)</span>
          </div>

          {/* Simulated A4 PDF Document Sheet */}
          <div
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            className={cn(
              'relative w-full max-w-[210px] aspect-[595/842] rounded-md border-2 border-border bg-background p-2.5 shadow-md overflow-hidden select-none cursor-crosshair transition-colors',
              isDragging ? 'border-primary ring-2 ring-primary/30' : 'hover:border-primary/50'
            )}
            title="Click or drag to place QR code"
          >
            {/* Mock PDF Header and Lines */}
            <div className="space-y-1.5 pointer-events-none opacity-40">
              <div className="h-2 w-12 bg-primary/50 rounded-sm mb-2" />
              <div className="h-1 w-full bg-muted-foreground/30 rounded-full" />
              <div className="h-1 w-5/6 bg-muted-foreground/25 rounded-full" />
              <div className="h-1 w-4/6 bg-muted-foreground/20 rounded-full" />
              <div className="mt-3 grid grid-cols-2 gap-1">
                <div className="h-3 bg-muted-foreground/15 rounded-sm" />
                <div className="h-3 bg-muted-foreground/15 rounded-sm" />
              </div>
              <div className="h-1 w-full bg-muted-foreground/20 rounded-full mt-2" />
              <div className="h-1 w-3/4 bg-muted-foreground/20 rounded-full" />
              <div className="h-1 w-4/5 bg-muted-foreground/20 rounded-full" />
            </div>

            {/* Mock Attestation / Stamp Area Indicator */}
            <div className="absolute right-2 bottom-8 w-16 h-10 border border-dashed border-primary/30 rounded flex items-center justify-center pointer-events-none opacity-30">
              <span className="text-[7px] text-primary">Stamp zone</span>
            </div>

            {/* Draggable QR Code Representation */}
            <div
              style={{
                left: `${leftPct}%`,
                bottom: `${bottomPct}%`,
                width: `${Math.max(10, widthPct)}%`,
                height: `${Math.max(10, heightPct)}%`,
              }}
              className={cn(
                'absolute rounded border-2 border-primary bg-primary/25 shadow-lg flex items-center justify-center transition-shadow cursor-grab',
                isDragging ? 'cursor-grabbing scale-105 shadow-primary/40 ring-2 ring-primary' : 'hover:scale-105'
              )}
            >
              <QRMark className="w-full h-full p-0.5 text-primary opacity-90" />
            </div>
          </div>

          {/* Real-time Coordinate Readout */}
          <div className="mt-3 flex items-center justify-center gap-3 text-[11px] font-mono text-muted-foreground">
            <span>X: <strong className="text-foreground">{customX}</strong></span>
            <span>Y: <strong className="text-foreground">{customY}</strong></span>
            <span>Size: <strong className="text-foreground">{qrSize}</strong>px</span>
          </div>
        </div>
      </div>

      {/* Action Buttons: Save & Reset */}
      {showSaveButton && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={saving}
            className="text-xs text-muted-foreground hover:text-foreground h-9"
          >
            <RotateCcw size={13} className="mr-1.5" />
            Reset to defaults
          </Button>

          <Button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="h-9 px-4 text-xs font-medium"
          >
            {saving ? (
              <>
                <Loader2 size={13} className="animate-spin mr-1.5" />
                Saving...
              </>
            ) : (
              <>
                <Save size={13} className="mr-1.5" />
                Save QR Placement
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

