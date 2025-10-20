/**
 * Capacitor Wrapper for Safe Browser Execution
 * 
 * This wrapper provides safe access to Capacitor APIs that won't break
 * when the app runs in a browser environment.
 */

// Type definitions for mock objects
export interface MockCapacitor {
  isNativePlatform: () => boolean;
  getPlatform: () => string;
  Plugins: Record<string, any>;
}

/**
 * Get Capacitor safely - returns real Capacitor on native, mock in browser
 */
export async function getSafeCapacitor(): Promise<MockCapacitor> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return createMockCapacitor();
  }

  try {
    // Dynamically import Capacitor only if it's available
    const { Capacitor } = await import('@capacitor/core');
    
    if (Capacitor.isNativePlatform()) {
      return Capacitor as unknown as MockCapacitor;
    }
    
    // We're in a browser, return mock
    return createMockCapacitor();
  } catch (error) {
    // Capacitor not available, return mock
    console.log('Capacitor not available, using mock');
    return createMockCapacitor();
  }
}

/**
 * Create a mock Capacitor object for browser environments
 */
function createMockCapacitor(): MockCapacitor {
  return {
    isNativePlatform: () => false,
    getPlatform: () => 'web',
    Plugins: {},
  };
}

/**
 * Check if we're running on a native platform
 */
export async function isNativePlatform(): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Get the current platform
 */
export async function getPlatform(): Promise<string> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.getPlatform();
  } catch {
    return 'web';
  }
}

/**
 * Safely execute Capacitor plugin methods
 */
export async function safePluginCall<T>(
  pluginName: string,
  methodName: string,
  args?: any
): Promise<T | null> {
  const isNative = await isNativePlatform();
  
  if (!isNative) {
    console.log(`Skipping ${pluginName}.${methodName} - not on native platform`);
    return null;
  }

  try {
    const module = await import(`@capacitor/${pluginName.toLowerCase()}`);
    const plugin = module[pluginName];
    
    if (plugin && typeof plugin[methodName] === 'function') {
      return await plugin[methodName](args);
    }
    
    console.warn(`Method ${methodName} not found on ${pluginName}`);
    return null;
  } catch (error) {
    console.warn(`Failed to call ${pluginName}.${methodName}:`, error);
    return null;
  }
}
