import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ci.montoit.app',
  appName: 'Mon Toit',
  webDir: 'dist',
  // App package name and metadata
  package: 'ci.montoit.app',
  version: '1.0.0',
  build: '1.0.0',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // Security: Restrict navigation to app domains
    allowNavigation: [
      'https://*.supabase.co',
      'https://api.mapbox.com',
      'https://tiles.mapbox.com',
      'https://*.mapbox.com',
      'https://api.brevo.com',
      'https://*.brevo.com',
      'https://mon-toit.netlify.app/',
      'https://mon-toit.ci',
      'https://*.mon-toit.ci',
      'https://api.cinetpay.com',
      'https://*.cinetpay.com',
      'https://api.ipify.org',
      'https://*.azure-api.net',
      'https://*.cognitive.microsoft.com',
      // Development URLs
      'http://localhost:*',
      'http://127.0.0.1:*',
      'https://localhost:*',
      'https://127.0.0.1:*'
    ],
    // Security configurations
    cleartext: true, // Allow cleartext for local development
    // Performance and security
    allowNavigationByUserInitiatedAction: true,
    // Development server settings
    hostname: 'localhost',
    url: 'http://localhost:8081', // Default development server URL
    // Production security (will be overridden by environment)
    ...(process.env.NODE_ENV === 'production' && { cleartext: false })
  },
  // iOS configuration
  ios: {
    scheme: 'montoit',
    // Build configuration
    contentInset: 'automatic',
    // WebView configuration
    scrollEnabled: true,
    // Orientation configuration
    orientation: ['portrait'],
    // Performance and security
    backgroundColor: '#667eea',
    appendUserAgent: ' MonToit-iOS/1.0',
    // Handle external links
    handleLinks: 'all',
  },
  // Android configuration
  android: {
    // Deep linking configuration
    webContentsDebuggingEnabled: false,
    // Input method configuration
    captureInput: true,
    // Log configuration
    loggingBehavior: 'production',
    // WebView configuration
    allowMixedContent: 'never',
    // Orientation configuration
    orientation: 'portrait',
    // Security and performance
    backgroundColor: '#667eea',
    appendUserAgent: ' MonToit-Android/1.0',
  },
  plugins: {
    // SplashScreen configuration
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#667eea',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      // iOS specific
      launchFadeInDuration: 300,
    },
    // StatusBar configuration
    StatusBar: {
      style: 'dark',
      backgroundColor: '#FF8F00',
      overlaysWebView: true,
    },
    // App plugin configuration
    App: {
      appendUserAgent: ' MonToit-Secure-App/1.0',
      handleUrlOpen: true,
      allowNavigation: true,
    },
    // Keyboard plugin configuration
    Keyboard: {
      resize: 'ionic',
      style: 'dark',
      mode: 'resize',
      hideFormActionBar: false,
    },
    // Share plugin configuration
    Share: {
      enabled: true,
    },
    // Haptics plugin configuration
    Haptics: {
      enabled: true,
    },
    // Geolocation plugin configuration
    Geolocation: {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    },
    // HTTP plugin configuration for API requests
    Http: {
      enabled: true,
      // Configure HTTP timeouts and retries for better API reliability
      timeout: 30000,
      retryCount: 3,
    },
    // Camera plugin configuration
    Camera: {
      permissions: ['camera', 'photos'],
      resultType: 'uri',
      quality: 90,
      allowEditing: false,
      correctOrientation: true,
      saveToGallery: true,
    },
    // Filesystem plugin configuration
    Filesystem: {
      directory: 'DOCUMENTS',
      permissions: ['read', 'write'],
    },
    // Preferences plugin configuration
    Preferences: {
      group: 'montoit.storage',
    },
    // Browser plugin configuration
    Browser: {
      toolbarColor: '#667eea',
      presentationStyle: 'fullscreen',
    },
    // Network plugin configuration
    Network: {
      // Network monitoring for offline functionality
    },
    // Device plugin configuration
    Device: {
      // Device information access
    },
    // Push Notifications (when Firebase is configured)
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
