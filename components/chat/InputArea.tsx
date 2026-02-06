
import React, { useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X } from 'lucide-react';

interface InputAreaProps {
    input: string;
    setInput: (val: string) => void;
    attachedImage: string | null;
    setAttachedImage: (val: string | null) => void;
    onSend: () => void;
    isLoading: boolean;
    selectedText: string;
    onClearSelection: () => void;
}

const InputArea: React.FC<InputAreaProps> = ({ 
    input, setInput, 
    attachedImage, setAttachedImage, 
    onSend, isLoading, 
    selectedText, onClearSelection
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [input]);

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

    return (
        <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-30 shrink-0 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)] transition-colors">
            
            {/* Selected Text Indicator */}
            {selectedText && (
                <div className="px-3 py-1.5 bg-[var(--primary-50)] dark:bg-[var(--primary-900)]/20 text-[var(--primary-700)] dark:text-[var(--primary-300)] text-xs border-b border-[var(--primary-100)] dark:border-[var(--primary-800)] flex justify-between items-center">
                    <span className="truncate max-w-[240px] font-medium opacity-90">"{selectedText.substring(0, 40)}..."</span>
                    <button onClick={onClearSelection} className="text-[var(--primary-500)] hover:text-[var(--primary-700)] dark:hover:text-[var(--primary-300)] p-1"><X size={12}/></button>
                </div>
            )}

            {/* Image Preview */}
            {attachedImage && (
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-start gap-3">
                    <div className="relative group">
                        <img src={attachedImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-300 dark:border-slate-600 shadow-sm" />
                        <button 
                            onClick={() => setAttachedImage(null)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600"
                        >
                            <X size={12} />
                        </button>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <p className="font-semibold text-slate-700 dark:text-slate-200">Image attached</p>
                        <p>AI will analyze this image.</p>
                    </div>
                </div>
            )}

            {/* Text Input Area */}
            <div className="p-3 pt-3 flex items-end space-x-2">
                
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
                    className="mb-1 p-2 rounded-full text-slate-400 hover:text-[var(--primary-600)] hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="Upload Image"
                >
                    <ImageIcon size={20} />
                </button>

                <div className="flex-1 relative bg-slate-100 dark:bg-slate-700 rounded-2xl focus-within:ring-2 focus-within:ring-[var(--primary-500)] focus-within:bg-white dark:focus-within:bg-slate-800 transition-all">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={selectedText ? "Ask about selected..." : "Type here... (Enter for new line)"}
                        rows={1}
                        className="w-full bg-transparent text-slate-800 dark:text-slate-100 rounded-2xl pl-4 pr-4 py-3 text-sm focus:outline-none resize-none max-h-32 placeholder-slate-400"
                        style={{ minHeight: '44px' }}
                    />
                </div>
                
                <button
                    onClick={onSend}
                    disabled={(!input && !selectedText && !attachedImage) || isLoading}
                    className="mb-1 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white p-3 rounded-full shadow-lg transform transition-transform active:scale-90 flex-shrink-0"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

export default InputArea;
