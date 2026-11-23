'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

export default function Pagination({ page, totalPages, total, limit, onPageChange }) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const getVisiblePages = () => {
    const pages = [];
    const delta = 2;
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) {
      pages.push(i);
    }
    if (right < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-3 border-t border-border">
      <p className="text-xs text-text-secondary text-center sm:text-left">
        Showing <span className="font-semibold text-text-main">{start}</span>–
        <span className="font-semibold text-text-main">{end}</span> of{' '}
        <span className="font-semibold text-text-main">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        {getVisiblePages().map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-1.5 text-text-muted text-xs">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`
                h-7 min-w-[28px] px-1.5 rounded-md text-xs font-medium transition-colors
                ${p === page
                  ? 'bg-primary text-white font-bold'
                  : 'text-text-secondary hover:text-text-main hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
                }
              `}
            >
              {p}
            </button>
          )
        )}

        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
