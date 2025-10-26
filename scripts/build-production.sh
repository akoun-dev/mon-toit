#!/bin/bash

# Production Build and Deployment Script for Mon Toit
# This script builds the app for production and prepares it for deployment

set -e

echo "🚀 [BUILD] Starting production build process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Set production environment
export NODE_ENV=production
export VITE_PROD=true

echo -e "${BLUE}📦 Building for production environment...${NC}"

# Clean previous build
if [ -d "dist" ]; then
    echo -e "${YELLOW}🧹 Cleaning previous build...${NC}"
    rm -rf dist
fi

# Build the application
echo -e "${BLUE}🔨 Running npm run build...${NC}"
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist directory not created${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully!${NC}"

# Build stats
echo -e "${BLUE}📊 Build statistics:${NC}"
du -sh dist/
echo -e "${BLUE}📁 Files in build:${NC}"
find dist -type f | wc -l

# Capacitor sync for mobile apps
echo -e "${BLUE}📱 Syncing with Capacitor for mobile apps...${NC}"
npx cap sync

# Check Android build
if [ -d "android" ]; then
    echo -e "${GREEN}✅ Android project updated${NC}"
else
    echo -e "${YELLOW}⚠️  Android project not found (run: npx cap add android)${NC}"
fi

# Check iOS build
if [ -d "ios" ]; then
    echo -e "${GREEN}✅ iOS project updated${NC}"
else
    echo -e "${YELLOW}⚠️  iOS project not found (run: npx cap add ios)${NC}"
fi

# Production optimizations checklist
echo -e "${BLUE}🔍 Production optimization checklist:${NC}"
echo -e "   • PWA manifest configured: $([ -f "dist/manifest.json" ] && echo "✅" || echo "❌")"
echo -e "   • Service worker generated: $([ -f "dist/sw.js" ] && echo "✅" || echo "❌")"
echo -e "   • Security headers configured: $([ -f "public/_headers" ] && echo "✅" || echo "❌")"
echo -e "   • Capacitor config optimized: $([ -f "capacitor.config.ts" ] && echo "✅" || echo "❌")"

# Environment check
echo -e "${BLUE}🌍 Environment check:${NC}"
echo -e "   • NODE_ENV: $NODE_ENV"
echo -e "   • VITE_PROD: $VITE_PROD"

echo -e "${GREEN}🎉 Production build completed successfully!${NC}"
echo -e "${BLUE}📂 Ready for deployment:${NC}"
echo -e "   • Web: Deploy the 'dist/' folder to Netlify/Vercel"
echo -e "   • Android: Run 'npx cap open android' and build APK"
echo -e "   • iOS: Run 'npx cap open ios' and build IPA"