/**
 * FitRate Brand Constants - Single Source of Truth
 * 
 * All user-facing text must match these constants.
 * No page may invent its own explanation.
 */

// ============================================
// PRODUCT IDENTITY
// ============================================
export const BRAND = {
    name: 'FitRate',
    tagline: 'Your AI Style Coach',

    // Official descriptions - use these verbatim
    description: {
        short: 'FitRate is an AI-powered outfit rating app that analyzes your outfit and gives you a fun, shareable verdict.',
        medium: 'Upload a photo of your outfit and get an instant AI verdict you can share with friends.',
        long: 'FitRate uses AI to analyze visible outfit elements like colors, layering, and overall style balance. Get instant ratings, fun verdicts, and shareable results.'
    },

    // What FitRate is NOT
    notFor: ['fitness', 'body rating', 'face rating', 'health'],
};

// ============================================
// SUPPORT & CONTACT
// ============================================
export const SUPPORT = {
    email: 'support@agenticaihome.com',
    helpText: 'Need help? Email us at support@agenticaihome.com and we\'ll get back to you.',
};

// ============================================
// AI EXPLANATION (Legal-safe, consistent)
// ============================================
export const AI_DISCLAIMER = {
    explanation: 'FitRate uses AI to analyze visible outfit elements like colors, layering, and overall style balance.',
    limitations: 'AI ratings are subjective and for entertainment purposes. We don\'t guarantee accuracy.',
    privacy: 'Your photos are analyzed instantly and never stored on our servers.',
};

// ============================================
// VOICE & TONE GUIDELINES
// ============================================
export const VOICE = {
    personality: 'A friendly, confident fashion-savvy AI — not snarky, not clinical, not influencer cringe.',
    traits: ['Clear', 'Calm', 'Fun but grounded', 'Confident without arrogance', 'Non-judgmental', 'Human-readable'],
    never: ['Talk down to users', 'Overuse slang', 'Use conflicting metaphors', 'Body-shame', 'Judge fitness'],
};

// ============================================
// STANDARDIZED ERROR MESSAGES
// 2025 conversational, friendly tone
// ============================================
export const ERRORS = {
    generic: 'Oops, our AI blinked. One more time? 🔄',
    connection: 'Lost you for a sec. Reconnecting... 🔌',
    imageTooLarge: 'That pic is TOO fire (literally too big). Try a smaller one?',
    analysisTimeout: 'AI is thinking extra hard... maybe too hard. Try again?',
    invalidImage: 'Need to see some fabric to rate! Show us the fit 👕',
    serviceUnavailable: 'AI is touching up its makeup. Back in a sec! 💄',
};

// ============================================
// BUTTON LABELS (Approved - Action-oriented)
// ============================================
export const BUTTONS = {
    primary: {
        rateOutfit: 'Rate My Outfit',
        seeVerdict: 'Reveal My Score 🎯',
        shareResult: 'Flex This Fit 💪',
        unlockPro: 'Unlock Unlimited',
        tryAgain: 'Go Again 🔄',
    },
    secondary: {
        notNow: 'Maybe later',
        goBack: '← Back',
        rateAnother: 'New Fit',
    },
};

// ============================================
// PAYWALL COPY (Scan Packs - Clash of Clans style)
// ============================================
export const PAYWALL = {
    headline: 'Unlock Unlimited Scans',
    subheadline: 'All 12 AI judges + unlimited everything!',
    // Free tier limits (for display)
    freeTier: {
        scans: '2/day',
        arenaBattles: '5/day',
        aiModes: '6 judges',
        weeklyEvents: '1/week',
    },
    // Pro tier benefits (for display)
    proTier: {
        scans: 'Unlimited',
        arenaBattles: 'Unlimited',
        aiModes: 'All 12 judges',
        weeklyEvents: 'Unlimited',
    },
    benefits: [
        'Unlimited scans (no daily limit)',
        'All 12 AI personalities unlocked',
        'Unlimited arena battles',
        'Unlimited event entries',
    ],
    reassurance: '🔐 Secure · Instant access',
    outOfScans: 'You\'ve been busy! Get more scans to keep the fits coming 🔥',
};
