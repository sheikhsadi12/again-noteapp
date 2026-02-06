
import React from 'react';
import { X, Mic, GraduationCap, BookOpen, Feather, Smile } from 'lucide-react';
import { VoiceSettings, VoicePersona } from '../../types';

interface VoiceSettingsPanelProps {
    settings: VoiceSettings;
    onUpdate: (settings: VoiceSettings) => void;
    onClose: () => void;
}

const VoiceSettingsPanel: React.FC<VoiceSettingsPanelProps> = ({ settings, onUpdate, onClose }) => {
    
    const PersonaButton = ({ p, label, icon: Icon }: { p: VoicePersona, label: string, icon: any }) => (
        <button 
            onClick={() => onUpdate({ ...settings, persona: p })}
            className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                settings.persona === p 
                ? 'bg-[var(--primary-100)] border-[var(--primary-500)] text-[var(--primary-800)] dark:bg-[var(--primary-900)]/40 dark:text-[var(--primary-300)] dark:border-[var(--primary-700)]' 
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
        >
            <Icon size={20} className="mb-1" />
            <span className="text-[10px] font-bold uppercase">{label}</span>
        </button>
    );

    return (
        <div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 animate-in slide-in-from-top-2 transition-colors">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Voice Engine Configuration</h4>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={14}/></button>
            </div>
            
            <div className="grid grid-cols-5 gap-2 mb-4">
                <PersonaButton p="standard" label="Standard" icon={Mic} />
                <PersonaButton p="teacher" label="Teacher" icon={GraduationCap} />
                <PersonaButton p="storyteller" label="Story" icon={BookOpen} />
                <PersonaButton p="poetic" label="Poet" icon={Feather} />
                <PersonaButton p="child_friendly" label="Kid" icon={Smile} />
            </div>

            <div className="space-y-3">
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                    <span className="text-xs font-bold w-12">Speed:</span>
                    <input 
                        type="range" min="0.5" max="2" step="0.1"
                        value={settings.speed}
                        onChange={(e) => onUpdate({ ...settings, speed: parseFloat(e.target.value) })}
                        className="flex-1 accent-[var(--primary-600)] h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs w-8 text-right">{settings.speed}x</span>
                </div>
            </div>
        </div>
    );
};

export default VoiceSettingsPanel;
