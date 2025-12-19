import React from 'react'

/**
 * ButtonTestPage - Visual regression testing for all button variants
 * Access via: /?test=buttons
 * 
 * Tests all buttons with worst-case labels at each viewport
 */
export default function ButtonTestPage() {
    // Simulated loading states
    const [loading, setLoading] = React.useState(false)

    const toggleLoading = () => {
        setLoading(true)
        setTimeout(() => setLoading(false), 2000)
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4">
            <h1 className="text-2xl font-bold mb-2">🔬 Button Test Page</h1>
            <p className="text-sm text-gray-400 mb-6">
                Viewport: <span className="font-mono text-cyan-400">{typeof window !== 'undefined' ? window.innerWidth : '?'}px</span>
                {' '}| Resize browser to test containment
            </p>

            {/* Viewport indicators */}
            <div className="flex gap-2 mb-8 text-xs">
                <span className="px-2 py-1 rounded bg-red-500/20 hidden max-[374px]:block">📱 SE (320px)</span>
                <span className="px-2 py-1 rounded bg-orange-500/20 hidden min-[375px]:max-[389px]:block">📱 375px</span>
                <span className="px-2 py-1 rounded bg-yellow-500/20 hidden min-[390px]:max-[427px]:block">📱 390px</span>
                <span className="px-2 py-1 rounded bg-green-500/20 hidden min-[428px]:max-[767px]:block">📱 428px+</span>
                <span className="px-2 py-1 rounded bg-blue-500/20 hidden min-[768px]:block">🖥️ Tablet+</span>
            </div>

            {/* HIGH RISK BUTTONS */}
            <section className="mb-8">
                <h2 className="text-lg font-bold mb-4 text-red-400">🔴 HIGH RISK - Longest Labels</h2>
                <div className="space-y-4">

                    {/* Refill CTA */}
                    <div className="bg-slate-800 p-4 rounded-xl">
                        <p className="text-xs text-gray-500 mb-2">Refill CTA (28 chars + emoji)</p>
                        <button
                            className="btn-physical btn-responsive-text flex items-center gap-2 px-6 py-2.5 rounded-full"
                            style={{
                                background: 'rgba(255,215,0,0.1)',
                                border: '1px solid rgba(255,215,0,0.4)',
                                boxShadow: '0 0 30px rgba(255,215,0,0.1)'
                            }}
                        >
                            <span className="text-xs font-black" style={{ color: '#ffd700' }}>
                                REFILL SCANS · UNLOCK PRO 👑
                            </span>
                        </button>
                    </div>

                    {/* SAVAGE Roast */}
                    <div className="bg-slate-800 p-4 rounded-xl">
                        <p className="text-xs text-gray-500 mb-2">SAVAGE Roast (35 chars)</p>
                        <button
                            className="btn-responsive-text btn-multi-line w-full py-4 rounded-2xl text-red-400 font-bold text-sm"
                            style={{
                                background: 'rgba(255,68,68,0.08)',
                                border: '1px solid rgba(255,68,68,0.25)'
                            }}
                        >
                            💀 Or get 1 SAVAGE Roast for $0.99
                        </button>
                    </div>

                    {/* Decline Button */}
                    <div className="bg-slate-800 p-4 rounded-xl">
                        <p className="text-xs text-gray-500 mb-2">Decline (36 chars)</p>
                        <button className="btn-responsive-text btn-multi-line w-full py-3 text-sm text-gray-500 font-medium">
                            No thanks, I'll pay full price later
                        </button>
                    </div>

                    {/* Pro Badge Long */}
                    <div className="bg-slate-800 p-4 rounded-xl">
                        <p className="text-xs text-gray-500 mb-2">Upgrade Pill (28 chars)</p>
                        <button className="btn-responsive-text text-[10px] font-black tracking-[0.2em] text-orange-400">
                            Get Unlimited Savage Scans →
                        </button>
                    </div>
                </div>
            </section>

            {/* SHARE BUTTONS GRID */}
            <section className="mb-8">
                <h2 className="text-lg font-bold mb-4 text-yellow-400">🟡 Share Buttons Grid</h2>
                <div className="bg-slate-800 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 mb-2">5-column grid (4 on iPhone SE)</p>
                    <div className="share-grid-responsive grid grid-cols-5 gap-2">
                        {[
                            { emoji: '🔗', label: 'Copy' },
                            { emoji: '💬', label: 'Text' },
                            { emoji: '𝕏', label: 'X' },
                            { emoji: '📘', label: 'FB' },
                            { emoji: '🤖', label: 'Reddit' },
                        ].map((btn, i) => (
                            <button
                                key={i}
                                className="flex flex-col items-center justify-center p-3 rounded-xl"
                                style={{ background: 'rgba(255,255,255,0.1)' }}
                            >
                                <span className="text-xl mb-1">{btn.emoji}</span>
                                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{btn.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* LOADING STATES */}
            <section className="mb-8">
                <h2 className="text-lg font-bold mb-4 text-blue-400">🔄 Loading State Transition</h2>
                <div className="bg-slate-800 p-4 rounded-xl space-y-4">
                    <p className="text-xs text-gray-500 mb-2">Click to test layout stability</p>

                    <button
                        onClick={toggleLoading}
                        className="btn-physical btn-stable-width w-full py-4 rounded-2xl text-black font-bold text-lg"
                        style={{
                            background: 'linear-gradient(135deg, #00d4ff 0%, #0077ff 100%)',
                        }}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                                Loading...
                            </span>
                        ) : 'Unlock Pro'}
                    </button>

                    <button
                        onClick={toggleLoading}
                        className="btn-stable-width w-full py-4 rounded-2xl text-black font-bold text-lg"
                        style={{
                            background: 'linear-gradient(135deg, #ffd700 0%, #ffb800 100%)',
                        }}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                                Processing...
                            </span>
                        ) : '🔥 Claim This Deal'}
                    </button>
                </div>
            </section>

            {/* PAYWALL SCAN PACKS */}
            <section className="mb-8">
                <h2 className="text-lg font-bold mb-4 text-cyan-400">💰 Paywall Scan Packs</h2>
                <div className="bg-slate-800 p-4 rounded-xl">
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { count: '5', price: '$1.99' },
                            { count: '15', price: '$3.99', highlight: true },
                            { count: '50', price: '$9.99' },
                        ].map((pack, i) => (
                            <button
                                key={i}
                                className="btn-physical p-4 rounded-2xl text-center flex flex-col items-center justify-between min-h-[110px]"
                                style={{
                                    background: pack.highlight ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.05)',
                                    border: pack.highlight ? '2px solid #00d4ff' : '1px solid rgba(255,255,255,0.1)',
                                }}
                            >
                                <span className={`block text-2xl font-black ${pack.highlight ? 'text-cyan-400' : 'text-white'}`}>{pack.count}</span>
                                <span className="block text-[9px] text-gray-500 uppercase font-black">scans</span>
                                <span className="block text-sm font-bold text-white mt-1">{pack.price}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRIMARY CTAs */}
            <section className="mb-8">
                <h2 className="text-lg font-bold mb-4 text-green-400">🟢 Primary CTAs</h2>
                <div className="bg-slate-800 p-4 rounded-xl space-y-4">
                    <button
                        className="btn-physical w-full py-5 rounded-2xl text-black font-black text-xl flex items-center justify-center gap-3"
                        style={{
                            background: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
                        }}
                    >
                        <span className="text-2xl">📤</span> SHARE THIS FIT
                    </button>

                    <button className="btn-physical w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                        <span>🔄</span> Rate Another Fit
                    </button>

                    <button
                        className="w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3"
                        style={{
                            background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                        }}
                    >
                        <span className="text-xl">📤</span> Share with Image
                    </button>
                </div>
            </section>

            {/* FOOTER */}
            <div className="text-center text-xs text-gray-600 mt-8 pb-8">
                Button Test Page | FitRate.app
            </div>
        </div>
    )
}
