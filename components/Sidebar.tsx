
import React from 'react';
import { Note } from '../types';
import { Plus, Trash2, BookOpen, Menu, Sparkles, Settings } from 'lucide-react';

interface SidebarProps {
  notes: Note[];
  currentNoteId: string;
  onSelectNote: (note: Note) => void;
  onNewNote: () => void;
  onDeleteNote: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  notes,
  currentNoteId,
  onSelectNote,
  onNewNote,
  onDeleteNote,
  isOpen,
  setIsOpen,
  onOpenSettings
}) => {
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`
        fixed md:relative z-30
        w-72 h-full flex flex-col
        bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
        transition-all duration-300 ease-in-out shadow-2xl md:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-[var(--primary-600)] dark:text-[var(--primary-400)]">
            <div className="p-2 bg-[var(--primary-500)]/10 rounded-lg">
                <BookOpen size={20} />
            </div>
            <span className="font-bold text-lg tracking-wide text-slate-800 dark:text-slate-100">NoteAI</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
            <Menu size={20} />
          </button>
        </div>

        {/* Action Button */}
        <div className="p-4">
          <button
            onClick={() => {
              onNewNote();
              if (window.innerWidth < 768) setIsOpen(false);
            }}
            className="w-full flex items-center justify-center space-x-2 
                bg-gradient-to-r from-[var(--primary-600)] to-[var(--primary-500)] hover:from-[var(--primary-500)] hover:to-[var(--primary-400)]
                text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-[var(--primary-500)]/20 
                transition-all transform active:scale-95 border-none"
          >
            <Plus size={18} />
            <span>New Note</span>
          </button>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 dark:text-slate-500 text-center p-6">
                <Sparkles className="mb-2 opacity-20" size={32} />
                <p className="text-sm">Your knowledge base is empty.</p>
                <p className="text-xs opacity-60">Create a note to begin.</p>
            </div>
          ) : (
             notes.map((note) => (
                <div key={note.id} className="relative group">
                  <div
                    className={`
                      flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200
                      ${currentNoteId === note.id 
                        ? 'bg-[var(--primary-50)] dark:bg-[var(--primary-900)]/20 text-[var(--primary-700)] dark:text-[var(--primary-300)] font-medium shadow-sm' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}
                    `}
                    onClick={() => {
                      onSelectNote(note);
                      if (window.innerWidth < 768) setIsOpen(false);
                    }}
                  >
                    <div className="flex-1 truncate mr-2">
                      <p className="truncate text-sm">
                        {note.title || 'Untitled Note'}
                      </p>
                      <p className={`text-[10px] mt-0.5 font-mono transition-opacity ${currentNoteId === note.id ? 'opacity-80' : 'opacity-50'}`}>
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNote(note.id);
                      }}
                      className={`
                        p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100
                        ${currentNoteId === note.id 
                            ? 'text-[var(--primary-400)] hover:bg-[var(--primary-100)] dark:hover:bg-[var(--primary-900)]/40 hover:text-red-500' 
                            : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-red-500'}
                      `}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
             ))
          )}
        </div>
        
        {/* Footer with Settings */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
            <button 
                onClick={() => {
                    onOpenSettings();
                    if (window.innerWidth < 768) setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 p-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all"
            >
                <Settings size={18} />
                <span className="text-sm font-medium">Settings</span>
            </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
