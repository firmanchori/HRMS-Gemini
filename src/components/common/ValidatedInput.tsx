import React, { useState, useEffect, InputHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Generic text/email/tel/number/password input with inline validation —
 * same visual contract as ValidatedDateInput (red border + AlertCircle +
 * message under the field, not the browser's native tooltip), generalized
 * so every form can stop relying on bare `required` (user, 2026-11-10:
 * "aku tidak mau pakai default required bawaan html, aku mau ada error
 * form inline... border form berubah warna, termasuk juga error
 * required").
 *
 * `showError` is how a form forces every field's error to show at once on
 * a submit attempt — the field also still self-shows on blur, same as
 * ValidatedDateInput.
 */
interface ValidatedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'className' | 'value'> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  /** Extra check beyond "required" — return an error message, or null if valid. */
  validate?: (value: string) => string | null;
  /** Externally forced error (e.g. a server-side validation response) — always wins over internal checks. */
  customError?: string | null;
  helperText?: string;
  showError?: boolean;
  className?: string;
  icon?: React.ReactNode;
  /** An element rendered inside the field on the right (e.g. a show/hide password toggle) — positioned so it never overlaps the error message below. */
  rightElement?: React.ReactNode;
  requiredLabel?: string;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  value,
  onChange,
  required = false,
  validate,
  customError,
  helperText,
  showError = false,
  className = '',
  icon,
  rightElement,
  requiredLabel = 'Wajib diisi',
  id,
  name,
  disabled,
  type = 'text',
  ...rest
}) => {
  const [internalError, setInternalError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const runValidation = (val: string): string | null => {
    if (required && !val.trim()) return requiredLabel;
    if (validate) return validate(val);
    return null;
  };

  useEffect(() => {
    setInternalError(runValidation(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setInternalError(runValidation(e.target.value));
  };

  const handleBlur = () => setTouched(true);

  const effectiveError = customError || ((touched || showError) ? internalError : null);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative rounded-md shadow-2xs">
        {icon && <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">{icon}</div>}
        <input
          id={id}
          name={name}
          type={type}
          disabled={disabled}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          {...rest}
          className={`block w-full rounded-md border py-1.5 ${icon ? 'pl-9' : 'pl-3'} ${rightElement ? 'pr-9' : 'pr-3'} text-xs font-medium text-slate-800 transition-colors focus:outline-none ${
            effectiveError
              ? 'border-rose-500 bg-rose-50/20 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
              : 'border-slate-300 bg-white hover:border-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
          } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''} ${className}`}
        />
        {rightElement && <div className="absolute inset-y-0 right-0 flex items-center pr-3">{rightElement}</div>}
      </div>

      {effectiveError ? (
        <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1 mt-0.5 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{effectiveError}</span>
        </p>
      ) : helperText ? (
        <p className="text-[10px] text-slate-500 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};

/** Same contract, <textarea> instead of <input>. */
interface ValidatedTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'className' | 'value'> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  validate?: (value: string) => string | null;
  customError?: string | null;
  helperText?: string;
  showError?: boolean;
  className?: string;
  requiredLabel?: string;
}

export const ValidatedTextarea: React.FC<ValidatedTextareaProps> = ({
  label,
  value,
  onChange,
  required = false,
  validate,
  customError,
  helperText,
  showError = false,
  className = '',
  requiredLabel = 'Wajib diisi',
  id,
  name,
  disabled,
  rows = 3,
  ...rest
}) => {
  const [internalError, setInternalError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const runValidation = (val: string): string | null => {
    if (required && !val.trim()) return requiredLabel;
    if (validate) return validate(val);
    return null;
  };

  useEffect(() => {
    setInternalError(runValidation(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const effectiveError = customError || ((touched || showError) ? internalError : null);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <textarea
        id={id}
        name={name}
        disabled={disabled}
        rows={rows}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setInternalError(runValidation(e.target.value));
        }}
        onBlur={() => setTouched(true)}
        {...rest}
        className={`block w-full rounded-md border py-1.5 px-3 text-xs font-medium text-slate-800 transition-colors focus:outline-none ${
          effectiveError
            ? 'border-rose-500 bg-rose-50/20 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
            : 'border-slate-300 bg-white hover:border-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
        } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''} ${className}`}
      />
      {effectiveError ? (
        <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1 mt-0.5 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{effectiveError}</span>
        </p>
      ) : helperText ? (
        <p className="text-[10px] text-slate-500 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};

/** Same contract, <select> instead of <input> — children are the <option> elements. */
interface ValidatedSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'className' | 'value'> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  validate?: (value: string) => string | null;
  customError?: string | null;
  helperText?: string;
  showError?: boolean;
  className?: string;
  requiredLabel?: string;
  children: React.ReactNode;
}

export const ValidatedSelect: React.FC<ValidatedSelectProps> = ({
  label,
  value,
  onChange,
  required = false,
  validate,
  customError,
  helperText,
  showError = false,
  className = '',
  requiredLabel = 'Wajib dipilih',
  id,
  name,
  disabled,
  children,
  ...rest
}) => {
  const [internalError, setInternalError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const runValidation = (val: string): string | null => {
    if (required && !val.trim()) return requiredLabel;
    if (validate) return validate(val);
    return null;
  };

  useEffect(() => {
    setInternalError(runValidation(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const effectiveError = customError || ((touched || showError) ? internalError : null);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        id={id}
        name={name}
        disabled={disabled}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setInternalError(runValidation(e.target.value));
        }}
        onBlur={() => setTouched(true)}
        {...rest}
        className={`block w-full rounded-md border py-1.5 px-3 text-xs font-medium text-slate-800 transition-colors focus:outline-none cursor-pointer ${
          effectiveError
            ? 'border-rose-500 bg-rose-50/20 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
            : 'border-slate-300 bg-white hover:border-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
        } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''} ${className}`}
      >
        {children}
      </select>
      {effectiveError ? (
        <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1 mt-0.5 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{effectiveError}</span>
        </p>
      ) : helperText ? (
        <p className="text-[10px] text-slate-500 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};

/**
 * Form-level helper: tracks whether a submit attempt has been made,
 * forcing every field's error to show at once (matches the native
 * `required` behavior of "nothing shows until you try to submit", but as
 * our own inline errors instead of the browser's default). Use with
 * e.preventDefault() in the submit handler: call markSubmitAttempted(),
 * then check hasErrors(fields) before proceeding.
 */
export function useFormSubmitAttempt() {
  const [submitAttempted, setSubmitAttempted] = useState(false);
  return { submitAttempted, markSubmitAttempted: () => setSubmitAttempted(true), reset: () => setSubmitAttempted(false) };
}
