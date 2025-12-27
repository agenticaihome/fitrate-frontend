import React, { useMemo } from 'react';
import ModalHeader from './common/ModalHeader';

// Premium floating particles
const FloatingParticles = () => {
    const particles = useMemo(() =>
        Array.from({ length: 6 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            size: 1 + Math.random() * 2,
            delay: Math.random() * 8,
            duration: 12 + Math.random() * 8,
            opacity: 0.15 + Math.random() * 0.2,
            drift: -15 + Math.random() * 30
        })), []
    )

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${p.left}%`,
                        bottom: '-5px',
                        width: p.size,
                        height: p.size,
                        background: p.id % 2 === 0 ? '#10b981' : '#fff',
                        opacity: p.opacity,
                        boxShadow: `0 0 ${p.size * 2}px ${p.id % 2 === 0 ? '#10b981' : '#fff'}`,
                        animation: `particle-float ${p.duration}s linear infinite`,
                        animationDelay: `${p.delay}s`,
                        '--drift': `${p.drift}px`
                    }}
                />
            ))}
        </div>
    )
}

export default function RulesModal({ onClose, event }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
            background: 'rgba(0,0,0,0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 60
        }}>
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[350px] h-[350px] rounded-full" style={{
                    background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
                    top: '25%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: 'glow-breathe 4s ease-in-out infinite'
                }} />
            </div>

            <div className="w-full max-w-sm rounded-3xl glass-premium border border-white/10 overflow-hidden relative" style={{
                background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(10,15,25,0.98) 100%)',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                animation: 'modal-slide-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
                <FloatingParticles />
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
                        className="w-full py-3.5 rounded-xl text-white font-bold transition-all active:scale-95 btn-premium-shine relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            boxShadow: '0 8px 30px rgba(16,185,129,0.4), 0 0 0 1px rgba(16,185,129,0.3)'
                        }}
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
}
