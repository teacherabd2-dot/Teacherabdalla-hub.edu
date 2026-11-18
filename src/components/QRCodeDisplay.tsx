"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  url: string;
  size?: number;
}

export function QRCodeDisplay({ url, size = 200 }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 2,
        color: {
          dark: "#1e293b",
          light: "#ffffff",
        },
      }).catch((err) => {
        console.error("QR Code generation error:", err);
      });
    }
  }, [url, size]);

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border-4 border-amber-300 shadow-md inline-block">
      <canvas ref={canvasRef} className="rounded-lg max-w-full" />
    </div>
  );
}
