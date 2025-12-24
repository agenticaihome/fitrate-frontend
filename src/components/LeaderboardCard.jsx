import React, { useState, useEffect } from 'react';

// Fun rank badges with emojis
const getRankBadge = (rank) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '🔥';
    return `#${rank}`;
};

// Color for rank
const getRankColor = (rank) => {
    if (rank === 1) return '#ffd700';
    if (rank === 2) return '#c0c0c0';
    if (rank === 3) return '#cd7f32';
    if (rank <= 10) return '#ff6b35';
    return '#ffffff';
};

/**
 * LeaderboardCard - Today's Top Fits preview component
 * 
 * Shows top 3-5 entries from the daily leaderboard
 * Tappable to expand to full leaderboard view
 */
export default function LeaderboardCard({
    onViewFull,
    userRank = null,
    playSound,
    vibrate
}) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch leaderboard on mount
    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/analyze', '/api') || 'https://fitrate-production.up.railway.app/api';
                const response = await fetch(`${API_BASE}/leaderboard/today`);
                const data = await response.json();

                if (data.success) {
                    setLeaderboard(data.leaderboard || []);
                } else {
                    setError('Failed to load');
                }
            } catch (err) {
                console.error('[Leaderboard] Fetch error:', err);
                setError('Offline');
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();

        // Refresh every 30 seconds
        const interval = setInterval(fetchLeaderboard, 30000);
        return () => clearInterval(interval);
    }, []);

    // Loading state
    if (loading) {
        return (
            <div className="w-full rounded-2xl p-4" style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                border: '1px solid rgba(255,255,255,0.08)'
            }}>
                <div className="flex items-center justify-center gap-2 text-white/40">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                    <span className="text-sm">Loading rankings...</span>
                </div>
            </div>
        );
    }

    // Error or empty state
    if (error || leaderboard.length === 0) {
        return (
            <div className="w-full rounded-2xl p-4" style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                border: '1px solid rgba(255,255,255,0.08)'
            }}>
                <div className="text-center text-white/50 text-sm">
                    {error || 'No fits rated today yet. Be the first! 🏆'}
                </div>
            </div>
        );
    }

    // Show top 3
    const topEntries = leaderboard.slice(0, 3);

    return (
        <div
            className="w-full rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-[0.98]"
            style={{
                background: 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(255,107,53,0.05) 100%)',
                border: '1px solid rgba(255,215,0,0.2)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
            onClick={() => {
                playSound?.('click');
                vibrate?.(10);
                onViewFull?.();
            }}
        >
            {/* Header */}
            <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🏆</span>
                    <span className="text-xs font-black uppercase tracking-widest text-yellow-400">
                        Today's Top Fits
                    </span>
                </div>
                <span className="text-[10px] text-white/40 uppercase tracking-wide">
                    Live
                </span>
            </div>

            {/* Leaderboard entries */}
            <div className="px-4 pb-3 space-y-2">
                {topEntries.map((entry, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-3 py-2 px-3 rounded-xl"
                        style={{
                            background: index === 0
                                ? 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,215,0,0.05) 100%)'
                                : 'rgba(255,255,255,0.03)',
                            border: index === 0 ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.05)'
                        }}
                    >
                        {/* Rank badge */}
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm"
                            style={{
                                background: index === 0
                                    ? 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)'
                                    : 'rgba(255,255,255,0.1)',
                                color: index === 0 ? '#000' : '#fff',
                                boxShadow: index === 0 ? '0 2px 10px rgba(255,215,0,0.4)' : 'none'
                            }}
                        >
                            {getRankBadge(entry.rank)}
                        </div>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white truncate">
                                {entry.displayName}
                            </div>
                            <div className="text-[10px] text-white/40">
                                {entry.title}
                            </div>
                        </div>

                        {/* Score */}
                        <div
                            className="text-xl font-black"
                            style={{ color: getRankColor(entry.rank) }}
                        >
                            {entry.score}
                        </div>
                    </div>
                ))}
            </div>

            {/* User's rank (if available) */}
            {userRank && userRank > 3 && (
                <div className="px-4 pb-3">
                    <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                        <span className="text-xs text-white/50">Your rank</span>
                        <span className="text-sm font-bold" style={{ color: getRankColor(userRank) }}>
                            #{userRank}
                        </span>
                    </div>
                </div>
            )}

            {/* Footer - tap to expand */}
            <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5 flex items-center justify-center gap-1">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">
                    Tap to see full leaderboard
                </span>
                <span className="text-white/40">→</span>
            </div>
        </div>
    );
}
