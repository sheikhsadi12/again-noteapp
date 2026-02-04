import { VoiceSettings, VoicePersona } from '../types';

let synth: SpeechSynthesis | null = null;
if (typeof window !== 'undefined') {
    synth = window.speechSynthesis;
}

// Global reference to prevent garbage collection of the utterance while speaking/paused
let currentUtterance: SpeechSynthesisUtterance | null = null;

const isBengaliText = (text: string) => /[\u0980-\u09FF]/.test(text);

// Helpers to select voice based on persona and availability
const getPreferredVoice = (voices: SpeechSynthesisVoice[], persona: VoicePersona, text: string): SpeechSynthesisVoice | null => {
    const isBengali = isBengaliText(text);

    // CRITICAL FIX: If the text contains ANY Bengali, we MUST use a Bengali voice for the WHOLE text.
    // Switching engines (e.g., using an English voice for English words in a Bengali sentence) 
    // causes the "two people speaking" effect and robotic transitions.
    // A Bengali voice reading English words sounds like a Bengali teacher speaking English, which is natural.
    
    if (isBengali) {
        // Priority 1: Google Bengali (High quality on Android/Chrome)
        const googleBn = voices.find(v => v.lang.includes('bn') && v.name.includes('Google'));
        if (googleBn) return googleBn;
        
        // Priority 2: Any Bengali voice
        const anyBn = voices.find(v => v.lang.includes('bn'));
        if (anyBn) return anyBn;
        
        // Fallback: If no Bengali voice, use the default (will likely sound robotic for BN, but unavoidable)
    }

    // If text is purely English (or other), proceed with English persona logic
    const enVoices = voices.filter(v => v.lang.startsWith('en'));
    
    // Priority list for "AI-like" quality voices often found in browsers
    const priorities = [
        'Google US English', 
        'Google UK English Female',
        'Microsoft Zira', 
        'Samantha', 
        'English United States'
    ];
    
    // 1. Persona specific tweaks (Only applies if we aren't forced into Bengali mode)
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

    // 3. Fallback
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

  // Create utterance
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Voice Selection logic
  const voices = synth.getVoices();
  const voice = getPreferredVoice(voices, settings.persona, text);
  if (voice) {
      utterance.voice = voice;
  }

  // Settings Logic
  let rate = settings.speed || 1.0;
  let pitch = settings.pitch || 1.0;

  // Apply Persona tweaks ONLY if we are in a supported language (English)
  // If we are forcing a Bengali voice, we keep pitch/rate fairly standard to ensure clarity
  // as Bengali engines can distort easily with high pitch shifts.
  if (settings.persona !== 'standard' && !isBengaliText(text)) {
      switch (settings.persona) {
          case 'teacher':
              rate = Math.min(rate, 0.95); 
              break;
          case 'storyteller':
              rate = Math.min(rate, 0.9);
              break;
          case 'poetic':
              rate = Math.min(rate, 0.85);
              pitch = Math.max(0.8, pitch * 0.95);
              break;
          case 'child_friendly':
              pitch = Math.min(1.4, pitch * 1.2);
              rate = Math.min(rate, 1.1);
              break;
      }
  }

  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = 1.0;

  // Event Handling
  utterance.onend = () => {
      if (currentUtterance === utterance) {
        currentUtterance = null;
        if (onEnd) onEnd();
      }
  };
  
  utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
          console.error("TTS Error:", e);
          if (onError) onError(); 
      }
      if (e.error !== 'interrupted') {
          if (currentUtterance === utterance) {
             currentUtterance = null;
          }
      }
  };

  currentUtterance = utterance; // Keep reference to prevent GC
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
        // Robust pause check
        if (!synth.paused && synth.speaking) {
            synth.pause();
        }
    }
};

export const resumeSpeaking = () => {
    if (synth) {
        // Robust resume check: simply calling resume() is usually safe even if already playing
        synth.resume();
    }
};