import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANT_STYLES: Record<Variant, string> = {
  primary: 'bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_0_1px_rgba(139,92,246,0.4)]',
  secondary: 'bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 border border-white/10',
  ghost: 'hover:bg-white/[0.06] text-zinc-400 hover:text-white',
  danger: 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
}

export function Button({ variant = 'secondary', size = 'md', className = '', ...props }: ButtonProps) {
  const sizeCls = size === 'sm' ? 'px-2.5 py-1.5 text-[12px]' : 'px-3.5 py-2 text-[13px]';
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none ${sizeCls} ${VARIANT_STYLES[variant]} ${className}`}
    />
  );
}
