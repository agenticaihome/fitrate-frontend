import React from 'react'

// Map backend error codes to user-friendly messages
const ERROR_CONFIG = {
    LIMIT_REACHED: {
        emoji: '⏰',
        title: 'Daily Limit Reached',
        message: 'Come back tomorrow for 2 more free scans, or upgrade to Pro for 25/day!',
        showUpgrade: true
    },
    PROVIDER_ERROR: {
        emoji: '🤖',
        title: 'AI Taking a Break',
        message: 'Our style AI is busy right now. Try again in a moment!',
        showUpgrade: false
    },
    UPLOAD_ERROR: {
        emoji: '📸',
        title: 'Image Issue',
        message: 'Try a clearer outfit photo (JPEG, PNG, or WebP under 10MB)',
        showUpgrade: false
    },
    INVALID_OUTFIT: {
        emoji: '👕',
        title: 'Can\'t See Your Outfit',
        message: 'Make sure your photo shows clothing clearly! Try a full-body or mirror selfie.',
        showUpgrade: false
    },
    INVALID_SPAM_BLOCKED: {
        emoji: '🚫',
        title: 'Too Many Attempts',
        message: 'Please wait a bit and try again with a valid outfit photo.',
        showUpgrade: false
    },
    BOT_DETECTED: {
        emoji: '🤖',
        title: 'Access Blocked',
        message: 'Please use a regular web browser to access FitRate.',
        showUpgrade: false
    },
    SERVER_ERROR: {
        emoji: '⚡',
        title: 'Something Went Wrong',
        message: 'Our servers hiccuped. Please try again!',
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
                    onClick={onReset}
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
                {onHome && (
                    <button
                        onClick={onHome}
                        className="w-full py-3 mt-2 text-sm font-medium transition-all active:opacity-60"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                        ← Back to Home
                    </button>
                )}
            </div>
        </div>
    )
}

