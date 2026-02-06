
import { Note, Command, VoiceSettings, VoicePersona, AppSettings } from '../types';

const STORAGE_KEY = 'smart_teacher_notes';
const COMMANDS_KEY = 'smart_teacher_commands';
const SETTINGS_KEY = 'smart_teacher_settings';
const APP_SETTINGS_KEY = 'smart_teacher_app_settings';

// --- Notes Storage ---

export const getNotes = (): Note[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading notes:', error);
    return [];
  }
};

export const saveNote = (note: Note): void => {
  const notes = getNotes();
  const index = notes.findIndex((n) => n.id === note.id);
  
  if (index >= 0) {
    notes[index] = { ...note, updatedAt: Date.now() };
  } else {
    notes.unshift({ ...note, updatedAt: Date.now() });
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
};

export const deleteNote = (id: string): void => {
  const notes = getNotes().filter((n) => n.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
};

export const createNewNote = (): Note => {
  return {
    id: crypto.randomUUID(),
    title: 'Untitled Note',
    content: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: []
  };
};

// --- Commands Storage ---

const DEFAULT_COMMANDS: Command[] = [
  { 
    id: 'cmd_eng_ban', 
    name: 'English + Bangla', 
    instruction: 'Read the English text, then explain it clearly in Bangla. Break down difficult words. Format: [Reading] -> [Explanation]', 
    isCustom: false, 
    icon: 'Languages' 
  },
  { 
    id: 'cmd_story', 
    name: 'Bangla Story', 
    instruction: 'Rewrite/Present the text with a storytelling tone (শিক্ষকের ভঙ্গিতে). Use formatting like *italics* for emphasis. Use commas and ellipses (...) to indicate pauses naturally, do not use explicit [PAUSE] tags.', 
    isCustom: false, 
    icon: 'BookOpen' 
  },
  { 
    id: 'cmd_poem', 
    name: 'Poem Analysis', 
    instruction: 'Analyze the poem. 1. Recite line by line. 2. Explain meaning in Bangla. 3. Summarize the theme.', 
    isCustom: false, 
    icon: 'Feather' 
  },
  { 
    id: 'cmd_grammar', 
    name: 'Grammar Rules', 
    instruction: 'Analyze the grammar. List verbs, tense, and sentence structure rules used in the text.', 
    isCustom: false, 
    icon: 'Sparkles' 
  },
];

export const getCommands = (): Command[] => {
  try {
    const stored = localStorage.getItem(COMMANDS_KEY);
    const customCommands = stored ? JSON.parse(stored) : [];
    return [...DEFAULT_COMMANDS, ...customCommands];
  } catch (error) {
    return DEFAULT_COMMANDS;
  }
};

export const saveCustomCommand = (command: Command): void => {
  try {
    const stored = localStorage.getItem(COMMANDS_KEY);
    const customCommands: Command[] = stored ? JSON.parse(stored) : [];
    customCommands.push(command);
    localStorage.setItem(COMMANDS_KEY, JSON.stringify(customCommands));
  } catch (error) {
    console.error("Error saving command", error);
  }
};

export const deleteCustomCommand = (id: string): void => {
    try {
        const stored = localStorage.getItem(COMMANDS_KEY);
        if (!stored) return;
        let customCommands: Command[] = JSON.parse(stored);
        customCommands = customCommands.filter(c => c.id !== id);
        localStorage.setItem(COMMANDS_KEY, JSON.stringify(customCommands));
    } catch (error) {
        console.error("Error deleting command", error);
    }
};

// --- Settings Storage ---

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  voiceURI: null,
  speed: 1.0,
  pitch: 1.0,
  persona: 'standard'
};

export const getSettings = (): VoiceSettings => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : DEFAULT_VOICE_SETTINGS;
  } catch {
    return DEFAULT_VOICE_SETTINGS;
  }
};

export const saveSettings = (settings: VoiceSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

const DEFAULT_APP_SETTINGS: AppSettings = {
    themeMode: 'light',
    themeColor: 'emerald'
};

export const getAppSettings = (): AppSettings => {
    try {
        const data = localStorage.getItem(APP_SETTINGS_KEY);
        return data ? JSON.parse(data) : DEFAULT_APP_SETTINGS;
    } catch {
        return DEFAULT_APP_SETTINGS;
    }
}

export const saveAppSettings = (settings: AppSettings) => {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
}
