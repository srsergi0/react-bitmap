import React, { useRef, useEffect, useState } from 'react';
import { BitmapRenderer } from '../core/BitmapRenderer';
import { resolvePalette, PaletteName } from '../core/palettes';

/**
 * Props for the BitImage component.
 */
export interface BitImageProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  /**
   * The source URL or base64 data URI of the image to render.
   */
  src: string;
  /**
   * The size of the pixelated blocks. Larger values result in a more pixelated, lower resolution look.
   * @default 4
   */
  pixelSize?: number;
  /**
   * The dithering algorithm to apply to the image.
   * - 'none': Direct color quantization.
   * - 'bayer2', 'bayer4', 'bayer8': Ordered dithering using Bayer matrices of different sizes.
   * - 'halftone': Simulated halftone screening effect.
   * - 'noise': Pseudo-random noise dithering.
   * @default 'bayer4'
   */
  ditherType?: 'none' | 'bayer2' | 'bayer4' | 'bayer8' | 'halftone' | 'noise';
  /**
   * The intensity/amount of the dithering effect, ranging from 0.0 (no dither) to 1.0 (full dither).
   * @default 1.0
   */
  ditherAmount?: number;
  /**
   * Brightness adjustment multiplier.
   * @default 1.0
   */
  brightness?: number;
  /**
   * Contrast adjustment multiplier.
   * @default 1.0
   */
  contrast?: number;
  /**
   * Saturation adjustment multiplier.
   * @default 1.0
   */
  saturation?: number;
  /**
   * An array of hex color strings (e.g., ['#000000', '#ffffff']) or a predefined PaletteName to map the image colors to.
   */
  palette?: string[] | PaletteName;
  /**
   * Number of color steps/levels to use when no palette is applied (grayscale or full RGB).
   * @default 8
   */
  colorDepth?: number;
  /**
   * Whether to smoothly transition colors when the palette changes.
   * @default false
   */
  transitionPalette?: boolean;
  /**
   * Duration of the palette color transition in milliseconds.
   * @default 300
   */
  transitionDuration?: number; // in ms
  /**
   * Callback function fired when the source image has successfully loaded.
   */
  onLoad?: () => void;
}

/**
 * A high-performance React component that renders a pixelated and dithered version of an image
 * using WebGL 2.0. Supports custom palettes, multiple dithering algorithms, and smooth palette transitions.
 */
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
