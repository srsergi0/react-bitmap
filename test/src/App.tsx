import React, { useState, useRef, useEffect } from 'react';
import { 
  BitImage, 
  BitVideo, 
  PALETTE_PRESETS, 
  PaletteName 
} from 'react-bitmap';
import { 
  Sliders, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Camera, 
  Upload, 
  Sparkles, 
  Activity
} from 'lucide-react';

const DEFAULT_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><defs><linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:%23ff007f;stop-opacity:1' /><stop offset='50%' style='stop-color:%237b2ff7;stop-opacity:1' /><stop offset='100%' style='stop-color:%2300f0ff;stop-opacity:1' /></linearGradient></defs><rect width='100%' height='100%' fill='url(%23grad)'/><circle cx='400' cy='300' r='180' fill='%23fffb00'/><circle cx='400' cy='300' r='150' fill='none' stroke='%23080c14' stroke-width='10'/><path d='M 300 450 Q 400 350 500 450' stroke='%23080c14' stroke-width='15' fill='none' stroke-linecap='round'/><circle cx='340' cy='250' r='20' fill='%23080c14'/><circle cx='460' cy='250' r='20' fill='%23080c14'/><text x='50%' y='90%' font-size='38' font-family='sans-serif' font-weight='bold' fill='%23ffffff' text-anchor='middle'>REACT BITMAP WEBGL</text></svg>";

interface Preset {
  name: string;
  palette: PaletteName | 'none' | 'grayscale';
  pixelSize: number;
  ditherType: 'none' | 'bayer2' | 'bayer4' | 'bayer8' | 'halftone' | 'noise';
  ditherAmount: number;
  brightness: number;
  contrast: number;
  saturation: number;
  colorDepth?: number;
}

const PRESETS: Record<string, Preset> = {
  gameboy: {
    name: 'GameBoy DMG',
    palette: 'gameboy',
    pixelSize: 4,
    ditherType: 'bayer4',
    ditherAmount: 1.0,
    brightness: 1.0,
    contrast: 1.25,
    saturation: 1.0,
  },
  gameboyPocket: {
    name: 'GB Pocket',
    palette: 'macintosh',
    pixelSize: 4,
    ditherType: 'bayer4',
    ditherAmount: 0.95,
    brightness: 1.0,
    contrast: 1.35,
    saturation: 0.0,
  },
  macintosh: {
    name: 'Mac Classic',
    palette: 'monochrome',
    pixelSize: 2,
    ditherType: 'bayer8',
    ditherAmount: 1.0,
    brightness: 1.0,
    contrast: 1.6,
    saturation: 0.0,
  },
  cga: {
    name: 'CGA Mode 4',
    palette: 'cga',
    pixelSize: 4,
    ditherType: 'bayer4',
    ditherAmount: 1.0,
    brightness: 0.95,
    contrast: 1.4,
    saturation: 1.0,
  },
  ega: {
    name: 'EGA 16-Color',
    palette: 'ega',
    pixelSize: 3,
    ditherType: 'bayer4',
    ditherAmount: 0.8,
    brightness: 1.0,
    contrast: 1.1,
    saturation: 1.2,
  },
  pipboy: {
    name: 'PipBoy Green',
    palette: 'pipboy',
    pixelSize: 4,
    ditherType: 'bayer2',
    ditherAmount: 0.9,
    brightness: 1.2,
    contrast: 1.5,
    saturation: 1.0,
  },
  pipboyAmber: {
    name: 'PipBoy Amber',
    palette: 'pipboyAmber',
    pixelSize: 4,
    ditherType: 'bayer4',
    ditherAmount: 0.9,
    brightness: 1.15,
    contrast: 1.45,
    saturation: 1.0,
  },
  cyberpunk: {
    name: 'Cyber Neon',
    palette: 'cyberpunk',
    pixelSize: 3,
    ditherType: 'bayer8',
    ditherAmount: 1.0,
    brightness: 1.05,
    contrast: 1.3,
    saturation: 1.5,
  },
  vaporwave: {
    name: 'Vaporwave',
    palette: 'vaporwave',
    pixelSize: 5,
    ditherType: 'halftone',
    ditherAmount: 1.0,
    brightness: 1.0,
    contrast: 1.2,
    saturation: 1.4,
  },
  eink: {
    name: 'E-Ink Dither',
    palette: 'monochrome',
    pixelSize: 2,
    ditherType: 'bayer8',
    ditherAmount: 1.0,
    brightness: 1.0,
    contrast: 1.5,
    saturation: 0.0,
  },
  grayscale: {
    name: 'Grayscale',
    palette: 'grayscale',
    pixelSize: 3,
    ditherType: 'bayer4',
    ditherAmount: 1.0,
    brightness: 1.0,
    contrast: 1.2,
    saturation: 0.0,
    colorDepth: 4
  },
  noDither: {
    name: 'Clean Pixel',
    palette: 'ega',
    pixelSize: 6,
    ditherType: 'none',
    ditherAmount: 0.0,
    brightness: 1.0,
    contrast: 1.1,
    saturation: 1.1,
  }
};

function App() {
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'webcam'>('image');
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  
  // Renderer state parameters
  const [pixelSize, setPixelSize] = useState<number>(4);
  const [ditherType, setDitherType] = useState<Preset['ditherType']>('bayer4');
  const [ditherAmount, setDitherAmount] = useState<number>(1.0);
  const [brightness, setBrightness] = useState<number>(1.0);
  const [contrast, setContrast] = useState<number>(1.2);
  const [saturation, setSaturation] = useState<number>(1.0);
  const [colorDepth, setColorDepth] = useState<number>(8);
  const [paletteName, setPaletteName] = useState<string>('gameboy');
  const [customPalette, setCustomPalette] = useState<string[] | null>(null);
  const [transitionPalette, setTransitionPalette] = useState<boolean>(true);
  const [transitionDuration, setTransitionDuration] = useState<number>(500);

  // Asset inputs
  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_IMAGE);
  const [videoSrc, setVideoSrc] = useState<string>('');
  
  // Custom video drawing parameters
  const [canvasStream, setCanvasStream] = useState<MediaStream | null>(null);
  const generatorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Webcam capturing
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  // Benchmarking stats
  const [fps, setFps] = useState<number>(60);
  const lastTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);

  const getCodeSnippet = () => {
    const paletteProp = paletteName === 'none' 
      ? '' 
      : paletteName === 'grayscale'
        ? '\n  palette="grayscale"'
        : `\n  palette="${paletteName}"`;

    const depthProp = (paletteName === 'none' || paletteName === 'grayscale') && colorDepth !== 8
      ? `\n  colorDepth={${colorDepth}}`
      : '';

    const transitionProp = transitionPalette
      ? `\n  transitionPalette={true}\n  transitionDuration={${transitionDuration}}`
      : '';

    const componentName = activeTab === 'image' ? 'BitImage' : 'BitVideo';
    const srcProp = activeTab === 'image' 
      ? 'src="path/to/image.jpg"' 
      : videoSrc 
        ? 'src="path/to/video.mp4"' 
        : 'stream={mediaStream}';

    return `<${componentName}
  ${srcProp}
  pixelSize={${pixelSize}}
  ditherType="${ditherType}"
  ditherAmount={${ditherAmount}}
  brightness={${brightness}}
  contrast={${contrast}}
  saturation={${saturation}}${paletteProp}${depthProp}${transitionProp}
/>`;
  };

  // Apply visual theme presets
  const applyPreset = (key: string) => {
    const preset = PRESETS[key];
    if (!preset) return;
    
    setPixelSize(preset.pixelSize);
    setDitherType(preset.ditherType);
    setDitherAmount(preset.ditherAmount);
    setBrightness(preset.brightness);
    setContrast(preset.contrast);
    setSaturation(preset.saturation);
    
    if (preset.palette === 'grayscale' || preset.palette === 'none') {
      setCustomPalette(null);
      setPaletteName(preset.palette);
      if (preset.colorDepth) setColorDepth(preset.colorDepth);
    } else {
      setCustomPalette(null);
      setPaletteName(preset.palette);
      setColorDepth(8);
    }
  };

  // Generate synthetic high-FPS video animation locally
  useEffect(() => {
    const canvas = generatorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;
    
    const draw = () => {
      // Draw background
      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw rotating vector logo
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(angle);
      
      const grad = ctx.createLinearGradient(-120, -120, 120, 120);
      grad.addColorStop(0, '#ec4899');
      grad.addColorStop(0.5, '#3b82f6');
      grad.addColorStop(1, '#eab308');
      
      ctx.fillStyle = grad;
      ctx.fillRect(-120, -120, 240, 240);
      ctx.restore();

      // Bouncing retro neon balls
      const time = Date.now() * 0.0025;
      for (let i = 0; i < 4; i++) {
        const offset = i * (Math.PI / 2);
        const x = canvas.width / 2 + Math.cos(time + offset) * 160;
        const y = canvas.height / 2 + Math.sin(time * 1.3 + offset) * 160;
        
        ctx.beginPath();
        ctx.arc(x, y, 35 - i * 4, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#ffffff';
        ctx.fill();
      }

      // Draw technical overlay text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GPU CORE 60 FPS', canvas.width / 2, canvas.height / 2 - 10);
      
      ctx.fillStyle = '#9ca3af';
      ctx.font = '20px "Share Tech Mono", monospace';
      ctx.fillText('STRESS TESTING SOURCE', canvas.width / 2, canvas.height / 2 + 25);
      
      angle += 0.015;
      animId = requestAnimationFrame(draw);
    };

    draw();

    try {
      // Capture local canvas animation as 60fps stream
      const stream = (canvas as any).captureStream(60);
      setCanvasStream(stream);
    } catch (e) {
      console.error('Failed to capture stream from canvas generator:', e);
    }

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  // Cleanup webcam stream when switching tabs or closing
  useEffect(() => {
    if (activeTab !== 'webcam') {
      stopWebcam();
    } else {
      startWebcam();
    }
    return () => {
      stopWebcam();
    };
  }, [activeTab]);

  // FPS calculation render callback
  const handleFrameTick = () => {
    frameCountRef.current++;
    const now = performance.now();
    if (now - lastTimeRef.current >= 1000) {
      setFps(Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current)));
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }
  };

  // Run frame ticker automatically on image/canvas updates
  useEffect(() => {
    let active = true;
    const ticker = () => {
      if (!active) return;
      handleFrameTick();
      requestAnimationFrame(ticker);
    };
    if (activeTab !== 'image') {
      requestAnimationFrame(ticker);
    } else {
      // Images run at static updates, default to 60 or 0
      setFps(60);
    }
    return () => {
      active = false;
    };
  }, [activeTab]);

  const startWebcam = async () => {
    setWebcamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 960, height: 540, frameRate: { ideal: 60 } },
        audio: false
      });
      setWebcamStream(stream);
    } catch (err: any) {
      console.error('Camera request failed:', err);
      setWebcamError('Webcam access was denied or is unavailable. Please check system permissions.');
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
  };

  // Handle custom image uploads
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle custom video uploads
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
    }
  };

  // Resolve palette settings
  const resolvedPalette = () => {
    if (paletteName === 'grayscale' || paletteName === 'none') {
      return undefined;
    }
    return customPalette || (paletteName as PaletteName) || undefined;
  };

  return (
    <div className="app-container">
      <header>
        <div className="badge">Arcade Console v1.0.0</div>
        <h1>REACT-BITMAP</h1>
        <p className="subtitle">Real-Time WebGPU Retro Dithering & Pixelation Engine</p>
      </header>

      {/* Mode Selectors */}
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
          onClick={() => setActiveTab('image')}
        >
          <ImageIcon size={18} />
          BitImage
        </button>
        <button 
          className={`tab-btn ${activeTab === 'video' ? 'active' : ''}`}
          onClick={() => setActiveTab('video')}
        >
          <VideoIcon size={18} />
          BitVideo
        </button>
        <button 
          className={`tab-btn ${activeTab === 'webcam' ? 'active' : ''}`}
          onClick={() => setActiveTab('webcam')}
        >
          <Camera size={18} />
          Webcam
        </button>
      </div>

      <div className="dashboard-grid">
        {/* Left Column: Interactive Viewer */}
        <div className="panel preview-card">
          <div className="preview-header">
            <div className="preview-title">
              <span className="dot"></span>
              {activeTab === 'image' && 'Image Processing Viewport'}
              {activeTab === 'video' && 'Video GPU Feed'}
              {activeTab === 'webcam' && 'Real-time Camera Stream'}
            </div>
            <div className="stats-badge" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                onClick={() => setViewMode(viewMode === 'preview' ? 'code' : 'preview')}
                className="action-btn"
                style={{ padding: '2px 8px', fontSize: '0.55rem', border: '1px solid var(--text-primary)', height: '22px' }}
              >
                {viewMode === 'preview' ? 'CODE' : 'VIEW'}
              </button>
              <span>
                <Activity size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                {fps} FPS | WEBGPU
              </span>
            </div>
          </div>

          <div className="viewport-container">
            <div className="code-container" style={{ display: viewMode === 'code' ? 'block' : 'none' }}>
              <div className="code-header">
                <span>REACT SNIPPET CONFIGURATION</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(getCodeSnippet());
                    alert('Snippet copied to clipboard!');
                  }}
                  className="action-btn"
                  style={{ padding: '2px 8px', fontSize: '0.55rem', border: '1px solid var(--text-primary)' }}
                >
                  COPY
                </button>
              </div>
              <pre className="code-block">
                <code>{getCodeSnippet()}</code>
              </pre>
            </div>

            <div className="canvas-wrapper" style={{ display: viewMode === 'preview' ? 'block' : 'none' }}>
              {activeTab === 'image' && (
                <BitImage
                  src={imageSrc}
                  pixelSize={pixelSize}
                  ditherType={ditherType}
                  ditherAmount={ditherAmount}
                  brightness={brightness}
                  contrast={contrast}
                  saturation={saturation}
                  palette={resolvedPalette()}
                  colorDepth={colorDepth}
                  transitionPalette={transitionPalette}
                  transitionDuration={transitionDuration}
                />
              )}

              {activeTab === 'video' && (
                videoSrc ? (
                  <BitVideo
                    src={videoSrc}
                    pixelSize={pixelSize}
                    ditherType={ditherType}
                    ditherAmount={ditherAmount}
                    brightness={brightness}
                    contrast={contrast}
                    saturation={saturation}
                    palette={resolvedPalette()}
                    colorDepth={colorDepth}
                    transitionPalette={transitionPalette}
                    transitionDuration={transitionDuration}
                    autoPlay
                    loop
                    muted
                  />
                ) : (
                  canvasStream && (
                    <BitVideo
                      stream={canvasStream}
                      pixelSize={pixelSize}
                      ditherType={ditherType}
                      ditherAmount={ditherAmount}
                      brightness={brightness}
                      contrast={contrast}
                      saturation={saturation}
                      palette={resolvedPalette()}
                      colorDepth={colorDepth}
                      transitionPalette={transitionPalette}
                      transitionDuration={transitionDuration}
                      autoPlay
                      loop
                      muted
                    />
                  )
                )
              )}

              {activeTab === 'webcam' && (
                webcamStream ? (
                  <BitVideo
                    stream={webcamStream}
                    pixelSize={pixelSize}
                    ditherType={ditherType}
                    ditherAmount={ditherAmount}
                    brightness={brightness}
                    contrast={contrast}
                    saturation={saturation}
                    palette={resolvedPalette()}
                    colorDepth={colorDepth}
                    transitionPalette={transitionPalette}
                    transitionDuration={transitionDuration}
                    autoPlay
                  />
                ) : (
                  !webcamError && (
                    <div className="prompt-card">
                      <Camera size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Camera access needed for live feed</p>
                      <button className="action-btn" onClick={startWebcam}>Enable Webcam</button>
                    </div>
                  )
                )
              )}
            </div>

            {webcamError && activeTab === 'webcam' && (
              <div className="error-message">
                {webcamError}
              </div>
            )}
          </div>

          {/* Asset Upload Bar */}
          <div style={{ width: '100%', padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem', flexWrap: 'wrap', background: 'rgba(17,24,39,0.2)' }}>
            {activeTab === 'image' && (
              <label className="action-btn" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                <Upload size={16} />
                Upload Custom Image
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  style={{ display: 'none' }} 
                />
              </label>
            )}
            {activeTab === 'video' && (
              <>
                <label className="action-btn" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                  <Upload size={16} />
                  Upload Custom Video
                  <input 
                    type="file" 
                    accept="video/*" 
                    onChange={handleVideoUpload} 
                    style={{ display: 'none' }} 
                  />
                </label>
                {videoSrc && (
                  <button 
                    className="action-btn" 
                    onClick={() => {
                      URL.revokeObjectURL(videoSrc);
                      setVideoSrc('');
                    }}
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: 'var(--bg-tertiary)' }}
                  >
                    Reset to Shader Generator
                  </button>
                )}
              </>
            )}
            
            {activeTab === 'image' && imageSrc !== DEFAULT_IMAGE && (
              <button 
                className="action-btn" 
                onClick={() => setImageSrc(DEFAULT_IMAGE)}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: 'var(--bg-tertiary)' }}
              >
                Reset Default SVG
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Settings Panel */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={18} color="var(--accent)" />
            Control Parameters
          </h2>

          {/* Quick Presets Gallery */}
          <div className="control-group">
            <span className="control-label">
              <span>Quick Presets</span>
              <Sparkles size={14} color="var(--accent-purple)" />
            </span>
            <div className="presets-grid">
              {Object.keys(PRESETS).map((key) => (
                <button
                  key={key}
                  className={`preset-btn ${paletteName === PRESETS[key].palette ? 'active' : ''}`}
                  onClick={() => applyPreset(key)}
                >
                  {PRESETS[key].name}
                </button>
              ))}
            </div>
          </div>

          <hr style={{ border: 0, borderTop: '1px solid var(--border-color)' }} />

          {/* Downscaling resolution */}
          <div className="control-group">
            <label className="control-label">
              <span>Pixel Size</span>
              <span className="control-val">{pixelSize}px</span>
            </label>
            <input 
              type="range" 
              min="1" 
              max="20" 
              step="1"
              value={pixelSize} 
              onChange={(e) => setPixelSize(parseInt(e.target.value))} 
            />
          </div>

          {/* Dithering Options */}
          <div className="control-group">
            <label className="control-label">Dithering Algorithm</label>
            <select 
              value={ditherType} 
              onChange={(e) => setDitherType(e.target.value as Preset['ditherType'])}
            >
              <option value="none">None (Direct Quantization)</option>
              <option value="bayer2">Bayer 2x2 Matrix</option>
              <option value="bayer4">Bayer 4x4 Matrix</option>
              <option value="bayer8">Bayer 8x8 Matrix</option>
              <option value="halftone">Halftone Screen</option>
              <option value="noise">Pseudo-Random Noise</option>
            </select>
          </div>

          {/* Dithering intensity */}
          {ditherType !== 'none' && (
            <div className="control-group">
              <label className="control-label">
                <span>Dither Intensity</span>
                <span className="control-val">{Math.round(ditherAmount * 100)}%</span>
              </label>
              <input 
                type="range" 
                min="0.0" 
                max="1.0" 
                step="0.05"
                value={ditherAmount} 
                onChange={(e) => setDitherAmount(parseFloat(e.target.value))} 
              />
            </div>
          )}

          {/* Palette presets dropdown */}
          <div className="control-group">
            <label className="control-label">Color Palette Preset</label>
            <select 
              value={paletteName} 
              onChange={(e) => {
                setPaletteName(e.target.value);
                setCustomPalette(null);
              }}
            >
              <option value="none">None (Full RGB Colors)</option>
              <option value="grayscale">No Palette (Quantized Grayscale)</option>
              {Object.keys(PALETTE_PRESETS).map((name) => (
                <option key={name} value={name}>
                  {name.toUpperCase()} ({PALETTE_PRESETS[name].length} colors)
                </option>
              ))}
            </select>

            {/* Display active palette colors colorbar */}
            {paletteName !== 'none' && paletteName !== 'grayscale' && PALETTE_PRESETS[paletteName] && (
              <div className="palette-preview">
                {PALETTE_PRESETS[paletteName].map((color: string, idx: number) => (
                  <div 
                    key={idx} 
                    className="palette-color-block" 
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quantization color depth steps */}
          {(paletteName === 'grayscale' || paletteName === 'none') && (
            <div className="control-group">
              <label className="control-label">
                <span>Color Depth Steps</span>
                <span className="control-val">{colorDepth} steps</span>
              </label>
              <input 
                type="range" 
                min="2" 
                max="32" 
                step="1"
                value={colorDepth} 
                onChange={(e) => setColorDepth(parseInt(e.target.value))} 
              />
            </div>
          )}

          {/* Palette Transition Controls */}
          <div className="control-group">
            <label className="control-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'var(--font-pixel)', fontSize: '0.6rem' }}>
              <input 
                type="checkbox" 
                checked={transitionPalette} 
                onChange={(e) => setTransitionPalette(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--text-primary)', cursor: 'pointer' }}
              />
              <span>Enable Transitions</span>
            </label>
          </div>

          {transitionPalette && (
            <div className="control-group">
              <label className="control-label">
                <span>Transition Duration</span>
                <span className="control-val">{transitionDuration}ms</span>
              </label>
              <input 
                type="range" 
                min="100" 
                max="2000" 
                step="50"
                value={transitionDuration} 
                onChange={(e) => setTransitionDuration(parseInt(e.target.value))} 
              />
            </div>
          )}

          <hr style={{ border: 0, borderTop: '1px solid var(--border-color)' }} />

          {/* Color Adjustments */}
          <div className="control-group">
            <label className="control-label">
              <span>Brightness</span>
              <span className="control-val">{brightness}x</span>
            </label>
            <input 
              type="range" 
              min="0.5" 
              max="2.0" 
              step="0.05"
              value={brightness} 
              onChange={(e) => setBrightness(parseFloat(e.target.value))} 
            />
          </div>

          <div className="control-group">
            <label className="control-label">
              <span>Contrast</span>
              <span className="control-val">{contrast}x</span>
            </label>
            <input 
              type="range" 
              min="0.5" 
              max="2.0" 
              step="0.05"
              value={contrast} 
              onChange={(e) => setContrast(parseFloat(e.target.value))} 
            />
          </div>

          <div className="control-group">
            <label className="control-label">
              <span>Color Saturation</span>
              <span className="control-val">{saturation}x</span>
            </label>
            <input 
              type="range" 
              min="0.0" 
              max="2.0" 
              step="0.05"
              value={saturation} 
              onChange={(e) => setSaturation(parseFloat(e.target.value))} 
            />
          </div>
        </div>
      </div>

      {/* Hidden local canvas generator */}
      <canvas 
        ref={generatorCanvasRef} 
        width="640" 
        height="480" 
        style={{ display: 'none' }}
      />
    </div>
  );
}

export default App;
