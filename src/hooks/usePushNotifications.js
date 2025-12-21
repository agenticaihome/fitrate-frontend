/**
 * usePushNotifications Hook
 * 
 * Manages push notification subscription state and API interactions.
 * 
 * Usage:
 *   const { isSupported, isSubscribed, subscribe, unsubscribe, error } = usePushNotifications(userId)
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://fitrate-production.up.railway.app';

/**
 * Convert base64 VAPID key to Uint8Array
 */
const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const usePushNotifications = (userId) => {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [vapidPublicKey, setVapidPublicKey] = useState(null);

    // Check if push is supported
    useEffect(() => {
        const supported = 'serviceWorker' in navigator &&
            'PushManager' in window &&
            'Notification' in window;
        setIsSupported(supported);

        if (supported) {
            // Check current subscription status
            navigator.serviceWorker.ready.then(registration => {
                registration.pushManager.getSubscription().then(subscription => {
                    setIsSubscribed(!!subscription);
                });
            });
        }
    }, []);

    // Fetch VAPID public key
    useEffect(() => {
        if (!isSupported) return;

        fetch(`${API_BASE}/api/push/vapid-public-key`)
            .then(res => res.json())
            .then(data => {
                if (data.publicKey) {
                    setVapidPublicKey(data.publicKey);
                }
            })
            .catch(err => {
                console.warn('Failed to fetch VAPID key:', err);
            });
    }, [isSupported]);

    /**
     * Subscribe to push notifications
     */
    const subscribe = useCallback(async () => {
        if (!isSupported || !vapidPublicKey || !userId) {
            setError('Push notifications not available');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Request notification permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                setError('Notification permission denied');
                setIsLoading(false);
                return false;
            }

            // Get service worker registration
            const registration = await navigator.serviceWorker.ready;

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });

            // Send subscription to backend
            const response = await fetch(`${API_BASE}/api/push/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    subscription: subscription.toJSON()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save subscription');
            }

            setIsSubscribed(true);
            localStorage.setItem('fitrate_push_subscribed', 'true');
            setIsLoading(false);
            return true;

        } catch (err) {
            console.error('Push subscription failed:', err);
            setError(err.message);
            setIsLoading(false);
            return false;
        }
    }, [isSupported, vapidPublicKey, userId]);

    /**
     * Unsubscribe from push notifications
     */
    const unsubscribe = useCallback(async () => {
        if (!isSupported || !userId) return false;

        setIsLoading(true);
        setError(null);

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
            }

            // Remove from backend
            await fetch(`${API_BASE}/api/push/unsubscribe`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            setIsSubscribed(false);
            localStorage.removeItem('fitrate_push_subscribed');
            setIsLoading(false);
            return true;

        } catch (err) {
            console.error('Push unsubscribe failed:', err);
            setError(err.message);
            setIsLoading(false);
            return false;
        }
    }, [isSupported, userId]);

    return {
        isSupported,
        isSubscribed,
        isLoading,
        error,
        subscribe,
        unsubscribe
    };
};

export default usePushNotifications;
