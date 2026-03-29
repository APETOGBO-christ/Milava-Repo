"use client";

import { ReactNode } from "react";

interface ErrorDisplayProps {
  error: Error | null;
  className?: string;
  onDismiss?: () => void;
}

export function ErrorDisplay({
  error,
  className = "",
  onDismiss,
}: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <div
      className={`rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-lg font-bold">✕</span>
          <div>
            <p className="font-medium">Error</p>
            <p className="mt-1 text-sm opacity-90">{error.message}</p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 opacity-50 hover:opacity-100"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

interface LoadingSkeletonProps {
  count?: number;
  height?: string;
  className?: string;
}

export function LoadingSkeleton({
  count = 1,
  height = "h-12",
  className = "",
}: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${height} w-full rounded-lg bg-gray-200 animate-pulse`}
        />
      ))}
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children?: ReactNode;
}

export function LoadingOverlay({
  isLoading,
  message = "Loading...",
  children,
}: LoadingOverlayProps) {
  if (!isLoading) return children;

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
          <p className="text-sm font-medium text-gray-700">{message}</p>
        </div>
      </div>
    </div>
  );
}

interface FieldErrorProps {
  error?: string;
  className?: string;
}

export function FieldError({ error, className = "" }: FieldErrorProps) {
  if (!error) return null;
  return <p className={`text-sm text-red-600 mt-1 ${className}`}>{error}</p>;
}

export function ValidationSummary({
  errors,
  className = "",
}: {
  errors: Record<string, string>;
  className?: string;
}) {
  const errorsList = Object.values(errors).filter(Boolean);

  if (errorsList.length === 0) return null;

  return (
    <div
      className={`rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 ${className}`}
    >
      <p className="font-medium mb-2">Please fix the following errors:</p>
      <ul className="list-inside list-disc space-y-1 text-sm">
        {errorsList.map((error, i) => (
          <li key={i}>{error}</li>
        ))}
      </ul>
    </div>
  );
}
