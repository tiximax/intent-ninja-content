import React from 'react';
import { AlertTriangle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FormErrorType = 'error' | 'warning' | 'info';

interface FormErrorProps {
  type?: FormErrorType;
  message: string;
  field?: string;
  className?: string;
  suggestions?: string[];
}

const ERROR_ICONS = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

const ERROR_STYLES = {
  error: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/50 dark:border-red-800',
  warning: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/50 dark:border-yellow-800',
  info: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/50 dark:border-blue-800',
} as const;

export const FormError: React.FC<FormErrorProps> = ({
  type = 'error',
  message,
  field,
  className,
  suggestions = [],
}) => {
  const Icon = ERROR_ICONS[type];
  const styles = ERROR_STYLES[type];

  if (!message) return null;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border text-sm',
        styles,
        className
      )}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {field && (
          <div className="font-medium mb-1">
            {field}
          </div>
        )}
        <div className="leading-relaxed">
          {message}
        </div>
        {suggestions.length > 0 && (
          <div className="mt-2">
            <div className="font-medium mb-1">Gợi ý:</div>
            <ul className="list-disc list-inside space-y-1 opacity-90">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="text-xs">
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// Specific error types for common validation scenarios
export const ValidationError: React.FC<{
  field: string;
  message: string;
  suggestions?: string[];
}> = ({ field, message, suggestions }) => (
  <FormError 
    type="error" 
    field={field} 
    message={message} 
    suggestions={suggestions}
  />
);

export const FieldWarning: React.FC<{
  field: string;
  message: string;
  suggestions?: string[];
}> = ({ field, message, suggestions }) => (
  <FormError 
    type="warning" 
    field={field} 
    message={message} 
    suggestions={suggestions}
  />
);

export const FormInfo: React.FC<{
  message: string;
  suggestions?: string[];
}> = ({ message, suggestions }) => (
  <FormError 
    type="info" 
    message={message} 
    suggestions={suggestions}
  />
);

// Hook for form validation with enhanced error messages
export const useFormValidation = () => {
  const validateTitle = (title: string): string | null => {
    if (!title.trim()) {
      return 'Tiêu đề không được để trống';
    }
    if (title.length < 10) {
      return 'Tiêu đề quá ngắn (ít nhất 10 ký tự)';
    }
    if (title.length > 100) {
      return 'Tiêu đề quá dài (tối đa 100 ký tự)';
    }
    return null;
  };

  const validateKeywords = (keywords: string): string | null => {
    if (!keywords.trim()) {
      return 'Vui lòng nhập ít nhất một từ khóa';
    }
    
    const keywordArray = keywords.split(',').map(k => k.trim()).filter(Boolean);
    
    if (keywordArray.length > 20) {
      return 'Quá nhiều từ khóa (tối đa 20 từ khóa)';
    }
    
    const tooLongKeywords = keywordArray.filter(k => k.length > 50);
    if (tooLongKeywords.length > 0) {
      return `Từ khóa quá dài: "${tooLongKeywords[0]}" (tối đa 50 ký tự)`;
    }
    
    return null;
  };

  const validateWordCount = (wordCount: number): string | null => {
    if (wordCount < 100) {
      return 'Số từ quá ít (tối thiểu 100 từ)';
    }
    if (wordCount > 5000) {
      return 'Số từ quá nhiều (tối đa 5000 từ)';
    }
    return null;
  };

  const validateProjectName = (name: string): string | null => {
    if (!name.trim()) {
      return 'Tên dự án không được để trống';
    }
    if (name.length < 3) {
      return 'Tên dự án quá ngắn (ít nhất 3 ký tự)';
    }
    if (name.length > 50) {
      return 'Tên dự án quá dài (tối đa 50 ký tự)';
    }
    return null;
  };

  const validateUrl = (url: string): string | null => {
    if (!url) return null; // Optional field
    
    try {
      new URL(url);
      return null;
    } catch {
      return 'URL không hợp lệ (ví dụ: https://example.com)';
    }
  };

  const validateApiKey = (apiKey: string, provider: string): string | null => {
    if (!apiKey.trim()) {
      return `API key ${provider} không được để trống`;
    }
    
    // Basic format validation for common providers
    const validations: Record<string, RegExp> = {
      openai: /^sk-[A-Za-z0-9]{48}$/,
      google: /^[A-Za-z0-9_-]{39}$/,
      serpapi: /^[a-f0-9]{64}$/,
    };
    
    const pattern = validations[provider.toLowerCase()];
    if (pattern && !pattern.test(apiKey)) {
      return `Định dạng API key ${provider} không đúng`;
    }
    
    return null;
  };

  return {
    validateTitle,
    validateKeywords,
    validateWordCount,
    validateProjectName,
    validateUrl,
    validateApiKey,
  };
};

// Enhanced error messages for specific contexts
export const getEnhancedErrorMessage = (error: any, context: string): { message: string; suggestions: string[] } => {
  const errorMessage = error?.message || 'Đã xảy ra lỗi không xác định';
  
  const contextMessages: Record<string, { message: string; suggestions: string[] }> = {
    'network-error': {
      message: 'Không thể kết nối với server',
      suggestions: [
        'Kiểm tra kết nối internet',
        'Thử lại sau vài phút',
        'Liên hệ admin nếu vấn đề vẫn tiếp diễn'
      ]
    },
    'auth-failed': {
      message: 'Đăng nhập thất bại',
      suggestions: [
        'Kiểm tra email và mật khẩu',
        'Thử đăng nhập bằng Google',
        'Sử dụng chức năng quên mật khẩu nếu cần'
      ]
    },
    'content-generation-failed': {
      message: 'Không thể tạo nội dung',
      suggestions: [
        'Thử với tiêu đề khác',
        'Giảm số lượng từ khóa',
        'Kiểm tra cài đặt API key trong Settings'
      ]
    },
    'keyword-research-failed': {
      message: 'Không thể tìm kiếm từ khóa',
      suggestions: [
        'Thử với từ khóa khác',
        'Kiểm tra từ khóa có đúng ngôn ngữ không',
        'Đảm bảo API key SerpAPI được cấu hình'
      ]
    },
    'save-failed': {
      message: 'Không thể lưu dữ liệu',
      suggestions: [
        'Kiểm tra kết nối mạng',
        'Thử lại sau vài giây',
        'Đảm bảo bạn đã đăng nhập'
      ]
    }
  };

  const contextMessage = contextMessages[context];
  if (contextMessage) {
    return contextMessage;
  }

  // Default fallback
  return {
    message: errorMessage,
    suggestions: [
      'Thử lại sau vài phút',
      'Kiểm tra kết nối mạng',
      'Liên hệ hỗ trợ nếu vấn đề vẫn tiếp diễn'
    ]
  };
};