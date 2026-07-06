import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { BitmapRenderer } from '../core/BitmapRenderer';
import { resolvePalette, PaletteName } from '../core/palettes';

export interface BitVideoProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  src?: string;
  stream?: MediaStream;
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
  muted?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  crossOrigin?: 'anonymous' | 'use-credentials';
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export interface BitVideoRef {
  video: HTMLVideoElement | null;
  canvas: HTMLCanvasElement | null;
  play: () => Promise<void>;
  pause: () => void;
}

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
