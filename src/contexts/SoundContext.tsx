import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';

export interface SoundSettings {
  enabled: boolean;
  volume: number;
  notificationSounds: boolean;
  clickSounds: boolean;
  taskSounds: boolean;
  commentSounds: boolean;
  selectedNotificationSound: string;
  selectedClickSound: string;
}

interface SoundContextType {
  settings: SoundSettings;
  updateSettings: (updates: Partial<SoundSettings>) => void;
  playNotificationSound: () => void;
  playClickSound: () => void;
  playTaskSound: (type: 'assigned' | 'completed' | 'updated') => void;
  playCommentSound: () => void;
  testSound: (soundType: string) => void;
  availableSounds: {
    notifications: Array<{ id: string; name: string; description: string }>;
    clicks: Array<{ id: string; name: string; description: string }>;
  };
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

const defaultSettings: SoundSettings = {
  enabled: true,
  volume: 0.7,
  notificationSounds: true,
  clickSounds: true,
  taskSounds: true,
  commentSounds: true,
  selectedNotificationSound: 'gentle-chime',
  selectedClickSound: 'soft-click'
};

const STORAGE_KEY = 'nbslims_sound_settings';

// Available sound options
const availableSounds = {
  notifications: [
    { id: 'gentle-chime', name: 'Gentle Chime', description: 'Soft and pleasant notification sound' },
    { id: 'modern-bell', name: 'Modern Bell', description: 'Clean bell sound for notifications' },
    { id: 'success-tone', name: 'Success Tone', description: 'Positive notification sound' },
    { id: 'alert-beep', name: 'Alert Beep', description: 'Clear alert sound' }
  ],
  clicks: [
    { id: 'soft-click', name: 'Soft Click', description: 'Gentle click sound' },
    { id: 'modern-tap', name: 'Modern Tap', description: 'Clean tap sound' },
    { id: 'button-press', name: 'Button Press', description: 'Classic button press sound' },
    { id: 'subtle-pop', name: 'Subtle Pop', description: 'Light pop sound' }
  ]
};

export const SoundProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SoundSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading sound settings:', error);
    }
    return defaultSettings;
  });

  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio Context
  useEffect(() => {
    const initAudioContext = () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
      }
    };

    // Initialize on first user interaction
    const handleFirstInteraction = () => {
      initAudioContext();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving sound settings:', error);
    }
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<SoundSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Create different types of sounds using Web Audio API
  const createSound = useCallback((type: string, frequency1: number, frequency2?: number, duration = 0.3) => {
    if (!audioContextRef.current || !settings.enabled) return;

    try {
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Set volume
      gainNode.gain.setValueAtTime(settings.volume * 0.3, audioContext.currentTime);
      
      // Configure oscillator based on sound type
      switch (type) {
        case 'gentle-chime':
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
          break;
          
        case 'modern-bell':
          oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.05);
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
          break;
          
        case 'success-tone':
          oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
          oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
          oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
          break;
          
        case 'alert-beep':
          oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          break;
          
        case 'soft-click':
          oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          break;
          
        case 'modern-tap':
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
          break;
          
        case 'button-press':
          oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.12);
          break;
          
        case 'subtle-pop':
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.06);
          break;
          
        default:
          oscillator.frequency.setValueAtTime(frequency1, audioContext.currentTime);
          if (frequency2) {
            oscillator.frequency.setValueAtTime(frequency2, audioContext.currentTime + duration / 2);
          }
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      }
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }, [settings.enabled, settings.volume]);

  const playNotificationSound = useCallback(() => {
    if (settings.notificationSounds) {
      createSound(settings.selectedNotificationSound, 800, 600);
    }
  }, [settings.notificationSounds, settings.selectedNotificationSound, createSound]);

  const playClickSound = useCallback(() => {
    if (settings.clickSounds) {
      createSound(settings.selectedClickSound, 400);
    }
  }, [settings.clickSounds, settings.selectedClickSound, createSound]);

  const playTaskSound = useCallback((type: 'assigned' | 'completed' | 'updated') => {
    if (!settings.taskSounds) return;
    
    switch (type) {
      case 'assigned':
        createSound('modern-bell', 1000, 800);
        break;
      case 'completed':
        createSound('success-tone', 523, 784, 0.5);
        break;
      case 'updated':
        createSound('gentle-chime', 700, 500);
        break;
    }
  }, [settings.taskSounds, createSound]);

  const playCommentSound = useCallback(() => {
    if (settings.commentSounds) {
      createSound('subtle-pop', 600);
    }
  }, [settings.commentSounds, createSound]);

  const testSound = useCallback((soundType: string) => {
    createSound(soundType, 800, 600);
  }, [createSound]);

  const value: SoundContextType = {
    settings,
    updateSettings,
    playNotificationSound,
    playClickSound,
    playTaskSound,
    playCommentSound,
    testSound,
    availableSounds
  };

  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = (): SoundContextType => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};