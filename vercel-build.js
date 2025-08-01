#!/usr/bin/env node

// Vercel build script for compatibility
const { execSync } = require('child_process');

console.log('Building frontend for Vercel...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}