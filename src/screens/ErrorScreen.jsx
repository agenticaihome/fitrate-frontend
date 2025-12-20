import React from 'react'

export default function ErrorScreen({ error, onReset }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#0a0a0f] text-white" style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
        }}>
            <span className="text-6xl mb-6">👗</span>
            <h2 className="text-2xl font-black mb-4 uppercase tracking-tight">Oops!</h2>
            <p className="text-white/60 text-center mb-8 max-w-xs">{error || "We couldn't rate that one. Try a clearer photo or check your connection."}</p>

            <div className="w-full max-w-xs">
                <button
                    onClick={onReset}
                    className="w-full py-4 rounded-2xl bg-white text-black font-black text-lg transition-all active:scale-95"
                    style={{ boxShadow: 'var(--shadow-physical)' }}
                >
                    Try Again
                </button>
            </div>
        </div>
    )
}
