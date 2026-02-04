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
              ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500' 
              : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'}
      `}
      title={label}
    >
      {isLoading ? <Loader2 size={14} className="animate-spin text-emerald-600" /> : <Icon size={14} />}
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
                            onClick={() => onSpeak(msg.content, msg.id)} 
                            icon={loadingAudioId === msg.id ? Loader2 : Volume2} 
                            label={playingMsgId === msg.id ? (isPaused ? "Resume" : "Playing") : (loadingAudioId === msg.id ? "Loading..." : "Speak")} 
                            isLoading={loadingAudioId === msg.id}
                            isActive={playingMsgId === msg.id}
                        />
                        <MessageAction onClick={() => onCopy(msg.content)} icon={Copy} label="Copy" />
                        <div className="w-px h-3 bg-slate-300 mx-2"></div>
                        <MessageAction onClick={() => onExport(msg.content)} icon={FileText} label="Doc" />
                        <MessageAction onClick={() => onPrint(msg.content)} icon={Printer} label="PDF" />
                        <MessageAction onClick={() => onShare(msg.content)} icon={Share2} label="Share" />
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
    );
};

export default MessageList;