import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'title' | 'card' | 'avatar' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className,
  variant = 'text',
  width,
  height,
  count = 1,
}) => {
  const baseClasses = 'skeleton';
  
  const variantClasses = {
    text: 'skeleton-text',
    title: 'skeleton-title',
    card: 'skeleton-card',
    avatar: 'skeleton-avatar',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={cn(baseClasses, variantClasses[variant], className)}
            style={style}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
      aria-label="Loading..."
    />
  );
};

// Dashboard-specific skeleton components
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <SkeletonLoader variant="title" height={40} width="60%" />
        <SkeletonLoader variant="text" width="80%" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="elevation-1 rounded-lg p-4 space-y-3">
            <SkeletonLoader variant="rectangular" height={24} width="40%" />
            <SkeletonLoader variant="title" height={32} />
            <SkeletonLoader variant="text" width="70%" />
          </div>
        ))}
      </div>

      {/* Transaction List Skeleton */}
      <div className="elevation-1 rounded-lg p-6 space-y-4">
        <SkeletonLoader variant="title" height={24} width="40%" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
            <SkeletonLoader variant="avatar" />
            <div className="flex-1 space-y-2">
              <SkeletonLoader variant="text" width="60%" />
              <SkeletonLoader variant="text" width="40%" />
            </div>
            <SkeletonLoader variant="rectangular" height={24} width={80} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Card Skeleton
export const CardSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div className="elevation-1 rounded-lg p-6 space-y-4">
      <SkeletonLoader variant="title" height={24} width="50%" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLoader key={i} variant="text" width={i === lines - 1 ? '60%' : '100%'} />
        ))}
      </div>
    </div>
  );
};

