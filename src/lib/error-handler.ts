import * as React from 'react';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import type { ToastActionElement } from '@/components/ui/toast';

export type ErrorType = 'error' | 'success' | 'warning' | 'info';

interface NotificationOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: ToastActionElement;
}

class ErrorHandler {
  private getIcon(type: ErrorType) {
    switch (type) {
      case 'error':
        return AlertCircle;
      case 'success':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'info':
        return Info;
      default:
        return AlertCircle;
    }
  }

  private getVariant(type: ErrorType): 'default' | 'destructive' | 'success' | 'warning' | 'info' {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  }

  private notify(type: ErrorType, options: NotificationOptions) {
    const Icon = this.getIcon(type);
    
    toast({
      variant: this.getVariant(type),
      title: options.title,
      description: options.description,
      duration: options.duration || (type === 'error' ? 5000 : 3000),
      action: options.action,
    });
  }

  // Error notifications
  error(message: string, title?: string, options?: Partial<NotificationOptions>) {
    this.notify('error', {
      title: title || 'خطأ',
      description: message,
      ...options
    });
  }

  // Success notifications
  success(message: string, title?: string, options?: Partial<NotificationOptions>) {
    this.notify('success', {
      title: title || 'نجح',
      description: message,
      ...options
    });
  }

  // Warning notifications
  warning(message: string, title?: string, options?: Partial<NotificationOptions>) {
    this.notify('warning', {
      title: title || 'تحذير',
      description: message,
      ...options
    });
  }

  // Info notifications
  info(message: string, title?: string, options?: Partial<NotificationOptions>) {
    this.notify('info', {
      title: title || 'معلومات',
      description: message,
      ...options
    });
  }

  // Handle API errors with proper formatting
  handleApiError(error: any, fallbackMessage?: string) {
    let errorMessage = fallbackMessage || 'حدث خطأ غير متوقع';
    
    if (error?.response?.data) {
      const data = error.response.data;
      errorMessage = data.message || data.detail || data.error || errorMessage;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    this.error(errorMessage);
    return errorMessage;
  }

  // Handle authentication errors
  handleAuthError(error: any) {
    const authMessages = {
      401: 'يجب تسجيل الدخول أولاً',
      403: 'ليس لديك صلاحية للوصول لهذا المحتوى',
      404: 'المورد المطلوب غير موجود',
      500: 'خطأ في الخادم، يرجى المحاولة لاحقاً'
    };

    const status = error?.response?.status;
    const message = authMessages[status as keyof typeof authMessages] || 'حدث خطأ في المصادقة';
    
    this.error(message, 'خطأ في المصادقة');
    return message;
  }

  // Handle validation errors
  handleValidationError(errors: Record<string, string[]> | string) {
    if (typeof errors === 'string') {
      this.error(errors, 'خطأ في التحقق');
      return;
    }

    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n');
    
    this.error(errorMessages, 'خطأ في التحقق من البيانات');
  }

  // Handle network errors
  handleNetworkError() {
    this.error(
      'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.',
      'خطأ في الشبكة'
    );
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Export individual methods for convenience
export const { error, success, warning, info, handleApiError, handleAuthError, handleValidationError, handleNetworkError } = errorHandler;

// Legacy compatibility - for gradual migration
export const showNotification = (type: ErrorType, message: string, description?: string, duration?: number) => {
  switch (type) {
    case 'error':
      errorHandler.error(description || message, message);
      break;
    case 'success':
      errorHandler.success(description || message, message);
      break;
    case 'warning':
      errorHandler.warning(description || message, message);
      break;
    case 'info':
      errorHandler.info(description || message, message);
      break;
  }
};