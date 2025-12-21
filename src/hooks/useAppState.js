/**
 * useAppState Hook
 * 
 * Extracts core application state from App.jsx for cleaner code organization.
 * Manages: screen navigation, toast notifications, PWA state, user identity.
 */

import { useState, useEffect, useCallback } from 'react';

// Generate secure user ID
const generateUserId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const arr = new Uint8Array(16);
        crypto.getRandomValues(arr);
        return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
    }
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

export const useAppState = () => {
    // Screen & Navigation
    const [screen, setScreen] = useState('home');

    // Toast Notifications
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // PWA State
    const [isStandalone, setIsStandalone] = useState(false);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    // User Identity
    const [userId] = useState(() => {
        let id = localStorage.getItem('fitrate_user_id');
        if (!id) {
            id = generateUserId();
            localStorage.setItem('fitrate_user_id', id);
        }
        return id;
    });

    // Challenge Score (from URL)
    const [challengeScore, setChallengeScore] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return parseInt(params.get('challenge')) || null;
    });

    // Last Score (for "you improved!" messaging)
    const [lastScore, setLastScore] = useState(() => {
        const saved = localStorage.getItem('fitrate_last_score');
        return saved ? parseInt(saved) : null;
    });

    // Error State
    const [error, setError] = useState(null);
    const [errorCode, setErrorCode] = useState(null);

    // Detect standalone mode (PWA)
    useEffect(() => {
        const checkStandalone = () => {
            const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone === true ||
                document.referrer.includes('android-app://');
            setIsStandalone(isStandaloneMode);
            if (isStandaloneMode) {
                document.body.classList.add('is-standalone');
            }
            const dismissed = localStorage.getItem('fitrate_install_dismissed');
            if (!isStandaloneMode && !dismissed) {
                setShowInstallBanner(true);
            }
        };
        checkStandalone();
    }, []);

    // Display toast notification
    const displayToast = useCallback((message, duration = 2500) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), duration);
    }, []);

    // Clear challenge score
    const clearChallenge = useCallback(() => {
        setChallengeScore(null);
    }, []);

    // Update last score
    const updateLastScore = useCallback((score) => {
        localStorage.setItem('fitrate_last_score', score.toString());
        setLastScore(score);
    }, []);

    // Reset app to home
    const resetApp = useCallback(() => {
        setScreen('home');
        setError(null);
        setErrorCode(null);
    }, []);

    return {
        // Screen
        screen,
        setScreen,
        resetApp,

        // Toast
        showToast,
        toastMessage,
        displayToast,
        setShowToast,
        setToastMessage,

        // PWA
        isStandalone,
        showInstallBanner,
        setShowInstallBanner,

        // User
        userId,

        // Challenge
        challengeScore,
        setChallengeScore,
        clearChallenge,

        // Scores
        lastScore,
        updateLastScore,

        // Errors
        error,
        setError,
        errorCode,
        setErrorCode
    };
};

export default useAppState;
