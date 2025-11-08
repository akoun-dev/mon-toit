/**
 * Audio notification utility with synthetic sound generation
 * Uses Web Audio API to generate sounds without external files
 */

type NotificationSound = 'step' | 'success' | 'error' | 'upload' | 'processing';

// Audio context singleton
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

/**
 * Generate a simple beep sound
 */
const generateBeep = (
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine'
) => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (error) {
    console.debug('Audio playback failed:', error);
  }
};

/**
 * Generate a chord (multiple frequencies)
 */
const generateChord = (frequencies: number[], duration: number) => {
  try {
    const ctx = getAudioContext();
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = 0.2;

    frequencies.forEach((freq) => {
      const oscillator = ctx.createOscillator();
      oscillator.connect(masterGain);
      oscillator.frequency.value = freq;
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    });

    masterGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  } catch (error) {
    console.debug('Audio playback failed:', error);
  }
};

/**
 * Sound generators for each notification type
 */
const soundGenerators: Record<NotificationSound, () => void> = {
  // Light "pop" for step transitions
  step: () => {
    generateBeep(800, 0.1, 'sine');
  },

  // Success chord (major triad)
  success: () => {
    generateChord([523.25, 659.25, 783.99], 0.4); // C-E-G
  },

  // Error sound (minor chord, lower)
  error: () => {
    generateChord([293.66, 349.23, 440], 0.3); // D-F-A (minor)
  },

  // Upload complete (rising tone)
  upload: () => {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  },

  // Processing (double beep)
  processing: () => {
    generateBeep(600, 0.08);
    setTimeout(() => generateBeep(700, 0.08), 100);
  },
};

/**
 * Play a notification sound
 */
export const playNotificationSound = async (
  type: NotificationSound
): Promise<void> => {
  try {
    // Check if sounds are enabled
    const soundsEnabled = localStorage.getItem('sounds_enabled') !== 'false';
    if (!soundsEnabled) return;

    // Get audio context ready
    const ctx = getAudioContext();
    
    // Resume context if suspended (required on iOS)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Generate the sound
    soundGenerators[type]();
  } catch (error) {
    // Silently fail if audio blocked
    console.debug('Notification sound blocked:', error);
  }
};

/**
 * Toggle notification sounds on/off
 */
export const toggleNotificationSounds = (enabled: boolean): void => {
  localStorage.setItem('sounds_enabled', String(enabled));
};

/**
 * Check if notification sounds are enabled
 */
export const areNotificationSoundsEnabled = (): boolean => {
  return localStorage.getItem('sounds_enabled') !== 'false';
};

/**
 * Preload audio context (call on user interaction)
 */
export const preloadNotificationSounds = (): void => {
  try {
    const ctx = getAudioContext();
    // Resume context to prepare for playback
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  } catch (error) {
    console.debug('Audio context initialization failed:', error);
  }
};
