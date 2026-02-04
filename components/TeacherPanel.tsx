import React, { useState, useRef, useEffect } from 'react';
import { Command, VoiceSettings, VoicePersona, Note } from '../types';
import { 
  Send, Volume2, Square, Mic, BookOpen, GraduationCap, 
  Languages, Feather, Sparkles, Plus, Play, Pause, X,
  Copy, Download, ChevronDown, Settings, Smile, FileText, Printer, Share2, Loader2, Image as ImageIcon, Paperclip
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { speakText, stopSpeaking, pauseSpeaking, resumeSpeaking, loadVoices } from '../services/tts';
import * as Storage from '../services/storage';
import * as ExportService from '../services/export';

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
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [commands, setCommands] = useState<Command[]>([]);
  
  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  
  // Settings & Voice
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(Storage.getSettings());
  const [showSettings, setShowSettings] = useState(false);
  
  // Export Menu
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Custom Command Form
  const [showAddCommand, setShowAddCommand] = useState(false);
  const [newCmdName, setNewCmdName] = useState('');
  const [newCmdInstruction, setNewCmdInstruction] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize
  useEffect(() => {
    loadCommands();
    loadVoices().then(setAvailableVoices);
    
    // Cleanup audio on unmount
    return () => {
        stopSpeaking();
    };
  }, []);

  // Save voice settings when changed and STOP speaking to allow new settings to take effect
  useEffect(() => {
    Storage.saveSettings(voiceSettings);
    if (isSpeaking || isPaused) {
        handleStop();
    }
  }, [voiceSettings]);

  const loadCommands = () => {
    setCommands(Storage.getCommands());
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSendChat = () => {
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
    // Reset height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleCommandClick = (command: Command) => {
    const text = selectedText || input;
    if (!text && !attachedImage) {
        onSendMessage("How can I help you today? Please select some text, upload an image, or type a question.", command.instruction);
        return;
    }
    // If command is clicked, we send immediately with that command's instruction
    onSendMessage(text, command.instruction, attachedImage || undefined);
    setInput(''); 
    setAttachedImage(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setAttachedImage(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveCustomCommand = () => {
    if (!newCmdName.trim() || !newCmdInstruction.trim()) return;
    const newCmd: Command = {
      id: `custom_${Date.now()}`,
      name: newCmdName,
      instruction: newCmdInstruction,
      isCustom: true,
      icon: 'Star'
    };
    Storage.saveCustomCommand(newCmd);
    loadCommands();
    setShowAddCommand(false);
    setNewCmdName('');
    setNewCmdInstruction('');
  };

  const cleanTextForSpeech = (text: string): string => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Bold to normal
        .replace(/\*(.*?)\*/g, '$1')     // Italic to normal
        .replace(/`([^`]+)`/g, '$1')     // Code to normal
        .replace(/#+\s/g, '')            // Remove Headers
        .replace(/\[.*?\]/g, '')         // Remove things like [Explanation]
        .replace(/\$\$.*?\$\$/g, ' equation ') // Remove complex latex block
        .replace(/\$.*?\$/g, ' equation ')     // Remove inline latex
        .replace(/[\|_~]/g, ' ')         // Remove other markdown symbols
        .replace(/\n\s*\n/g, '. ');      // Double newlines to pauses
  };

  const handleSpeak = async (text: string, msgId: string) => {
    // 1. If currently loading this message, ignore click
    if (loadingAudioId === msgId) return;

    // 2. If clicking the SAME message that is already playing, toggle pause
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
    
    // 3. Switching to a new message: Stop previous
    // NOTE: We do not call stopSpeaking() here immediately because speakText() does it.
    // However, for UI state sanity, we reset UI state.
    
    setIsSpeaking(false);
    setIsPaused(false);
    setPlayingMsgId(null);
    
    // 4. Start loading new message
    setLoadingAudioId(msgId);
    
    const cleanText = cleanTextForSpeech(text);

    // Pass the CURRENT voiceSettings.
    const started = await speakText(
        cleanText, 
        voiceSettings, 
        () => {
            // On End
            setIsSpeaking(false);
            setIsPaused(false);
            setLoadingAudioId(null);
            setPlayingMsgId(null);
        },
        () => {
            // On Error
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
        // Failed to start
        if (loadingAudioId === msgId) {
             setLoadingAudioId(null);
        }
    }
  };

  const handleStop = () => {
      stopSpeaking();
      setIsSpeaking(false);
      setIsPaused(false);
      setLoadingAudioId(null);
      setPlayingMsgId(null);
  };

  const handleCopy = (text: string) => {
      ExportService.copyToClipboard(text);
  };
  
  const handleShare = async (text: string) => {
      if (navigator.share) {
          try {
              await navigator.share({
                  title: 'AI Teacher Response',
                  text: text,
              });
          } catch (error) {
              console.log('Error sharing:', error);
          }
      } else {
          handleCopy(text);
          alert('Content copied to clipboard!');
      }
  };

  const getIcon = (iconName?: string) => {
      switch(iconName) {
          case 'Languages': return Languages;
          case 'BookOpen': return BookOpen;
          case 'Feather': return Feather;
          case 'Sparkles': return Sparkles;
          default: return GraduationCap;
      }
  };

  // UI Components
  const PersonaButton = ({ p, label, icon: Icon }: { p: VoicePersona, label: string, icon: any }) => (
    <button 
        onClick={() => setVoiceSettings(prev => ({ ...prev, persona: p }))}
        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
            voiceSettings.persona === p 
            ? 'bg-emerald-100 border-emerald-500 text-emerald-800' 
            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
        }`}
    >
        <Icon size={20} className="mb-1" />
        <span className="text-[10px] font-bold uppercase">{label}</span>
    </button>
  );
  
  const MessageAction = ({ onClick, icon: Icon, label, isLoading, isActive }: { onClick: () => void, icon: any, label?: string, isLoading?: boolean, isActive?: boolean }) => (
      <button 
        onClick={onClick} 
        disabled={isLoading}
        className={`px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium disabled:opacity-50
            ${isActive 
                ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500' 
                : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'}
        `}
        title={label}
      >
        {isLoading ? <Loader2 size={14} className="animate-spin text-emerald-600" /> : <Icon size={14} />}
        {label && <span>{label}</span>}
      </button>
  );

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
          <div className="bg-slate-100 border-b border-slate-200 p-4 animate-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Voice Engine Configuration</h4>
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
            </div>
            
            <div className="grid grid-cols-5 gap-2 mb-4">
                <PersonaButton p="standard" label="Standard" icon={Mic} />
                <PersonaButton p="teacher" label="Teacher" icon={GraduationCap} />
                <PersonaButton p="storyteller" label="Story" icon={BookOpen} />
                <PersonaButton p="poetic" label="Poet" icon={Feather} />
                <PersonaButton p="child_friendly" label="Kid" icon={Smile} />
            </div>

            <div className="space-y-3">
                <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold w-12">Speed:</span>
                    <input 
                        type="range" min="0.5" max="2" step="0.1"
                        value={voiceSettings.speed}
                        onChange={(e) => setVoiceSettings(prev => ({...prev, speed: parseFloat(e.target.value)}))}
                        className="flex-1 accent-emerald-600 h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs w-8 text-right">{voiceSettings.speed}x</span>
                </div>
            </div>
          </div>
      )}

      {/* 2. Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-6 bg-gradient-to-b from-slate-50 to-white">
        {messages.length === 0 && (
            <div className="text-center text-slate-400 mt-10">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen size={24} className="text-emerald-300" />
                </div>
                <p className="font-medium text-slate-500">How can I help you learn?</p>
                <p className="text-sm mt-1">Select text, upload a math problem, or ask a question.</p>
            </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            
            {/* Message Bubble */}
            <div className={`
                max-w-[95%] rounded-2xl px-5 py-4 shadow-sm relative transition-all duration-200
                ${msg.role === 'user' 
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none hover:shadow-md'}
              `}
            >
              {/* Show Attachment if exists */}
              {msg.attachment && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
                      <img src={msg.attachment} alt="User upload" className="max-w-full max-h-60 object-contain bg-black/10" />
                  </div>
              )}

              <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-strong:text-current">
                {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                ) : (
                    <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                    >
                        {msg.content}
                    </ReactMarkdown>
                )}
              </div>
            </div>

            {/* Toolbar - Placed BELOW message */}
            {msg.role === 'model' && (
                <div className="flex flex-wrap items-center gap-1 mt-2 ml-2 pt-1 border-t border-slate-50/0 hover:border-slate-100 transition-all opacity-80 hover:opacity-100">
                    <MessageAction 
                        onClick={() => handleSpeak(msg.content, msg.id)} 
                        icon={loadingAudioId === msg.id ? Loader2 : Volume2} 
                        label={playingMsgId === msg.id ? (isPaused ? "Resume" : "Playing") : (loadingAudioId === msg.id ? "Loading..." : "Speak")} 
                        isLoading={loadingAudioId === msg.id}
                        isActive={playingMsgId === msg.id}
                    />
                    <MessageAction onClick={() => handleCopy(msg.content)} icon={Copy} label="Copy" />
                    <div className="w-px h-3 bg-slate-300 mx-2"></div>
                    <MessageAction onClick={() => ExportService.exportMessageToDoc(msg.content)} icon={FileText} label="Doc" />
                    <MessageAction onClick={() => ExportService.printMessage(msg.content)} icon={Printer} label="PDF" />
                    <MessageAction onClick={() => handleShare(msg.content)} icon={Share2} label="Share" />
                </div>
            )}
          </div>
        ))}

        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center space-x-2">
                    <span className="text-xs font-bold text-emerald-600 animate-pulse">Thinking...</span>
                    <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Global Audio Control Bar (Overlay) */}
      {(isSpeaking || isPaused || loadingAudioId) && (
          <div className="absolute bottom-14 left-0 right-0 mx-4 mb-2 bg-emerald-900/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-bold shadow-2xl animate-in slide-in-from-bottom-5 z-40">
               <div className="flex items-center space-x-3">
                   {loadingAudioId ? (
                       <>
                        <Loader2 className="animate-spin text-emerald-300" size={16} />
                        <span className="text-emerald-50">Connecting AI Voice...</span>
                       </>
                   ) : (
                       <>
                        <div className="flex space-x-1 items-end h-4">
                            {!isPaused && (
                                <>
                                <div className="w-1 bg-emerald-400 animate-[bounce_1s_infinite] h-2"></div>
                                <div className="w-1 bg-emerald-400 animate-[bounce_1.2s_infinite] h-4"></div>
                                <div className="w-1 bg-emerald-400 animate-[bounce_0.8s_infinite] h-3"></div>
                                </>
                            )}
                            {isPaused && <div className="w-3 h-3 bg-amber-400 rounded-sm"></div>}
                        </div>
                        <span className="text-emerald-50 tracking-wide">{isPaused ? "Playback Paused" : "AI Teacher Speaking"}</span>
                       </>
                   )}
               </div>
               <div className="flex items-center space-x-2">
                   {!loadingAudioId && (
                       <button 
                         onClick={() => { if(isPaused) resumeSpeaking(); else pauseSpeaking(); setIsPaused(!isPaused); }} 
                         className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"
                       >
                            {isPaused ? <Play size={16} fill="currentColor"/> : <Pause size={16} fill="currentColor"/>}
                       </button>
                   )}
                   <button 
                     onClick={handleStop} 
                     className="p-2 bg-white/10 rounded-full hover:bg-red-500/80 transition-all text-white"
                   >
                        <Square size={16} fill="currentColor"/>
                   </button>
               </div>
          </div>
      )}

      {/* 4. Command Input Area */}
      <div className="bg-white border-t border-slate-200 z-30 shrink-0 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]">
        
        {/* Selected Text Indicator */}
        {selectedText && (
            <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs border-b border-emerald-100 flex justify-between items-center">
                <span className="truncate max-w-[240px] font-medium opacity-90">"{selectedText.substring(0, 40)}..."</span>
                <button onClick={() => onSendMessage("CLEAR_SELECTION_INTERNAL_HACK", "", undefined)} className="text-emerald-500 hover:text-emerald-700 p-1"><X size={12}/></button>
            </div>
        )}

        {/* Image Preview */}
        {attachedImage && (
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-start gap-3">
                <div className="relative group">
                    <img src={attachedImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-300 shadow-sm" />
                    <button 
                        onClick={() => setAttachedImage(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600"
                    >
                        <X size={12} />
                    </button>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                    <p className="font-semibold text-slate-700">Image attached</p>
                    <p>AI will analyze this image.</p>
                </div>
            </div>
        )}

        {/* Commands Scroll */}
        <div className="p-2 overflow-x-auto no-scrollbar">
            <div className="flex space-x-2">
                {commands.map((cmd) => {
                    const Icon = getIcon(cmd.icon);
                    return (
                        <button
                            key={cmd.id}
                            onClick={() => handleCommandClick(cmd)}
                            className={`
                                flex-shrink-0 flex items-center space-x-1 px-3 py-1.5 rounded-lg border shadow-sm text-[11px] font-bold transition-all transform active:scale-95
                                ${cmd.isCustom 
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-700'}
                            `}
                        >
                            <Icon size={12} />
                            <span>{cmd.name}</span>
                        </button>
                    );
                })}
                <button
                    onClick={() => setShowAddCommand(true)}
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                >
                    <Plus size={14} />
                </button>
            </div>
        </div>

        {/* Text Input Area */}
        <div className="p-3 pt-0 flex items-end space-x-2">
            
            {/* File Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileSelect}
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="mb-1 p-2 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-colors"
                title="Upload Image"
            >
                <ImageIcon size={20} />
            </button>

            <div className="flex-1 relative bg-slate-100 rounded-2xl focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={selectedText ? "Ask about selected..." : "Type here... (Enter for new line)"}
                    rows={1}
                    className="w-full bg-transparent text-slate-800 rounded-2xl pl-4 pr-4 py-3 text-sm focus:outline-none resize-none max-h-32"
                    style={{ minHeight: '44px' }}
                />
            </div>
            
            <button
                onClick={handleSendChat}
                disabled={(!input && !selectedText && !attachedImage) || isLoading}
                className="mb-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white p-3 rounded-full shadow-lg transform transition-transform active:scale-90 flex-shrink-0"
            >
                <Send size={18} />
            </button>
        </div>
      </div>

      {/* Add Custom Command Modal */}
      {showAddCommand && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <Sparkles className="text-emerald-500"/> Custom Command
                    </h3>
                    <button onClick={() => setShowAddCommand(false)} className="bg-slate-100 p-1 rounded-full text-slate-500 hover:bg-slate-200">
                        <X size={16} />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Label</label>
                        <input 
                            value={newCmdName}
                            onChange={e => setNewCmdName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                            placeholder="e.g. Simplify"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">AI Instruction</label>
                        <textarea 
                            value={newCmdInstruction}
                            onChange={e => setNewCmdInstruction(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                            placeholder="e.g. Rewrite this text in simple words..."
                        />
                    </div>
                    <button 
                        onClick={handleSaveCustomCommand}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all mt-2"
                    >
                        Save Command
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TeacherPanel;