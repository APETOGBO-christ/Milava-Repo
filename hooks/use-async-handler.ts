import { useCallback } from "react";
import { toast } from "@/lib/toast";
import { handleError, getUserFriendlyMessage } from "@/lib/error-handling";

interface UseAsyncHandlerOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
}

export function useAsyncHandler(options: UseAsyncHandlerOptions = {}) {
  const {
    onSuccess,
    onError,
    loadingMessage = "Processing...",
    successMessage = "Success!",
    errorMessage,
  } = options;

  const handle = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      try {
        const toastId = toast.info(loadingMessage, 0); // No auto-remove

        const result = await fn();

        toast.removeToast(toastId);
        toast.success(successMessage);
        onSuccess?.();

        return result;
      } catch (error) {
        const appError = handleError(error);
        const message = errorMessage || getUserFriendlyMessage(appError);

        toast.error(message);
        onError?.(appError);

        return null;
      }
    },
    [loadingMessage, successMessage, errorMessage, onSuccess, onError],
  );

  return { handle };
}

interface UseFormErrorsOptions {
  onFieldError?: (field: string, error: string) => void;
}

export function useFormErrors(options: UseFormErrorsOptions = {}) {
  const { onFieldError } = options;

  const setFieldError = useCallback(
    (field: string, error: string) => {
      onFieldError?.(field, error);
    },
    [onFieldError],
  );

  const validateRequired = useCallback(
    (value: any, fieldName: string): boolean => {
      if (!value || (typeof value === "string" && !value.trim())) {
        setFieldError(fieldName, `${fieldName} is required`);
        return false;
      }
      return true;
    },
    [setFieldError],
  );

  const validateEmail = useCallback(
    (value: string, fieldName: string = "Email"): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setFieldError(fieldName, "Please enter a valid email address");
        return false;
      }
      return true;
    },
    [setFieldError],
  );

  const validateMinLength = useCallback(
    (value: string, min: number, fieldName: string): boolean => {
      if (value.length < min) {
        setFieldError(
          fieldName,
          `${fieldName} must be at least ${min} characters`,
        );
        return false;
      }
      return true;
    },
    [setFieldError],
  );

  const validatePhone = useCallback(
    (value: string, fieldName: string = "Phone"): boolean => {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(value)) {
        setFieldError(fieldName, "Please enter a valid phone number");
        return false;
      }
      return true;
    },
    [setFieldError],
  );

  return {
    setFieldError,
    validateRequired,
    validateEmail,
    validateMinLength,
    validatePhone,
  };
}

// Simpler toast helpers
export function useToast() {
  return {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    warning: (message: string) => toast.warning(message),
    info: (message: string) => toast.info(message),
    promise: <T>(
      promise: Promise<T>,
      messages: { loading: string; success: string; error: string },
    ) => toast.promise(promise, messages),
  };
}
