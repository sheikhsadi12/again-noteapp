export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  attachment?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

export interface Command {
  id: string;
  name: string;
  instruction: string;
  isCustom: boolean;
  icon?: string;
}

export type VoicePersona = 'standard' | 'teacher' | 'storyteller' | 'poetic' | 'child_friendly';

export interface VoiceSettings {
  voiceURI: string | null;
  speed: number;
  pitch: number;
  persona: VoicePersona;
}

export interface TtsState {
  isSpeaking: boolean;
  isPaused: boolean;
}