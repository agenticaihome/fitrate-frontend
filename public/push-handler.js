/**
 * Push Notification Handler for Service Worker
 * 
 * This file is imported by the Workbox-generated service worker
 * to handle push events and notification clicks.
 */

// Handle incoming push notifications
self.addEventListener('push', event => {
    console.log('[Push] Received push event');

    let data = {
        title: 'FitRate',
        body: 'You have a new notification',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: {}
    };

    // Parse the push data if available
    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            console.warn('[Push] Failed to parse push data:', e);
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        badge: data.badge || '/icon-192.png',
        vibrate: [100, 50, 100],
        data: data.data || {},
        actions: data.actions || [],
        // Keep notification until user interacts
        requireInteraction: false,
        // Tag for grouping similar notifications
        tag: data.tag || 'fitrate-notification'
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    console.log('[Push] Notification clicked');

    event.notification.close();

    const data = event.notification.data || {};
    const urlToOpen = data.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(windowClients => {
                // Check if app is already open
                for (const client of windowClients) {
                    if (client.url.includes('fitrate.app') && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window if not found
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Handle notification close
self.addEventListener('notificationclose', event => {
    console.log('[Push] Notification closed');
});

console.log('[Push] Push handler loaded');
