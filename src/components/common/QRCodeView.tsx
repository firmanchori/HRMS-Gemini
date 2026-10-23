import React, { useMemo } from 'react';
import { generateQRMatrix } from '../../utils/qrGenerator';

interface QRCodeViewProps {
  value: string;
  size?: number;
  label?: string;
  subLabel?: string;
  showBorder?: boolean;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  size = 140,
  label,
  subLabel,
  showBorder = true,
}) => {
  const matrix = useMemo(() => generateQRMatrix(value, 25), [value]);
  const matrixSize = matrix.length;
  const cellSize = size / matrixSize;

  return (
    <div
      className={`inline-flex flex-col items-center bg-white p-3 ${
        showBorder ? 'border border-slate-200 rounded-lg shadow-xs' : ''
      }`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shape-rendering-crispEdges"
      >
        <rect width={size} height={size} fill="#ffffff" />
        {matrix.map((row, r) =>
          row.map((filled, c) => {
            if (!filled) return null;
            return (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill="#0f172a"
              />
            );
          })
        )}
      </svg>
      {label && (
        <span className="mt-2 text-xs font-semibold text-slate-800 font-mono tracking-tight text-center">
          {label}
        </span>
      )}
      {subLabel && (
        <span className="text-[10px] text-slate-500 font-sans text-center max-w-[140px] truncate">
          {subLabel}
        </span>
      )}
    </div>
  );
};
