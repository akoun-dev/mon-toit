import React from 'react';
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from "@sentry/react";
import { queryClient } from '@/lib/queryClient';
import { initPerformanceMonitoring } from '@/lib/analytics';
import App from "./App.tsx";
import "./index.css";

// Initialize Sentry in production
if (false && import.meta.env.PROD) {
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
      // Add user ID if available
      const userId = localStorage.getItem('supabase.auth.token');
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
