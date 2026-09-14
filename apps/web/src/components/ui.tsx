'use client';

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
} from 'react';
import clsx from 'clsx';

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'light';

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: 'sm' | 'md' | 'lg';
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-bold transition-all duration-150 active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed';
  const variants: Record<BtnVariant, string> = {
    primary: 'bg-teal-700 text-white hover:bg-teal-800 shadow-sm',
    secondary: 'bg-white text-teal-700 border border-teal-700 hover:bg-teal-50',
    ghost: 'text-teal-700 hover:bg-teal-50',
    danger: 'bg-danger text-white hover:bg-danger-dark shadow-sm',
    light: 'bg-white text-teal-800 hover:bg-teal-50',
  };
  const sizes = { sm: 'h-9 px-3.5 text-sm', md: 'h-11 px-5 text-base', lg: 'h-12 px-7 text-lg' };
  return (
    <button className={clsx(base, variants[variant], sizes[size], className)} {...props} />
  );
}

export function Badge({
  children,
  tone = 'chip',
  className,
}: {
  children: ReactNode;
  tone?: 'verified' | 'online' | 'chip' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}) {
  const tones: Record<string, string> = {
    verified: 'bg-teal-700 text-white',
    online: 'bg-teal-50 text-success',
    chip: 'bg-sand-100 text-ink',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold', tones[tone], className)}>
      {tone === 'verified' && <ShieldIcon className="w-3.5 h-3.5" />}
      {tone === 'online' && <span className="w-2 h-2 rounded-full bg-success" />}
      {children}
    </span>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }>(
  ({ label, error, className, ...props }, ref) => (
    <label className="block">
      {label && <span className="block text-sm font-bold mb-1.5">{label}</span>}
      <input
        ref={ref}
        className={clsx(
          'w-full h-11 rounded-lg border bg-white px-3.5 text-base placeholder:text-sand-400 focus:outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-500/15',
          error ? 'border-danger' : 'border-sand-200',
          className,
        )}
        aria-invalid={!!error}
        {...props}
      />
      {error && <span className="block text-xs text-danger mt-1">{error}</span>}
    </label>
  ),
);
Input.displayName = 'Input';

export function Textarea({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-bold mb-1.5">{label}</span>}
      <textarea
        className="w-full rounded-lg border border-sand-200 bg-white px-3.5 py-2.5 text-base focus:outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-500/15 min-h-[96px]"
        {...props}
      />
    </label>
  );
}

export function Select({ label, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-bold mb-1.5">{label}</span>}
      <select
        className="w-full h-11 rounded-lg border border-sand-200 bg-white px-3 text-base focus:outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-500/15"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('bg-white rounded-2xl border border-sand-200/70 shadow-card', className)}>{children}</div>;
}

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 font-bold text-sm', className)}>
      <StarIcon className="w-4 h-4" />
      {value.toFixed(1)}
    </span>
  );
}

export function EmptyState({ icon, title, hint, action }: { icon: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-16 px-6">
      <div className="w-14 h-14 mx-auto rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mb-4 text-2xl">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      {hint && <p className="text-sm text-sand-600 mb-5 max-w-sm mx-auto">{hint}</p>}
      {action}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={clsx('inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin', className)}
      aria-label="Loading"
    />
  );
}

// ---- inline icons (no external deps) ----
export function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="#ED9F1C" className={className}>
      <path d="M12 2l3 6.6 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21.2l1.4-7L2 9.4l7-.8L12 2z" />
    </svg>
  );
}
export function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2.5l7.5 3v5.2c0 4.8-3.2 8.4-7.5 10.3-4.3-1.9-7.5-5.5-7.5-10.3V5.5l7.5-3z" fill="currentColor" />
      <path d="M8.6 12.2l2.3 2.3 4.6-4.8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function HeartIcon({ filled, className }: { filled?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? '#E0564F' : 'none'} stroke="#E0564F" strokeWidth="2" className={className}>
      <path d="M12 21s-7.5-4.9-9.7-9.2C.7 8.6 2.4 5 5.8 5c2 0 3.4 1.1 4.2 2.3C10.8 6.1 12.2 5 14.2 5c3.4 0 5.1 3.6 3.5 6.8C19.5 16.1 12 21 12 21z" />
    </svg>
  );
}

/** Initials avatar with brand gradient backgrounds. */
const GRADIENTS = ['from-teal-500 to-teal-800', 'from-amber-500 to-amber-800', 'from-blue-500 to-blue-900', 'from-rose-400 to-rose-700'];
export function Avatar({ name, size = 'md', index = 0 }: { name: string; size?: 'sm' | 'md' | 'lg'; index?: number }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const sz = { sm: 'w-9 h-9 text-sm', md: 'w-11 h-11 text-[15px]', lg: 'w-20 h-20 text-2xl' }[size];
  return (
    <div className={`rounded-full bg-gradient-to-br ${GRADIENTS[index % GRADIENTS.length]} text-white font-bold flex items-center justify-center ${sz}`}>
      {initials}
    </div>
  );
}
