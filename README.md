# 👾 react-bitmap

<div align="center">

**High-performance React components for real-time retro pixelation, Bayer dithering, and custom color palette mapping using WebGL 2.0.**

[![npm version](https://img.shields.io/npm/v/react-bitmap.svg?style=flat-square&color=blue)](https://www.npmjs.com/package/react-bitmap)
[![Build Status](https://img.shields.io/github/actions/workflow/status/srsergi0/react-bitmap/deploy-demo.yml?branch=main&style=flat-square)](https://github.com/srsergi0/react-bitmap/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/srsergi0/react-bitmap/pulls)

[🎮 Live Playground Demo](https://srsergi0.github.io/react-bitmap/) · [📖 Documentation Guide](./GUIDE.md) · [Report Bug](https://github.com/srsergi0/react-bitmap/issues)

</div>

---

## ⚡️ Why WebGL 2.0?

Most react dithering or pixelation libraries perform image processing on the CPU using 2D Canvas context `getImageData`. While fine for tiny static thumbnails, it struggles and lags on larger images, high-res screen assets, and live media.

**react-bitmap** processes every single pixel on the GPU utilizing custom **GLSL ES 3.0 fragment shaders**:
- 🚀 **Full 60 FPS**: Process 4K images, raw loops, and live camera streams with zero lag.
- 🔋 **Zero UI Blocking**: Keeps your React/JavaScript main thread completely free.
- 📦 **Lightweight**: Zero dependencies (apart from React).

---

## ✨ Features

- 👾 **Ordered & Noise Dithering**: Choose between Bayer 2x2, 4x4, 8x8, Halftone screen circles, or organic noise dithering.
- 🎨 **30+ Predefined Palettes**: GameBoy DMG, CGA, EGA, Commodore 64, PipBoy Phosphor, Cyberpunk, Vaporwave, and more.
- 🧩 **Custom Palette Arrays**: Pass any array of custom HEX colors (up to 32 colors) to dynamically recolor on the GPU.
- 📹 **60fps Video & Webcam Support**: Optimized requestVideoFrameCallback render loop with WebGL texture bindings.
- 🎛️ **Pre-Processing Controls**: Adjust brightness, contrast, and saturation inside the shader before applying retro effects.

---

## 📦 Installation

```bash
# Using bun (recommended)
bun add react-bitmap

# Using npm
npm install react-bitmap

# Using pnpm
pnpm add react-bitmap
```

---

## 🚀 Quick Start

### 1. Retro Pixel Image (`BitImage`)

Simply replace any normal HTML `<img />` tag with `<BitImage />` to instantly apply WebGL shaders.

```tsx
import { BitImage } from 'react-bitmap';

function App() {
  return (
    <BitImage
      src="/path/to/image.jpg"
      pixelSize={4}              // Downscale factor (px)
      ditherType="bayer4"        // Dither pattern ('none' | 'bayer2' | 'bayer4' | 'bayer8' | 'halftone' | 'noise')
      ditherAmount={0.8}         // Dithering intensity (0.0 - 1.0)
      palette="gameboy"          // Retro color scheme key or custom hex array
      brightness={1.1}           // Brightness multiplier
      contrast={1.2}             // Contrast multiplier
    />
  );
}
```

### 2. Live Webcam or Video (`BitVideo`)

`BitVideo` seamlessly supports standard video elements and webcam raw feeds.

```tsx
import { useRef } from 'react';
import { BitVideo, BitVideoRef } from 'react-bitmap';

function LiveCam() {
  const videoRef = useRef<BitVideoRef>(null);

  return (
    <BitVideo
      ref={videoRef}
      src="/path/to/retro-synth-loop.mp4"
      pixelSize={6}
      ditherType="halftone"
      palette="cga"
      autoPlay
      loop
      muted
    />
  );
}
```

---

## ⚙️ Properties & API Reference

`<BitImage>` and `<BitVideo>` inherit all standard HTML `<canvas>` elements attributes:

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `src` | `string` | `undefined` | Source path of the image/video. |
| `stream` | `MediaStream` | `undefined` | Live webcam/camera media stream. (Overrides `src`). |
| `pixelSize` | `number` | `4` | Width & height of downsampled pixel grids. `1` means native resolution. |
| `ditherType` | `'none' \| 'bayer2' \| 'bayer4' \| 'bayer8' \| 'halftone' \| 'noise'` | `'bayer4'` | Selection of ordered matrix or mathematical dither layout. |
| `ditherAmount` | `number` | `1.0` | Strength coefficient of dithering offsets (range `0.0` to `1.0`). |
| `palette` | `string[] \| PaletteName` | `undefined` | Custom array of hex colors (max 32 colors) or a predefined key name. |
| `colorDepth` | `number` | `8` | Color levels per RGB channel (range `2` to `32`) used when `palette` is disabled. |
| `brightness` | `number` | `1.0` | Pre-processing brightness multiplier. |
| `contrast` | `number` | `1.0` | Pre-processing contrast multiplier. |
| `saturation` | `number` | `1.0` | Pre-processing saturation scale (`0.0` for grayscale, `1.0` default). |

---

## 🎨 Palette Presets

Pass any of these keys into the `palette` prop to apply instantly:

| Key | Colors | Style Description |
| :--- | :---: | :--- |
| `"monochrome"` | 2 | Pure black and white. |
| `"gameboy"` | 4 | Classic green GameBoy DMG matrix screen. |
| `"cga"` | 4 | Cyan, magenta, black, and white. |
| `"pipboy"` | 4 | Retro green phosphor terminal display. |
| `"pipboyAmber"` | 4 | Warm amber terminal display. |
| `"cyberpunk"` | 4 | High-contrast neon pink and cyan. |
| `"vaporwave"` | 4 | Synthwave pastel purple, pink, and cyan. |
| `"macintosh"` | 4 | System 7 era grayscale spectrum. |
| `"ega"` | 16 | The legacy 16-color PC display standard. |

---

## 🛠️ Raw WebGL Access (Non-React)

You can import the core WebGL engine class `BitmapRenderer` directly if you want to use it outside React (e.g. inside a Vanilla JS canvas or custom animation loops):

```typescript
import { BitmapRenderer } from 'react-bitmap';

const canvas = document.getElementById('my-canvas') as HTMLCanvasElement;
const renderer = new BitmapRenderer(canvas);

// In your rendering loop:
renderer.render(videoElement, width, height, {
  pixelSize: 4,
  ditherType: 'bayer4',
  ditherAmount: 0.7,
  palette: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f']
});

// Clean up WebGL resources when done
renderer.dispose();
```

---

## 🤝 Contributing

Contributions are welcome! Please check out our [GUIDE.md](./GUIDE.md) to understand the architecture, run local test playgrounds, and submit PRs.

## 📄 License

MIT © Antigravity.
