import React from 'react'
import Footer from '../components/common/Footer'

export default function PaywallScreen({
    screen, // 'paywall' or 'limit-reached'
    mode,
    timeUntilReset,
    onShowPaywall, // setShowPaywall(true)
    onClose // setScreen('home')
}) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{
            background: 'linear-gradient(180deg, #0a0a0f 0%, #12121f 100%)',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)'
        }}>

            {/* Background content */}
            <div className="text-center">
                <span className="text-6xl mb-4 block">{mode === 'roast' ? '🔥' : '✨'}</span>
                <h2 className="text-2xl font-black text-white mb-2">
                    {screen === 'limit-reached' ? "You've used today's free scans" : 'Upgrade to Pro'}
                </h2>
                <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {timeUntilReset ? `Resets in ${timeUntilReset}` : 'Get 25 ratings per day'}
                </p>

                {/* Single CTA to open Sales Page */}
                <button
                    onClick={onShowPaywall}
                    className="px-8 py-4 rounded-2xl text-white font-bold text-lg transition-all active:scale-95"
                    style={{
                        background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                        boxShadow: '0 8px 30px rgba(0,212,255,0.3)',
                        minHeight: '56px'
                    }}
                >
                    👑 View Options
                </button>

                {/* Back button */}
                <button
                    onClick={onClose}
                    className="w-full mt-4 py-3 text-sm font-medium transition-all active:opacity-60"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                    ← Maybe later
                </button>
            </div>

            <Footer className="opacity-50 pb-8" />
            <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
        </div>
    )
}
