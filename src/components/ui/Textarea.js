'use client';

import { forwardRef } from 'react';

const Textarea = forwardRef(function Textarea(
  { label, error, hint, className = '', rows = 3, ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-text-secondary mb-1">
          {label}
          {props.required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full px-3 py-2 text-xs bg-[var(--bg-input)] border border-border rounded-lg
          text-text-main placeholder:text-text-muted/60 resize-vertical
          transition-colors duration-150
          focus:border-primary-light focus:ring-1 focus:ring-primary/40 focus:outline-none
          disabled:bg-bg-main disabled:cursor-not-allowed disabled:opacity-40
          ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {hint && !error && <p className="mt-1 text-[11px] text-text-muted">{hint}</p>}
    </div>
  );
});

export default Textarea;
