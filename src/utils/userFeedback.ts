/**
 * Combined user feedback utility (audio + haptic)
 * Provides multisensory feedback for verification steps
 */

import { triggerHapticFeedback, HapticIntensity } from './haptics';
import { playNotificationSound } from './notifications';

type FeedbackType =
  | 'step_change'      // Step transition
  | 'upload_complete'  // Upload finished
  | 'processing_start' // Processing started
  | 'success'          // Final success
  | 'error';           // Error occurred

interface FeedbackConfig {
  sound?: 'step' | 'success' | 'error' | 'upload' | 'processing';
  haptic?: HapticIntensity;
  vibrationPattern?: number[]; // Custom pattern for Android
}

/**
 * Feedback configuration map
 */
const FEEDBACK_MAP: Record<FeedbackType, FeedbackConfig> = {
  step_change: {
    sound: 'step',
    haptic: 'light',
  },
  upload_complete: {
    sound: 'upload',
    haptic: 'medium',
  },
  processing_start: {
    sound: 'processing',
    haptic: 'light',
  },
  success: {
    sound: 'success',
    haptic: 'heavy',
    vibrationPattern: [0, 100, 50, 100], // Double vibration
  },
  error: {
    sound: 'error',
    haptic: 'medium',
    vibrationPattern: [0, 200, 100, 200, 100, 200], // Triple vibration
  },
};

/**
 * Trigger combined user feedback (audio + haptic)
 */
export const triggerUserFeedback = async (type: FeedbackType): Promise<void> => {
  const config = FEEDBACK_MAP[type];

  // Check preferences
  const hapticsEnabled = localStorage.getItem('haptics_enabled') !== 'false';
  const soundsEnabled = localStorage.getItem('sounds_enabled') !== 'false';

  // Play sound
  if (soundsEnabled && config.sound) {
    await playNotificationSound(config.sound);
  }

  // Trigger haptic feedback
  if (hapticsEnabled) {
    if (config.vibrationPattern && 'vibrate' in navigator) {
      // Custom pattern for Android
      navigator.vibrate(config.vibrationPattern);
    } else if (config.haptic) {
      // Simple feedback for iOS/Android
      triggerHapticFeedback(config.haptic);
    }
  }
};

/**
 * Toggle haptic feedback on/off
 */
export const toggleHaptics = (enabled: boolean): void => {
  localStorage.setItem('haptics_enabled', String(enabled));
};

/**
 * Toggle sounds on/off
 */
export const toggleSounds = (enabled: boolean): void => {
  localStorage.setItem('sounds_enabled', String(enabled));
};

/**
 * Check if haptics are enabled
 */
export const areHapticsEnabled = (): boolean => {
  return localStorage.getItem('haptics_enabled') !== 'false';
};

/**
 * Check if sounds are enabled
 */
export const areSoundsEnabled = (): boolean => {
  return localStorage.getItem('sounds_enabled') !== 'false';
};
