import { WGSL_SHADER } from './shaders';

export interface BitmapRendererOptions {
  pixelSize: number;
  ditherType: 'none' | 'bayer2' | 'bayer4' | 'bayer8' | 'halftone' | 'noise';
  ditherAmount: number;
  brightness: number;
  contrast: number;
  saturation: number;
  palette: string[] | null;
  colorDepth: number;
  transitionPalette?: boolean;
  transitionDuration?: number; // in ms
}

export class BitmapRenderer {
  private canvas: HTMLCanvasElement;
  private isGpuInitialized = false;

  // WebGPU resources
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private format: GPUTextureFormat | null = null;
  private pipeline: GPURenderPipeline | null = null;
  private sampler: GPUSampler | null = null;
  private uniformBuffer: GPUBuffer | null = null;
  private bindGroupLayout: GPUBindGroupLayout | null = null;

  // Canvas 2D fallback resources
  private ctx2d: CanvasRenderingContext2D | null = null;

  // Palette transition states
  private currentPaletteFloats = new Float32Array(32 * 3);
  private startPaletteFloats = new Float32Array(32 * 3);
  private targetPaletteFloats = new Float32Array(32 * 3);
  private transitionStartTime: number | null = null;
  private prevPaletteKey = '';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  /**
   * Asynchronously initialize the renderer.
   * Attempts to request WebGPU. If it is unavailable or blocked, falls back to Canvas 2D context.
   */
  public async init(): Promise<boolean> {
    try {
      if (!navigator.gpu) {
        throw new Error('WebGPU is not supported by this browser.');
      }

      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        throw new Error('No appropriate WebGPU adapter found.');
      }

      this.device = await adapter.requestDevice();
      this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;
      if (!this.context) {
        throw new Error('Failed to retrieve WebGPU context from canvas.');
      }

      this.format = navigator.gpu.getPreferredCanvasFormat();
      this.context.configure({
        device: this.device,
        format: this.format,
        alphaMode: 'premultiplied',
      });

      const shaderModule = this.device.createShaderModule({
        code: WGSL_SHADER,
      });

      this.bindGroupLayout = this.device.createBindGroupLayout({
        entries: [
          { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {} },
          { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
          { binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        ],
      });

      const pipelineLayout = this.device.createPipelineLayout({
        bindGroupLayouts: [this.bindGroupLayout],
      });

      this.pipeline = this.device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
          module: shaderModule,
          entryPoint: 'vs_main',
        },
        fragment: {
          module: shaderModule,
          entryPoint: 'fs_main',
          targets: [{ format: this.format }],
        },
        primitive: {
          topology: 'triangle-strip',
        },
      });

      this.sampler = this.device.createSampler({
        magFilter: 'nearest',
        minFilter: 'nearest',
      });

      // RenderParams struct size is 560 bytes
      this.uniformBuffer = this.device.createBuffer({
        size: 560,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      this.isGpuInitialized = true;
      return true;
    } catch (e) {
      console.warn('⚠️ WebGPU not available on this device. Falling back to Canvas 2D:', e);
      this.ctx2d = this.canvas.getContext('2d');
      this.isGpuInitialized = false;
      return false;
    }
  }

  private hexToRgb(hex: string): [number, number, number] {
    let cleanHex = hex.replace(/^#/, '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(char => char + char).join('');
    }
    const num = parseInt(cleanHex, 16);
    const r = ((num >> 16) & 255) / 255;
    const g = ((num >> 8) & 255) / 255;
    const b = (num & 255) / 255;
    return [r, g, b];
  }

  /**
   * Render the source onto the canvas.
   * Automatically branches to WebGPU rendering or Canvas 2D scaling fallback.
   * Returns a boolean indicating if a transition is currently in progress.
   */
  public render(
    source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    width: number,
    height: number,
    options: BitmapRendererOptions
  ): boolean {
    const now = performance.now();
    const newPaletteKey = options.palette ? options.palette.join(',') : '';
    let isTransitionActive = false;

    // Detect Palette changes
    if (newPaletteKey !== this.prevPaletteKey) {
      if (options.transitionPalette && this.prevPaletteKey !== '') {
        // Copy current floats to start floats
        this.startPaletteFloats.set(this.currentPaletteFloats);

        // Prep new target floats
        const targetFloats = new Float32Array(32 * 3);
        if (options.palette && options.palette.length > 0) {
          const activeColors = options.palette.slice(0, 32);
          for (let i = 0; i < activeColors.length; i++) {
            const rgb = this.hexToRgb(activeColors[i]);
            targetFloats[i * 3 + 0] = rgb[0];
            targetFloats[i * 3 + 1] = rgb[1];
            targetFloats[i * 3 + 2] = rgb[2];
          }
        }
        this.targetPaletteFloats.set(targetFloats);
        this.transitionStartTime = now;
      } else {
        // Instant setup
        const newFloats = new Float32Array(32 * 3);
        if (options.palette && options.palette.length > 0) {
          const activeColors = options.palette.slice(0, 32);
          for (let i = 0; i < activeColors.length; i++) {
            const rgb = this.hexToRgb(activeColors[i]);
            newFloats[i * 3 + 0] = rgb[0];
            newFloats[i * 3 + 1] = rgb[1];
            newFloats[i * 3 + 2] = rgb[2];
          }
        }
        this.currentPaletteFloats.set(newFloats);
        this.transitionStartTime = null;
      }
      this.prevPaletteKey = newPaletteKey;
    }

    // Process active transition interpolation
    if (this.transitionStartTime !== null) {
      const duration = options.transitionDuration ?? 300;
      const elapsed = now - this.transitionStartTime;
      const t = Math.min(1.0, elapsed / duration);

      // Lerp RGB channels
      for (let i = 0; i < 32 * 3; i++) {
        this.currentPaletteFloats[i] = this.startPaletteFloats[i] + (this.targetPaletteFloats[i] - this.startPaletteFloats[i]) * t;
      }

      if (t >= 1.0) {
        this.transitionStartTime = null;
      } else {
        isTransitionActive = true;
      }
    }

    if (this.isGpuInitialized && this.device) {
      this.renderGpu(source, width, height, options);
    } else {
      this.renderCanvas2d(source, width, height, options);
    }

    return isTransitionActive;
  }

  private renderGpu(
    source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    width: number,
    height: number,
    options: BitmapRendererOptions
  ) {
    const device = this.device!;
    const context = this.context!;
    const canvas = this.canvas;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // 1. Copy image source to a GPU texture.
    const texture = device.createTexture({
      size: [width, height],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });

    device.queue.copyExternalImageToTexture(
      { source },
      { texture },
      [width, height]
    );

    // 2. Pack uniforms (140 floats = 560 bytes)
    const paramsArray = new Float32Array(140);
    paramsArray[0] = width;
    paramsArray[1] = height;
    paramsArray[2] = options.pixelSize;

    let ditherTypeVal = 0;
    switch (options.ditherType) {
      case 'bayer2': ditherTypeVal = 1; break;
      case 'bayer4': ditherTypeVal = 2; break;
      case 'bayer8': ditherTypeVal = 3; break;
      case 'halftone': ditherTypeVal = 4; break;
      case 'noise': ditherTypeVal = 5; break;
      default: ditherTypeVal = 0;
    }
    paramsArray[3] = ditherTypeVal;
    paramsArray[4] = options.ditherAmount;
    paramsArray[5] = options.brightness;
    paramsArray[6] = options.contrast;
    paramsArray[7] = options.saturation;

    let paletteSizeVal = 0;
    if (options.palette && options.palette.length > 0) {
      // During active transition, palette size matches target palette length
      paletteSizeVal = options.palette.length;
      for (let i = 0; i < Math.min(32, options.palette.length); i++) {
        paramsArray[12 + i * 4 + 0] = this.currentPaletteFloats[i * 3 + 0];
        paramsArray[12 + i * 4 + 1] = this.currentPaletteFloats[i * 3 + 1];
        paramsArray[12 + i * 4 + 2] = this.currentPaletteFloats[i * 3 + 2];
        paramsArray[12 + i * 4 + 3] = 1.0;
      }
    }
    paramsArray[8] = paletteSizeVal;
    paramsArray[9] = options.colorDepth;

    // 3. Write Uniforms buffer
    device.queue.writeBuffer(this.uniformBuffer!, 0, paramsArray.buffer);

    // 4. Create Bind Group
    const bindGroup = device.createBindGroup({
      layout: this.bindGroupLayout!,
      entries: [
        { binding: 0, resource: texture.createView() },
        { binding: 1, resource: this.sampler! },
        { binding: 2, resource: { buffer: this.uniformBuffer! } },
      ],
    });

    // 5. Submit GPU commands
    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });

    renderPass.setPipeline(this.pipeline!);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.draw(4);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);

    // Clean up texture frame buffer instantly to avoid VRAM bloat
    texture.destroy();
  }

  private renderCanvas2d(
    source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    width: number,
    height: number,
    options: BitmapRendererOptions
  ) {
    const ctx = this.ctx2d;
    if (!ctx) return;

    const canvas = this.canvas;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    // Turn off anti-aliasing to preserve sharp pixels
    ctx.imageSmoothingEnabled = false;

    // Compute pixelated scaling dimensions
    const pixelSize = Math.max(1, Math.floor(options.pixelSize));
    const sw = Math.max(1, Math.floor(width / pixelSize));
    const sh = Math.max(1, Math.floor(height / pixelSize));

    // Downscale onto canvas first
    ctx.drawImage(source, 0, 0, width, height, 0, 0, sw, sh);
    
    // Upscale nearest-neighbor back to full resolution
    ctx.drawImage(canvas, 0, 0, sw, sh, 0, 0, width, height);
  }

  public dispose() {
    this.isGpuInitialized = false;

    if (this.uniformBuffer) {
      this.uniformBuffer.destroy();
      this.uniformBuffer = null;
    }
    
    this.device = null;
    this.context = null;
    this.pipeline = null;
    this.sampler = null;
    this.bindGroupLayout = null;
    this.ctx2d = null;
  }
}
