import React from 'react'

export default function ShareSuccessScreen({
    mode,
    setMode,
    setScreen
}) {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f] text-white p-6" style={{
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))'
        }}>
            <span className="text-6xl mb-4">🎉</span>
            <h2 className="text-2xl font-black mb-2">Shared!</h2>
            <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Let's see if they can beat it
            </p>

            {/* ONE Follow-up Option */}
            <button
                onClick={() => {
                    // If they used Nice mode, suggest Roast. Otherwise, rate another.
                    if (mode !== 'roast') {
                        setMode('roast')
                        setScreen('home')
                    } else {
                        setScreen('home')
                    }
                }}
                className="w-full max-w-xs py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 mb-4"
                style={{
                    background: mode === 'roast'
                        ? 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)'
                        : 'linear-gradient(135deg, #ff4444 0%, #ff6b6b 100%)',
                    boxShadow: mode === 'roast'
                        ? '0 8px 30px rgba(0,212,255,0.3)'
                        : '0 8px 30px rgba(255,68,68,0.3)'
                }}
            >
                {mode === 'roast' ? '📸 Rate Another Fit' : '🔥 Roast It Harder'}
            </button>

            {/* Back to home */}
            <button
                onClick={() => setScreen('home')}
                className="text-sm transition-all active:opacity-60"
                style={{ color: 'rgba(255,255,255,0.4)' }}
            >
                ← Back to Home
            </button>
        </div>
    )
}
