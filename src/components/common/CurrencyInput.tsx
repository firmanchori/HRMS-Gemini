import React, { useState, useEffect } from 'react';
import { AlertCircle, Check } from 'lucide-react';

interface CurrencyInputProps {
  id?: string;
  name?: string;
  label?: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  min?: number;
  max?: number;
  helperText?: string;
  showTerbilang?: boolean;
  showError?: boolean;
}

/**
 * Formats a number with Indonesian thousand separator (dot)
 * e.g. 15000000 -> "15.000.000"
 */
export function formatThousandSeparator(num: number | string): string {
  if (num === '' || num === null || num === undefined || isNaN(Number(num))) return '';
  const clean = Math.round(Number(num)).toString();
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Parses a string formatted with dots or commas into a raw integer
 * e.g. "15.000.000" -> 15000000
 */
export function parseThousandSeparator(str: string): number {
  if (!str) return 0;
  // Remove all non-digits
  const clean = str.replace(/[^\d]/g, '');
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Converts Indonesian number to words (Terbilang)
 */
export function terbilangRupiah(n: number): string {
  if (!n || n <= 0) return '';
  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  function bilang(num: number): string {
    if (num < 12) return satuan[num];
    if (num < 20) return bilang(num - 10) + ' Belas';
    if (num < 100) return bilang(Math.floor(num / 10)) + ' Puluh' + (num % 10 !== 0 ? ' ' + bilang(num % 10) : '');
    if (num < 200) return 'Seratus' + (num - 100 !== 0 ? ' ' + bilang(num - 100) : '');
    if (num < 1000) return bilang(Math.floor(num / 100)) + ' Ratus' + (num % 100 !== 0 ? ' ' + bilang(num % 100) : '');
    if (num < 2000) return 'Seribu' + (num - 1000 !== 0 ? ' ' + bilang(num - 1000) : '');
    if (num < 1000000) return bilang(Math.floor(num / 1000)) + ' Ribu' + (num % 1000 !== 0 ? ' ' + bilang(num % 1000) : '');
    if (num < 1000000000) return bilang(Math.floor(num / 1000000)) + ' Juta' + (num % 1000000 !== 0 ? ' ' + bilang(num % 1000000) : '');
    if (num < 1000000000000) return bilang(Math.floor(num / 1000000000)) + ' Miliar' + (num % 1000000000 !== 0 ? ' ' + bilang(num % 1000000000) : '');
    return bilang(Math.floor(num / 1000000000000)) + ' Triliun';
  }
  return bilang(Math.floor(n)).trim() + ' Rupiah';
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  placeholder = '0',
  required = false,
  disabled = false,
  className = '',
  error,
  min,
  max,
  helperText,
  showTerbilang = true,
  showError = false,
}) => {
  const [displayValue, setDisplayValue] = useState<string>(
    value ? formatThousandSeparator(value) : ''
  );
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayValue(value > 0 ? formatThousandSeparator(value) : value === 0 ? '0' : '');
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const numericValue = parseThousandSeparator(rawInput);

    if (max !== undefined && numericValue > max) return;

    setDisplayValue(numericValue > 0 ? formatThousandSeparator(numericValue) : rawInput === '' ? '' : '0');
    onChange(numericValue);
  };

  const handleBlur = () => {
    setTouched(true);
  };

  // Compute effective error
  let computedError = error;
  if (!computedError && (touched || showError)) {
    if (required && (!value || value <= 0)) {
      computedError = 'Nominal mata uang wajib diisi';
    } else if (min !== undefined && value < min) {
      computedError = `Nominal minimal Rp ${formatThousandSeparator(min)}`;
    } else if (max !== undefined && value > max) {
      computedError = `Nominal maksimal Rp ${formatThousandSeparator(max)}`;
    }
  }

  const hasError = !!computedError;
  const words = showTerbilang && value && value > 0 ? terbilangRupiah(value) : '';

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative rounded-md shadow-2xs">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <span className={`text-xs font-bold font-mono ${hasError ? 'text-rose-500' : 'text-slate-500'}`}>
            Rp
          </span>
        </div>

        <input
          type="text"
          inputMode="numeric"
          id={id}
          name={name}
          disabled={disabled}
          required={required}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`block w-full rounded-md border py-1.5 pl-10 pr-3 text-xs font-mono font-bold text-slate-900 transition-colors focus:outline-none ${
            hasError
              ? 'border-rose-500 bg-rose-50/30 text-rose-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
              : 'border-slate-300 bg-white hover:border-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
          } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''} ${className}`}
        />
      </div>

      {/* Form Error Display */}
      {hasError ? (
        <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1 mt-1 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
          <span>{computedError}</span>
        </p>
      ) : words ? (
        <p className="text-[10px] font-medium text-indigo-700 italic mt-0.5 truncate flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block shrink-0"></span>
          <span>{words}</span>
        </p>
      ) : helperText ? (
        <p className="text-[10px] text-slate-500 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};
