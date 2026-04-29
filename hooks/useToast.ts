import { useState, useCallback } from 'react';
import { ToastProps } from '../components/Toast';

interface Toast extends ToastProps {
  id: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((props: Omit<ToastProps, 'onHide'>) => {
    const id = Date.now().toString();
    const newToast: Toast = {
      ...props,
      id,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, props.duration || 3000);

    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message: string, options?: Partial<ToastProps>) => {
    return showToast({ message, type: 'success', ...options });
  }, [showToast]);

  const showError = useCallback((message: string, options?: Partial<ToastProps>) => {
    return showToast({ message, type: 'error', ...options });
  }, [showToast]);

  const showWarning = useCallback((message: string, options?: Partial<ToastProps>) => {
    return showToast({ message, type: 'warning', ...options });
  }, [showToast]);

  const showInfo = useCallback((message: string, options?: Partial<ToastProps>) => {
    return showToast({ message, type: 'info', ...options });
  }, [showToast]);

  return {
    toasts,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
