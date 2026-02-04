import { VoiceSettings, VoicePersona } from '../types';

let synth: SpeechSynthesis | null = null;
if (typeof window !== 'undefined') {
    synth = window.speechSynthesis;
}

// Global reference to prevent garbage collection of the utterance while speaking
let currentUtterance: SpeechSynthesisUtterance | null = null;

// Helpers to select voice based on persona and availability
const getPreferredVoice = (voices: SpeechSynthesisVoice[], persona: VoicePersona): SpeechSynthesisVoice | null => {
    // Filter by language roughly if possible
    const enVoices = voices.filter(v => v.lang.startsWith('en'));

    // Priority list for "AI-like" quality voices often found in browsers
    const priorities = [
        'Google US English', 
        'Microsoft Zira', 
        'Samantha', 
        'Google UK English Female',
        'English United States'
    ];
    
    // 1. Persona specific tweaks
    if (persona === 'storyteller' || persona === 'poetic') {
       // Try to find a male voice for variety if requested
       const male = enVoices.find(v => v.name.includes('Male') || v.name.includes('David') || v.name.includes('Guy'));
       if (male) return male;
    }

    // 2. Try to find a high quality priority voice
    for (const name of priorities) {
        const found = voices.find(v => v.name.includes(name));
        if (found) return found;
    }

    // 3. Fallback to first English or first available
    return enVoices[0] || voices[0] || null;
};

// --- Public API ---

export const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
    return new Promise((resolve) => {
        if (!synth) {
            resolve([]);
            return;
        }
        
        const voices = synth.getVoices();
        if (voices.length > 0) {
            resolve(voices);
            return;
        }
        
        // Chrome needs this event to populate voices
        synth.onvoiceschanged = () => {
            resolve(synth.getVoices());
        };
        
        // Fallback timeout
        setTimeout(() => resolve(synth ? synth.getVoices() : []), 1000); 
    });
};

export const speakText = async (
  text: string, 
  settings: VoiceSettings,
  onEnd?: () => void,
  onError?: () => void
): Promise<boolean> => {
  // Always stop previous before starting new
  stopSpeaking();
  
  if (!synth || !text.trim()) {
      if (onError) onError();
      return false;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Base Settings
  let rate = settings.speed || 1.0;
  let pitch = settings.pitch || 1.0;

  // Persona Tweaks (parametric adjustments)
  // Ensure 'standard' uses strict 1.0 if not modified by slider
  if (settings.persona === 'standard') {
      // Keep strictly as defined by user settings (default 1.0)
  } else {
      switch (settings.persona) {
          case 'teacher':
              // Slightly slower, clear
              rate = Math.min(rate, 0.95); 
              break;
          case 'storyteller':
              // Slower, dramatic
              rate = Math.min(rate, 0.9);
              break;
          case 'poetic':
              // Slow, slight pitch drop
              rate = Math.min(rate, 0.85);
              pitch = Math.max(0.8, pitch * 0.95);
              break;
          case 'child_friendly':
              // Higher pitch, energetic
              pitch = Math.min(1.4, pitch * 1.2);
              rate = Math.min(rate, 1.1);
              break;
          default:
              break;
      }
  }

  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = 1.0;

  // Voice Selection
  const voices = synth.getVoices();
  const voice = getPreferredVoice(voices, settings.persona);
  if (voice) {
      utterance.voice = voice;
  }

  // Event Handling
  utterance.onend = () => {
      // Only clear if this is the active utterance
      if (currentUtterance === utterance) {
        currentUtterance = null;
        if (onEnd) onEnd();
      }
  };
  
  utterance.onerror = (e) => {
      // 'canceled' or 'interrupted' are common and not critical errors
      // Note: Some browsers fire 'interrupted' on pause, ignore it to prevent reset
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
          console.error("TTS Error:", e);
          if (onError) onError(); 
      }
      
      // If it was just interrupted (paused), don't kill the reference
      if (e.error !== 'interrupted') {
          if (currentUtterance === utterance) {
             currentUtterance = null;
          }
      }
  };

  currentUtterance = utterance;
  synth.speak(utterance);
  
  return true;
};

export const stopSpeaking = () => {
    if (synth) {
        synth.cancel();
    }
    currentUtterance = null;
};

export const pauseSpeaking = () => {
    if (synth) {
        if (!synth.paused && synth.speaking) {
            synth.pause();
        }
    }
};

export const resumeSpeaking = () => {
    if (synth) {
        if (synth.paused) {
            synth.resume();
        }
    }
};