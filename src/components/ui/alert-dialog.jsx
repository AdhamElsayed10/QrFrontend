import React, { forwardRef } from 'react';
import { X, Loader2, Trash2 } from 'lucide-react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { cn } from '../../lib/utils';
import { buttonVariants } from './button';

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const AlertDialogContent = forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-2xl shadow-black/60 duration-200',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AlertDialogTitle = forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn('font-display text-lg font-semibold tracking-tight text-foreground', className)}
    {...props}
  />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

const AlertDialogAction = forwardRef(({ className, loading, children, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(
      buttonVariants({ variant: 'destructive' }),
      'flex-1',
      className
    )}
    {...props}
  >
    {loading
      ? <><Loader2 size={14} className="animate-spin" /> {children}</>
      : children}
  </AlertDialogPrimitive.Action>
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

const AlertDialogCancel = forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(buttonVariants({ variant: 'secondary' }), 'flex-1', className)}
    {...props}
  />
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

/* Delete-style alert dialog with the header icon block included */
function DeleteAlertDialog({
  open,
  onConfirm,
  onCancel,
  loading,
  title,
  description,
  confirmLabel = 'Delete',
  children,
}) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel?.()}>
      <AlertDialogContent>
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute right-4 top-4 rounded-md text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring/50 disabled:pointer-events-none"
        >
          <X size={16} />
          <span className="sr-only">Close</span>
        </button>
        <div className="w-11 h-11 rounded-xl bg-destructive/15 border border-destructive/25 flex items-center justify-center mb-4">
          <Trash2 size={20} className="text-destructive" />
        </div>
        {title && <AlertDialogTitle>{title}</AlertDialogTitle>}
        {description && <AlertDialogDescription className="mt-1.5">{description}</AlertDialogDescription>}
        {children}
        <div className="flex gap-3 mt-6">
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  DeleteAlertDialog,
};
