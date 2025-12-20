import React from 'react'

export default function ProWelcomeScreen({ onStart }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0f] text-white" style={{
            background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
        }}>
            <div className="text-7xl mb-6">🎉</div>
            <h2 className="text-4xl font-black text-white mb-3">Welcome to FitRate Pro!</h2>
            <p className="text-center mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
                You now have 25 ratings per day
            </p>

            <div className="p-6 rounded-2xl mb-8 text-center" style={{
                background: 'rgba(0,255,136,0.1)',
                border: '1px solid rgba(0,255,136,0.3)',
                backdropFilter: 'blur(10px)'
            }}>
                <p className="text-base" style={{ color: '#00ff88' }}>
                    ✨ 25 ratings per day<br />
                    🤖 Advanced AI analysis<br />
                    🔥 All modes unlocked
                </p>
            </div>

            <button
                onClick={onStart}
                className="px-10 py-5 rounded-2xl text-white font-bold text-xl transition-all hover:scale-105"
                style={{
                    background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                    boxShadow: '0 4px 30px rgba(0,212,255,0.4)'
                }}
            >
                Start Rating 🚀
            </button>
        </div>
    )
}
