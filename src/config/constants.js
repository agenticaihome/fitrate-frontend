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
};

export const PRICES = {
    // Legacy (keeping for any existing subscribers)
    PRO_WEEKLY: 2.99,

    // 5-Tier Scan Pack System (Clash of Clans style)
    SCAN_PACK_3: 0.99,      // Tier 1: Tiny - removes friction
    SCAN_PACK_10: 2.99,     // Tier 2: Starter - "smart choice"
    SCAN_PACK_25: 4.99,     // Tier 3: Popular ⭐ - sweet spot
    SCAN_PACK_50: 7.99,     // Tier 4: Best Value
    SCAN_PACK_100: 12.99,   // Tier 5: Pro Pack - anchor

    // First-Time Buyer Offer (one-time only)
    FIRST_TIME_SCANS: 10,
    FIRST_TIME_PRICE: 0.99,
    FIRST_TIME_ORIGINAL: 2.99,
};

export const RESETS = {
    TIME_UTC: '00:00', // Midnight UTC
    TIME_DISPLAY: 'Midnight UTC',
};

// Stripe Checkout Links
// YOUR EXISTING PRODUCTS: 5 scans, 15 scans, 50 scans, proRoast
export const STRIPE_LINKS = {
    // ============================================
    // 5-TIER SCAN PACKS
    // You have 4 existing links - edit them in Stripe:
    // ============================================

    // Tier 1: 3 scans @ $0.99 (EDIT your old 5-scan product → change to 3 scans @ $0.99)
    tinyPack: 'https://buy.stripe.com/aFa7sN1OEeZl0iXbjdfYY04',

    // Tier 2: 10 scans @ $2.99 (EDIT your old 15-scan product → change to 10 scans @ $2.99)
    starterPack: 'https://buy.stripe.com/5kQ4gBfFu9F1ghVfztfYY05',

    // Tier 3: 25 scans @ $4.99 ⭐ MOST POPULAR (CREATE NEW or edit another)
    popularPack: 'NEED_NEW_25_SCAN_LINK',

    // Tier 4: 50 scans @ $7.99 (EDIT your old 50-scan product → change price to $7.99)
    valuePack: 'https://buy.stripe.com/4gMaEZ1OEeZlc1FcnhfYY06',

    // Tier 5: 100 scans @ $12.99 (EDIT your old proRoast → change to 100 scans @ $12.99)
    proPack: 'https://buy.stripe.com/3cI9AVgJy7wT3v9gDxfYY01',

    // First-Time Offer: 10 scans @ $0.99 (CREATE NEW in Stripe)
    firstTimeOffer: 'NEED_TO_CREATE_FIRST_TIME_LINK',

    // ============================================
    // SUBSCRIPTIONS - 25 scans/day (CREATE NEW)
    // ============================================

    // Monthly: $4.99/mo - 25 scans/day
    proMonthly: 'NEED_TO_CREATE_MONTHLY_SUB',

    // Yearly: $29.99/yr - 25 scans/day (50% off = "2 months free")
    proYearly: 'NEED_TO_CREATE_YEARLY_SUB',
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
