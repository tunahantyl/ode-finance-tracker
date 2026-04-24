import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id, ...rest },
  ref
) {
  const inputId = id || rest.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink/80">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={cn('input-base', error && 'border-negative/60 focus:ring-negative/15', className)}
        {...rest}
      />
      {error ? (
        <p className="text-xs text-negative">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
});

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, className, children, id, ...rest },
  ref
) {
  const selId = id || rest.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selId} className="block text-sm font-medium text-ink/80">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selId}
        className={cn('input-base appearance-none pr-8', error && 'border-negative/60', className)}
        {...rest}
      >
        {children}
      </select>
      {error && <p className="text-xs text-negative">{error}</p>}
    </div>
  );
});

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className, id, ...rest },
  ref
) {
  const tId = id || rest.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={tId} className="block text-sm font-medium text-ink/80">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={tId}
        className={cn('input-base min-h-[80px]', error && 'border-negative/60', className)}
        {...rest}
      />
      {error && <p className="text-xs text-negative">{error}</p>}
    </div>
  );
});
