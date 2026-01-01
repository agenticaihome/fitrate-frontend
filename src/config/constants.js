/**
 * FitRate Application Constants
 * Single Source of Truth for Limits, Pricing, and Links
 */

export const LIMITS = {
    // Scans - Simplified Model: 2 Free Gemini scans/day
    // Pro scans (GPT-4o) earned via referrals or subscription
    FREE_SCANS_DAILY: 2,            // Gemini-powered free scans
    TOTAL_FREE_DAILY: 2,            // For user display
    PRO_SCANS_DAILY: 100,           // Fair use limit for 'Unlimited' subscribers

    // Weekly Event - SAME FOR EVERYONE
    EVENT_ENTRIES_WEEKLY: 1,        // All users get 1 entry per week
};

export const PRICES = {
    // 5-Tier Scan Pack System (Optimized for teens)
    SCAN_PACK_3: 0.99,      // Tier 1: Impulse - removes friction
    SCAN_PACK_10: 2.99,     // Tier 2: Starter
    SCAN_PACK_25: 4.99,     // Tier 3: Popular ⭐ - sweet spot
    SCAN_PACK_50: 6.99,     // Tier 4: Value - best $/scan
    SCAN_PACK_100: 9.99,    // Tier 5: Mega - anchor

    // First-Time Buyer Offer (one-time only)
    FIRST_TIME_SCANS: 10,
    FIRST_TIME_PRICE: 0.99,
    FIRST_TIME_ORIGINAL: 2.99,

    // Subscriptions
    PRO_MONTHLY: 3.99,
    PRO_YEARLY: 29.99,
};

export const RESETS = {
    TIME_UTC: '00:00', // Midnight UTC
    TIME_DISPLAY: 'Midnight UTC',
};

// Stripe Checkout Links (Production)
export const STRIPE_LINKS = {
    // First-Time Offer: 10 scans @ $0.99 (67% OFF)
    firstTimeOffer: 'https://buy.stripe.com/3cI9AVgJy7wT3v9gDxfYY01',

    // Scan Packs
    impulsePack: 'https://buy.stripe.com/8x28wR50Q5oLaXBcnhfYY07',   // 3 scans @ $0.99
    starterPack: 'https://buy.stripe.com/00w7sN64UbN97Lp0EzfYY08',   // 10 scans @ $2.99
    popularPack: 'https://buy.stripe.com/5kQbJ350Q2czc1FbjdfYY09',   // 25 scans @ $4.99 ⭐
    valuePack: 'https://buy.stripe.com/eVq00ldxm04r7Lp871fYY0a',     // 50 scans @ $6.99
    megaPack: 'https://buy.stripe.com/28EfZj9h618ve9NgDxfYY0b',      // 100 scans @ $9.99

    // Subscriptions
    proMonthly: 'https://buy.stripe.com/14AeVf3WMaJ5d5JevpfYY0c',    // $3.99/mo
    proYearly: 'https://buy.stripe.com/aFaaEZ9h66sP2r5bjdfYY0d',     // $29.99/yr
};

// Subscription Pricing
export const SUBSCRIPTIONS = {
    MONTHLY_PRICE: 4.99,
    YEARLY_PRICE: 29.99,
    YEARLY_SAVINGS: 30,      // $60 - $30 = $30 saved
    SCANS_PER_DAY: 25,
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
