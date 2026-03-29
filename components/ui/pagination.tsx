import { useMemo, useCallback } from "react";

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
}

export function usePagination(
  items: any[],
  pageSize: number = 20,
  initialPage: number = 1,
) {
  const state = useMemo<PaginationState>(() => {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const currentPage = Math.min(initialPage, totalPages);

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);

    return {
      currentPage,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      startIndex,
      endIndex,
    };
  }, [items.length, pageSize, initialPage]);

  const paginatedItems = useMemo(
    () => items.slice(state.startIndex, state.endIndex),
    [items, state.startIndex, state.endIndex],
  );

  return {
    ...state,
    paginatedItems,
  };
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  className = "",
}: PaginationProps) {
  // Generate page numbers to display
  const pageNumbers = useMemo(() => {
    const delta = 2; // Pages before/after current
    const range: (string | number)[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift("...");
    }
    range.unshift(1);

    if (currentPage + delta < totalPages - 1) {
      range.push("...");
    }
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  }, [currentPage, totalPages]);

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrevPage}
        className="px-3 py-2 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ← Previous
      </button>

      <div className="flex items-center gap-1">
        {pageNumbers.map((page, i) => (
          <button
            key={i}
            onClick={() => typeof page === "number" && onPageChange(page)}
            disabled={page === "..."}
            className={`px-2 py-2 rounded text-sm font-medium ${
              page === currentPage
                ? "bg-blue-600 text-white"
                : page === "..."
                  ? "cursor-default"
                  : "border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
        className="px-3 py-2 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next →
      </button>
    </div>
  );
}

// Infinite scroll hook
export function useInfiniteScroll(
  callback: () => void | Promise<void>,
  options: {
    threshold?: number;
    enabled?: boolean;
  } = {},
) {
  const { threshold = 0.1, enabled = true } = options;

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && enabled) {
          callback();
        }
      });
    },
    [callback, enabled],
  );

  return (ref: React.RefObject<HTMLElement>) => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  };
}
