import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors [&_svg]:size-2.5',
  {
    variants: {
      variant: {
        default: 'border-primary/30 bg-primary/15 text-primary',
        success: 'border-success/25 bg-success/15 text-success',
        warning: 'border-warning/35 bg-warning/15 text-warning',
        destructive: 'border-destructive/25 bg-destructive/15 text-destructive',
        muted: 'border-border bg-secondary text-muted-foreground',
        outline: 'border-border bg-transparent text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
