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

  const cleanTextForSpeech = (text: string): string => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/#+\s/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\$\$.*?\$\$/g, ' equation ')
        .replace(/\$.*?\$/g, ' equation ')
        .replace(/[\|_~]/g, ' ')
        .replace(/\n\s*\n/g, '. ');
  };

  const handleSpeak = async (text: string, msgId: string) => {
    if (loadingAudioId === msgId) return;

    if (playingMsgId === msgId) { 
        if (isPaused) {
            resumeSpeaking();
            setIsPaused(false);
        } else {
            pauseSpeaking();
            setIsPaused(true);
        }
        return;
    } 

    if (!text) return;
    
    setIsSpeaking(false);
    setIsPaused(false);
    setPlayingMsgId(null);
    setLoadingAudioId(msgId);
    
    const cleanText = cleanTextForSpeech(text);

    const started = await speakText(
        cleanText, 
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
        if (loadingAudioId === msgId) setLoadingAudioId(null);
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
      if(isPaused) resumeSpeaking(); else pauseSpeaking();
      setIsPaused(!isPaused);
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
    <div className="flex flex-col h-full bg-slate-50 font-sans shadow-inner z-20 relative">
      
      {/* 1. Header & Controls */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 text-slate-800 font-extrabold tracking-tight">
          <div className="bg-emerald-100 p-1.5 rounded-lg">
            <Sparkles className="text-emerald-600" size={18} />
          </div>
          <span>AI Teacher</span>
        </div>
        
        <div className="flex items-center space-x-2 relative">
           {/* Export Dropdown */}
           <div className="relative">
             <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 transition-all text-xs font-bold"
                  title="Export Options"
             >
                  <Download size={14} /> <span>Export</span> <ChevronDown size={12} />
             </button>
             
             {showExportMenu && (
               <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                 <button 
                    onClick={() => { ExportService.exportChatToDoc(currentNote); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 block"
                 >
                    Download All (DOCX)
                 </button>
                 <button 
                    onClick={() => { ExportService.printChat(currentNote); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 block border-t border-slate-50"
                 >
                    Print All (PDF)
                 </button>
               </div>
             )}
           </div>

           {/* Voice Settings Button */}
           <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:bg-slate-100'}`}
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

      {/* 2. Chat Area */}
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
      <div className="bg-white border-t border-slate-200 z-30 shrink-0 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]">
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