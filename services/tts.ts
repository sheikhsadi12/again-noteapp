import { VoiceSettings, VoicePersona } from '../types';

let synth: SpeechSynthesis | null = null;
if (typeof window !== 'undefined') {
    synth = window.speechSynthesis;
}

// --- State Management ---
interface TTSQueueState {
    segments: { text: string; lang: 'en' | 'bn' }[];
    currentIndex: number;
    isPlaying: boolean;
    isPaused: boolean; // Explicit flag for manual pause
    onComplete?: () => void;
    onError?: () => void;
    settings: VoiceSettings;
    utterance: SpeechSynthesisUtterance | null;
}

// Default empty state
let state: TTSQueueState = {
    segments: [],
    currentIndex: 0,
    isPlaying: false,
    isPaused: false,
    settings: { speed: 1, pitch: 1, persona: 'standard', voiceURI: null },
    utterance: null
};

// --- Helpers ---

const isBengali = (text: string) => /[\u0980-\u09FF]/.test(text);

/**
 * Removes Markdown symbols so the TTS reads naturally like a human.
 * e.g., "# Heading" becomes "Heading", "**Bold**" becomes "Bold".
 */
const cleanMarkdownForSpeech = (text: string): string => {
    return text
        // Remove code block delimiters but keep content (or remove entirely if preferred)
        // Here we keep content but remove backticks
        .replace(/```[\s\S]*?```/g, (m) => m.replace(/`/g, '')) 
        .replace(/`([^`]+)`/g, '$1') 
        
        // Remove Headers (#) but keep text
        .replace(/^#+\s+/gm, '') 
        
        // Remove Bold/Italic markers
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        
        // Remove Links: [text](url) -> text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        
        // Remove Images: ![alt](url) -> ignore
        .replace(/!\[.*?\]\(.*?\)/g, '')

        // Remove Blockquotes (>)
        .replace(/^>\s+/gm, '')
        
        // Remove List bullets (*, -, +) at start of lines
        .replace(/^[\*\-\+]\s+/gm, '')
        
        // Remove Horizontal Rules
        .replace(/^-{3,}/gm, '')
        
        // Remove stray hashtags that might be read as "Hashtag"
        .replace(/#/g, '')
        
        .trim();
};

/**
 * Splits text into natural sentences.
 * Treats Punctuation (. ! ?) and Newlines as breaks.
 */
const tokenizeText = (fullText: string): { text: string; lang: 'en' | 'bn' }[] => {
    // 1. Clean the text first
    const cleanText = cleanMarkdownForSpeech(fullText);

    // 2. Split by sentence terminators (. ! ? | danda) OR Newlines (\n)
    // We include \n in the split regex to ensure Headers/Paragraphs are treated as separate segments.
    // The capture group ( ) keeps the delimiter.
    const parts = cleanText.split(/([.|!|?|।|\n]+)/);
    
    const results: { text: string; lang: 'en' | 'bn' }[] = [];
    
    for (let i = 0; i < parts.length; i += 2) {
        let sentence = parts[i];
        const punctuation = parts[i+1] || ''; 
        
        sentence = sentence.trim();
        
        // Skip empty segments usually caused by double newlines
        if (!sentence) continue;

        // Determine if we should attach punctuation (for intonation) or if it was just a newline
        // If punct is a newline, we don't add it to the spoken text, but it caused the split.
        const fullSegment = punctuation.includes('\n') ? sentence : sentence + punctuation;

        if (fullSegment.trim()) {
            results.push({
                text: fullSegment.trim(),
                lang: isBengali(fullSegment) ? 'bn' : 'en'
            });
        }
    }

    return results;
};

const getVoice = (lang: 'en' | 'bn', persona: VoicePersona): SpeechSynthesisVoice | null => {
    if (!synth) return null;
    const voices = synth.getVoices();

    if (lang === 'bn') {
        // Bengali Priority
        const google = voices.find(v => v.lang.includes('bn') && v.name.includes('Google'));
        if (google) return google;
        const microsoft = voices.find(v => v.lang.includes('bn') && v.name.includes('Microsoft'));
        if (microsoft) return microsoft;
        return voices.find(v => v.lang.includes('bn')) || null;
    } else {
        // English Priority
        const enVoices = voices.filter(v => v.lang.startsWith('en'));
        
        if (persona === 'storyteller') {
             const male = enVoices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Daniel'));
             if (male) return male;
        }

        const priorities = ['Google US English', 'Google UK English Female', 'Microsoft Zira', 'Samantha'];
        for (const p of priorities) {
            const found = enVoices.find(v => v.name.includes(p));
            if (found) return found;
        }
        return enVoices[0] || null;
    }
};

// --- Core Playback Loop ---

const playNextSegment = () => {
    if (!synth) return;

    // Check if finished
    if (state.currentIndex >= state.segments.length) {
        state.isPlaying = false;
        state.isPaused = false;
        state.utterance = null;
        if (state.onComplete) state.onComplete();
        return;
    }

    const segment = state.segments[state.currentIndex];
    
    // Create Utterance
    const utterance = new SpeechSynthesisUtterance(segment.text);
    state.utterance = utterance;

    // 1. Select Voice
    const voice = getVoice(segment.lang, state.settings.persona);
    if (voice) {
        utterance.voice = voice;
    }

    // 2. Adjust Rate/Pitch
    let rate = state.settings.speed || 1.0;
    let pitch = state.settings.pitch || 1.0;

    if (segment.lang === 'en') {
        if (state.settings.persona === 'teacher') rate *= 0.95;
        if (state.settings.persona === 'storyteller') { rate *= 0.9; pitch *= 0.95; }
    } else {
        // Bengali engines are often naturally fast
        rate = Math.min(rate, 0.9);
    }

    utterance.rate = rate;
    utterance.pitch = pitch;

    // 3. Event Handlers
    utterance.onend = () => {
        // If manually paused, DO NOT advance index.
        if (state.isPaused) return;

        state.currentIndex++;
        state.utterance = null;
        
        // Small delay for natural flow
        setTimeout(() => {
            if (state.isPlaying && !state.isPaused) {
                playNextSegment();
            }
        }, 50);
    };

    utterance.onerror = (e) => {
        if (e.error === 'interrupted' || e.error === 'canceled') {
            return;
        }
        console.warn("TTS Segment Error:", e);
        // Skip bad segment if not paused
        if (!state.isPaused) {
            state.currentIndex++;
            playNextSegment();
        }
    };

    // 4. Speak
    try {
        // Clear anything in browser queue just in case
        synth.cancel(); 
        
        setTimeout(() => {
            if (state.isPlaying && !state.isPaused) {
                synth?.speak(utterance);
            }
        }, 10);

    } catch (err) {
        console.error("Synth Exception", err);
        if (state.onError) state.onError();
    }
};

// --- Public API ---

export const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
    return new Promise((resolve) => {
        if (!synth) { resolve([]); return; }
        const v = synth.getVoices();
        if (v.length) { resolve(v); return; }
        synth.onvoiceschanged = () => resolve(synth!.getVoices());
        setTimeout(() => resolve(synth!.getVoices()), 1000);
    });
};

export const speakText = async (
    text: string,
    settings: VoiceSettings,
    onComplete?: () => void,
    onError?: () => void
): Promise<boolean> => {
    stopSpeaking();

    if (!synth) {
        if (onError) onError();
        return false;
    }

    // Tokenize with Markdown cleaning
    const segments = tokenizeText(text);
    if (segments.length === 0) {
        if (onComplete) onComplete();
        return true;
    }

    // Initialize State
    state = {
        segments,
        currentIndex: 0,
        isPlaying: true,
        isPaused: false,
        settings,
        onComplete,
        onError,
        utterance: null
    };

    playNextSegment();
    return true;
};

export const stopSpeaking = () => {
    state.isPlaying = false;
    state.isPaused = false;
    state.currentIndex = 0;
    state.utterance = null;
    if (synth) synth.cancel();
};

export const pauseSpeaking = () => {
    if (state.isPlaying) {
        state.isPlaying = false; 
        state.isPaused = true;   
        // Cancel stops the current audio. 
        // Because isPaused=true, onend will fire but NOT increment index.
        // So Resume will restart the SAME segment.
        if (synth) synth.cancel(); 
    }
};

export const resumeSpeaking = () => {
    if (state.isPaused && state.segments.length > 0) {
        state.isPlaying = true;
        state.isPaused = false;
        // Resume from current index (replaying the sentence that was cut off)
        playNextSegment();
    }
};