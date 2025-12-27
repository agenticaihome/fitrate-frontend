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
            color: '#00d4ff'
        },
        {
            emoji: '⚡',
            title: 'Get Rated Instantly',
            description: 'AI analyzes your color, fit, and style in seconds',
            color: '#00ff88'
        },
        {
            emoji: '🔥',
            title: 'Flex & Challenge',
            description: 'Share your score and battle friends to see who dresses best',
            color: '#ff6b35'
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
        localStorage.setItem('fitrate_onboarded', 'true')
        onComplete()
    }

    const slide = slides[currentSlide]
    const isLastSlide = currentSlide === slides.length - 1

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)'
        }}>
            {/* Background glow that changes with slide */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[500px] h-[500px] rounded-full transition-all duration-700" style={{
                    background: `radial-gradient(circle, ${slide.color}30 0%, transparent 70%)`,
                    top: '30%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: 'glow-breathe 4s ease-in-out infinite'
                }} />
            </div>

            <FloatingParticles color={slide.color} />

            <div className="w-full max-w-sm mx-4 flex flex-col items-center relative z-10">

                {!isLastSlide && (
                    <button
                        onClick={handleSkip}
                        aria-label="Skip onboarding and go to app"
                        className="absolute top-6 right-6 text-xs text-white/40 font-bold uppercase tracking-wider hover:text-white/60 transition-colors"
                    >
                        Skip
                    </button>
                )}

                {/* Slide content with staggered animations */}
                <div
                    className="text-center"
                    key={currentSlide}
                    style={{ animation: 'stagger-fade-up 0.5s ease-out forwards' }}
                >
                    {/* Emoji with glow */}
                    <div
                        className="text-8xl mb-6 relative inline-block"
                        style={{
                            animation: 'float-gentle 3s ease-in-out infinite',
                            filter: `drop-shadow(0 0 30px ${slide.color}60)`
                        }}
                    >
                        {slide.emoji}
                        {/* Breathing ring behind emoji */}
                        <div className="absolute inset-0 rounded-full pointer-events-none" style={{
                            background: `radial-gradient(circle, ${slide.color}20 0%, transparent 70%)`,
                            animation: 'ring-breathe 2s ease-in-out infinite',
                            transform: 'scale(1.5)'
                        }} />
                    </div>

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
                    <p className="text-white/60 text-sm mb-8 max-w-xs mx-auto">
                        {slide.description}
                    </p>
                </div>

                {/* Progress dots */}
                <div className="flex gap-2 mb-8">
                    {slides.map((_, index) => (
                        <div
                            key={index}
                            className="w-2 h-2 rounded-full transition-all duration-300"
                            style={{
                                background: index === currentSlide ? slide.color : 'rgba(255,255,255,0.2)',
                                transform: index === currentSlide ? 'scale(1.5)' : 'scale(1)'
                            }}
                        />
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
                    {isLastSlide ? "Let's Go!" : 'Next'}
                </button>

                {/* Branding */}
                <p className="text-[10px] text-white/20 mt-6 uppercase tracking-widest">
                    FitRate • AI Fit Check
                </p>
            </div>
        </div>
    )
}
