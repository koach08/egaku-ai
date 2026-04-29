"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Props {
  imageFile: File | null;
  onMaskReady: (maskDataUrl: string) => void;
}

export function InpaintCanvas({ imageFile, onMaskReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(30);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 512, h: 512 });

  // Load image onto canvas
  useEffect(() => {
    if (!imageFile || !canvasRef.current || !maskCanvasRef.current) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      const maskCanvas = maskCanvasRef.current!;

      // Scale to fit max 512px while preserving aspect ratio
      const maxSize = 512;
      let w = img.width;
      let h = img.height;
      if (w > maxSize || h > maxSize) {
        const scale = maxSize / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      canvas.width = w;
      canvas.height = h;
      maskCanvas.width = w;
      maskCanvas.height = h;
      setCanvasSize({ w, h });

      // Draw image
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);

      // Clear mask (black = keep, white = edit)
      const maskCtx = maskCanvas.getContext("2d")!;
      maskCtx.fillStyle = "black";
      maskCtx.fillRect(0, 0, w, h);

      setImageLoaded(true);
    };
    img.src = URL.createObjectURL(imageFile);

    return () => URL.revokeObjectURL(img.src);
  }, [imageFile]);

  const getPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const draw = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current!;
    const maskCanvas = maskCanvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const maskCtx = maskCanvas.getContext("2d")!;

    // Draw red overlay on visible canvas
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Draw white on mask canvas
    maskCtx.fillStyle = "white";
    maskCtx.beginPath();
    maskCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    maskCtx.fill();
  }, [brushSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const { x, y } = getPos(e);
    draw(x, y);
  }, [getPos, draw]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { x, y } = getPos(e);
    draw(x, y);
  }, [isDrawing, getPos, draw]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const handleClear = useCallback(() => {
    if (!canvasRef.current || !maskCanvasRef.current || !imageFile) return;

    // Redraw image
    const img = new Image();
    img.onload = () => {
      const ctx = canvasRef.current!.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvasSize.w, canvasSize.h);
    };
    img.src = URL.createObjectURL(imageFile);

    // Clear mask
    const maskCtx = maskCanvasRef.current.getContext("2d")!;
    maskCtx.fillStyle = "black";
    maskCtx.fillRect(0, 0, canvasSize.w, canvasSize.h);
  }, [imageFile, canvasSize]);

  const handleConfirm = useCallback(() => {
    if (!maskCanvasRef.current) return;
    const dataUrl = maskCanvasRef.current.toDataURL("image/png");
    onMaskReady(dataUrl);
  }, [onMaskReady]);

  if (!imageFile) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
        Upload an image first, then paint over the area you want to change.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Label className="text-xs">Brush: {brushSize}px</Label>
        <Input
          type="range"
          min={5}
          max={80}
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="flex-1"
        />
        <Button variant="outline" size="sm" onClick={handleClear}>
          Clear
        </Button>
        <Button size="sm" onClick={handleConfirm} className="bg-white text-black hover:bg-white/90">
          Apply Mask
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">Paint red over the area you want to change. The AI will regenerate only that area.</p>
      <div className="relative rounded-lg overflow-hidden border border-muted bg-black flex justify-center">
        <canvas
          ref={canvasRef}
          className="max-w-full cursor-crosshair"
          style={{ maxHeight: 512 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
      {/* Hidden mask canvas */}
      <canvas ref={maskCanvasRef} className="hidden" />
    </div>
  );
}
