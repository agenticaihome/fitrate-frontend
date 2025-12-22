import React from 'react';
import ModalHeader from './common/ModalHeader';

export default function RulesModal({ onClose, event }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
            background: 'rgba(0,0,0,0.95)',
            backdropFilter: 'blur(5px)',
            zIndex: 60 // Ensure it's above other modals if needed
        }}>
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/10 overflow-hidden shadow-2xl">
                <div className="p-6 pb-0">
                    <ModalHeader
                        title="Event Rules"
                        subtitle={event ? event.theme : "Official Charter"}
                        icon="📋"
                        onClose={onClose}
                    />
                </div>

                <div className="p-6 pt-4 space-y-5 text-sm max-h-[60vh] overflow-y-auto custom-scrollbar">

                    {/* Dynamic Theme Context */}
                    {event && (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <h4 className="text-emerald-400 font-bold mb-1 flex items-center gap-2">
                                <span>{event.themeEmoji}</span> Current Theme
                            </h4>
                            <p className="text-gray-300 text-xs leading-relaxed">
                                {event.themeDescription}
                            </p>
                        </div>
                    )}

                    <div>
                        <h4 className="text-white font-bold mb-1">✅ What Gets Judged</h4>
                        <p className="text-gray-400">Clothing, styling, accessories, and how well you execute a cohesive look matching the theme.</p>
                    </div>

                    <div>
                        <h4 className="text-red-400 font-bold mb-1">❌ What Is NEVER Judged</h4>
                        <p className="text-gray-400">Body type, weight, age, gender, identity, or photo quality.</p>
                    </div>

                    <div>
                        <h4 className="text-cyan-400 font-bold mb-1">📊 How It Works</h4>
                        <ul className="text-gray-400 space-y-1.5 pl-1">
                            <li>• Submit outfits during the active week</li>
                            <li>• AI scores based on Theme Adherence + Style</li>
                            <li>• Only your best score counts on leaderboard</li>
                        </ul>
                    </div>

                    <div className="p-3 rounded-lg bg-white/5 text-xs text-gray-500">
                        Disclaimer: For entertainment purposes only. By participating, you agree to our <a href="/terms.html" className="text-cyan-400 underline">Terms</a> and <a href="/privacy.html" className="text-cyan-400 underline">Privacy Policy</a>.
                    </div>
                </div>

                <div className="p-6 pt-0">
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
                    >
                        I Understand ✓
                    </button>
                </div>
            </div>
        </div>
    );
}
