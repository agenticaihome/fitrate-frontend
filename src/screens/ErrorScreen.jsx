import React from 'react'

// Map backend error codes to user-friendly messages
// 2025 conversational, friendly, Gen Z approved
const ERROR_CONFIG = {
    LIMIT_REACHED: {
        emoji: '😅',
        title: 'You\'ve Been Busy!',
        message: 'Fresh scans drop at midnight, or unlock unlimited now ✨',
        showUpgrade: true
    },
    PROVIDER_ERROR: {
        emoji: '💄',
        title: 'AI is Getting Ready',
        message: 'Our style AI is touching up its look. Back in a sec!',
        showUpgrade: false
    },
    UPLOAD_ERROR: {
        emoji: '📸',
        title: 'Photo Didn\'t Load',
        message: 'Try a clearer pic (JPEG, PNG under 10MB works best)',
        showUpgrade: false
    },
    INVALID_OUTFIT: {
        emoji: '👀',
        title: 'Where\'s the Fit?',
        message: 'We need to see some fabric! Try a mirror selfie or full-body shot',
        showUpgrade: false
    },
    INVALID_SPAM_BLOCKED: {
        emoji: '🐌',
        title: 'Slow Down!',
        message: 'Too many attempts. Take a breath and try again in a min',
        showUpgrade: false
    },
    BOT_DETECTED: {
        emoji: '🤖',
        title: 'Beep Boop?',
        message: 'Use a regular browser to rate your fits!',
        showUpgrade: false
    },
    SERVER_ERROR: {
        emoji: '🙈',
        title: 'Oops, Our Bad',
        message: 'Servers had a moment. One more try?',
        showUpgrade: false
    }
};

// Check if error message indicates outfit not visible
function getErrorConfig(errorCode, errorMessage) {
    // First check for explicit error code
    if (errorCode && ERROR_CONFIG[errorCode]) {
        return ERROR_CONFIG[errorCode];
    }

    // Check error message for outfit-related issues
    if (errorMessage) {
        const lower = errorMessage.toLowerCase();
        if (lower.includes('outfit') || lower.includes('clothing') || lower.includes('clothes')) {
            return {
                emoji: '👕',
                title: 'Need to See Your Outfit!',
                message: errorMessage,
                showUpgrade: false
            };
        }
    }

    // Default fallback - show actual error if available
    return {
        emoji: '👗',
        title: 'Oops!',
        message: errorMessage || "We couldn't rate that one. Try a clearer outfit photo!",
        showUpgrade: false
    };
}

// Animated floating emoji component
const FloatingEmoji = ({ emoji }) => (
    <div className="relative">
        {/* Glow behind */}
        <div
            className="absolute inset-0 blur-2xl opacity-30"
            style={{
                background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)'
            }}
        />
        {/* Main emoji with bounce */}
        <span
            className="text-7xl block animate-bounce relative z-10"
            style={{ animationDuration: '2s' }}
        >
            {emoji}
        </span>
    </div>
)

export default function ErrorScreen({ error, errorCode, onReset, onUpgrade, onHome }) {
    // Get config for this error code or message
    const config = getErrorConfig(errorCode, error);

    const handleAction = (callback, fallbackUrl = '/') => {
        if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
        if (callback) {
            callback();
        } else {
            window.location.href = fallbackUrl;
        }
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-8 text-white"
            style={{
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
                background: 'linear-gradient(180deg, #0a0a12 0%, #1a1a2e 50%, #0a0a12 100%)'
            }}
        >
            {/* Animated Emoji */}
            <FloatingEmoji emoji={config.emoji} />

            {/* Title */}
            <h2 className="text-2xl font-black mb-3 mt-6 text-center bg-gradient-to-r from-white to-white/80 bg-clip-text">
                {config.title}
            </h2>

            {/* Message */}
            <p className="text-gray-300 text-center mb-8 max-w-xs leading-relaxed">
                {config.message}
            </p>

            {/* Action Buttons */}
            <div className="w-full max-w-xs space-y-3">
                {/* Primary: Try Again */}
                <button
                    onClick={() => handleAction(onReset)}
                    className="w-full py-4 rounded-2xl bg-white text-black font-black text-lg 
                        transition-all active:scale-95 hover:shadow-lg
                        animate-pulse hover:animate-none"
                    style={{
                        boxShadow: '0 8px 0 rgba(255,255,255,0.1), 0 15px 30px rgba(0, 0, 0, 0.3)',
                        animationDuration: '3s'
                    }}
                >
                    🔄 Try Again
                </button>

                {/* Upgrade CTA (if applicable) */}
                {config.showUpgrade && onUpgrade && (
                    <button
                        onClick={() => handleAction(onUpgrade)}
                        className="w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-95"
                        style={{
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                            boxShadow: '0 4px 20px rgba(139,92,246,0.4)'
                        }}
                    >
                        ⚡ Unlock Unlimited
                    </button>
                )}

                {/* Back to Home */}
                <button
                    onClick={() => handleAction(onHome)}
                    className="w-full py-3 mt-2 text-sm font-medium text-gray-400 
                        transition-all active:opacity-60 hover:text-gray-300"
                >
                    ← Back to Home
                </button>
            </div>
        </div>
    )
}
