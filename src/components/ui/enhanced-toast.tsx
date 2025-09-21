import React from 'react';
import { toast as sonnerToast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Clock,
  RefreshCw,
  Wifi,
  WifiOff,
  Brain,
  Search,
  Save,
  Download,
  Settings
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';
export type ToastContext = 
  | 'content-generation'
  | 'keyword-research' 
  | 'data-save'
  | 'export'
  | 'auth'
  | 'network'
  | 'settings'
  | 'general';

interface EnhancedToastOptions {
  type: ToastType;
  context?: ToastContext;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  dismissible?: boolean;
  id?: string | number;
  dedupe?: boolean;
  dedupeTtlMs?: number;
  dedupeKey?: string;
}

const CONTEXT_ICONS = {
  'content-generation': Brain,
  'keyword-research': Search,
  'data-save': Save,
  'export': Download,
  'auth': Settings,
  'network': Wifi,
  'settings': Settings,
  'general': Info,
} as const;

const TYPE_ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Clock,
} as const;

const getContextualMessages = (context: ToastContext, type: ToastType): { title: string; description: string } => {
  const messages = {
    'content-generation': {
      success: {
        title: 'Nội dung đã được tạo thành công!',
        description: 'Nội dung SEO được tối ưu và sẵn sàng sử dụng.'
      },
      error: {
        title: 'Không thể tạo nội dung',
        description: 'Vui lòng kiểm tra kết nối mạng hoặc thử lại sau ít phút.'
      },
      loading: {
        title: 'Đang tạo nội dung...',
        description: 'AI đang phân tích và tạo nội dung tối ưu cho bạn.'
      },
      warning: {
        title: 'Nội dung được tạo ở chế độ demo',
        description: 'Để sử dụng AI thực, vui lòng cấu hình API key trong Settings.'
      }
    },
    'keyword-research': {
      success: {
        title: 'Tìm kiếm từ khóa hoàn tất',
        description: 'Đã phân tích và tìm thấy các từ khóa tiềm năng.'
      },
      error: {
        title: 'Không thể tìm kiếm từ khóa',
        description: 'Vui lòng thử với từ khóa khác hoặc kiểm tra kết nối mạng.'
      },
      loading: {
        title: 'Đang phân tích từ khóa...',
        description: 'Đang tìm kiếm và phân tích dữ liệu từ khóa từ nhiều nguồn.'
      }
    },
    'data-save': {
      success: {
        title: 'Đã lưu thành công',
        description: 'Dữ liệu của bạn đã được lưu an toàn.'
      },
      error: {
        title: 'Lưu thất bại',
        description: 'Không thể lưu dữ liệu. Vui lòng thử lại hoặc kiểm tra kết nối.'
      },
      loading: {
        title: 'Đang lưu...',
        description: 'Vui lòng chờ trong khi hệ thống lưu dữ liệu.'
      }
    },
    'export': {
      success: {
        title: 'Xuất file thành công',
        description: 'File đã được tải xuống vào thư mục Downloads.'
      },
      error: {
        title: 'Không thể xuất file',
        description: 'Có lỗi khi tạo file. Vui lòng thử lại.'
      }
    },
    'auth': {
      success: {
        title: 'Đăng nhập thành công',
        description: 'Chào mừng bạn quay trở lại!'
      },
      error: {
        title: 'Đăng nhập thất bại',
        description: 'Vui lòng kiểm tra email và mật khẩu.'
      }
    },
    'network': {
      error: {
        title: 'Mất kết nối mạng',
        description: 'Vui lòng kiểm tra kết nối internet và thử lại.'
      },
      warning: {
        title: 'Kết nối không ổn định',
        description: 'Có thể ảnh hưởng đến hiệu suất. Vui lòng kiểm tra mạng.'
      }
    },
    'settings': {
      success: {
        title: 'Cài đặt đã được lưu',
        description: 'Các thay đổi đã có hiệu lực.'
      },
      warning: {
        title: 'Cần cấu hình API key',
        description: 'Để sử dụng đầy đủ tính năng, vui lòng thêm API key.'
      }
    },
    'general': {
      info: {
        title: 'Thông báo',
        description: 'Có thông tin mới từ hệ thống.'
      }
    }
  };

  const contextMessages = messages[context] || messages.general;
  return contextMessages[type] || { title: 'Thông báo', description: 'Có cập nhật từ hệ thống.' };
};

const recentToasts = new Map<string, number>();
const activeToasts = new Map<string, string | number>();

export const showEnhancedToast = (options: EnhancedToastOptions) => {
  const { type, context = 'general', title, description, action, duration, dismissible = true, id, dedupe, dedupeTtlMs, dedupeKey } = options;
  
  const Icon = TYPE_ICONS[type];
  const ContextIcon = context ? CONTEXT_ICONS[context] : null;
  
  const finalTitle = title;
  const finalDescription = description || (context ? getContextualMessages(context, type).description : '');

  // Dedupe logic: mặc định bật cho warning/info và retry toasts để tránh spam
  const defaultDedupe = type === 'warning' || type === 'info';
  const ttl = dedupeTtlMs ?? (type === 'warning' ? 1500 : type === 'info' ? 1500 : 0);
  const key = dedupeKey || (id ? String(id) : `${type}|${context}|${finalTitle}|${finalDescription}`);
  if ((dedupe ?? defaultDedupe) && ttl > 0) {
    const now = Date.now();
    const last = recentToasts.get(key);
    if (last && now - last < ttl) {
      return activeToasts.get(key);
    }
    recentToasts.set(key, now);
  }

  const testId = `toast-${context}-${type}`;
  const toastConfig: any = {
    id,
    description: (
      <div className="flex items-start gap-3 w-full" data-testid={testId} data-toast-id={id ?? ''}>
        <div className="flex items-center gap-2 flex-shrink-0">
          {ContextIcon && <ContextIcon className="h-4 w-4 opacity-70" />}
          <Icon className={`h-4 w-4 ${
            type === 'success' ? 'text-green-600' :
            type === 'error' ? 'text-red-600' :
            type === 'warning' ? 'text-yellow-600' :
            type === 'loading' ? 'text-blue-600 animate-spin' :
            'text-gray-600'
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{finalTitle}</div>
          {finalDescription && (
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {finalDescription}
            </div>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="text-xs text-primary hover:text-primary/80 mt-2 font-medium underline"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    ),
    duration: duration || (type === 'loading' ? Infinity : type === 'error' ? 6000 : 4000),
    dismissible,
    important: type === 'error',
  };

  let toastId: string | number;
  if (type === 'loading') {
    toastId = sonnerToast.loading('', toastConfig);
  } else {
    const fn = type === 'success' ? 'success' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info';
    // @ts-ignore
    toastId = sonnerToast[fn]('', toastConfig);
  }
  activeToasts.set(key, toastId);
  return toastId;
};

// Convenience functions for common scenarios
export const toastSuccess = (title: string, description?: string, context?: ToastContext) => {
  showEnhancedToast({ type: 'success', title, description, context });
};

export const toastError = (title: string, description?: string, context?: ToastContext, action?: { label: string; onClick: () => void }) => {
  showEnhancedToast({ type: 'error', title, description, context, action });
};

export const toastWarning = (title: string, description?: string, context?: ToastContext) => {
  showEnhancedToast({ type: 'warning', title, description, context });
};

export const toastInfo = (title: string, description?: string, context?: ToastContext) => {
  showEnhancedToast({ type: 'info', title, description, context });
};

export const toastLoading = (title: string, description?: string, context?: ToastContext) => {
  return showEnhancedToast({ type: 'loading', title, description, context });
};

// Network-specific toasts
export const toastNetworkError = (retryFn?: () => void) => {
  showEnhancedToast({
    type: 'error',
    context: 'network',
    title: 'Mất kết nối mạng',
    description: 'Không thể kết nối với server. Vui lòng kiểm tra internet.',
    action: retryFn ? { label: 'Thử lại', onClick: retryFn } : undefined,
  });
};

export const toastRetryAttempt = (attempt: number, maxRetries: number, context?: ToastContext) => {
  showEnhancedToast({
    type: 'warning',
    context: context || 'general',
    title: `Đang thử lại (${attempt}/${maxRetries})`,
    description: 'Hệ thống đang cố gắng kết nối lại...',
    duration: 2000,
  });
};

// Content-specific convenience functions
export const toastContentGeneration = {
  start: () => showEnhancedToast({ type: 'loading', title: 'Đang tạo nội dung...', description: 'AI đang phân tích và tạo nội dung tối ưu SEO', context: 'content-generation', id: 'content-generation' }),
  success: (seoScore?: number, id?: string | number) => showEnhancedToast({
    type: 'success',
    title: 'Nội dung đã được tạo!',
    description: seoScore ? `Điểm SEO: ${seoScore}/100` : 'Nội dung được tối ưu và sẵn sàng sử dụng',
    context: 'content-generation',
    id: id ?? 'content-generation'
  }),
  error: (retryFn?: () => void, id?: string | number) => showEnhancedToast({
    type: 'error',
    title: 'Không thể tạo nội dung',
    description: 'Có lỗi khi gọi AI service. Hệ thống sẽ sử dụng nội dung mẫu.',
    context: 'content-generation',
    id: id ?? 'content-generation',
    action: retryFn ? { label: 'Thử lại', onClick: retryFn } : undefined
  }),
  mockMode: () => toastWarning(
    'Đang dùng chế độ Demo',
    'Để sử dụng AI thực, vui lòng cấu hình API key trong Settings.',
    'content-generation'
  ),
};

export const toastKeywordResearch = {
  start: () => showEnhancedToast({ type: 'loading', title: 'Đang nghiên cứu từ khóa...', description: 'Phân tích dữ liệu từ nhiều nguồn', context: 'keyword-research', id: 'keyword-research' }),
  success: (count: number, id?: string | number) => showEnhancedToast({
    type: 'success',
    title: `Tìm thấy ${count} từ khóa`,
    description: 'Dữ liệu đã được phân tích và sẵn sàng sử dụng',
    context: 'keyword-research',
    id: id ?? 'keyword-research'
  }),
  error: (retryFn?: () => void, id?: string | number) => showEnhancedToast({
    type: 'error',
    title: 'Không thể tìm kiếm từ khóa',
    description: 'Vui lòng thử với từ khóa khác hoặc kiểm tra kết nối.',
    context: 'keyword-research',
    id: id ?? 'keyword-research',
    action: retryFn ? { label: 'Thử lại', onClick: retryFn } : undefined
  }),
};

// Hook for enhanced toast in React components
export const useEnhancedToast = () => {
  return {
    success: toastSuccess,
    error: toastError,
    warning: toastWarning,
    info: toastInfo,
    loading: toastLoading,
    networkError: toastNetworkError,
    retryAttempt: (attempt: number, max: number, ctx?: ToastContext) => showEnhancedToast({ type: 'warning', context: ctx || 'general', title: `Đang thử lại (${attempt}/${max})`, description: 'Hệ thống đang cố gắng kết nối lại...', duration: 1500, dedupe: true, dedupeTtlMs: 1500, dedupeKey: `retry:${ctx}` }),
    content: toastContentGeneration,
    keyword: toastKeywordResearch,
    dismiss: (id: string | number) => sonnerToast.dismiss(id),
    show: showEnhancedToast,
  };
};
