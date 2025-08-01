// Simple build script for Vercel compatibility
const { execSync } = require('child_process');

try {
  console.log('Building frontend...');
  execSync('vite build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}