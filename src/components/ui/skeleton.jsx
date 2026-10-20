import React from 'react';
import { cn } from '../../lib/utils';

function Skeleton({ className, shimmer = true, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-accent', className)}
      {...props}
    />
  );
}

export { Skeleton };
