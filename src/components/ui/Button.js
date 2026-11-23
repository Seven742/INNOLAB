'use client';

import { forwardRef } from 'react';

const variants = {
  primary: 'bg-primary hover:bg-primary-light text-white shadow-xs border border-primary-light/30 font-semibold',
  secondary: 'bg-black/[0.05] dark:bg-white/[0.05] text-text-main hover:bg-black/[0.08] dark:hover:bg-white/[0.08] border border-border',
  outline: 'border border-border text-text-secondary hover:text-text-main hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:border-border-hover',
  ghost: 'text-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:text-text-main',
  danger: 'bg-danger text-white hover:bg-red-600 shadow-xs border border-red-400/20',
  'danger-outline': 'border border-danger/35 text-danger hover:bg-danger-light',
  warning: 'bg-warning text-white hover:bg-amber-600 shadow-xs border border-amber-400/20',
};

const sizes = {
  xs: 'h-7 px-2.5 text-xs gap-1',
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-xs gap-2',
  lg: 'h-10 px-4 text-sm gap-2',
  xl: 'h-11 px-5 text-sm gap-2.5',
  icon: 'h-9 w-9 p-0 justify-center',
  'icon-sm': 'h-8 w-8 p-0 justify-center',
  'icon-xs': 'h-7 w-7 p-0 justify-center',
};

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', children, disabled, loading, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        transition-all duration-200 ease-out active:scale-[0.975] cursor-pointer will-change-transform
        disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
        focus:outline-none focus:ring-1 focus:ring-primary/40 focus:ring-offset-1 focus:ring-offset-bg-main
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-0.5 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
});

export default Button;
