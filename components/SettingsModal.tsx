
import React, { useState } from 'react';
import { X, Moon, Sun, Check, Plus } from 'lucide-react';
import { AppSettings } from '../types';
import { PRESET_COLORS } from '../services/themeUtils';

interface SettingsModalProps {
    settings: AppSettings;
    onUpdate: (settings: AppSettings) => void;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onUpdate, onClose }) => {
    const [isCustom, setIsCustom] = useState(!Object.keys(PRESET_COLORS).includes(settings.themeColor));

    const handleColorSelect = (colorKey: string) => {
        setIsCustom(false);
        onUpdate({ ...settings, themeColor: colorKey });
    };

    const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsCustom(true);
        onUpdate({ ...settings, themeColor: e.target.value });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
                
                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Settings</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    
                    {/* Appearance (Dark/Light) */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Appearance</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => onUpdate({ ...settings, themeMode: 'light' })}
                                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border-2 transition-all
                                    ${settings.themeMode === 'light' 
                                        ? 'border-[var(--primary-500)] bg-[var(--primary-50)] text-[var(--primary-700)] dark:border-white dark:bg-slate-800 dark:text-white' 
                                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}
                                `}
                            >
                                <Sun size={18} />
                                <span className="font-medium">Light Mode</span>
                            </button>
                            <button
                                onClick={() => onUpdate({ ...settings, themeMode: 'dark' })}
                                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border-2 transition-all
                                    ${settings.themeMode === 'dark' 
                                        ? 'border-[var(--primary-500)] bg-[var(--primary-50)] text-[var(--primary-700)] dark:border-white dark:bg-slate-700 dark:text-white' 
                                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}
                                `}
                            >
                                <Moon size={18} />
                                <span className="font-medium">Dark Mode</span>
                            </button>
                        </div>
                    </div>

                    {/* Chat Theme */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Chat Theme</h3>
                        <div className="flex flex-wrap gap-3">
                            {/* Presets */}
                            {Object.entries(PRESET_COLORS).map(([key, hex]) => (
                                <button
                                    key={key}
                                    onClick={() => handleColorSelect(key)}
                                    className={`
                                        w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm
                                        ${settings.themeColor === key ? 'ring-4 ring-offset-2 ring-slate-300 dark:ring-slate-600 dark:ring-offset-slate-900 scale-110' : ''}
                                    `}
                                    style={{ backgroundColor: hex }}
                                    title={key}
                                >
                                    {settings.themeColor === key && <Check className="text-white" size={20} strokeWidth={3} />}
                                </button>
                            ))}
                            
                            {/* Custom Color Input */}
                            <label className={`
                                w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm cursor-pointer border-2 border-slate-200 dark:border-slate-600
                                ${isCustom ? 'ring-4 ring-offset-2 ring-slate-300 dark:ring-slate-600 dark:ring-offset-slate-900 scale-110' : ''}
                            `}
                            style={{ backgroundColor: isCustom ? settings.themeColor : '#ffffff' }}
                            title="Custom Color"
                            >
                                <input 
                                    type="color" 
                                    className="opacity-0 w-full h-full cursor-pointer absolute"
                                    onChange={handleCustomColorChange}
                                    value={isCustom ? settings.themeColor : '#000000'}
                                />
                                {isCustom ? <Check className="text-white mix-blend-difference" size={20} strokeWidth={3} /> : <Plus className="text-slate-400" />}
                            </label>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Choose a preset or click + to pick a custom color.</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
