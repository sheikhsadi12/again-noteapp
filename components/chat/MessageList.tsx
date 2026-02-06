
import React, { useRef, useEffect } from 'react';
import { Message } from '../../types';
import { BookOpen, Copy, FileText, Printer, Share2, Volume2, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MessageListProps {
    messages: Message[];
    isLoading: boolean;
    playingMsgId: string | null;
    loadingAudioId: string | null;
    isPaused: boolean;
    onSpeak: (text: string, id: string) => void;
    onCopy: (text: string) => void;
    onExport: (text: string) => void;
    onPrint: (text: string) => void;
    onShare: (text: string) => void;
}

const MessageAction = ({ onClick, icon: Icon, label, isLoading, isActive }: { onClick: () => void, icon: any, label?: string, isLoading?: boolean, isActive?: boolean }) => (
    <button 
      onClick={onClick} 
      disabled={isLoading}
      className={`px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium disabled:opacity-50
          ${isActive 
              ? 'bg-[var(--primary-100)] text-[var(--primary-700)] ring-1 ring-[var(--primary-500)] dark:bg-[var(--primary-900)]/40 dark:text-[var(--primary-300)]' 
              : 'text-slate-500 hover:text-[var(--primary-700)] hover:bg-[var(--primary-50)] dark:text-slate-400 dark:hover:text-[var(--primary-300)] dark:hover:bg-slate-800'}
      `}
      title={label}
    >
      {isLoading ? <Loader2 size={14} className="animate-spin text-[var(--primary-600)]" /> : <Icon size={14} />}
      {label && <span>{label}</span>}
    </button>
);

const MessageList: React.FC<MessageListProps> = ({
    messages, isLoading,
    playingMsgId, loadingAudioId, isPaused,
    onSpeak, onCopy, onExport, onPrint, onShare
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    return (
        <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-8 bg-white dark:bg-slate-900 transition-colors">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600">
                    <div className="w-16 h-16 bg-[var(--primary-50)] dark:bg-[var(--primary-900)]/20 rounded-full flex items-center justify-center mb-4">
                        <BookOpen size={24} className="text-[var(--primary-400)] dark:text-[var(--primary-600)]" />
                    </div>
                    <p className="font-medium text-slate-500 dark:text-slate-400">How can I help you learn?</p>
                    <p className="text-sm mt-1 opacity-80">Select text or ask a question.</p>
                </div>
            )}
            
            {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                
                {/* Message Bubble */}
                <div className={`
                    max-w-[95%] lg:max-w-[90%] rounded-2xl px-5 py-3.5 shadow-sm relative transition-all duration-200 text-sm leading-relaxed
                    ${msg.role === 'user' 
                        ? 'bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] text-white rounded-tr-sm' 
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-sm'}
                    `}
                >
                    {/* Show Attachment if exists */}
                    {msg.attachment && (
                        <div className="mb-3 rounded-lg overflow-hidden border border-white/20 bg-black/5">
                            <img src={msg.attachment} alt="User upload" className="max-w-full max-h-60 object-contain mx-auto" />
                        </div>
                    )}

                    <div className={`prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-strong:text-current ${msg.role === 'user' ? 'prose-invert text-white' : 'dark:prose-invert'}`}>
                    {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
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
                    <div className="flex flex-wrap items-center gap-1 mt-2 ml-1 opacity-70 hover:opacity-100 transition-opacity">
                        <MessageAction 
                            onClick={() => onSpeak(msg.content, msg.id)} 
                            icon={loadingAudioId === msg.id ? Loader2 : Volume2} 
                            label={playingMsgId === msg.id ? (isPaused ? "Resume" : "Playing") : (loadingAudioId === msg.id ? "Loading..." : "Speak")} 
                            isLoading={loadingAudioId === msg.id}
                            isActive={playingMsgId === msg.id}
                        />
                        <div className="w-px h-3 bg-slate-300 dark:bg-slate-700 mx-2"></div>
                        <MessageAction onClick={() => onCopy(msg.content)} icon={Copy} />
                        <MessageAction onClick={() => onExport(msg.content)} icon={FileText} />
                        <MessageAction onClick={() => onPrint(msg.content)} icon={Printer} />
                        <MessageAction onClick={() => onShare(msg.content)} icon={Share2} />
                    </div>
                )}
                </div>
            ))}

            {isLoading && (
                <div className="flex justify-start animate-in fade-in">
                    <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-700 shadow-sm flex items-center space-x-3">
                        <span className="text-xs font-bold text-[var(--primary-600)] dark:text-[var(--primary-400)] animate-pulse">Thinking...</span>
                        <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-[var(--primary-500)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-[var(--primary-500)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-[var(--primary-500)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;
