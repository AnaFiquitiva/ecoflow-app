import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm',
        'placeholder:text-neutral-400',
        'focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-brand-600',
        'aria-[invalid=true]:border-red-500',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
