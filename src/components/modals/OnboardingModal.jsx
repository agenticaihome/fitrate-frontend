import React, { useState } from 'react'

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="w-full max-w-sm mx-4 flex flex-col items-center">

                {/* Skip button */}
                {!isLastSlide && (
                    <button
                        onClick={handleSkip}
                        className="absolute top-6 right-6 text-xs text-white/40 font-bold uppercase tracking-wider hover:text-white/60 transition-colors"
                    >
                        Skip
                    </button>
                )}

                {/* Slide content */}
                <div
                    className="text-center transition-all duration-300"
                    key={currentSlide}
                >
                    {/* Emoji */}
                    <div
                        className="text-8xl mb-6 animate-bounce"
                        style={{ animationDuration: '2s' }}
                    >
                        {slide.emoji}
                    </div>

                    {/* Title */}
                    <h2
                        className="text-2xl font-black text-white mb-3"
                        style={{ textShadow: `0 0 30px ${slide.color}` }}
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

                {/* CTA Button */}
                <button
                    onClick={handleNext}
                    className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.97]"
                    style={{
                        background: `linear-gradient(135deg, ${slide.color} 0%, ${slide.color}cc 100%)`,
                        color: '#000',
                        boxShadow: `0 8px 30px ${slide.color}50`
                    }}
                >
                    {isLastSlide ? "Let's Go! 🚀" : 'Next'}
                </button>

                {/* Branding */}
                <p className="text-[10px] text-white/20 mt-6 uppercase tracking-widest">
                    FitRate • AI Fit Check
                </p>
            </div>
        </div>
    )
}
