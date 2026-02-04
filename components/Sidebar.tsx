import React from 'react';
import { Note } from '../types';
import { Plus, Trash2, BookOpen, Menu, Sparkles } from 'lucide-react';

interface SidebarProps {
  notes: Note[];
  currentNoteId: string;
  onSelectNote: (note: Note) => void;
  onNewNote: () => void;
  onDeleteNote: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  notes,
  currentNoteId,
  onSelectNote,
  onNewNote,
  onDeleteNote,
  isOpen,
  setIsOpen,
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
        w-72 h-full bg-slate-900 text-white flex flex-col
        transition-transform duration-300 ease-in-out shadow-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="flex items-center space-x-3 text-emerald-400">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <BookOpen size={20} />
            </div>
            <span className="font-bold text-lg tracking-wide">NoteAI</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-white">
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
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-900/20 transition-all transform active:scale-95"
          >
            <Plus size={18} />
            <span>New Note</span>
          </button>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-center p-6">
                <Sparkles className="mb-2 opacity-20" size={32} />
                <p className="text-sm">Your knowledge base is empty.</p>
                <p className="text-xs opacity-60">Create a note to begin.</p>
            </div>
          ) : (
             notes.map((note) => (
                <div key={note.id} className="relative group">
                  <div
                    className={`
                      flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border border-transparent
                      ${currentNoteId === note.id 
                        ? 'bg-slate-800 text-white border-slate-700 shadow-md' 
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
                    `}
                    onClick={() => {
                      onSelectNote(note);
                      if (window.innerWidth < 768) setIsOpen(false);
                    }}
                  >
                    <div className="flex-1 truncate mr-2">
                      <p className="font-medium truncate text-sm">{note.title || 'Untitled Note'}</p>
                      <p className="text-[10px] opacity-60 mt-0.5 font-mono">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNote(note.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
             ))
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-600 text-center font-mono">
          PREMIUM AI TEACHER v2.0
        </div>
      </div>
    </>
  );
};

export default Sidebar;
