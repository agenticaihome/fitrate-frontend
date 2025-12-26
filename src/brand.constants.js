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
// ============================================
export const ERRORS = {
    generic: 'Something went wrong — try again!',
    connection: 'Connection issue — try again in a moment.',
    imageTooLarge: 'Image is too large. Please try a smaller photo.',
    analysisTimeout: 'Analysis took too long. Please try again.',
    invalidImage: 'We need to see some clothing for a proper rating!',
    serviceUnavailable: 'Our AI is taking a quick break. Try again in a moment.',
};

// ============================================
// BUTTON LABELS (Approved)
// ============================================
export const BUTTONS = {
    primary: {
        rateOutfit: 'Rate My Outfit',
        seeVerdict: 'See My Verdict',
        shareResult: 'Share Result',
        unlockPro: 'Unlock Unlimited',
        tryAgain: 'Try Again',
    },
    secondary: {
        notNow: 'Not now',
        goBack: '← Back',
        rateAnother: 'Rate Another Fit',
    },
};

// ============================================
// PAYWALL COPY (Scan Packs - Clash of Clans style)
// ============================================
export const PAYWALL = {
    headline: 'Get More Scans',
    subheadline: 'All 12 AI modes included free!',
    benefits: [
        '2 free scans every day',
        'All 12 AI modes unlocked',
        'Purchased scans never expire',
        'Instant access after purchase',
    ],
    reassurance: '🔐 Secure checkout · Instant access',
    outOfScans: 'You\'ve used your free scans for today. Get more to keep rating!',
};
