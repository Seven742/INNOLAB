'use client';

const badgeVariants = {
  default: 'bg-black/[0.04] dark:bg-white/[0.05] text-text-secondary border-border',
  primary: 'bg-primary/10 text-primary dark:text-cyan-300 border-primary/25',
  secondary: 'bg-secondary/10 text-secondary dark:text-blue-300 border-secondary/25',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/25',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/25',
  danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/25',
  info: 'bg-secondary/10 text-secondary dark:text-blue-300 border-secondary/25',
};

const badgeSizes = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-[11px] px-2.5 py-0.5 font-medium',
  lg: 'text-xs px-3 py-1 font-medium',
};

export default function Badge({ variant = 'default', size = 'md', className = '', children, dot }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium border rounded-full whitespace-nowrap
        ${badgeVariants[variant] || badgeVariants.default}
        ${badgeSizes[size] || badgeSizes.md}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === 'success' ? 'bg-emerald-500' :
          variant === 'warning' ? 'bg-amber-500' :
          variant === 'danger' ? 'bg-rose-500' :
          variant === 'primary' ? 'bg-primary' :
          variant === 'info' ? 'bg-secondary' :
          'bg-slate-400'
        }`} />
      )}
      {children}
    </span>
  );
}
