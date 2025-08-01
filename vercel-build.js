#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Starting Vercel build process...');

try {
  // Build frontend
  console.log('📦 Building frontend...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Ensure api directory exists in build output
  const apiDir = path.join(__dirname, 'api');
  const distApiDir = path.join(__dirname, 'dist', 'api');
  
  if (fs.existsSync(apiDir)) {
    console.log('📄 Copying API files...');
    // Copy API files to dist if needed
    if (!fs.existsSync(distApiDir)) {
      fs.mkdirSync(distApiDir, { recursive: true });
    }
  }
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}