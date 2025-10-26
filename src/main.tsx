import React from 'react';
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from "@sentry/react";
import { queryClient } from '@/lib/queryClient';
import { initPerformanceMonitoring } from '@/lib/analytics';
import { migrateToSecureStorage, secureStorage } from '@/lib/secureStorage';
import { isNativePlatform } from '@/lib/capacitorWrapper';
import App from "./App.tsx";
import "./index.css";
import "./styles/design-system.css";

// Initialize secure storage migration on app startup
migrateToSecureStorage();

// Debug environment variables in production
if (import.meta.env.PROD) {
  console.log('🔧 Environment Variables Debug:');
  console.log('- VITE_SUPABASE_URL:', !!import.meta.env.VITE_SUPABASE_URL);
  console.log('- VITE_SUPABASE_ANON_KEY:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
  console.log('- VITE_MAPBOX_PUBLIC_TOKEN:', !!import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN);
  console.log('- VITE_BREVO_API_KEY:', !!import.meta.env.VITE_BREVO_API_KEY);

  // Validate Mapbox token format
  const mapboxToken = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
  if (mapboxToken && !/^pk\.[a-zA-Z0-9.-_]+$/.test(mapboxToken)) {
    console.error('❌ Invalid Mapbox token format detected');
  } else if (mapboxToken) {
    console.log('✅ Mapbox token format is valid');
  }
}

// Initialize mobile services asynchronously only on native platforms
async function initializeMobileServices() {
  const isNative = await isNativePlatform();
  
  if (!isNative) {
    console.log('📱 Running in browser mode - Capacitor features disabled');
    return;
  }

  try {
    // Dynamically import Capacitor modules only on native platforms
    const [
      { initializeWebViewSecurity },
      { initializeDeviceSecurity },
      { initializeMobilePlugins, logPluginReport },
      { MobileNotificationService },
      { MobileFileSystemService },
      { MobileNetworkService }
    ] = await Promise.all([
      import('@/lib/webviewSecurity'),
      import('@/lib/deviceSecurity'),
      import('@/lib/mobilePlugins'),
      import('@/lib/mobileNotifications'),
      import('@/lib/mobileFileSystem'),
      import('@/lib/mobileNetwork')
    ]);

    // Initialize WebView security for mobile apps
    initializeWebViewSecurity();

    // Initialize device security detection
    initializeDeviceSecurity();

    // Initialize and verify mobile plugins
    await initializeMobilePlugins();

    // Log plugin report for debugging
    await logPluginReport();

    // Initialize notification service
    const notificationService = MobileNotificationService.getInstance();
    await notificationService.initialize();

    // Initialize file system service
    const fileSystemService = MobileFileSystemService.getInstance();
    await fileSystemService.initialize();

    // Initialize network service
    const networkService = MobileNetworkService.getInstance();
    await networkService.initialize();

    console.log('✅ All mobile services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize mobile services:', error);
  }
}

// Initialize mobile services
initializeMobileServices();

// Initialize Sentry in production
if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN || "",
    environment: import.meta.env.MODE,
    
    // Performance monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    
    // Performance traces
    tracesSampleRate: 1.0, // 100% in production
    
    // Session replays
    replaysSessionSampleRate: 0.1, // 10% of normal sessions
    replaysOnErrorSampleRate: 1.0, // 100% of error sessions
    
    // Context enrichment
    beforeSend(event, hint) {
      // Add user ID if available (using secure storage)
      const userId = secureStorage.getItem('supabase.auth.token', true);
      if (userId) {
        event.user = { ...event.user, id: userId };
      }
      
      // Filter out benign errors
      if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
        return null;
      }
      
      return event;
    },
    
    // Ignore specific errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'ChunkLoadError',
    ],
  });

  // Initialize performance monitoring
  initPerformanceMonitoring();
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
