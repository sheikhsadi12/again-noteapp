import React from 'react';

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
  onTextSelect,
}) => {
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const selected = target.value.substring(target.selectionStart, target.selectionEnd);
    if (selected.trim().length > 0) {
      onTextSelect(selected);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 pb-2">
        <input
          type="text"
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="Note Title..."
          className="w-full text-3xl font-bold text-slate-800 placeholder-slate-300 border-none outline-none bg-transparent"
        />
        <div className="h-px bg-slate-200 mt-4 w-full" />
      </div>
      
      <div className="flex-1 p-6 pt-2 overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => onChangeContent(e.target.value)}
          onSelect={handleSelect}
          placeholder="Start writing here... Select text to ask the AI Teacher."
          className="w-full h-full resize-none border-none outline-none text-lg text-slate-600 leading-relaxed font-serif bg-transparent placeholder-slate-300"
        />
      </div>
    </div>
  );
};

export default NoteEditor;
