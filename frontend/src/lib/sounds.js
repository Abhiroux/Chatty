// Sound Manager for Chatty
// Handles notification sounds with user preference support

const SOUND_PATHS = {
  receive: "/sounds/notification.mp3",
  send: "/sounds/notification.mp3",
  notification: "/sounds/notification.mp3",
};

const STORAGE_KEY = "chatty-sound-settings";

// Default settings
const defaultSettings = {
  enabled: true,
  browserNotifications: false,
  volume: 0.7,
};

// Load settings from localStorage
function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch {
    // ignore parse errors
  }
  return { ...defaultSettings };
}

// Save settings to localStorage
function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// Audio cache to avoid re-creating Audio objects
const audioCache = {};

function getAudio(key) {
  if (!audioCache[key]) {
    audioCache[key] = new Audio(SOUND_PATHS[key]);
  }
  return audioCache[key];
}

// Debounce tracking — prevent overlapping sounds
let lastPlayTime = 0;
const MIN_INTERVAL_MS = 300;

/**
 * Synthesize a short, subtle tick/pop sound using Web Audio API for sent messages
 */
function playTick(volume) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // WhatsApp-like subtle tick/pop
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    // Drop pitch rapidly for a click effect
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(1, ctx.currentTime);
    // Fade out rapidly
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    // Apply user volume setting (typically ~50% of the normal notification sound to keep it subtle)
    gain.gain.value *= Math.min(1, Math.max(0, volume)) * 0.5;

    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);

    // Clean up AudioContext to prevent memory leaks
    setTimeout(() => {
      if (ctx.state !== "closed") ctx.close();
    }, 100);
  } catch (e) {
    // Ignore context errors
  }
}

/**
 * Play an audio file sound effect
 */
export function playSound(type) {
  const settings = loadSettings();
  if (!settings.enabled) return;

  const now = Date.now();
  if (now - lastPlayTime < MIN_INTERVAL_MS) return;
  lastPlayTime = now;

  try {
    const audio = getAudio(type);
    audio.volume = Math.min(1, Math.max(0, settings.volume));
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Browser blocked autoplay
    });
  } catch {
    // Audio not supported
  }
}

// Convenience methods
export const playReceive = () => playSound("receive");
export const playNotification = () => playSound("notification");
export const playSend = () => {
  const settings = loadSettings();
  if (settings.enabled) {
    playTick(settings.volume);
  }
};

// Settings getters/setters
export function getSoundSettings() {
  return loadSettings();
}

export function updateSoundSettings(updates) {
  const current = loadSettings();
  const newSettings = { ...current, ...updates };
  saveSettings(newSettings);

  // If volume changed, update cached audio objects
  if (updates.volume !== undefined) {
    Object.values(audioCache).forEach((audio) => {
      audio.volume = newSettings.volume;
    });
  }

  return newSettings;
}

export function toggleMute() {
  const current = loadSettings();
  const newSettings = { ...current, enabled: !current.enabled };
  saveSettings(newSettings);
  return newSettings;
}

export function isMuted() {
  return !loadSettings().enabled;
}
