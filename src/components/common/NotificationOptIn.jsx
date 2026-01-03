/**
 * NotificationOptIn Component
 * 
 * Shown after first successful scan to prompt for push notification permission.
 * Dismissible and remembers user's choice.
 */

import React, { useState, useEffect } from 'react';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { vibrate } from '../../utils/soundEffects';

export default function NotificationOptIn({ userId, onClose }) {
    const { isSupported, isSubscribed, isLoading, subscribe } = usePushNotifications(userId);
    const [dismissed, setDismissed] = useState(false);

    // Check if user already dismissed or subscribed
    useEffect(() => {
        const wasDismissed = localStorage.getItem('fitrate_push_dismissed');
        const wasSubscribed = localStorage.getItem('fitrate_push_subscribed');
        if (wasDismissed || wasSubscribed) {
            setDismissed(true);
        }
    }, []);

    // Don't show if not supported, already subscribed, or dismissed
    if (!isSupported || isSubscribed || dismissed) {
        return null;
    }

    const handleEnable = async () => {
        vibrate(20);
        const success = await subscribe();
        if (success) {
            onClose?.();
        }
    };

    const handleDismiss = () => {
        vibrate(10);
        localStorage.setItem('fitrate_push_dismissed', 'true');
        setDismissed(true);
        onClose?.();
    };

    return (
        <div
            className="w-full max-w-sm mx-auto p-4 rounded-2xl border backdrop-blur-xl animate-fade-in"
            style={{
                background: 'linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(0,255,136,0.05) 100%)',
                borderColor: 'rgba(0,212,255,0.25)',
                boxShadow: '0 0 30px rgba(0,212,255,0.1)'
            }}
        >
            <div className="flex items-start gap-3">
                <span className="text-2xl">🔔</span>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-white mb-1">
                        Get Daily Style Reminders
                    </h3>
                    <p className="text-xs text-gray-300 mb-3">
                        We'll remind you to rate your OOTD and never miss a chance to flex
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleEnable}
                            disabled={isLoading}
                            className="flex-1 py-2 px-3 min-h-[44px] rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-white"
                            style={{
                                background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                                color: '#000'
                            }}
                            aria-label="Enable push notifications"
                        >
                            {isLoading ? 'Enabling...' : 'Enable 🔥'}
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="py-2 px-3 min-h-[44px] rounded-xl text-xs font-bold text-gray-400 transition-all active:scale-95 hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-cyan-400"
                            aria-label="Dismiss notification prompt"
                        >
                            Not now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
