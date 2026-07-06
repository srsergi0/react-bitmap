import React, { useRef, useEffect, useState } from 'react';
import { BitmapRenderer } from '../core/BitmapRenderer';
import { resolvePalette, PaletteName } from '../core/palettes';

export interface BitImageProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  src: string;
  pixelSize?: number;
  ditherType?: 'none' | 'bayer2' | 'bayer4' | 'bayer8' | 'halftone' | 'noise';
  ditherAmount?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  palette?: string[] | PaletteName;
  colorDepth?: number;
  transitionPalette?: boolean;
  transitionDuration?: number; // in ms
  onLoad?: () => void;
}

export const BitImage: React.FC<BitImageProps> = ({
  src,
  pixelSize = 4,
  ditherType = 'bayer4',
  ditherAmount = 1.0,
  brightness = 1.0,
  contrast = 1.0,
  saturation = 1.0,
  palette,
  colorDepth = 8,
  transitionPalette = false,
  transitionDuration = 300,
  onLoad,
  style,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<BitmapRenderer | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Handle image loading asynchronously
  useEffect(() => {
    if (!src) {
      setLoadedImage(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous'; // Set anonymous to enable cross-origin textures
    img.onload = () => {
      setLoadedImage(img);
      if (onLoad) onLoad();
    };
    img.src = src;

    return () => {
      img.onload = null;
    };
  }, [src, onLoad]);

  // Handle WebGPU / Canvas2D context lifecycle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new BitmapRenderer(canvas);
    rendererRef.current = renderer;

    renderer.init().then(() => {
      setIsInitialized(true);
    }).catch(err => {
      console.warn('BitmapRenderer init failed, proceeding with fallback:', err);
      setIsInitialized(true);
    });

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      setIsInitialized(false);
    };
  }, []);

  // Handle updates and rendering
  useEffect(() => {
    const renderer = rendererRef.current;
    const image = loadedImage;
    if (!renderer || !image || !isInitialized) return;

    let rafId: number;

    const runRender = () => {
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;

      const needsNextFrame = renderer.render(image, width, height, {
        pixelSize,
        ditherType,
        ditherAmount,
        brightness,
        contrast,
        saturation,
        palette: resolvePalette(palette),
        colorDepth,
        transitionPalette,
        transitionDuration,
      });

      if (needsNextFrame) {
        rafId = requestAnimationFrame(runRender);
      }
    };

    runRender();

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [
    loadedImage,
    isInitialized,
    pixelSize,
    ditherType,
    ditherAmount,
    brightness,
    contrast,
    saturation,
    palette,
    colorDepth,
    transitionPalette,
    transitionDuration,
  ]);

  // Combine default styling with user styling to prevent aspect ratio glitches
  const canvasStyle: React.CSSProperties = {
    display: 'block',
    maxWidth: '100%',
    height: 'auto',
    imageRendering: 'pixelated', // Keep pixels sharp when scaled in browser
    ...style,
  };

  return (
    <canvas
      ref={canvasRef}
      style={canvasStyle}
      {...props}
    />
  );
};
