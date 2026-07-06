import { build } from 'esbuild';
import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';

console.log('🧹 Cleaning previous builds...');
if (existsSync('dist')) {
  rmSync('dist', { recursive: true, force: true });
}

console.log('🚀 Building react-bitmap package...');

// ESM Build
await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  format: 'esm',
  minify: true,
  sourcemap: true,
  external: ['react', 'react-dom'],
  platform: 'neutral',
  target: 'es2022',
});
console.log('✅ ESM Build complete (dist/index.js)');

// CommonJS Build
await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.cjs',
  bundle: true,
  format: 'cjs',
  minify: true,
  sourcemap: true,
  external: ['react', 'react-dom'],
  platform: 'neutral',
  target: 'es2022',
});
console.log('✅ CommonJS Build complete (dist/index.cjs)');

console.log('📝 Generating TypeScript declarations...');
try {
  execSync('tsc --emitDeclarationOnly', { stdio: 'inherit' });
  console.log('✅ Declarations generated (dist/index.d.ts)');
} catch (error) {
  console.error('❌ Failed to generate declarations:', error);
  process.exit(1);
}

console.log('🎉 All builds finished successfully!');
