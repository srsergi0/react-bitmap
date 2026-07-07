import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { BitmapRenderer } from '../core/BitmapRenderer';
import { resolvePalette, PaletteName } from '../core/palettes';

/**
 * Props for the BitVideo component.
 */
export interface BitVideoProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  /**
   * The source URL of the video file to load and render.
   */
  src?: string;
  /**
   * A MediaStream (e.g., from a webcam or canvas capture) to render in real-time.
   */
  stream?: MediaStream;
  /**
   * The size of the pixelated blocks. Larger values result in a more pixelated, lower resolution look.
   * @default 4
   */
  pixelSize?: number;
  /**
   * The dithering algorithm to apply to each video frame.
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
   * An array of hex color strings (e.g., ['#000000', '#ffffff']) or a predefined PaletteName to map the video colors to.
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
   * Whether the internal video player is muted.
   * @default true
   */
  muted?: boolean;
  /**
   * Whether the internal video player should loop playback.
   * @default true
   */
  loop?: boolean;
  /**
   * Whether the internal video player should start playing automatically.
   * @default true
   */
  autoPlay?: boolean;
  /**
   * CORS configuration for loading cross-origin video files.
   * @default 'anonymous'
   */
  crossOrigin?: 'anonymous' | 'use-credentials';
  /**
   * Callback function fired when video playback starts or resumes.
   */
  onPlay?: () => void;
  /**
   * Callback function fired when video playback is paused.
   */
  onPause?: () => void;
  /**
   * Callback function fired when video playback finishes.
   */
  onEnded?: () => void;
}

/**
 * Handle ref object exposed by the BitVideo component.
 */
export interface BitVideoRef {
  /**
   * The underlying HTMLVideoElement used to load and play the source video.
   */
  video: HTMLVideoElement | null;
  /**
   * The underlying HTMLCanvasElement where WebGL 2.0 renders the retro effect.
   */
  canvas: HTMLCanvasElement | null;
  /**
   * Plays the video element.
   */
  play: () => Promise<void>;
  /**
   * Pauses the video element.
   */
  pause: () => void;
}

/**
 * A high-performance React component that renders a pixelated and dithered version of a video file
 * or live camera stream in real-time using WebGL 2.0. Supports custom palettes, multiple dithering
 * algorithms, and smooth palette transitions.
 */
export const BitVideo = forwardRef<BitVideoRef, BitVideoProps>(({
  src,
  stream,
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
  muted = true,
  loop = true,
  autoPlay = true,
  crossOrigin = 'anonymous',
  onPlay,
  onPause,
  onEnded,
  style,
  ...props
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<BitmapRenderer | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // We maintain animation handles to cancel loops cleanly
  const loopRef = useRef<{
    rafId?: number;
    rvfcId?: number;
  }>({});

  // Initialize the programmatically created video element
  useEffect(() => {
    const video = document.createElement('video');
    video.crossOrigin = crossOrigin;
    video.playsInline = true;
    video.muted = muted;
    video.loop = loop;
    video.autoplay = autoPlay;
    videoRef.current = video;

    return () => {
      video.pause();
      video.src = '';
      video.srcObject = null;
      video.load();
      videoRef.current = null;
    };
  }, [crossOrigin]);

  // Handle video parameters update
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    video.loop = loop;
  }, [muted, loop]);

  // Handle source changes (file URL vs camera stream)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    
    if (stream) {
      video.src = '';
      video.srcObject = stream;
      video.play().catch(err => {
        console.warn('Auto-play stream failed (awaiting user interaction):', err);
      });
    } else if (src) {
      video.srcObject = null;
      video.src = src;
      video.load();
      if (autoPlay) {
        video.play().catch(err => {
          console.warn('Auto-play video failed (awaiting user interaction):', err);
        });
      }
    } else {
      video.src = '';
      video.srcObject = null;
    }
  }, [src, stream, autoPlay]);

  // Initialize context asynchronously
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new BitmapRenderer(canvas);
    rendererRef.current = renderer;

    renderer.init().then(() => {
      setIsInitialized(true);
    }).catch(err => {
      console.warn('BitmapRenderer init failed in BitVideo, proceeding with fallback:', err);
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

  // Expose public API through the ref
  useImperativeHandle(ref, () => ({
    video: videoRef.current,
    canvas: canvasRef.current,
    play: async () => {
      if (videoRef.current) {
        return videoRef.current.play();
      }
      return Promise.reject(new Error('Video element not initialized'));
    },
    pause: () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }));

  // Render a single static frame (useful when video is loaded, seeked, or props change while paused)
  const renderSingleFrame = () => {
    const renderer = rendererRef.current;
    const video = videoRef.current;
    if (!renderer || !video || video.readyState < video.HAVE_CURRENT_DATA || !isInitialized) return;

    renderer.render(video, video.videoWidth, video.videoHeight, {
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
  };

  // Setup loop function that uses requestVideoFrameCallback for extreme synchronization
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isInitialized) return;

    let localRafId: number;

    const renderLoop = () => {
      const renderer = rendererRef.current;
      if (!renderer || !video) return;

      let needsNextFrame = false;

      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        needsNextFrame = renderer.render(video, video.videoWidth, video.videoHeight, {
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
      }

      // If the video is playing, or if it's paused but a color transition is active, keep rendering frames!
      if (!video.paused && !video.ended) {
        queueNextFrame();
      } else if (needsNextFrame) {
        localRafId = requestAnimationFrame(renderLoop);
      }
    };

    const queueNextFrame = () => {
      if (!video || video.paused || video.ended) return;

      if (video.requestVideoFrameCallback) {
        loopRef.current.rvfcId = video.requestVideoFrameCallback(renderLoop);
      } else {
        loopRef.current.rafId = requestAnimationFrame(renderLoop);
      }
    };

    const cancelNextFrame = () => {
      if (loopRef.current.rvfcId !== undefined && video.cancelVideoFrameCallback) {
        video.cancelVideoFrameCallback(loopRef.current.rvfcId);
      }
      if (loopRef.current.rafId !== undefined) {
        cancelAnimationFrame(loopRef.current.rafId);
      }
      cancelAnimationFrame(localRafId);
    };

    const handlePlay = () => {
      cancelNextFrame();
      queueNextFrame();
      if (onPlay) onPlay();
    };

    const handlePause = () => {
      // Do not stop instantly if a transition is in progress; renderLoop will transition and stop.
      renderLoop();
      if (onPause) onPause();
    };

    const handleEnded = () => {
      cancelNextFrame();
      if (onEnded) onEnded();
    };

    const handleSeekedOrLoaded = () => {
      renderSingleFrame();
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('playing', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('seeked', handleSeekedOrLoaded);
    video.addEventListener('loadeddata', handleSeekedOrLoaded);
    video.addEventListener('loadedmetadata', handleSeekedOrLoaded);

    // Initial frame render if video is already ready
    renderSingleFrame();

    // If already playing (e.g. from autoplay), kickstart loop
    if (!video.paused) {
      queueNextFrame();
    }

    return () => {
      cancelNextFrame();
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('playing', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('seeked', handleSeekedOrLoaded);
      video.removeEventListener('loadeddata', handleSeekedOrLoaded);
      video.removeEventListener('loadedmetadata', handleSeekedOrLoaded);
    };
  }, [
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
    onPlay,
    onPause,
    onEnded,
  ]);

  const canvasStyle: React.CSSProperties = {
    display: 'block',
    maxWidth: '100%',
    height: 'auto',
    imageRendering: 'pixelated',
    ...style,
  };

  return (
    <canvas
      ref={canvasRef}
      style={canvasStyle}
      {...props}
    />
  );
});

BitVideo.displayName = 'BitVideo';
