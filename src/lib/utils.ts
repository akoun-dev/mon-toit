import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { type IllustrationKey, illustrationPaths } from "@/assets/illustrations/ivorian/illustrationPaths";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the path of an illustration by key
 * @param name - The illustration key
 * @returns The illustration path or undefined if not found
 */
export function getIllustrationPath(name: IllustrationKey): string | undefined {
  return illustrationPaths[name];
}

/**
 * Generate a UUID v4 with fallback for browsers that don't support crypto.randomUUID()
 * @returns A UUID v4 string
 */
export function generateUUID(): string {
  // Check if crypto.randomUUID is available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback implementation for older browsers or non-secure contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
