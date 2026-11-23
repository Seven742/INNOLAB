'use client';

import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, hint, className = '', leftIcon, rightIcon, ...props },
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
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full h-8.5 px-3 text-xs bg-[var(--bg-input)] border border-border rounded-lg
            text-text-main placeholder:text-text-muted/60
            transition-colors duration-150
            focus:border-primary-light focus:ring-1 focus:ring-primary/40 focus:outline-none
            disabled:bg-bg-main disabled:cursor-not-allowed disabled:opacity-40
            ${leftIcon ? 'pl-8.5' : ''}
            ${rightIcon ? 'pr-8.5' : ''}
            ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {hint && !error && <p className="mt-1 text-[11px] text-text-muted">{hint}</p>}
    </div>
  );
});

export default Input;
