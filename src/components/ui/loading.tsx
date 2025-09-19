import React from 'react';
import { Loader2, Brain, Search, Download, RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
  centered?: boolean;
  fullPage?: boolean;
  icon?: 'default' | 'brain' | 'search' | 'download' | 'refresh' | 'sparkles';
}

const LoadingIcon = ({ icon, size }: { icon: LoadingProps['icon']; size: LoadingProps['size'] }) => {
  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';
  const className = `${iconSize} animate-spin`;

  switch (icon) {
    case 'brain':
      return <Brain className={className} />;
    case 'search':
      return <Search className={className} />;
    case 'download':
      return <Download className={className} />;
    case 'refresh':
      return <RefreshCw className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    default:
      return <Loader2 className={className} />;
  }
};

const DotsVariant = ({ size }: { size: LoadingProps['size'] }) => {
  const dotSize = size === 'sm' ? 'h-1 w-1' : size === 'lg' ? 'h-3 w-3' : 'h-2 w-2';
  
  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            dotSize,
            'bg-primary rounded-full animate-bounce'
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  );
};

const PulseVariant = ({ size }: { size: LoadingProps['size'] }) => {
  const pulseSize = size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-12 w-12' : 'h-8 w-8';
  
  return (
    <div className={cn(pulseSize, 'bg-primary/20 rounded-full animate-pulse')} />
  );
};

const SkeletonVariant = ({ size }: { size: LoadingProps['size'] }) => {
  const height = size === 'sm' ? 'h-4' : size === 'lg' ? 'h-8' : 'h-6';
  
  return (
    <div className="space-y-2 w-full max-w-sm">
      <div className={cn(height, 'bg-muted animate-pulse rounded w-full')} />
      <div className={cn(height, 'bg-muted animate-pulse rounded w-3/4')} />
      <div className={cn(height, 'bg-muted animate-pulse rounded w-1/2')} />
    </div>
  );
};

export const Loading: React.FC<LoadingProps> = ({
  variant = 'spinner',
  size = 'md',
  className,
  text,
  centered = true,
  fullPage = false,
  icon = 'default'
}) => {
  const renderLoadingContent = () => {
    switch (variant) {
      case 'dots':
        return <DotsVariant size={size} />;
      case 'pulse':
        return <PulseVariant size={size} />;
      case 'skeleton':
        return <SkeletonVariant size={size} />;
      default:
        return <LoadingIcon icon={icon} size={size} />;
    }
  };

  const loadingContent = (
    <div className={cn(
      'flex items-center gap-3',
      centered && 'justify-center',
      className
    )}>
      {renderLoadingContent()}
      {text && (
        <span className={cn(
          'text-muted-foreground',
          size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
        )}>
          {text}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-background p-6 rounded-lg border shadow-lg">
          {loadingContent}
        </div>
      </div>
    );
  }

  return loadingContent;
};

// Specialized loading components for specific use cases
export const ContentLoadingState = () => (
  <Loading
    variant="spinner"
    icon="brain"
    size="md"
    text="Đang tạo nội dung..."
    className="py-8"
  />
);

export const SearchLoadingState = () => (
  <Loading
    variant="spinner"
    icon="search"
    size="md"
    text="Đang tìm kiếm..."
    className="py-4"
  />
);

export const SaveLoadingState = () => (
  <Loading
    variant="dots"
    size="sm"
    text="Đang lưu..."
    className="py-2"
  />
);

export const ExportLoadingState = () => (
  <Loading
    variant="spinner"
    icon="download"
    size="sm"
    text="Đang xuất file..."
    className="py-2"
  />
);

export const PageLoadingState = () => (
  <Loading
    variant="spinner"
    size="lg"
    text="Đang tải..."
    fullPage
  />
);

export const TableLoadingState = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="flex space-x-4">
        <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
        <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
        <div className="h-4 bg-muted animate-pulse rounded w-1/6" />
        <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
      </div>
    ))}
  </div>
);

export const CardLoadingState = () => (
  <div className="p-6 space-y-4">
    <div className="h-6 bg-muted animate-pulse rounded w-1/3" />
    <div className="space-y-2">
      <div className="h-4 bg-muted animate-pulse rounded w-full" />
      <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
      <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
    </div>
    <div className="h-10 bg-muted animate-pulse rounded w-1/4" />
  </div>
);

// Hook for consistent loading states
export const useLoadingState = () => {
  return {
    ContentLoading: ContentLoadingState,
    SearchLoading: SearchLoadingState,
    SaveLoading: SaveLoadingState,
    ExportLoading: ExportLoadingState,
    PageLoading: PageLoadingState,
    TableLoading: TableLoadingState,
    CardLoading: CardLoadingState,
  };
};