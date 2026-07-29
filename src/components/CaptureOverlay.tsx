import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, X, Check } from 'lucide-react';

interface SelectionRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface CaptureOverlayProps {
  onCaptureComplete: (cropDataUrl: string, rect: SelectionRect) => void;
  onClose: () => void;
  bgImageUrl?: string;
}

export default function CaptureOverlay({ onCaptureComplete, onClose, bgImageUrl }: CaptureOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [rect, setRect] = useState<SelectionRect | null>(null);
  
  const lastMousePos = useRef<{ clientX: number; clientY: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateSelection = useCallback(() => {
    if (!isDragging || !startPos || !lastMousePos.current) return;

    const edgeThreshold = 50; // px boundary
    const scrollSpeed = 15;
    const { clientX, clientY } = lastMousePos.current;

    // Edge Auto-Scroll
    if (clientY > window.innerHeight - edgeThreshold) {
      window.scrollBy({ top: scrollSpeed, behavior: 'auto' });
    } else if (clientY < edgeThreshold) {
      window.scrollBy({ top: -scrollSpeed, behavior: 'auto' });
    }

    const pageX = clientX + window.scrollX;
    const pageY = clientY + window.scrollY;

    const w = Math.abs(pageX - startPos.x);
    const h = Math.abs(pageY - startPos.y);
    const x = Math.min(pageX, startPos.x);
    const y = Math.min(pageY, startPos.y);

    setRect({ x, y, w, h });

    if (isDragging) {
      animationFrameRef.current = requestAnimationFrame(updateSelection);
    }
  }, [isDragging, startPos]);

  useEffect(() => {
    if (isDragging) {
      animationFrameRef.current = requestAnimationFrame(updateSelection);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isDragging, updateSelection]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const pageX = e.clientX + window.scrollX;
    const pageY = e.clientY + window.scrollY;

    setIsDragging(true);
    setStartPos({ x: pageX, y: pageY });
    setRect({ x: pageX, y: pageY, w: 0, h: 0 });
    lastMousePos.current = { clientX: e.clientX, clientY: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    lastMousePos.current = { clientX: e.clientX, clientY: e.clientY };
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
  };

  const handleConfirmCapture = () => {
    if (!rect || rect.w < 5 || rect.h < 5) return;

    // Perform canvas cropping if background image is provided
    if (bgImageUrl) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = rect.w;
        canvas.height = rect.h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
          onCaptureComplete(canvas.toDataURL('image/png'), rect);
        }
      };
      img.src = bgImageUrl;
    } else {
      onCaptureComplete('', rect);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="fixed inset-0 z-50 cursor-crosshair select-none bg-black/30 backdrop-blur-[1px]"
    >
      {/* Top Banner */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#0a0a0f]/90 border border-blue-500/30 px-4 py-2 rounded-xl text-stone-200 text-xs font-mono flex items-center gap-2 shadow-2xl glass pointer-events-auto">
        <Camera size={14} className="text-blue-400 animate-pulse" />
        <span>Drag selection box to capture. Drag to screen top/bottom to auto-scroll.</span>
        <button onClick={onClose} className="ml-2 text-stone-400 hover:text-white p-1 rounded">
          <X size={14} />
        </button>
      </div>

      {/* Selection Box */}
      {rect && rect.w > 0 && rect.h > 0 && (
        <div
          style={{
            left: `${rect.x - window.scrollX}px`,
            top: `${rect.y - window.scrollY}px`,
            width: `${rect.w}px`,
            height: `${rect.h}px`,
          }}
          className="absolute border-2 border-blue-400 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.5)] pointer-events-auto"
        >
          {!isDragging && (
            <div className="absolute -bottom-10 right-0 flex items-center gap-2 bg-[#0a0a0f] border border-blue-500/30 p-1.5 rounded-lg shadow-xl glass">
              <button
                onClick={handleConfirmCapture}
                className="bg-blue-600 hover:bg-blue-500 text-white p-1 rounded transition-colors flex items-center gap-1 text-[10px] px-2 font-bold"
              >
                <Check size={12} /> Capture
              </button>
              <button
                onClick={onClose}
                className="bg-stone-800 hover:bg-stone-700 text-stone-300 p-1 rounded transition-colors text-[10px] px-2"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
