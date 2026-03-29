import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    // Auto-remove after duration
    if (toast.duration !== 0) {
      const duration = toast.duration || 3000;
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));

// Helper functions
export const toast = {
  success: (message: string, duration = 3000) => {
    return useToastStore.getState().addToast({
      message,
      type: "success",
      duration,
    });
  },

  error: (message: string, duration = 4000) => {
    return useToastStore.getState().addToast({
      message,
      type: "error",
      duration,
    });
  },

  warning: (message: string, duration = 3500) => {
    return useToastStore.getState().addToast({
      message,
      type: "warning",
      duration,
    });
  },

  info: (message: string, duration = 3000) => {
    return useToastStore.getState().addToast({
      message,
      type: "info",
      duration,
    });
  },

  removeToast: (id: string) => {
    return useToastStore.getState().removeToast(id);
  },

  promise: async <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
  ): Promise<T> => {
    const id = useToastStore.getState().addToast({
      message: messages.loading,
      type: "info",
      duration: 0, // Don't auto-remove
    });

    try {
      const result = await promise;
      useToastStore.getState().removeToast(id);
      useToastStore.getState().addToast({
        message: messages.success,
        type: "success",
        duration: 3000,
      });
      return result;
    } catch (error) {
      useToastStore.getState().removeToast(id);
      useToastStore.getState().addToast({
        message: messages.error,
        type: "error",
        duration: 4000,
      });
      throw error;
    }
  },
};
