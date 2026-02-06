
import React from 'react';
import { Play, Pause, Square, Loader2 } from 'lucide-react';

interface AudioControlBarProps {
    isSpeaking: boolean;
    isPaused: boolean;
    loadingAudioId: string | null;
    onPauseResume: () => void;
    onStop: () => void;
}

const AudioControlBar: React.FC<AudioControlBarProps> = ({ 
    isSpeaking, 
    isPaused, 
    loadingAudioId, 
    onPauseResume, 
    onStop
}) => {
    if (!isSpeaking && !isPaused && !loadingAudioId) return null;

    return (
        <div className="absolute bottom-14 left-0 right-0 mx-4 mb-2 bg-[var(--primary-900)]/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-bold shadow-2xl animate-in slide-in-from-bottom-5 z-40">
            <div className="flex items-center space-x-3">
                {loadingAudioId ? (
                    <>
                    <Loader2 className="animate-spin text-[var(--primary-300)]" size={16} />
                    <span className="text-[var(--primary-50)]">Connecting AI Voice...</span>
                    </>
                ) : (
                    <>
                    <div className="flex space-x-1 items-end h-4">
                        {!isPaused && (
                            <>
                            <div className="w-1 bg-[var(--primary-400)] animate-[bounce_1s_infinite] h-2"></div>
                            <div className="w-1 bg-[var(--primary-400)] animate-[bounce_1.2s_infinite] h-4"></div>
                            <div className="w-1 bg-[var(--primary-400)] animate-[bounce_0.8s_infinite] h-3"></div>
                            </>
                        )}
                        {isPaused && <div className="w-3 h-3 bg-amber-400 rounded-sm"></div>}
                    </div>
                    <span className="text-[var(--primary-50)] tracking-wide">{isPaused ? "Playback Paused" : "AI Teacher Speaking"}</span>
                    </>
                )}
            </div>
            <div className="flex items-center space-x-2">
                {!loadingAudioId && (
                    <button 
                        onClick={onPauseResume} 
                        className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"
                    >
                        {isPaused ? <Play size={16} fill="currentColor"/> : <Pause size={16} fill="currentColor"/>}
                    </button>
                )}
                <button 
                    onClick={onStop} 
                    className="p-2 bg-white/10 rounded-full hover:bg-red-500/80 transition-all text-white"
                >
                    <Square size={16} fill="currentColor"/>
                </button>
            </div>
        </div>
    );
};

export default AudioControlBar;
