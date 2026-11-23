'use client';

import { Loader2, Package, AlertCircle } from 'lucide-react';

export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
      <Loader2 className="h-6 w-6 animate-spin text-primary dark:text-cyan-400 mb-2.5" />
      <p className="text-xs text-text-secondary">{message}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon = Package, title = 'No data found', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-text-secondary text-center px-4">
      <div className="w-11 h-11 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-border flex items-center justify-center mb-3">
        <Icon className="h-5 w-5 text-text-muted" />
      </div>
      <p className="text-xs font-semibold text-text-main mb-1">{title}</p>
      {message && <p className="text-xs text-text-muted max-w-sm mb-3.5 leading-relaxed">{message}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-text-secondary text-center px-4">
      <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-3">
        <AlertCircle className="h-5 w-5 text-rose-500 dark:text-rose-400" />
      </div>
      <p className="text-xs font-semibold text-text-main mb-1">Failed to load data</p>
      <p className="text-xs text-text-muted max-w-sm mb-3.5">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-medium text-primary dark:text-cyan-400 hover:underline transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
