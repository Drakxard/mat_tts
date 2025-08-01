#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔨 Building Vite/Express app for Vercel...');

try {
  // Clean dist directory
  const distDir = path.join(__dirname, 'dist');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }

  // Build frontend with Vite
  console.log('📦 Building frontend...');
  execSync('vite build', { stdio: 'inherit', cwd: __dirname });
  
  // Verify the build output
  const publicDir = path.join(__dirname, 'dist', 'public');
  if (fs.existsSync(publicDir)) {
    console.log('✅ Frontend build completed successfully!');
    
    // List generated files
    const files = fs.readdirSync(publicDir);
    console.log('📄 Generated files:', files.join(', '));
  } else {
    throw new Error('Frontend build failed - no public directory found');
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}