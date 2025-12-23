/**
 * FitRate Application Constants
 * Single Source of Truth for Limits, Pricing, and Links
 */

export const LIMITS = {
    // Scans - Simplified Model: 2 Free Gemini scans/day
    // Pro scans (GPT-4o) earned via referrals or subscription
    FREE_SCANS_DAILY: 2,            // Gemini-powered free scans
    TOTAL_FREE_DAILY: 2,            // For user display
    PRO_SCANS_DAILY: 25,            // Soft cap to prevent abuse

    // Weekly Event
    FREE_EVENT_ENTRIES_WEEKLY: 1,  // Free users get 1 entry per week
    PRO_EVENT_ENTRIES_DAILY: 5,    // Pro users can submit up to 5/day
    WINNER_COOLDOWN_WEEKS: 4,      // Previous winners sit out 4 weeks

    // Referral Rewards: 3 shares = 1 Savage Roast
    SHARES_PER_SAVAGE_ROAST: 3,
};

export const PRICES = {
    PRO_WEEKLY: 2.99,
    PRO_ROAST_ONE_OFF: 0.99,
    SCAN_PACK_5: 1.99,
    SCAN_PACK_15: 3.99,
    SCAN_PACK_50: 9.99,
};

export const RESETS = {
    TIME_UTC: '00:00', // Midnight UTC
    TIME_DISPLAY: 'Midnight UTC',
};

// Stripe Checkout Links
export const STRIPE_LINKS = {
    proWeekly: 'https://buy.stripe.com/5kQ28tdxm3gD6HlgDxfYY02',
    proRoast: 'https://buy.stripe.com/3cI9AVgJy7wT3v9gDxfYY01',

    // Scan Packs (one-time)
    starterPack: 'https://buy.stripe.com/aFa7sN1OEeZl0iXbjdfYY04',
    popularPack: 'https://buy.stripe.com/5kQ4gBfFu9F1ghVfztfYY05',
    powerPack: 'https://buy.stripe.com/4gMaEZ1OEeZlc1FcnhfYY06'
};

// Internal Routes & Modal Keys
export const ROUTES = {
    HOME: 'home',
    RESULTS: 'results',
    PAYWALL: 'paywall',
    LIMIT_REACHED: 'limit-reached',
    PRO_WELCOME: 'pro-welcome',
    PRO_EMAIL_PROMPT: 'pro-email-prompt',
};
