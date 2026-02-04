import React, { useState } from 'react';
import { Command } from '../../types';
import { Plus, Languages, BookOpen, Feather, Sparkles, GraduationCap, X } from 'lucide-react';
import * as Storage from '../../services/storage';

interface CommandBarProps {
    commands: Command[];
    onCommandClick: (command: Command) => void;
    onCommandsUpdated: () => void;
}

const CommandBar: React.FC<CommandBarProps> = ({ commands, onCommandClick, onCommandsUpdated }) => {
    const [showAddCommand, setShowAddCommand] = useState(false);
    const [newCmdName, setNewCmdName] = useState('');
    const [newCmdInstruction, setNewCmdInstruction] = useState('');

    const getIcon = (iconName?: string) => {
        switch(iconName) {
            case 'Languages': return Languages;
            case 'BookOpen': return BookOpen;
            case 'Feather': return Feather;
            case 'Sparkles': return Sparkles;
            default: return GraduationCap;
        }
    };

    const handleSaveCustomCommand = () => {
        if (!newCmdName.trim() || !newCmdInstruction.trim()) return;
        const newCmd: Command = {
            id: `custom_${Date.now()}`,
            name: newCmdName,
            instruction: newCmdInstruction,
            isCustom: true,
            icon: 'Star'
        };
        Storage.saveCustomCommand(newCmd);
        onCommandsUpdated();
        setShowAddCommand(false);
        setNewCmdName('');
        setNewCmdInstruction('');
    };

    return (
        <>
            <div className="p-2 overflow-x-auto no-scrollbar">
                <div className="flex space-x-2">
                    {commands.map((cmd) => {
                        const Icon = getIcon(cmd.icon);
                        return (
                            <button
                                key={cmd.id}
                                onClick={() => onCommandClick(cmd)}
                                className={`
                                    flex-shrink-0 flex items-center space-x-1 px-3 py-1.5 rounded-lg border shadow-sm text-[11px] font-bold transition-all transform active:scale-95
                                    ${cmd.isCustom 
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-700'}
                                `}
                            >
                                <Icon size={12} />
                                <span>{cmd.name}</span>
                            </button>
                        );
                    })}
                    <button
                        onClick={() => setShowAddCommand(true)}
                        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                        <Plus size={14} />
                    </button>
                </div>
            </div>

            {/* Modal */}
            {showAddCommand && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <Sparkles className="text-emerald-500"/> Custom Command
                            </h3>
                            <button onClick={() => setShowAddCommand(false)} className="bg-slate-100 p-1 rounded-full text-slate-500 hover:bg-slate-200">
                                <X size={16} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Label</label>
                                <input 
                                    value={newCmdName}
                                    onChange={e => setNewCmdName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                                    placeholder="e.g. Simplify"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">AI Instruction</label>
                                <textarea 
                                    value={newCmdInstruction}
                                    onChange={e => setNewCmdInstruction(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                                    placeholder="e.g. Rewrite this text in simple words..."
                                />
                            </div>
                            <button 
                                onClick={handleSaveCustomCommand}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all mt-2"
                            >
                                Save Command
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CommandBar;