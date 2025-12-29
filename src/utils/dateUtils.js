/**
 * Date and time utility functions for FitRate
 */

/**
 * Formats a remaining time in milliseconds to a human-readable string
 * @param {number} ms - Time remaining in milliseconds
 * @returns {string} Formatted time string (e.g., "23h 45m", "5m 30s", "Just now")
 */
export function formatTimeRemaining(ms) {
    if (!ms || ms <= 0) return 'Just now';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        const remainingHours = hours % 24;
        return remainingHours > 0
            ? `${days}d ${remainingHours}h`
            : `${days}d`;
    }

    if (hours > 0) {
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0
            ? `${hours}h ${remainingMinutes}m`
            : `${hours}h`;
    }

    if (minutes > 0) {
        const remainingSeconds = seconds % 60;
        return remainingSeconds > 0
            ? `${minutes}m ${remainingSeconds}s`
            : `${minutes}m`;
    }

    return `${seconds}s`;
}

/**
 * Calculates time until midnight UTC (daily reset)
 * @returns {number} Milliseconds until midnight UTC
 */
export function getTimeUntilMidnightUTC() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setUTCDate(midnight.getUTCDate() + 1);
    midnight.setUTCHours(0, 0, 0, 0);
    return midnight.getTime() - now.getTime();
}

/**
 * Formats a date for display
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

/**
 * Formats a date for display with time
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date/time string
 */
export function formatDateTime(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}
