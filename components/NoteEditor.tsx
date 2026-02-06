
import React, { useState, useEffect } from 'react';
import { Volume2, Square } from 'lucide-react';
import { speakText, stopSpeaking } from '../services/tts';
import * as Storage from '../services/storage';

interface NoteEditorProps {
  title: string;
  content: string;
  onChangeTitle: (title: string) => void;
  onChangeContent: (content: string) => void;
  onTextSelect: (text: string) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  title,
  content,
  onChangeTitle,
  onChangeContent,
  onTextSelect
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        if (isSpeaking) stopSpeaking();
    };
  }, [isSpeaking]);

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const selected = target.value.substring(target.selectionStart, target.selectionEnd);
    if (selected.trim().length > 0) {
      onTextSelect(selected);
    }
  };

  const handleToggleSpeak = async () => {
      if (isSpeaking) {
          stopSpeaking();
          setIsSpeaking(false);
      } else {
          if (!content.trim()) return;
          
          const settings = Storage.getSettings();
          
          const started = await speakText(
              content, 
              settings, 
              () => setIsSpeaking(false), // On Complete
              () => setIsSpeaking(false)  // On Error
          );

          if (started) {
              setIsSpeaking(true);
          }
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between">
            <input
            type="text"
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="Note Title..."
            className="w-full text-3xl font-bold text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-700 border-none outline-none bg-transparent mr-4"
            />
            
            <button
                onClick={handleToggleSpeak}
                className={`
                    p-2 rounded-full transition-all flex-shrink-0
                    ${isSpeaking 
                        ? 'bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400' 
                        : 'bg-[var(--primary-50)] text-[var(--primary-600)] hover:bg-[var(--primary-100)] dark:bg-[var(--primary-900)]/20 dark:text-[var(--primary-400)] dark:hover:bg-[var(--primary-900)]/40'}
                `}
                title={isSpeaking ? "Stop Reading" : "Read Aloud"}
            >
                {isSpeaking ? <Square size={20} fill="currentColor" /> : <Volume2 size={20} />}
            </button>
        </div>
        <div className="h-px bg-slate-200 dark:bg-slate-800 mt-4 w-full" />
      </div>
      
      <div className="flex-1 p-6 pt-2 overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => onChangeContent(e.target.value)}
          onSelect={handleSelect}
          placeholder="Start writing here... Select text to ask the AI Teacher."
          className="w-full h-full resize-none border-none outline-none text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-serif bg-transparent placeholder-slate-400 dark:placeholder-slate-700 selection:bg-[var(--primary-200)] dark:selection:bg-[var(--primary-900)]"
        />
      </div>
    </div>
  );
};

export default NoteEditor;
