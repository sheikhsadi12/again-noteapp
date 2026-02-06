
import React, { useState, useEffect } from 'react';
import { Command, VoiceSettings, Note } from '../types';
import { Sparkles, Download, ChevronDown, Settings } from 'lucide-react';
import { speakText, stopSpeaking, pauseSpeaking, resumeSpeaking, loadVoices } from '../services/tts';
import * as Storage from '../services/storage';
import * as ExportService from '../services/export';

// Feature Components
import MessageList from './chat/MessageList';
import InputArea from './chat/InputArea';
import CommandBar from './chat/CommandBar';
import VoiceSettingsPanel from './chat/VoiceSettingsPanel';
import AudioControlBar from './chat/AudioControlBar';

interface TeacherPanelProps {
  currentNote: Note;
  onSendMessage: (text: string, instruction: string, image?: string) => void;
  selectedText: string;
  isLoading: boolean;
  onClearChat?: () => void;
}

const TeacherPanel: React.FC<TeacherPanelProps> = ({
  currentNote,
  onSendMessage,
  selectedText,
  isLoading,
  onClearChat
}) => {
  const { messages } = currentNote;
  
  // Input State
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  
  // Command State
  const [commands, setCommands] = useState<Command[]>([]);
  
  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  
  // Settings & Voice
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(Storage.getSettings());
  const [showSettings, setShowSettings] = useState(false);
  
  // Export Menu
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Initialize
  useEffect(() => {
    loadCommands();
    loadVoices(); // Preload voices
    return () => stopSpeaking();
  }, []);

  // Save settings & stop audio when settings change
  useEffect(() => {
    Storage.saveSettings(voiceSettings);
    if (isSpeaking || isPaused) {
        handleStopAudio();
    }
  }, [voiceSettings]);

  const loadCommands = () => {
    setCommands(Storage.getCommands());
  };

  // --- Handlers ---

  const handleSend = () => {
    if ((!input.trim() && !attachedImage) && !selectedText) return;
    
    const defaultInstruction = attachedImage 
        ? "Analyze the provided image. If it contains math problems, solve them step-by-step. If it contains text, summarize or translate it."
        : "Answer the user's question clearly and helpfully.";
        
    const textToSend = input;
    const context = selectedText ? `Context: "${selectedText}"` : "";
    const fullText = context ? `${textToSend}\n${context}` : textToSend;
    
    onSendMessage(fullText, defaultInstruction, attachedImage || undefined);
    setInput('');
    setAttachedImage(null);
  };

  const handleCommandClick = (command: Command) => {
    const text = selectedText || input;
    if (!text && !attachedImage) {
        onSendMessage("How can I help you today? Please select some text, upload an image, or type a question.", command.instruction);
        return;
    }
    onSendMessage(text, command.instruction, attachedImage || undefined);
    setInput(''); 
    setAttachedImage(null);
  };

  const handleSpeak = async (text: string, msgId: string) => {
    if (loadingAudioId === msgId) return;

    if (playingMsgId === msgId) { 
        handlePauseResumeAudio();
        return;
    } 

    handleStopAudio(); 
    
    if (!text) return;

    setLoadingAudioId(msgId);
    
    const started = await speakText(
        text, 
        voiceSettings, 
        () => {
            setIsSpeaking(false);
            setIsPaused(false);
            setLoadingAudioId(null);
            setPlayingMsgId(null);
        },
        () => {
            setIsSpeaking(false);
            setLoadingAudioId(null);
            setPlayingMsgId(null);
            alert("Audio unavailable. Please try again.");
        }
    );
    
    if (started) {
        setIsSpeaking(true);
        setIsPaused(false);
        setPlayingMsgId(msgId);
        setLoadingAudioId(null);
    } else {
        setLoadingAudioId(null);
    }
  };

  const handleStopAudio = () => {
      stopSpeaking();
      setIsSpeaking(false);
      setIsPaused(false);
      setLoadingAudioId(null);
      setPlayingMsgId(null);
  };

  const handlePauseResumeAudio = () => {
      if (isPaused) {
          resumeSpeaking();
          setIsPaused(false);
          setIsSpeaking(true);
      } else {
          pauseSpeaking();
          setIsPaused(true);
      }
  };

  const handleShare = async (text: string) => {
      if (navigator.share) {
          try {
              await navigator.share({ title: 'AI Teacher Response', text: text });
          } catch (error) { console.log('Error sharing:', error); }
      } else {
          ExportService.copyToClipboard(text);
          alert('Content copied to clipboard!');
      }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 font-sans z-20 relative transition-colors">
      
      {/* 1. Header & Controls */}
      <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-100 font-extrabold tracking-tight">
          <div className="bg-[var(--primary-100)] dark:bg-[var(--primary-900)]/30 p-1.5 rounded-lg">
            <Sparkles className="text-[var(--primary-600)] dark:text-[var(--primary-400)]" size={18} />
          </div>
          <span>AI Teacher</span>
        </div>
        
        <div className="flex items-center space-x-2 relative">
           {/* Export Dropdown */}
           <div className="relative">
             <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[var(--primary-50)] text-[var(--primary-700)] hover:bg-[var(--primary-100)] border border-[var(--primary-100)] dark:bg-[var(--primary-900)]/20 dark:text-[var(--primary-300)] dark:border-[var(--primary-800)] transition-all text-xs font-bold"
                  title="Export Options"
             >
                  <Download size={14} /> <span>Export</span> <ChevronDown size={12} />
             </button>
             
             {showExportMenu && (
               <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                 <button 
                    onClick={() => { ExportService.exportChatToDoc(currentNote); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-[var(--primary-50)] dark:hover:bg-[var(--primary-900)]/30 hover:text-[var(--primary-700)] block"
                 >
                    Download All (DOCX)
                 </button>
                 <button 
                    onClick={() => { ExportService.printChat(currentNote); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-[var(--primary-50)] dark:hover:bg-[var(--primary-900)]/30 hover:text-[var(--primary-700)] block border-t border-slate-50 dark:border-slate-700"
                 >
                    Print All (PDF)
                 </button>
               </div>
             )}
           </div>

           {/* Voice Settings Button */}
           <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700'}`}
                title="Voice Settings"
           >
                <Settings size={18} />
           </button>
        </div>
      </div>

      {/* Voice Settings Panel */}
      {showSettings && (
          <VoiceSettingsPanel 
            settings={voiceSettings} 
            onUpdate={setVoiceSettings} 
            onClose={() => setShowSettings(false)}
          />
      )}

      {/* 2. Chat Area - MessageList handles its own background */}
      <MessageList 
        messages={messages}
        isLoading={isLoading}
        playingMsgId={playingMsgId}
        loadingAudioId={loadingAudioId}
        isPaused={isPaused}
        onSpeak={handleSpeak}
        onCopy={ExportService.copyToClipboard}
        onExport={ExportService.exportMessageToDoc}
        onPrint={ExportService.printMessage}
        onShare={handleShare}
      />

      {/* 3. Global Audio Control Bar (Overlay) */}
      <AudioControlBar 
        isSpeaking={isSpeaking}
        isPaused={isPaused}
        loadingAudioId={loadingAudioId}
        onPauseResume={handlePauseResumeAudio}
        onStop={handleStopAudio}
      />

      {/* 4. Command Bar & Input Area */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 z-30 shrink-0 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.02)]">
         <CommandBar 
            commands={commands} 
            onCommandClick={handleCommandClick} 
            onCommandsUpdated={loadCommands}
         />
         <InputArea 
            input={input}
            setInput={setInput}
            attachedImage={attachedImage}
            setAttachedImage={setAttachedImage}
            onSend={handleSend}
            isLoading={isLoading}
            selectedText={selectedText}
            onClearSelection={() => onSendMessage("CLEAR_SELECTION_INTERNAL_HACK", "", undefined)}
         />
      </div>
    </div>
  );
};

export default TeacherPanel;
