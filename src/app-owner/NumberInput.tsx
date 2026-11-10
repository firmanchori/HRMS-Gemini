import React from "react";

/**
 * Strips a leading zero that isn't part of a decimal ("01" -> "1", "007" ->
 * "7", "00" -> "0"), but leaves a genuine decimal alone ("0.1" stays "0.1").
 * Exported so it can be unit-tested without mounting a component.
 */
export function maskLeadingZero(raw: string): string {
  return raw.replace(/^0+(?=[0-9])/, "");
}

/**
 * Standard numeric input for this app — every plain `<input type="number">`
 * should go through this instead of being hand-rolled per screen, because
 * browsers don't auto-strip a leading zero while typing ("050" can stay
 * visible even after React re-renders with the numeric value 50, since the
 * parsed value didn't change). This masks the raw text directly on keystroke
 * and auto-selects on focus so clicking into a field replaces its value
 * instead of inserting into it.
 */
export function NumberInput({
  value,
  onChange,
  className,
  min,
  max,
  placeholder,
  disabled,
  required,
  showError,
  requiredLabel = "Wajib diisi",
  customError,
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  min?: number;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  /** Force the "required but empty" error to show (e.g. on a submit attempt). */
  showError?: boolean;
  requiredLabel?: string;
  /** Externally computed error (e.g. a max-exceeded check) — always wins over the built-in required check. */
  customError?: string | null;
}) {
  const effectiveError = customError || (required && showError && (!value || value <= 0) ? requiredLabel : null);
  return (
    <div className="w-full space-y-1">
      <input
        type="number"
        disabled={disabled}
        min={min}
        max={max}
        placeholder={placeholder}
        value={value}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const cleaned = maskLeadingZero(e.target.value);
          if (cleaned !== e.target.value) e.target.value = cleaned;
          onChange(cleaned === "" || cleaned === "-" ? 0 : Number(cleaned));
        }}
        className={`${className ?? ""} ${effectiveError ? "border-rose-500 bg-rose-50/20" : ""}`}
      />
      {effectiveError && (
        <p className="text-[11px] font-medium text-rose-600">{effectiveError}</p>
      )}
    </div>
  );
}
