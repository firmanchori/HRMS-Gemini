import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

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
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(value, {
      width: size * 2, // 2x for sharp retina canvas & crisp print
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate authentic QR Code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  return (
    <div
      className={`inline-flex flex-col items-center bg-white ${
        showBorder ? 'p-2 border border-slate-200 rounded-lg shadow-xs' : ''
      }`}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          width={size}
          height={size}
          alt={`QR Code: ${value}`}
          className="block"
          style={{ imageRendering: 'pixelated', width: size, height: size }}
        />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="bg-slate-50 animate-pulse rounded flex items-center justify-center text-[10px] text-slate-400 font-mono"
        >
          Memuat QR...
        </div>
      )}
      {label && (
        <span className="mt-1.5 text-xs font-semibold text-slate-800 font-mono tracking-tight text-center">
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
