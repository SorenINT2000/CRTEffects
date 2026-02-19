import type { CRTConfig, Vec2 } from './types';
import { DEFAULT_CONFIG } from './types';

interface ShaderLocations {
  position: number;
  texCoord: number;
  texture0: WebGLUniformLocation | null;
  texture1: WebGLUniformLocation | null;
  texture2: WebGLUniformLocation | null;
  texture3: WebGLUniformLocation | null;
  time: WebGLUniformLocation | null;
  random: WebGLUniformLocation | null;
  redOffset: WebGLUniformLocation | null;
  blueOffset: WebGLUniformLocation | null;
  resolution: WebGLUniformLocation | null;
  enableScanlines: WebGLUniformLocation | null;
  enableVignette: WebGLUniformLocation | null;
  enableNoise: WebGLUniformLocation | null;
  enableRoll: WebGLUniformLocation | null;
  scanlineScale: WebGLUniformLocation | null;
  bendFactor: WebGLUniformLocation | null;
  noiseIntensity: WebGLUniformLocation | null;
  vignetteIntensity: WebGLUniformLocation | null;
  rollSpeed: WebGLUniformLocation | null;
  enableStutter: WebGLUniformLocation | null;
  stutterFrequency: WebGLUniformLocation | null;
}

export class CRTRenderer {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  locations: ShaderLocations;
  vao!: WebGLVertexArrayObject;
  textures: Record<string, WebGLTexture> = {};
  config: CRTConfig = { ...DEFAULT_CONFIG };

  private resizeHandler = () => this.resize();

  constructor(canvas: HTMLCanvasElement, vsSource: string, fsSource: string) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', { alpha: true });
    if (!gl) throw new Error('WebGL2 not supported');
    this.gl = gl;

    this.program = this.createProgram(vsSource, fsSource);
    this.locations = this.getLocations();
    this.setupBuffers();

    this.resize();
    window.addEventListener('resize', this.resizeHandler);
  }

  dispose() {
    window.removeEventListener('resize', this.resizeHandler);
    this.gl.deleteProgram(this.program);
  }

  resize() {
    const displayWidth = this.canvas.clientWidth;
    const displayHeight = this.canvas.clientHeight;
    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
      this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    }
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`Shader compile error: ${info}`);
    }
    return shader;
  }

  private createProgram(vsSource: string, fsSource: string): WebGLProgram {
    const vs = this.createShader(this.gl.VERTEX_SHADER, vsSource);
    const fs = this.createShader(this.gl.FRAGMENT_SHADER, fsSource);
    const program = this.gl.createProgram()!;
    this.gl.attachShader(program, vs);
    this.gl.attachShader(program, fs);
    this.gl.linkProgram(program);
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw new Error(`Program link error: ${this.gl.getProgramInfoLog(program)}`);
    }
    return program;
  }

  private getLocations(): ShaderLocations {
    const gl = this.gl;
    const p = this.program;
    return {
      position: gl.getAttribLocation(p, 'a_position'),
      texCoord: gl.getAttribLocation(p, 'a_texCoord'),
      texture0: gl.getUniformLocation(p, 'texture0'),
      texture1: gl.getUniformLocation(p, 'texture1'),
      texture2: gl.getUniformLocation(p, 'texture2'),
      texture3: gl.getUniformLocation(p, 'texture3'),
      time: gl.getUniformLocation(p, 'u_time'),
      random: gl.getUniformLocation(p, 'u_random'),
      redOffset: gl.getUniformLocation(p, 'u_redOffset'),
      blueOffset: gl.getUniformLocation(p, 'u_blueOffset'),
      resolution: gl.getUniformLocation(p, 'u_resolution'),
      enableScanlines: gl.getUniformLocation(p, 'u_enableScanlines'),
      enableVignette: gl.getUniformLocation(p, 'u_enableVignette'),
      enableNoise: gl.getUniformLocation(p, 'u_enableNoise'),
      enableRoll: gl.getUniformLocation(p, 'u_enableRoll'),
      scanlineScale: gl.getUniformLocation(p, 'u_scanlineScale'),
      bendFactor: gl.getUniformLocation(p, 'u_bendFactor'),
      noiseIntensity: gl.getUniformLocation(p, 'u_noiseIntensity'),
      vignetteIntensity: gl.getUniformLocation(p, 'u_vignetteIntensity'),
      rollSpeed: gl.getUniformLocation(p, 'u_rollSpeed'),
      enableStutter: gl.getUniformLocation(p, 'u_enableStutter'),
      stutterFrequency: gl.getUniformLocation(p, 'u_stutterFrequency'),
    };
  }

  private setupBuffers() {
    const gl = this.gl;
    const positions = new Float32Array([
      -1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0,
      -1, 1, 0, 0, 1, -1, 1, 1, 1, 1, 1, 0,
    ]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(this.locations.position);
    gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(this.locations.texCoord);
    gl.vertexAttribPointer(this.locations.texCoord, 2, gl.FLOAT, false, 16, 8);
    this.vao = vao;
  }

  createTexture(unit: number, data: HTMLImageElement | Uint8Array, width: number, height: number): WebGLTexture {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    if (data instanceof HTMLImageElement) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return tex;
  }

  generateAssets() {
    const gl = this.gl;

    // Noise texture
    const nw = 256, nh = 256;
    const nData = new Uint8Array(nw * nh * 4);
    for (let i = 0; i < nData.length; i += 4) {
      const v = Math.random() * 255;
      nData[i] = v; nData[i + 1] = v; nData[i + 2] = v; nData[i + 3] = 255;
    }
    this.textures.noise = this.createTexture(2, nData, nw, nh);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    // Scanline RGB mesh texture
    const sw = 3, sh = 3;
    const sData = new Uint8Array([
      255, 0, 0, 15, 0, 255, 0, 5, 0, 0, 255, 15,
      255, 0, 0, 15, 0, 255, 0, 5, 0, 0, 255, 15,
      0, 0, 0, 64, 0, 0, 0, 64, 0, 0, 0, 64,
    ]);
    this.textures.scanline = this.createTexture(3, sData, sw, sh);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Vignette texture (generated via offscreen canvas)
    const vw = 512, vh = 512;
    const canvas = document.createElement('canvas');
    canvas.width = vw; canvas.height = vh;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(vw / 2, vh / 2, vw / 3, vw / 2, vh / 2, vw / 1.5);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(50,50,50,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, vw, vh);

    const vImg = new Image();
    vImg.src = canvas.toDataURL();
    vImg.onload = () => {
      this.textures.vignette = this.createTexture(1, vImg, vw, vh);
    };
  }

  setImage(img: HTMLImageElement) {
    this.textures.main = this.createTexture(0, img, img.width, img.height);
  }

  render(time: number, jitterOffsetRed: Vec2, jitterOffsetBlue: Vec2) {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform1i(this.locations.texture0, 0);
    gl.uniform1i(this.locations.texture1, 1);
    gl.uniform1i(this.locations.texture2, 2);
    gl.uniform1i(this.locations.texture3, 3);
    gl.uniform1f(this.locations.time, time);
    gl.uniform1f(this.locations.random, Math.random());
    gl.uniform1f(this.locations.bendFactor, this.config.curvature ? this.config.bendFactor : 0.0);
    gl.uniform1f(this.locations.enableScanlines, this.config.scanlines ? 1.0 : 0.0);
    gl.uniform1f(this.locations.scanlineScale, this.config.scanlineScale);
    gl.uniform1f(this.locations.enableVignette, this.config.vignette ? 1.0 : 0.0);
    gl.uniform1f(this.locations.vignetteIntensity, this.config.vignetteIntensity);
    gl.uniform1f(this.locations.enableNoise, this.config.noise ? 1.0 : 0.0);
    gl.uniform1f(this.locations.noiseIntensity, this.config.noiseIntensity);
    gl.uniform1f(this.locations.enableRoll, this.config.roll ? 1.0 : 0.0);
    gl.uniform1f(this.locations.rollSpeed, this.config.rollSpeed);
    gl.uniform1f(this.locations.enableStutter, this.config.stutter ? 1.0 : 0.0);
    gl.uniform1f(this.locations.stutterFrequency, this.config.stutterFrequency);
    gl.uniform2f(this.locations.resolution, this.canvas.width, this.canvas.height);

    if (this.config.jitter) {
      const intensity = this.config.jitterIntensity;
      gl.uniform2f(this.locations.redOffset, jitterOffsetRed.x * intensity, jitterOffsetRed.y * intensity);
      gl.uniform2f(this.locations.blueOffset, jitterOffsetBlue.x * intensity, jitterOffsetBlue.y * intensity);
    } else {
      gl.uniform2f(this.locations.redOffset, 0, 0);
      gl.uniform2f(this.locations.blueOffset, 0, 0);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}
