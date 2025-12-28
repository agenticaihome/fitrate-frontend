import React, { useState, useEffect, useMemo } from 'react'
import {
    getSeasonData,
    getCurrentTier,
    getSeasonTimeRemaining,
    getAllTimeStats,
    getWinRate,
    getUnlockedMilestones,
    SEASON_TIERS,
    MILESTONES
} from '../utils/arenaStorage'
import { getDisplayName } from '../utils/displayNameStorage'

// ============================================
// ANIMATED BACKGROUND
// ============================================
const AnimatedBackground = ({ color }) => {
    const particles = useMemo(() =>
        Array.from({ length: 20 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            size: 1 + Math.random() * 3,
            delay: Math.random() * 10,
            duration: 15 + Math.random() * 25,
            opacity: 0.1 + Math.random() * 0.2
        })), []
    )

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
                className="absolute w-80 h-80 rounded-full blur-3xl opacity-15"
                style={{
                    background: `radial-gradient(circle, ${color}, transparent)`,
                    top: '-10%',
                    right: '-15%',
                    animation: 'orb-drift 10s ease-in-out infinite'
                }}
            />
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${p.left}%`,
                        bottom: '-5px',
                        width: p.size,
                        height: p.size,
                        background: p.id % 2 === 0 ? color : '#00ff88',
                        opacity: p.opacity,
                        animation: `float-up ${p.duration}s linear infinite`,
                        animationDelay: `${p.delay}s`
                    }}
                />
            ))}
        </div>
    )
}

// ============================================
// LEADERBOARD ENTRY ROW
// ============================================
const LeaderboardRow = ({ rank, name, points, tier, isCurrentUser, modeColor }) => {
    const rankColors = {
        1: 'linear-gradient(135deg, #ffd700, #ffaa00)',
        2: 'linear-gradient(135deg, #c0c0c0, #a0a0a0)',
        3: 'linear-gradient(135deg, #cd7f32, #8b4513)'
    }

    const rankBg = rankColors[rank] || 'rgba(255,255,255,0.05)'

    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isCurrentUser ? 'scale-[1.02]' : ''}`}
            style={{
                background: isCurrentUser
                    ? `linear-gradient(135deg, ${modeColor}20, ${modeColor}10)`
                    : 'rgba(255,255,255,0.03)',
                border: isCurrentUser ? `1px solid ${modeColor}40` : '1px solid transparent'
            }}
        >
            {/* Rank Badge */}
            <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                style={{
                    background: rankBg,
                    color: rank <= 3 ? '#000' : '#fff'
                }}
            >
                {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
                <div className={`font-bold truncate ${isCurrentUser ? 'text-white' : 'text-white/80'}`}>
                    {name}
                    {isCurrentUser && <span className="ml-1 text-xs text-white/40">(You)</span>}
                </div>
            </div>

            {/* Tier Badge */}
            <div
                className="px-2 py-1 rounded-md text-xs font-bold"
                style={{ background: `${tier.color}20`, color: tier.color }}
            >
                {tier.emoji}
            </div>

            {/* Points */}
            <div className="text-right">
                <div className="font-black text-white">{points.toLocaleString()}</div>
                <div className="text-[10px] text-white/40">pts</div>
            </div>
        </div>
    )
}

// ============================================
// LEADERBOARD SKELETON (Loading State)
// ============================================
const LeaderboardSkeleton = () => (
    <div className="space-y-2 animate-pulse">
        {[1, 2, 3, 4, 5].map(i => (
            <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)' }}
            >
                <div className="w-8 h-8 rounded-lg bg-white/10" />
                <div className="flex-1">
                    <div className="h-4 w-24 bg-white/10 rounded mb-1" />
                </div>
                <div className="w-8 h-8 rounded-md bg-white/10" />
                <div className="text-right">
                    <div className="h-4 w-12 bg-white/10 rounded" />
                </div>
            </div>
        ))}
    </div>
)

// ============================================
// TIER PROGRESS CARD
// ============================================
const TierProgressCard = ({ tierData, seasonData, modeColor }) => {
    const { tier, nextTier, progress, pointsToNext } = tierData

    return (
        <div
            className="p-4 rounded-2xl relative overflow-hidden"
            style={{
                background: `linear-gradient(135deg, ${tier.color}15, transparent)`,
                border: `1px solid ${tier.color}30`
            }}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <span
                        className="text-4xl"
                        style={{ filter: `drop-shadow(0 0 10px ${tier.color})` }}
                    >
                        {tier.emoji}
                    </span>
                    <div>
                        <div className="font-black text-white text-lg">{tier.name}</div>
                        <div className="text-xs text-white/50">{seasonData.points} points</div>
                    </div>
                </div>

                {nextTier && (
                    <div className="text-right">
                        <div className="text-xs text-white/40">Next tier</div>
                        <div className="flex items-center gap-1">
                            <span className="text-lg">{nextTier.emoji}</span>
                            <span className="text-xs text-white/60">{pointsToNext} pts</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Progress bar */}
            {nextTier && (
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${progress}%`,
                            background: `linear-gradient(90deg, ${tier.color}, ${nextTier.color})`
                        }}
                    />
                </div>
            )}

            {!nextTier && (
                <div className="text-center text-sm text-white/50 mt-2">
                    🏆 Maximum tier reached!
                </div>
            )}
        </div>
    )
}

// ============================================
// MILESTONES SECTION
// ============================================
const MilestonesSection = ({ unlockedMilestones, allMilestones }) => {
    return (
        <div className="space-y-2">
            <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3">
                Achievements ({unlockedMilestones.length}/{allMilestones.length})
            </h3>
            <div className="grid grid-cols-3 gap-2">
                {allMilestones.map((milestone) => {
                    const isUnlocked = unlockedMilestones.some(m => m.id === milestone.id)
                    return (
                        <div
                            key={milestone.id}
                            className={`p-3 rounded-xl text-center transition-all ${isUnlocked ? '' : 'opacity-40 grayscale'}`}
                            style={{
                                background: isUnlocked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${isUnlocked ? 'rgba(255,255,255,0.1)' : 'transparent'}`
                            }}
                        >
                            <div className="text-2xl mb-1">{milestone.emoji}</div>
                            <div className="text-[10px] font-bold text-white/70 truncate">
                                {milestone.name}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ============================================
// SEASON REWARDS PREVIEW
// ============================================
const SeasonRewardsPreview = ({ tierData }) => {
    const rewards = [
        { tier: 'Bronze', reward: '+1 Scan', emoji: '🥉' },
        { tier: 'Silver', reward: '+3 Scans + Frame', emoji: '🥈' },
        { tier: 'Gold', reward: '+5 Scans + Gold Frame', emoji: '🥇' },
        { tier: 'Platinum', reward: '+10 Scans + Animated Frame', emoji: '💎' },
        { tier: 'Diamond', reward: '+25 Scans + Champion Badge', emoji: '👑' }
    ]

    const currentTierIndex = SEASON_TIERS.findIndex(t => t.name === tierData.tier.name)

    return (
        <div className="space-y-2">
            <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3">
                Season Rewards
            </h3>
            {rewards.map((r, i) => {
                const isAchieved = i <= currentTierIndex
                const isCurrent = i === currentTierIndex
                return (
                    <div
                        key={r.tier}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-all ${isCurrent ? 'bg-white/10' : ''} ${!isAchieved ? 'opacity-40' : ''}`}
                    >
                        <span className="text-xl">{r.emoji}</span>
                        <div className="flex-1">
                            <div className="text-sm font-medium text-white/80">{r.tier}</div>
                            <div className="text-xs text-white/50">{r.reward}</div>
                        </div>
                        {isAchieved && <span className="text-green-400 text-sm">✓</span>}
                    </div>
                )
            })}
        </div>
    )
}

// ============================================
// MAIN ARENA LEADERBOARD COMPONENT
// ============================================
export default function ArenaLeaderboard({
    onClose,
    modeColor = '#00d4ff',
    playSound,
    vibrate,
    userId
}) {
    const [activeTab, setActiveTab] = useState('leaderboard') // leaderboard | achievements | rewards
    const [leaderboardData, setLeaderboardData] = useState([])
    const [loading, setLoading] = useState(true)
    const [apiUserRank, setApiUserRank] = useState(null)

    // Fallback mock data (used if API fails)
    const MOCK_LEADERBOARD = [
        { id: 1, name: 'StyleKing👑', points: 2450, tier: SEASON_TIERS[4] },
        { id: 2, name: 'FashionQueen', points: 2180, tier: SEASON_TIERS[4] },
        { id: 3, name: 'DripMaster', points: 1920, tier: SEASON_TIERS[4] },
        { id: 4, name: 'FitCheck_Pro', points: 1650, tier: SEASON_TIERS[4] },
        { id: 5, name: 'AuraGod99', points: 1420, tier: SEASON_TIERS[4] },
        { id: 6, name: 'VibeCheck', points: 890, tier: SEASON_TIERS[3] },
        { id: 7, name: 'SlayAllDay', points: 720, tier: SEASON_TIERS[3] },
        { id: 8, name: 'Fashionista', points: 580, tier: SEASON_TIERS[3] },
        { id: 9, name: 'CleanFits', points: 340, tier: SEASON_TIERS[2] },
        { id: 10, name: 'NewPlayer', points: 120, tier: SEASON_TIERS[1] }
    ]

    const API_BASE = (import.meta.env.VITE_API_URL || 'https://fitrate-production.up.railway.app/api/analyze').replace('/api/analyze', '/api')

    // Fetch leaderboard from API
    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true)
                const url = userId
                    ? `${API_BASE}/arena/leaderboard?userId=${userId}`
                    : `${API_BASE}/arena/leaderboard`
                const res = await fetch(url)

                if (res.ok) {
                    const data = await res.json()
                    if (data.success && data.entries?.length > 0) {
                        // Transform API data to match component format
                        const entries = data.entries.map(entry => ({
                            id: entry.rank,
                            name: entry.displayName,
                            points: entry.points,
                            tier: entry.tier ? SEASON_TIERS.find(t => t.name === entry.tier.name) || SEASON_TIERS[0] : SEASON_TIERS[0],
                            isCurrentUser: entry.isCurrentUser
                        }))
                        setLeaderboardData(entries)
                        if (data.userRank) setApiUserRank(data.userRank)
                    } else {
                        // No entries yet - show empty state
                        setLeaderboardData([])
                    }
                } else {
                    setLeaderboardData([])
                }
            } catch (err) {
                console.log('[ArenaLeaderboard] API fetch failed:', err.message)
                setLeaderboardData([])
            } finally {
                setLoading(false)
            }
        }

        fetchLeaderboard()
    }, [userId, API_BASE])

    const seasonData = getSeasonData()
    const tierData = getCurrentTier()
    const timeRemaining = getSeasonTimeRemaining()
    const stats = getAllTimeStats()
    const winRate = getWinRate()
    const unlockedMilestones = getUnlockedMilestones()

    // Get display name or fallback to "You"
    const displayName = getDisplayName() || 'You'

    // Find user's position - use API rank if available, else estimate
    const userRank = apiUserRank || 6
    const userData = { id: 'user', name: displayName, points: seasonData.points, tier: tierData.tier }

    const handleTabChange = (tab) => {
        playSound?.('click')
        vibrate?.(10)
        setActiveTab(tab)
    }

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col overflow-hidden"
            style={{
                background: 'linear-gradient(180deg, #0a0a1a 0%, #0f1525 100%)'
            }}
        >
            <AnimatedBackground color={modeColor} />

            {/* Header */}
            <div className="relative z-10 px-4 pt-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => {
                            playSound?.('click')
                            vibrate?.(10)
                            onClose?.()
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        <span className="text-white text-lg">←</span>
                    </button>

                    <h1 className="text-xl font-black text-white">Arena Rankings</h1>

                    <div className="w-10" /> {/* Spacer */}
                </div>

                {/* Season Timer */}
                <div className="flex items-center justify-center gap-2 text-sm text-white/50 mb-4">
                    <span>⏱️</span>
                    <span>Season ends in {timeRemaining.days}d {timeRemaining.hours}h</span>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    {[
                        { id: 'leaderboard', label: '🏆 Ranks' },
                        { id: 'achievements', label: '🎯 Badges' },
                        { id: 'rewards', label: '🎁 Rewards' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                            style={{
                                background: activeTab === tab.id
                                    ? `linear-gradient(135deg, ${modeColor}, #00ff88)`
                                    : 'rgba(255,255,255,0.05)',
                                color: activeTab === tab.id ? '#000' : 'rgba(255,255,255,0.6)'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-6 relative z-10">
                {activeTab === 'leaderboard' && (
                    <div className="space-y-4">
                        {/* Your Progress Card */}
                        <TierProgressCard
                            tierData={tierData}
                            seasonData={seasonData}
                            modeColor={modeColor}
                        />

                        {/* Your Stats */}
                        <div
                            className="grid grid-cols-4 gap-2 p-3 rounded-xl"
                            style={{ background: 'rgba(255,255,255,0.03)' }}
                        >
                            <div className="text-center">
                                <div className="text-lg font-black text-white">{stats.totalWins}</div>
                                <div className="text-[10px] text-white/40">Wins</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black" style={{ color: modeColor }}>{winRate}%</div>
                                <div className="text-[10px] text-white/40">Rate</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-amber-400">#{userRank}</div>
                                <div className="text-[10px] text-white/40">Rank</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-black text-purple-400">{stats.totalBattles}</div>
                                <div className="text-[10px] text-white/40">Battles</div>
                            </div>
                        </div>

                        {/* Leaderboard */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider">
                                Top Players
                            </h3>
                            {loading ? (
                                <LeaderboardSkeleton />
                            ) : leaderboardData.length === 0 ? (
                                <div
                                    className="text-center py-8 rounded-xl"
                                    style={{ background: 'rgba(255,255,255,0.03)' }}
                                >
                                    <div className="text-4xl mb-3">🏆</div>
                                    <div className="text-white/80 font-bold mb-1">Be the first!</div>
                                    <div className="text-white/50 text-sm">No battles yet this season. Start competing to claim the top spot!</div>
                                </div>
                            ) : (
                                leaderboardData.slice(0, 5).map((player, i) => (
                                    <LeaderboardRow
                                        key={player.id}
                                        rank={i + 1}
                                        name={player.name}
                                        points={player.points}
                                        tier={player.tier}
                                        isCurrentUser={player.isCurrentUser}
                                        modeColor={modeColor}
                                    />
                                ))
                            )}

                            {/* Separator if user not in top 5 */}
                            {userRank > 5 && (
                                <>
                                    <div className="text-center text-white/20 py-2">• • •</div>
                                    <LeaderboardRow
                                        rank={userRank}
                                        name={displayName}
                                        points={seasonData.points}
                                        tier={tierData.tier}
                                        isCurrentUser={true}
                                        modeColor={modeColor}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'achievements' && (
                    <MilestonesSection
                        unlockedMilestones={unlockedMilestones}
                        allMilestones={MILESTONES}
                    />
                )}

                {activeTab === 'rewards' && (
                    <SeasonRewardsPreview tierData={tierData} />
                )}
            </div>

            <style>{`
                @keyframes orb-drift {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(-20px, 20px); }
                }
                @keyframes float-up {
                    0%, 100% { transform: translateY(0); opacity: 0; }
                    10% { opacity: 0.3; }
                    90% { opacity: 0.1; }
                    100% { transform: translateY(-100vh); }
                }
            `}</style>
        </div>
    )
}
