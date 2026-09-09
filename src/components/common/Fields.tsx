import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[12px] font-medium text-zinc-400 mb-1.5">{children}</label>;
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`stenner-input w-full px-3 py-2 text-[13px] placeholder:text-zinc-600 ${props.className ?? ''}`}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`stenner-input w-full px-3 py-2 text-[13px] placeholder:text-zinc-600 resize-none ${props.className ?? ''}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`stenner-input w-full px-3 py-2 text-[13px] ${props.className ?? ''}`}
    />
  );
}

export function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}
