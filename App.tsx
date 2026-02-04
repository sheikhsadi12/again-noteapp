import React, { useState, useEffect } from 'react';
import { Note } from './types';
import * as Storage from './services/storage';
import * as Gemini from './services/gemini';
import Sidebar from './components/Sidebar';
import NoteEditor from './components/NoteEditor';
import TeacherPanel from './components/TeacherPanel';
import { Menu, FileText, Sparkles } from 'lucide-react';

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
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
      attachment: image // Store image if exists
    };

    const updatedMessages = [...currentNote.messages, newUserMsg];
    setCurrentNote({ ...currentNote, messages: updatedMessages });
    setIsLoadingAI(true);
    setSelectedText('');
    
    // Ensure panel is open when sending a message
    setShowTeacherPanel(true);

    // Call Gemini with optional image
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
     return <div className="h-screen flex items-center justify-center bg-slate-900 text-emerald-500">Initializing AI...</div>;
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      
      {/* 1. Notes Sidebar (Left) */}
      <Sidebar 
        notes={notes}
        currentNoteId={currentNote?.id || ''}
        onSelectNote={setCurrentNote}
        onNewNote={handleNewNote}
        onDeleteNote={handleDeleteNote}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col h-full relative">
        
        {/* 2. Top Header */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shadow-sm z-10 shrink-0">
            <div className="flex items-center min-w-0">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-slate-600 mr-4 shrink-0">
                    <Menu />
                </button>
                <div className="flex items-center text-slate-800 font-bold text-lg truncate">
                    <FileText className="text-emerald-500 mr-2 shrink-0" size={20}/>
                    <span className="truncate">{currentNote?.title}</span>
                </div>
            </div>
            
            {/* AI Toggle Icon */}
            <button 
                onClick={() => setShowTeacherPanel(!showTeacherPanel)}
                className={`p-2 rounded-full transition-all ${showTeacherPanel ? 'bg-emerald-100 text-emerald-600' : 'text-slate-500 hover:bg-slate-100'}`}
                title="Toggle AI Teacher"
            >
                <Sparkles size={20} />
            </button>
        </div>

        {/* 3. Main Workspace */}
        <div className="flex-1 flex overflow-hidden relative">
            
            {/* Editor Area */}
            <div className={`
                flex-1 h-full bg-slate-50 transition-all duration-300 ease-in-out overflow-hidden
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

            {/* AI Teacher Panel - Toggled visibility */}
            {showTeacherPanel && (
                <div className="w-full md:w-[400px] lg:w-[450px] flex flex-col border-l border-slate-200 bg-white z-20 shadow-xl animate-in slide-in-from-right-10 duration-200 absolute inset-0 md:relative">
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
  );
}

export default App;