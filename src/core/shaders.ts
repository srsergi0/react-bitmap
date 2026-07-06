export const WGSL_SHADER = `
struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) texCoord : vec2<f32>,
}

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
  var pos = array<vec2<f32>, 4>(
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(1.0, -1.0)
  );
  var uv = array<vec2<f32>, 4>(
    vec2<f32>(0.0, 0.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(1.0, 1.0)
  );

  var out : VertexOutput;
  out.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
  out.texCoord = uv[vertexIndex];
  return out;
}

@group(0) @binding(0) var myTexture : texture_2d<f32>;
@group(0) @binding(1) var mySampler : sampler;
@group(0) @binding(2) var<uniform> params : RenderParams;

struct RenderParams {
  canvasResolution : vec2<f32>,
  pixelSize : f32,
  ditherType : f32,
  ditherAmount : f32,
  brightness : f32,
  contrast : f32,
  saturation : f32,
  paletteSize : f32,
  colorDepth : f32,
  padding : vec2<f32>,
  palette : array<vec4<f32>, 32>,
}

fn adjustColor(color: vec3<f32>) -> vec3<f32> {
  var col = color * params.brightness;
  col = (col - 0.5) * params.contrast + 0.5;
  let luma = dot(col, vec3<f32>(0.299, 0.587, 0.114));
  col = mix(vec3<f32>(luma), col, params.saturation);
  return clamp(col, vec3<f32>(0.0), vec3<f32>(1.0));
}

fn getBayer2(p: vec2<f32>) -> f32 {
  let x = i32(p.x % 2.0);
  let y = i32(p.y % 2.0);
  let index = x + y * 2;
  if (index == 0) { return 0.0; }
  if (index == 1) { return 2.0 / 4.0; }
  if (index == 2) { return 3.0 / 4.0; }
  return 1.0 / 4.0;
}

fn getBayer4(p: vec2<f32>) -> f32 {
  let x = i32(p.x % 4.0);
  let y = i32(p.y % 4.0);
  let index = x + y * 4;
  if (index == 0) { return 0.0; }
  if (index == 1) { return 8.0 / 16.0; }
  if (index == 2) { return 2.0 / 16.0; }
  if (index == 3) { return 10.0 / 16.0; }
  if (index == 4) { return 12.0 / 16.0; }
  if (index == 5) { return 4.0 / 16.0; }
  if (index == 6) { return 14.0 / 16.0; }
  if (index == 7) { return 6.0 / 16.0; }
  if (index == 8) { return 3.0 / 16.0; }
  if (index == 9) { return 11.0 / 16.0; }
  if (index == 10) { return 1.0 / 16.0; }
  if (index == 11) { return 9.0 / 16.0; }
  if (index == 12) { return 15.0 / 16.0; }
  if (index == 13) { return 7.0 / 16.0; }
  if (index == 14) { return 13.0 / 16.0; }
  return 5.0 / 16.0;
}

fn getBayer8(p: vec2<f32>) -> f32 {
  let x = i32(p.x % 8.0);
  let y = i32(p.y % 8.0);
  
  if (y == 0) {
    if (x == 0) { return 0.0; }
    if (x == 1) { return 48.0 / 64.0; }
    if (x == 2) { return 12.0 / 64.0; }
    if (x == 3) { return 60.0 / 64.0; }
    if (x == 4) { return 3.0 / 64.0; }
    if (x == 5) { return 51.0 / 64.0; }
    if (x == 6) { return 15.0 / 64.0; }
    return 63.0 / 64.0;
  }
  if (y == 1) {
    if (x == 0) { return 32.0 / 64.0; }
    if (x == 1) { return 16.0 / 64.0; }
    if (x == 2) { return 44.0 / 64.0; }
    if (x == 3) { return 28.0 / 64.0; }
    if (x == 4) { return 35.0 / 64.0; }
    if (x == 5) { return 19.0 / 64.0; }
    if (x == 6) { return 47.0 / 64.0; }
    return 31.0 / 64.0;
  }
  if (y == 2) {
    if (x == 0) { return 8.0 / 64.0; }
    if (x == 1) { return 56.0 / 64.0; }
    if (x == 2) { return 4.0 / 64.0; }
    if (x == 3) { return 52.0 / 64.0; }
    if (x == 4) { return 11.0 / 64.0; }
    if (x == 5) { return 59.0 / 64.0; }
    if (x == 6) { return 7.0 / 64.0; }
    return 55.0 / 64.0;
  }
  if (y == 3) {
    if (x == 0) { return 40.0 / 64.0; }
    if (x == 1) { return 24.0 / 64.0; }
    if (x == 2) { return 36.0 / 64.0; }
    if (x == 3) { return 20.0 / 64.0; }
    if (x == 4) { return 43.0 / 64.0; }
    if (x == 5) { return 27.0 / 64.0; }
    if (x == 6) { return 39.0 / 64.0; }
    return 23.0 / 64.0;
  }
  if (y == 4) {
    if (x == 0) { return 2.0 / 64.0; }
    if (x == 1) { return 50.0 / 64.0; }
    if (x == 2) { return 14.0 / 64.0; }
    if (x == 3) { return 62.0 / 64.0; }
    if (x == 4) { return 1.0 / 64.0; }
    if (x == 5) { return 49.0 / 64.0; }
    if (x == 6) { return 13.0 / 64.0; }
    return 61.0 / 64.0;
  }
  if (y == 5) {
    if (x == 0) { return 34.0 / 64.0; }
    if (x == 1) { return 18.0 / 64.0; }
    if (x == 2) { return 46.0 / 64.0; }
    if (x == 3) { return 30.0 / 64.0; }
    if (x == 4) { return 33.0 / 64.0; }
    if (x == 5) { return 17.0 / 64.0; }
    if (x == 6) { return 45.0 / 64.0; }
    return 29.0 / 64.0;
  }
  if (y == 6) {
    if (x == 0) { return 10.0 / 64.0; }
    if (x == 1) { return 58.0 / 64.0; }
    if (x == 2) { return 6.0 / 64.0; }
    if (x == 3) { return 54.0 / 64.0; }
    if (x == 4) { return 9.0 / 64.0; }
    if (x == 5) { return 57.0 / 64.0; }
    if (x == 6) { return 5.0 / 64.0; }
    return 53.0 / 64.0;
  }
  if (x == 0) { return 42.0 / 64.0; }
  if (x == 1) { return 26.0 / 64.0; }
  if (x == 2) { return 38.0 / 64.0; }
  if (x == 3) { return 22.0 / 64.0; }
  if (x == 4) { return 41.0 / 64.0; }
  if (x == 5) { return 25.0 / 64.0; }
  if (x == 6) { return 37.0 / 64.0; }
  return 21.0 / 64.0;
}

fn matchPalette(color: vec3<f32>) -> vec3<f32> {
  let size = i32(params.paletteSize);
  if (size <= 0) {
    let depth = params.colorDepth;
    if (depth > 0.0) {
      let d = depth - 1.0;
      let targetD = select(d, 1.0, d < 1.0);
      return floor(color * targetD + 0.5) / targetD;
    }
    return color;
  }

  var bestColor = params.palette[0].rgb;
  var minDistance = 1000.0;
  
  for (var i = 0; i < 32; i = i + 1) {
    if (i >= size) { break; }
    let dist = distance(color, params.palette[i].rgb);
    if (dist < minDistance) {
      minDistance = dist;
      bestColor = params.palette[i].rgb;
    }
  }

  return bestColor;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
  let pixelSize = vec2<f32>(params.pixelSize);
  let uv = floor(in.texCoord * (params.canvasResolution / pixelSize)) / (params.canvasResolution / pixelSize);
  
  let texColor = textureSample(myTexture, mySampler, uv);
  let adjusted = adjustColor(texColor.rgb);
  
  var ditherVal = 0.0;
  let ditherCoord = floor(in.texCoord * params.canvasResolution / params.pixelSize);
  let dType = i32(params.ditherType);
  
  if (dType == 1) {
    ditherVal = getBayer2(ditherCoord) - 0.5;
  } else if (dType == 2) {
    ditherVal = getBayer4(ditherCoord) - 0.5;
  } else if (dType == 3) {
    ditherVal = getBayer8(ditherCoord) - 0.5;
  } else if (dType == 4) {
    let frequency = 0.75;
    let angle = 0.785398;
    let rot = mat2x2<f32>(
      cos(angle), -sin(angle),
      sin(angle), cos(angle)
    );
    let rotCoord = rot * ditherCoord;
    let pattern = sin(rotCoord.x * frequency) * sin(rotCoord.y * frequency);
    ditherVal = pattern * 0.5;
  } else if (dType == 5) {
    let noise = fract(sin(dot(ditherCoord, vec2<f32>(12.9898, 78.233))) * 43758.5453);
    ditherVal = noise - 0.5;
  }
  
  var spread = 0.15;
  if (params.paletteSize > 0.0) {
    spread = (1.0 / sqrt(params.paletteSize)) * 0.5;
  } else if (params.colorDepth > 0.0) {
    spread = (1.0 / params.colorDepth) * 0.5;
  }
  
  let dithered = adjusted + vec3<f32>(ditherVal * spread * params.ditherAmount);
  let finalRGB = matchPalette(dithered);
  
  return vec4<f32>(finalRGB, texColor.a);
}
`;
