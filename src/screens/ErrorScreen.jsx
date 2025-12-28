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

export default function ErrorScreen({ error, errorCode, onReset, onUpgrade, onHome }) {
    // Get config for this error code or message
    const config = getErrorConfig(errorCode, error);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#0a0a0f] text-white" style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
        }}>
            <span className="text-6xl mb-6">{config.emoji}</span>
            <h2 className="text-2xl font-black mb-4 uppercase tracking-tight">{config.title}</h2>
            <p className="text-white/60 text-center mb-8 max-w-xs">{config.message}</p>

            <div className="w-full max-w-xs space-y-3">
                <button
                    onClick={() => {
                        // Haptic feedback to confirm click
                        if (navigator.vibrate) navigator.vibrate(20);

                        // Try the provided handler, or fall back to page reload
                        if (onReset) {
                            onReset();
                        } else {
                            // Nuclear option - full reload
                            window.location.href = '/';
                        }
                    }}
                    className="w-full py-4 rounded-2xl bg-white text-black font-black text-lg transition-all active:scale-95"
                    style={{ boxShadow: 'var(--shadow-physical)' }}
                >
                    Try Again
                </button>

                {config.showUpgrade && onUpgrade && (
                    <button
                        onClick={onUpgrade}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg transition-all active:scale-95"
                    >
                        ⚡ Upgrade to Pro
                    </button>
                )}

                {/* Home Button - Always Available Escape Route */}
                <button
                    onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(20);
                        if (onHome) {
                            onHome();
                        } else {
                            window.location.href = '/';
                        }
                    }}
                    className="w-full py-3 mt-2 text-sm font-medium transition-all active:opacity-60"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                    ← Back to Home
                </button>
            </div>
        </div>
    )
}

