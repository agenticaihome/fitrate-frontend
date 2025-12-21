/**
 * usePayments Hook
 * 
 * Manages payment-related state and checkout flow.
 * Handles: Pro status, checkout, scans remaining, purchased scans.
 */

import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/analyze', '/api') ||
    'https://fitrate-production.up.railway.app/api';

// Daily free scan limit
const FREE_SCANS_DAILY = 3;

export const usePayments = (userId) => {
    // Pro Status
    const [isPro, setIsPro] = useState(() => localStorage.getItem('fitrate_pro') === 'true');
    const [proEmail, setProEmail] = useState('');

    // Checkout State
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const [showDeclineOffer, setShowDeclineOffer] = useState(false);
    const [declineCountdown, setDeclineCountdown] = useState(null);

    // Scans
    const [scansRemaining, setScansRemaining] = useState(() => {
        const today = new Date().toDateString();
        const stored = localStorage.getItem('fitrate_scans');
        if (stored) {
            const { date, count } = JSON.parse(stored);
            if (date === today) return Math.max(0, FREE_SCANS_DAILY - count);
        }
        return FREE_SCANS_DAILY;
    });
    const [purchasedScans, setPurchasedScans] = useState(0);
    const [proRoasts, setProRoasts] = useState(0);

    // Email prompt state
    const [emailChecking, setEmailChecking] = useState(false);
    const [emailInput, setEmailInput] = useState('');

    // Time until daily reset
    const [timeUntilReset, setTimeUntilReset] = useState(null);

    /**
     * Check if user has Pro access
     */
    const checkProStatus = useCallback(async (emailToCheck) => {
        if (!emailToCheck && !userId) return false;

        try {
            const response = await fetch(`${API_BASE}/pro/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    email: emailToCheck
                })
            });
            const data = await response.json();

            if (data.isPro) {
                setIsPro(true);
                localStorage.setItem('fitrate_pro', 'true');
                if (emailToCheck) {
                    setProEmail(emailToCheck);
                    localStorage.setItem('fitrate_pro_email', emailToCheck);
                }
                return true;
            }
            return false;
        } catch (err) {
            console.error('Pro check failed:', err);
            return false;
        }
    }, [userId]);

    /**
     * Start Stripe checkout
     */
    const startCheckout = useCallback(async (product) => {
        setCheckoutLoading(true);

        try {
            const response = await fetch(`${API_BASE}/checkout/create-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product,
                    userId,
                    successUrl: `${window.location.origin}?success=true`,
                    cancelUrl: `${window.location.origin}?canceled=true`
                })
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (err) {
            console.error('Checkout failed:', err);
            setCheckoutLoading(false);
        }
    }, [userId]);

    /**
     * Grant Pro status
     */
    const grantPro = useCallback(() => {
        setIsPro(true);
        localStorage.setItem('fitrate_pro', 'true');
    }, []);

    /**
     * Consume a scan
     */
    const consumeScan = useCallback(() => {
        const today = new Date().toDateString();
        const stored = localStorage.getItem('fitrate_scans');
        let count = 1;
        if (stored) {
            const { date, count: storedCount } = JSON.parse(stored);
            if (date === today) count = storedCount + 1;
        }
        localStorage.setItem('fitrate_scans', JSON.stringify({ date: today, count }));
        setScansRemaining(Math.max(0, FREE_SCANS_DAILY - count));
    }, []);

    /**
     * Update scans from server response
     */
    const updateScansFromServer = useCallback((scanInfo) => {
        if (scanInfo) {
            const bonus = scanInfo.bonusRemaining || 0;
            setScansRemaining(scanInfo.scansRemaining + bonus);
            const used = scanInfo.scansUsed || 1;
            localStorage.setItem('fitrate_scans', JSON.stringify({
                date: new Date().toDateString(),
                count: used
            }));
        }
    }, []);

    return {
        // Pro Status
        isPro,
        setIsPro,
        proEmail,
        setProEmail,
        checkProStatus,
        grantPro,

        // Checkout
        checkoutLoading,
        setCheckoutLoading,
        showPaywall,
        setShowPaywall,
        showDeclineOffer,
        setShowDeclineOffer,
        declineCountdown,
        setDeclineCountdown,
        startCheckout,

        // Scans
        scansRemaining,
        setScansRemaining,
        purchasedScans,
        setPurchasedScans,
        proRoasts,
        setProRoasts,
        consumeScan,
        updateScansFromServer,

        // Email
        emailChecking,
        setEmailChecking,
        emailInput,
        setEmailInput,

        // Reset timer
        timeUntilReset,
        setTimeUntilReset
    };
};

export default usePayments;
