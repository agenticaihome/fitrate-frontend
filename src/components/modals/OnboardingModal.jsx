import React, { useState, useMemo } from 'react'

// Premium floating particles
const FloatingParticles = ({ color }) => {
    const particles = useMemo(() =>
        Array.from({ length: 10 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            size: 1 + Math.random() * 2,
            delay: Math.random() * 8,
            duration: 12 + Math.random() * 8,
            opacity: 0.15 + Math.random() * 0.25,
            drift: -20 + Math.random() * 40
        })), []
    )

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${p.left}%`,
                        bottom: '-5px',
                        width: p.size,
                        height: p.size,
                        background: p.id % 3 === 0 ? color : '#fff',
                        opacity: p.opacity,
                        boxShadow: `0 0 ${p.size * 2}px ${p.id % 3 === 0 ? color : '#fff'}`,
                        animation: `particle-float ${p.duration}s linear infinite`,
                        animationDelay: `${p.delay}s`,
                        '--drift': `${p.drift}px`
                    }}
                />
            ))}
        </div>
    )
}

/**
 * OnboardingModal - 3-slide intro for first-time users
 * Shows: Camera → Rate → Share flow
 */
export default function OnboardingModal({ onComplete, playSound, vibrate }) {
    const [currentSlide, setCurrentSlide] = useState(0)

    const slides = [
        {
            emoji: '📸',
            title: 'Snap Your Fit',
            description: 'Take a photo of your outfit and let AI judge your style',
            color: '#00d4ff',
            icon: (
                <div className="relative w-28 h-28 mx-auto mb-6">
                    {/* Camera circle with glow */}
                    <div className="absolute inset-0 rounded-full flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(0,212,255,0.05) 100%)',
                            border: '2px solid rgba(0,212,255,0.4)',
                            boxShadow: '0 0 40px rgba(0,212,255,0.3), inset 0 0 20px rgba(0,212,255,0.1)'
                        }}>
                        <span className="text-6xl" style={{ filter: 'drop-shadow(0 0 15px rgba(0,212,255,0.6))' }}>📸</span>
                    </div>
                    {/* Pulsing ring */}
                    <div className="absolute inset-0 rounded-full" style={{
                        border: '2px solid rgba(0,212,255,0.3)',
                        animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
                    }} />
                </div>
            )
        },
        {
            emoji: '⚡',
            title: 'Get Rated Instantly',
            description: 'AI analyzes your color, fit, and style in seconds',
            color: '#00ff88',
            icon: (
                <div className="relative w-28 h-28 mx-auto mb-6">
                    {/* Score circle */}
                    <div className="absolute inset-0 rounded-full flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(135deg, rgba(0,255,136,0.2) 0%, rgba(0,212,255,0.1) 100%)',
                            border: '3px solid rgba(0,255,136,0.5)',
                            boxShadow: '0 0 40px rgba(0,255,136,0.3), inset 0 0 20px rgba(0,255,136,0.1)'
                        }}>
                        <span className="text-3xl font-black" style={{
                            background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>87</span>
                    </div>
                    {/* Progress arc hint */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="56" cy="56" r="50" fill="none" stroke="rgba(0,255,136,0.15)" strokeWidth="4" />
                        <circle cx="56" cy="56" r="50" fill="none" stroke="url(#scoreGrad)" strokeWidth="4"
                            strokeDasharray={`${0.87 * 314} 314`} strokeLinecap="round" />
                        <defs>
                            <linearGradient id="scoreGrad">
                                <stop offset="0%" stopColor="#00ff88" />
                                <stop offset="100%" stopColor="#00d4ff" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
            )
        },
        {
            emoji: '🔥',
            title: 'Flex & Challenge',
            description: 'Share your score and battle friends to see who dresses best',
            color: '#ff6b35',
            icon: (
                <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
                    {/* Battle emoji */}
                    <div className="flex items-center gap-2">
                        <span className="text-4xl transform -rotate-12" style={{ filter: 'drop-shadow(0 0 10px rgba(255,107,53,0.5))' }}>👤</span>
                        <span className="text-3xl font-black text-orange-400">⚔️</span>
                        <span className="text-4xl transform rotate-12" style={{ filter: 'drop-shadow(0 0 10px rgba(255,107,53,0.5))' }}>👤</span>
                    </div>
                    {/* Glow behind */}
                    <div className="absolute inset-0 rounded-full -z-10" style={{
                        background: 'radial-gradient(circle, rgba(255,107,53,0.25) 0%, transparent 70%)'
                    }} />
                </div>
            )
        }
    ]

    const handleNext = () => {
        playSound?.('click')
        vibrate?.(20)
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1)
        } else {
            // Mark onboarding complete
            localStorage.setItem('fitrate_onboarded', 'true')
            onComplete()
        }
    }

    const handleSkip = () => {
        playSound?.('click')
        vibrate?.(15)
        localStorage.setItem('fitrate_onboarded', 'true')
        onComplete()
    }

    const slide = slides[currentSlide]
    const isLastSlide = currentSlide === slides.length - 1

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{
            background: 'radial-gradient(ellipse at center, rgba(10,10,20,0.95) 0%, rgba(5,5,10,0.98) 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)'
        }}>
            {/* Skip button - FIXED to top-right of viewport */}
            {!isLastSlide && (
                <button
                    onClick={handleSkip}
                    aria-label="Skip onboarding and go to app"
                    className="fixed top-6 right-6 z-[110] px-4 py-2 text-sm text-white/50 font-bold uppercase tracking-wider hover:text-white/80 transition-all active:scale-95"
                    style={{
                        marginTop: 'env(safe-area-inset-top, 0px)',
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    Skip
                </button>
            )}

            {/* Background glow that changes with slide */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[400px] h-[400px] rounded-full transition-all duration-700" style={{
                    background: `radial-gradient(circle, ${slide.color}25 0%, transparent 60%)`,
                    top: '35%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: 'glow-breathe 4s ease-in-out infinite'
                }} />
            </div>

            <FloatingParticles color={slide.color} />

            <div className="w-full max-w-sm mx-4 flex flex-col items-center relative z-10">

                {/* Slide content with staggered animations */}
                <div
                    className="text-center"
                    key={currentSlide}
                    style={{ animation: 'stagger-fade-up 0.5s ease-out forwards' }}
                >
                    {/* Custom icon for each slide */}
                    {slide.icon}

                    {/* Title with gradient */}
                    <h2
                        className="text-2xl font-black mb-3"
                        style={{
                            background: `linear-gradient(135deg, #fff, ${slide.color})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textShadow: 'none'
                        }}
                    >
                        {slide.title}
                    </h2>

                    {/* Description */}
                    <p className="text-white/60 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                        {slide.description}
                    </p>
                </div>

                {/* Progress dots */}
                <div className="flex gap-3 mb-8">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                playSound?.('click')
                                setCurrentSlide(index)
                            }}
                            className="p-1 transition-all"
                            aria-label={`Go to slide ${index + 1}`}
                        >
                            <div
                                className="rounded-full transition-all duration-300"
                                style={{
                                    width: index === currentSlide ? 24 : 8,
                                    height: 8,
                                    background: index === currentSlide
                                        ? `linear-gradient(90deg, ${slide.color}, ${slide.color}aa)`
                                        : 'rgba(255,255,255,0.2)',
                                    boxShadow: index === currentSlide ? `0 0 12px ${slide.color}60` : 'none'
                                }}
                            />
                        </button>
                    ))}
                </div>

                {/* CTA Button with premium shine */}
                <button
                    onClick={handleNext}
                    aria-label={isLastSlide ? "Start using FitRate" : "Go to next onboarding slide"}
                    className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.97] btn-premium-shine relative overflow-hidden"
                    style={{
                        background: `linear-gradient(135deg, ${slide.color} 0%, ${slide.color}cc 100%)`,
                        color: '#000',
                        boxShadow: `0 8px 30px ${slide.color}50, 0 0 0 1px ${slide.color}30`
                    }}
                >
                    {isLastSlide ? "Let's Go! 🚀" : 'Next →'}
                </button>

                {/* Branding */}
                <p className="text-[10px] text-white/20 mt-6 uppercase tracking-widest">
                    FitRate • AI Fit Check
                </p>
            </div>
        </div>
    )
}
