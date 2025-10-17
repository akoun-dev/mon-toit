import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ci.montoit.app',
  appName: 'Mon Toit',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
<<<<<<< Updated upstream
=======
    // Security: Restrict navigation to app domains
    allowNavigation: [
      'https://montoit.ci',
      'https://*.supabase.co',
      'https://api.mapbox.com',
      'https://tiles.mapbox.com',
      'https://*.mapbox.com',
      'https://mon-toit.netlify.app/'
    ],
    // Cleartext is not permitted
    cleartext: false,
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
>>>>>>> Stashed changes
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#667eea',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#FF8F00',
    },
  },
};

export default config;
