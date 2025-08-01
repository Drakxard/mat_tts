#!/bin/bash
set -e

echo "🔨 Starting Vercel build for Vite app..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the Vite frontend
echo "🏗️ Building frontend..."
npm run build

echo "✅ Build completed successfully!"
echo "📁 Output directory: dist/public"

# List build artifacts
ls -la dist/public/