/**
 * useEvents Hook
 * 
 * Manages weekly event/challenge state.
 * Handles: current event, leaderboard, user status, event mode.
 */

import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/analyze', '/api') ||
    'https://fitrate-production.up.railway.app/api';

// Helper: Get the start of the current week (Monday) as ISO date string
const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
};

export const useEvents = (userId) => {
    // Event State
    const [currentEvent, setCurrentEvent] = useState(null);
    const [upcomingEvent, setUpcomingEvent] = useState(null);
    const [eventMode, setEventMode] = useState(false);
    const [userEventStatus, setUserEventStatus] = useState(null);

    // UI State
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showEventRules, setShowEventRules] = useState(false);
    const [showEventExplainer, setShowEventExplainer] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);

    // Explainer tracking
    const [hasSeenEventExplainer, setHasSeenEventExplainer] = useState(() => {
        return localStorage.getItem('fitrate_seen_event_explainer') === 'true';
    });

    // Free user weekly entry
    const [freeEventEntryUsed, setFreeEventEntryUsed] = useState(() => {
        const stored = localStorage.getItem('fitrate_free_event_entry');
        if (stored) {
            const { weekStart, used } = JSON.parse(stored);
            const currentWeekStart = getWeekStart(new Date());
            if (weekStart === currentWeekStart) {
                return used;
            }
        }
        return false;
    });

    /**
     * Fetch current event
     */
    const fetchEvent = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/event/current`);
            const data = await response.json();
            if (data.event) {
                setCurrentEvent(data.event);
            }
            if (data.upcomingEvent) {
                setUpcomingEvent(data.upcomingEvent);
            }
        } catch (err) {
            console.error('Failed to fetch event:', err);
        }
    }, []);

    /**
     * Fetch user's event status
     */
    const fetchUserEventStatus = useCallback(async () => {
        if (!userId || !currentEvent) return;

        try {
            const response = await fetch(`${API_BASE}/event/user-status?userId=${userId}`);
            const data = await response.json();
            if (data.status) {
                setUserEventStatus(data.status);
            }
        } catch (err) {
            console.error('Failed to fetch user status:', err);
        }
    }, [userId, currentEvent]);

    /**
     * Fetch leaderboard
     */
    const fetchLeaderboard = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/event/leaderboard`);
            const data = await response.json();
            if (data.leaderboard) {
                setLeaderboard(data.leaderboard);
            }
        } catch (err) {
            console.error('Failed to fetch leaderboard:', err);
        }
    }, []);

    /**
     * Mark explainer as seen
     */
    const markExplainerSeen = useCallback(() => {
        localStorage.setItem('fitrate_seen_event_explainer', 'true');
        setHasSeenEventExplainer(true);
    }, []);

    /**
     * Use free event entry
     */
    const useFreeEventEntry = useCallback(() => {
        const weekStart = getWeekStart(new Date());
        localStorage.setItem('fitrate_free_event_entry', JSON.stringify({
            weekStart,
            used: true
        }));
        setFreeEventEntryUsed(true);
    }, []);

    return {
        // Event
        currentEvent,
        setCurrentEvent,
        upcomingEvent,
        setUpcomingEvent,
        eventMode,
        setEventMode,
        userEventStatus,
        setUserEventStatus,
        fetchEvent,
        fetchUserEventStatus,

        // Leaderboard
        showLeaderboard,
        setShowLeaderboard,
        leaderboard,
        fetchLeaderboard,

        // UI
        showEventRules,
        setShowEventRules,
        showEventExplainer,
        setShowEventExplainer,
        hasSeenEventExplainer,
        markExplainerSeen,

        // Free entry
        freeEventEntryUsed,
        useFreeEventEntry
    };
};

export default useEvents;
