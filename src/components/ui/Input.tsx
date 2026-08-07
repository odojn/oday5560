import React from 'react';
import { cn } from './Button';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const convertArabicToEnglishNumbers = (str: string) => {
  if (!str) return str;
  return str.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, onChange, onInput, ...props }, ref) => {
    const isNumeric = type === 'number' || type === 'tel' || props.inputMode === 'numeric' || props.inputMode === 'decimal';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value) {
        const converted = convertArabicToEnglishNumbers(e.target.value);
        if (converted !== e.target.value) {
          e.target.value = converted;
        }
      }
      if (onChange) {
        onChange(e);
      }
    };

    const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
      const target = e.currentTarget;
      if (target.value) {
        const converted = convertArabicToEnglishNumbers(target.value);
        if (converted !== target.value) {
          target.value = converted;
        }
      }
      if (onInput) {
        onInput(e);
      }
    };

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
        <input
          type={type}
          onChange={handleInputChange}
          onInput={handleInput}
          className={cn(
            "flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm",
            isNumeric && "font-mono ltr text-right",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

