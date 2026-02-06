
import React, { useState, useEffect } from 'react';
import { Note, AppSettings } from './types';
import * as Storage from './services/storage';
import * as Gemini from './services/gemini';
import { getThemeVariables } from './services/themeUtils';
import Sidebar from './components/Sidebar';
import NoteEditor from './components/NoteEditor';
import TeacherPanel from './components/TeacherPanel';
import SettingsModal from './components/SettingsModal';
import { Menu, FileText, Sparkles } from 'lucide-react';

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  // App Settings (Theme)
  const [appSettings, setAppSettings] = useState<AppSettings>(Storage.getAppSettings());
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Layout States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showTeacherPanel, setShowTeacherPanel] = useState(false);

  // Load notes on mount
  useEffect(() => {
    const loadedNotes = Storage.getNotes();
    setNotes(loadedNotes);
    if (loadedNotes.length > 0) {
      setCurrentNote(loadedNotes[0]);
    } else {
      handleNewNote();
    }
  }, []);

  // Save current note whenever it changes
  useEffect(() => {
    if (currentNote) {
      Storage.saveNote(currentNote);
      setNotes(prev => prev.map(n => n.id === currentNote.id ? currentNote : n));
    }
  }, [currentNote]);

  // Save Settings when changed
  useEffect(() => {
    Storage.saveAppSettings(appSettings);
  }, [appSettings]);

  const handleNewNote = () => {
    const newNote = Storage.createNewNote();
    setNotes([newNote, ...notes]);
    setCurrentNote(newNote);
    setIsSidebarOpen(false); 
  };

  const handleDeleteNote = (id: string) => {
    Storage.deleteNote(id);
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    if (currentNote?.id === id) {
      setCurrentNote(updatedNotes.length > 0 ? updatedNotes[0] : null);
    }
  };

  const handleUpdateContent = (content: string) => {
    if (currentNote) {
      setCurrentNote({ ...currentNote, content });
    }
  };

  const handleUpdateTitle = (title: string) => {
    if (currentNote) {
      setCurrentNote({ ...currentNote, title });
    }
  };

  const handleSendMessage = async (text: string, instruction: string, image?: string) => {
    if (!currentNote) return;

    if (text === "CLEAR_SELECTION_INTERNAL_HACK") {
        setSelectedText('');
        return;
    }

    const newUserMsg: any = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachment: image 
    };

    const updatedMessages = [...currentNote.messages, newUserMsg];
    setCurrentNote({ ...currentNote, messages: updatedMessages });
    setIsLoadingAI(true);
    setSelectedText('');
    
    // Ensure panel is open when sending a message
    setShowTeacherPanel(true);

    const aiResponseText = await Gemini.generateTeacherResponse(text, instruction, undefined, image);

    const newAiMsg: any = {
      id: crypto.randomUUID(),
      role: 'model',
      content: aiResponseText,
      timestamp: Date.now()
    };

    setCurrentNote(prev => prev ? {
      ...prev,
      messages: [...updatedMessages, newAiMsg]
    } : null);
    
    setIsLoadingAI(false);
  };

  if (!currentNote && notes.length === 0) {
     return <div className="h-screen flex items-center justify-center bg-slate-900 text-[var(--primary-500)]" style={getThemeVariables(appSettings.themeColor)}>Initializing AI...</div>;
  }
  
  return (
    <div className={`${appSettings.themeMode === 'dark' ? 'dark' : ''}`} style={getThemeVariables(appSettings.themeColor)}>
      {/* Main App Container - Uses different shades for depth */}
      <div className="flex h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-300">
        
        {/* Settings Modal */}
        {showSettingsModal && (
            <SettingsModal 
                settings={appSettings} 
                onUpdate={setAppSettings} 
                onClose={() => setShowSettingsModal(false)} 
            />
        )}

        {/* 1. Notes Sidebar (Left) */}
        <Sidebar 
          notes={notes}
          currentNoteId={currentNote?.id || ''}
          onSelectNote={setCurrentNote}
          onNewNote={handleNewNote}
          onDeleteNote={handleDeleteNote}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          onOpenSettings={() => setShowSettingsModal(true)}
        />

        <div className="flex-1 flex flex-col h-full relative">
          
          {/* 2. Top Header - Subtle separation */}
          <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 shadow-sm z-10 shrink-0 transition-colors">
              <div className="flex items-center min-w-0">
                  <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-slate-600 dark:text-slate-400 mr-4 shrink-0 hover:text-slate-900 dark:hover:text-slate-200">
                      <Menu />
                  </button>
                  <div className="flex items-center text-slate-800 dark:text-slate-100 font-bold text-lg truncate">
                      <FileText className="text-[var(--primary-500)] mr-2 shrink-0 transition-colors" size={20}/>
                      <span className="truncate">{currentNote?.title}</span>
                  </div>
              </div>
              
              {/* AI Toggle Icon */}
              <button 
                  onClick={() => setShowTeacherPanel(!showTeacherPanel)}
                  className={`p-2 rounded-full transition-all duration-200
                      ${showTeacherPanel 
                        ? 'bg-[var(--primary-50)] text-[var(--primary-600)] dark:bg-[var(--primary-900)]/30 dark:text-[var(--primary-400)] shadow-sm' 
                        : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}
                  `}
                  title="Toggle AI Teacher"
              >
                  <Sparkles size={20} />
              </button>
          </div>

          {/* 3. Main Workspace */}
          <div className="flex-1 flex overflow-hidden relative">
              
              {/* Editor Area - Slightly darker in dark mode than sidebar for focus */}
              <div className={`
                  flex-1 h-full bg-slate-50 dark:bg-slate-950 transition-all duration-300 ease-in-out overflow-hidden
                  ${showTeacherPanel ? 'hidden md:block' : 'block'}
              `}>
                 {currentNote && (
                   <NoteEditor 
                     title={currentNote.title}
                     content={currentNote.content}
                     onChangeTitle={handleUpdateTitle}
                     onChangeContent={handleUpdateContent}
                     onTextSelect={setSelectedText}
                   />
                 )}
              </div>

              {/* AI Teacher Panel - distinct background for separation */}
              {showTeacherPanel && (
                  <div className="w-full md:w-[400px] lg:w-[450px] flex flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-20 shadow-xl animate-in slide-in-from-right-10 duration-200 absolute inset-0 md:relative">
                      {currentNote && (
                          <TeacherPanel 
                              currentNote={currentNote}
                              onSendMessage={handleSendMessage}
                              selectedText={selectedText}
                              isLoading={isLoadingAI}
                          />
                      )}
                  </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
