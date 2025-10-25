#!/usr/bin/env node

/**
 * Script to clean environment and reset development setup
 */

console.log('🧹 Cleaning development environment...');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Clean Vite cache
const viteCachePath = path.join(__dirname, '..', 'node_modules', '.vite');
if (fs.existsSync(viteCachePath)) {
  try {
    fs.rmSync(viteCachePath, { recursive: true, force: true });
    console.log('✅ Vite cache cleared');
  } catch (error) {
    console.log('⚠️  Could not clear Vite cache:', error.message);
  }
}

// 2. Check environment variables
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasLocalUrl = envContent.includes('127.0.0.1:54321');
  const hasLocalKey = envContent.includes('sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH');

  if (hasLocalUrl && hasLocalKey) {
    console.log('✅ Local environment variables found');
  } else {
    console.log('⚠️  Environment variables may need updating');
  }
} else {
  console.log('❌ .env.local file not found');
}

console.log('\n📋 Next steps:');
console.log('1. Clear browser storage:');
console.log('   - Open DevTools (F12)');
console.log('   - Go to Application/Storage tab');
console.log('   - Clear Local Storage, Session Storage, and Cookies');
console.log('   - OR use hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)');
console.log('\n2. Restart development server:');
console.log('   npm run dev');
console.log('\n3. Check console for:');
console.log('   🔑 Supabase URL: http://127.0.0.1:54321');
console.log('   🔑 Supabase ANON Key: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH...');