import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { validateDateString, DateValidationResult } from '../../utils/dateValidator';

interface ValidatedDateInputProps {
  id?: string;
  name?: string;
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
  customError?: string;
  helperText?: string;
  validateMode?: 'all' | 'birthDate' | 'futureOnly' | 'pastOnly';
  onErrorChange?: (error: string | null) => void;
  showError?: boolean;
}

export const ValidatedDateInput: React.FC<ValidatedDateInputProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  minDate,
  maxDate,
  className = '',
  customError,
  helperText,
  validateMode = 'all',
  onErrorChange,
  showError = false,
}) => {
  const [internalError, setInternalError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const runValidation = (dateVal: string): string | null => {
    if (!dateVal) {
      if (required) return 'Tanggal wajib dipilih/diisi';
      return null;
    }

    const check = validateDateString(dateVal);
    if (!check.isValid) {
      return check.errorMessage || 'Format tanggal tidak valid (YYYY-MM-DD)';
    }

    const chosen = new Date(dateVal);

    if (minDate && dateVal < minDate) {
      return `Tanggal tidak boleh sebelum ${minDate}`;
    }

    if (maxDate && dateVal > maxDate) {
      return `Tanggal tidak boleh setelah ${maxDate}`;
    }

    if (validateMode === 'birthDate') {
      const today = new Date();
      if (chosen > today) {
        return 'Tanggal lahir tidak boleh di masa depan';
      }
      const age = today.getFullYear() - chosen.getFullYear();
      if (age < 17) {
        return 'Usia minimal adalah 17 tahun (sesuai UU Ketenagakerjaan)';
      }
    } else if (validateMode === 'futureOnly') {
      const todayStr = new Date().toISOString().split('T')[0];
      if (dateVal < todayStr) {
        return 'Tanggal harus hari ini atau di masa depan';
      }
    } else if (validateMode === 'pastOnly') {
      const todayStr = new Date().toISOString().split('T')[0];
      if (dateVal > todayStr) {
        return 'Tanggal tidak boleh di masa depan';
      }
    }

    return null;
  };

  useEffect(() => {
    const err = runValidation(value);
    setInternalError(err);
    if (onErrorChange) {
      onErrorChange(customError || err);
    }
  }, [value, minDate, maxDate, customError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    const err = runValidation(val);
    setInternalError(err);
  };

  const handleBlur = () => {
    setTouched(true);
    const err = runValidation(value);
    setInternalError(err);
  };

  const effectiveError = customError || (touched || showError ? internalError : null);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative rounded-md shadow-2xs">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
        </div>

        <input
          type="date"
          id={id}
          name={name}
          disabled={disabled}
          required={required}
          value={value}
          min={minDate}
          max={maxDate}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`block w-full rounded-md border py-1.5 pl-9 pr-3 text-xs font-medium text-slate-800 transition-colors focus:outline-none ${
            effectiveError
              ? 'border-rose-500 bg-rose-50/20 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
              : 'border-slate-300 bg-white hover:border-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
          } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''} ${className}`}
        />
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
