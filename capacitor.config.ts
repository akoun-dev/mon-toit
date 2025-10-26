import type { CapacitorConfig } from '@capacitor/cli';

// Environment detection
const isProd = process.env.NODE_ENV === 'production';
const isDev = process.env.NODE_ENV === 'development';

// Dynamic values
const serverUrl = isProd ? 'https://mon-toit.netlify.app' : 'https://mon-toit.netlify.app';
const serverHostname = isProd ? 'mon-toit.netlify.app' : 'mon-toit.netlify.app';

// Base navigation domains
const baseNavigation = [
  'https://mon-toit.netlify.app',
  'https://mon-toit.ci',
  'https://*.mon-toit.ci',
  'https://*.supabase.co',
  'https://api.mapbox.com',
  'https://tiles.mapbox.com',
  'https://*.mapbox.com',
  'https://api.cinetpay.com',
  'https://*.cinetpay.com',
  'https://api.ipify.org',
  'https://*.azure-api.net',
  'https://*.cognitive.microsoft.com'
];

// Add development URLs if in dev mode
const developmentNavigation = isDev ? [
  'http://localhost:*',
  'http://127.0.0.1:*',
  'https://localhost:*',
  'https://127.0.0.1:*'
] : [];

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
    // Security: Restrict navigation to approved domains only
    allowNavigation: [
      ...baseNavigation,
      ...developmentNavigation
    ],
    // Security configurations
    cleartext: isDev, // Only allow cleartext in development
    // Performance and security
    allowNavigationByUserInitiatedAction: true,
    // Dynamic URL based on environment
    url: serverUrl,
    hostname: serverHostname
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
    appendUserAgent: 'MonToit-iOS/1.0' + (isProd ? '-PROD' : '-DEV'),
    // Handle external links
    handleLinks: 'all',
    // Production optimizations
    ...(isProd && {
      // Disallow debugging in production
      webContentsDebuggingEnabled: false,
      // Enhanced security for production
      allowsInlineMediaPlayback: false,
      limitsNavigationsToAppBoundDomains: true,
    })
  },
  // Android configuration
  android: {
    // Deep linking configuration
    webContentsDebuggingEnabled: isDev, // Only in development
    // Input method configuration
    captureInput: true,
    // Log configuration
    loggingBehavior: isProd ? 'production' : 'debug',
    // WebView configuration
    allowMixedContent: 'never',
    // Orientation configuration
    orientation: 'portrait',
    // Security and performance
    backgroundColor: '#667eea',
    appendUserAgent: 'MonToit-Android/1.0' + (isProd ? '-PROD' : '-DEV'),
    // Production optimizations
    ...(isProd && {
      // Enhanced security for production
      hardwareAccelerated: true,
      // Network security
      networkSecurityConfig: {
        allowClearTextTraffic: false,
        domainConfigs: [
          {
            includeSubdomains: true,
            domains: ['mon-toit.netlify.app', 'mon-toit.ci', '*.mon-toit.ci', '*.supabase.co']
          }
        ]
      }
    })
  },
  plugins: {
    // SplashScreen configuration
    SplashScreen: {
      launchShowDuration: isProd ? 1500 : 2000,
      launchAutoHide: true,
      backgroundColor: '#667eea',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      // iOS specific
      launchFadeInDuration: isProd ? 200 : 300,
      // Production optimizations
      ...(isProd && {
        useDialog: true,
        layoutDisplayOptions: {
          backgroundColor: '#667eea'
        }
      })
    },
    // StatusBar configuration
    StatusBar: {
      style: 'dark',
      backgroundColor: '#FF8F00',
      overlaysWebView: true,
      // Production style
      ...(isProd && {
        style: 'LIGHT',
        backgroundColor: '#FFFFFF'
      })
    },
    // App plugin configuration
    App: {
      appendUserAgent: 'MonToit-Secure-App/1.0' + (isProd ? '-PROD' : '-DEV'),
      handleUrlOpen: true,
      allowNavigation: true,
      // Production security
      ...(isProd && {
        // Enhanced security for production
        // Disallow opening external URLs
        urlOpen: {
          // Allow only specific domains in production
          allowedUrls: [
            'https://mon-toit.netlify.app',
            'https://mon-toit.ci',
            'https://*.mon-toit.ci'
          ]
        }
      })
    },
    // Keyboard plugin configuration
    Keyboard: {
      resize: 'ionic',
      style: isProd ? 'light' : 'dark',
      mode: 'resize',
      hideFormActionBar: false,
      // Production optimizations
      ...(isProd && {
        scrollable: true,
        resizeOnKeyboardShow: true
      })
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
      timeout: isProd ? 25000 : 30000,
      retryCount: isProd ? 5 : 3,
      // Production optimizations
      ...(isProd && {
        // Enhanced caching for production
        caching: {
          enabled: true,
          maxSize: 50 * 1024 * 1024, // 50MB
          maxAge: 3600000 // 1 hour
        }
      })
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
      // Production optimizations
      ...(isProd && {
        // Enhanced push notification settings for production
        displayOptions: {
          badge: true,
          sound: true,
          alert: true,
          // Priority settings
          priority: 5,
          visibility: 'public'
        },
        // Local notification scheduling
        localNotifications: {
          allowScheduling: true,
          allowWhileIdle: true,
          allowWhileInBackground: true
        }
      })
    },
  },
};

export default config;
