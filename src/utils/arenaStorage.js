// ============================================
// ARENA STORAGE SERVICE
// Centralized persistence for Arena progression
// ============================================

const STORAGE_KEYS = {
    DAILY_RECORD: 'fitrate_arena_daily',
    STREAK_DATA: 'fitrate_arena_streak',
    ALL_TIME_STATS: 'fitrate_arena_stats',
    SEASON_DATA: 'fitrate_arena_season',
    WIN_STREAK: 'fitrate_arena_winstreak',
    CLAIMED_REWARDS: 'fitrate_arena_claimed'
}

// ============================================
// DATE UTILITIES
// ============================================
const getTodayKey = () => new Date().toISOString().split('T')[0] // YYYY-MM-DD

const getWeekKey = () => {
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000))
    const week = Math.ceil((days + startOfYear.getDay() + 1) / 7)
    return `${now.getFullYear()}-W${week}`
}

const getDayOfYear = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const diff = now - start
    return Math.floor(diff / (1000 * 60 * 60 * 24))
}

// ============================================
// DAILY STREAK SYSTEM
// Track consecutive days of Arena participation
// ============================================

// Streak reward tiers
export const STREAK_REWARDS = [
    { day: 1, reward: { type: 'scan', amount: 1 }, label: '🎯 1 Free Scan', emoji: '🔥' },
    { day: 3, reward: { type: 'badge', id: 'arena_warrior' }, label: '🏆 Arena Warrior Badge', emoji: '⚔️' },
    { day: 5, reward: { type: 'scan', amount: 3 }, label: '💎 3 Bonus Scans', emoji: '💎' },
    { day: 7, reward: { type: 'scan', amount: 5, badge: 'weekly_warrior' }, label: '👑 5 Scans + Weekly Warrior', emoji: '👑' },
    { day: 14, reward: { type: 'scan', amount: 10, unlock: 'battle_mode' }, label: '⚡ 10 Scans + Battle Mode Unlock', emoji: '⚡' },
    { day: 30, reward: { type: 'scan', amount: 20, badge: 'arena_legend' }, label: '🌟 20 Scans + Arena Legend Badge', emoji: '🌟' }
]

export const getStreakData = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.STREAK_DATA)
        if (!stored) {
            return { currentStreak: 0, lastPlayedDate: null, longestStreak: 0 }
        }
        return JSON.parse(stored)
    } catch {
        return { currentStreak: 0, lastPlayedDate: null, longestStreak: 0 }
    }
}

export const updateDailyStreak = () => {
    const today = getTodayKey()
    const data = getStreakData()

    // Already played today
    if (data.lastPlayedDate === today) {
        return { ...data, isNewDay: false, streakIncreased: false }
    }

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayKey = yesterday.toISOString().split('T')[0]

    let newStreak
    if (data.lastPlayedDate === yesterdayKey) {
        // Consecutive day - increase streak
        newStreak = data.currentStreak + 1
    } else if (data.lastPlayedDate === null) {
        // First time playing
        newStreak = 1
    } else {
        // Streak broken - restart at 1
        newStreak = 1
    }

    const updated = {
        currentStreak: newStreak,
        lastPlayedDate: today,
        longestStreak: Math.max(data.longestStreak, newStreak)
    }

    localStorage.setItem(STORAGE_KEYS.STREAK_DATA, JSON.stringify(updated))
    return { ...updated, isNewDay: true, streakIncreased: true }
}

export const getNextStreakReward = () => {
    const { currentStreak } = getStreakData()
    const claimed = getClaimedRewards()

    // Find the next unclaimed reward
    for (const reward of STREAK_REWARDS) {
        if (currentStreak >= reward.day && !claimed.includes(`streak_${reward.day}`)) {
            return { ...reward, claimable: true }
        }
        if (currentStreak < reward.day) {
            return { ...reward, claimable: false, daysUntil: reward.day - currentStreak }
        }
    }
    return null
}

// ============================================
// WIN STREAK SYSTEM
// Track consecutive wins within a session
// ============================================

export const getWinStreakData = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.WIN_STREAK)
        if (!stored) {
            return { currentWinStreak: 0, bestWinStreak: 0 }
        }
        return JSON.parse(stored)
    } catch {
        return { currentWinStreak: 0, bestWinStreak: 0 }
    }
}

export const recordWin = () => {
    const data = getWinStreakData()
    const newStreak = data.currentWinStreak + 1
    const updated = {
        currentWinStreak: newStreak,
        bestWinStreak: Math.max(data.bestWinStreak, newStreak)
    }
    localStorage.setItem(STORAGE_KEYS.WIN_STREAK, JSON.stringify(updated))

    // Determine streak bonuses
    let bonus = null
    if (newStreak === 3) bonus = { type: 'streak_3', message: '🔥 3 Win Streak!', scanBonus: 1 }
    else if (newStreak === 5) bonus = { type: 'streak_5', message: '💪 5 Win Streak! ON FIRE!', scanBonus: 2 }
    else if (newStreak === 7) bonus = { type: 'streak_7', message: '⚡ 7 Win Streak! UNSTOPPABLE!', scanBonus: 3 }
    else if (newStreak === 10) bonus = { type: 'streak_10', message: '👑 10 WIN STREAK! LEGENDARY!', scanBonus: 5, badge: 'unstoppable' }
    else if (newStreak > 10 && newStreak % 5 === 0) bonus = { type: 'streak_mega', message: `🌟 ${newStreak} WIN STREAK!`, scanBonus: 5 }

    return { ...updated, bonus }
}

export const recordLoss = () => {
    const data = getWinStreakData()
    const updated = {
        currentWinStreak: 0,
        bestWinStreak: data.bestWinStreak
    }
    localStorage.setItem(STORAGE_KEYS.WIN_STREAK, JSON.stringify(updated))
    return updated
}

export const recordTie = () => {
    // Ties don't break the streak but don't add to it
    return getWinStreakData()
}

// ============================================
// ALL-TIME STATS
// Persistent career statistics
// ============================================

export const getAllTimeStats = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.ALL_TIME_STATS)
        if (!stored) {
            return {
                totalBattles: 0,
                totalWins: 0,
                totalLosses: 0,
                totalTies: 0,
                bestWinStreak: 0,
                longestDayStreak: 0,
                firstBattleDate: null
            }
        }
        return JSON.parse(stored)
    } catch {
        return {
            totalBattles: 0,
            totalWins: 0,
            totalLosses: 0,
            totalTies: 0,
            bestWinStreak: 0,
            longestDayStreak: 0,
            firstBattleDate: null
        }
    }
}

export const updateAllTimeStats = (result) => { // 'win' | 'loss' | 'tie'
    const stats = getAllTimeStats()
    const winStreakData = getWinStreakData()
    const streakData = getStreakData()

    stats.totalBattles++
    if (result === 'win') stats.totalWins++
    else if (result === 'loss') stats.totalLosses++
    else stats.totalTies++

    stats.bestWinStreak = Math.max(stats.bestWinStreak, winStreakData.bestWinStreak)
    stats.longestDayStreak = Math.max(stats.longestDayStreak, streakData.longestStreak)

    if (!stats.firstBattleDate) {
        stats.firstBattleDate = getTodayKey()
    }

    localStorage.setItem(STORAGE_KEYS.ALL_TIME_STATS, JSON.stringify(stats))
    return stats
}

export const getWinRate = () => {
    const stats = getAllTimeStats()
    if (stats.totalBattles === 0) return 0
    return Math.round((stats.totalWins / stats.totalBattles) * 100)
}

// ============================================
// WEEKLY SEASON SYSTEM
// Reset every week, track tier progression
// ============================================

export const SEASON_TIERS = [
    { name: 'Bronze', minPoints: 0, color: '#cd7f32', emoji: '🥉' },
    { name: 'Silver', minPoints: 100, color: '#c0c0c0', emoji: '🥈' },
    { name: 'Gold', minPoints: 250, color: '#ffd700', emoji: '🥇' },
    { name: 'Platinum', minPoints: 500, color: '#e5e4e2', emoji: '💎' },
    { name: 'Diamond', minPoints: 1000, color: '#b9f2ff', emoji: '👑' }
]

export const getSeasonData = () => {
    const currentWeek = getWeekKey()
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.SEASON_DATA)
        if (!stored) {
            return { week: currentWeek, points: 0, rank: null }
        }
        const data = JSON.parse(stored)
        // Reset for new week
        if (data.week !== currentWeek) {
            const newData = { week: currentWeek, points: 0, rank: null, previousWeek: data }
            localStorage.setItem(STORAGE_KEYS.SEASON_DATA, JSON.stringify(newData))
            return newData
        }
        return data
    } catch {
        return { week: currentWeek, points: 0, rank: null }
    }
}

export const addSeasonPoints = (result, winStreak = 0) => {
    const data = getSeasonData()

    let pointsEarned = 0
    if (result === 'win') pointsEarned = 10
    else if (result === 'tie') pointsEarned = 3
    else pointsEarned = 1 // Losses still give 1 point (participation)

    // Win streak bonus
    if (winStreak >= 3 && result === 'win') {
        pointsEarned += Math.min(winStreak, 10) // Max +10 bonus
    }

    data.points += pointsEarned
    localStorage.setItem(STORAGE_KEYS.SEASON_DATA, JSON.stringify(data))

    return { ...data, pointsEarned }
}

export const getCurrentTier = () => {
    const { points } = getSeasonData()
    let currentTier = SEASON_TIERS[0]

    for (const tier of SEASON_TIERS) {
        if (points >= tier.minPoints) {
            currentTier = tier
        }
    }

    // Find next tier
    const currentIndex = SEASON_TIERS.indexOf(currentTier)
    const nextTier = SEASON_TIERS[currentIndex + 1] || null
    const pointsToNext = nextTier ? nextTier.minPoints - points : 0

    return {
        tier: currentTier,
        nextTier,
        pointsToNext,
        progress: nextTier ? ((points - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100 : 100
    }
}

// ============================================
// CLAIMED REWARDS TRACKING
// ============================================

export const getClaimedRewards = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.CLAIMED_REWARDS)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

export const claimReward = (rewardId) => {
    const claimed = getClaimedRewards()
    if (!claimed.includes(rewardId)) {
        claimed.push(rewardId)
        localStorage.setItem(STORAGE_KEYS.CLAIMED_REWARDS, JSON.stringify(claimed))
    }
    return claimed
}

// ============================================
// DAILY RECORD (Enhanced from existing)
// ============================================

export const getDailyArenaRecord = () => {
    try {
        const todayKey = getTodayKey()
        const stored = localStorage.getItem(STORAGE_KEYS.DAILY_RECORD)
        if (stored) {
            const data = JSON.parse(stored)
            if (data.date === todayKey) {
                return data
            }
        }
        return { date: todayKey, wins: 0, losses: 0, ties: 0 }
    } catch {
        return { date: getTodayKey(), wins: 0, losses: 0, ties: 0 }
    }
}

export const recordArenaResult = (result) => { // 'win' | 'loss' | 'tie'
    // Update daily record
    const record = getDailyArenaRecord()
    if (result === 'win') record.wins++
    else if (result === 'loss') record.losses++
    else record.ties++
    localStorage.setItem(STORAGE_KEYS.DAILY_RECORD, JSON.stringify(record))

    // Update win streak
    let winStreakResult
    if (result === 'win') {
        winStreakResult = recordWin()
    } else if (result === 'loss') {
        winStreakResult = recordLoss()
    } else {
        winStreakResult = recordTie()
    }

    // Update all-time stats
    const allTimeStats = updateAllTimeStats(result)

    // Add season points
    const seasonResult = addSeasonPoints(result, winStreakResult.currentWinStreak)

    return {
        dailyRecord: record,
        winStreak: winStreakResult,
        allTimeStats,
        seasonPoints: seasonResult,
        bonus: winStreakResult.bonus
    }
}

// ============================================
// ACHIEVEMENT MILESTONES
// ============================================

export const MILESTONES = [
    { id: 'first_win', name: 'First Victory', description: 'Win your first Arena battle', emoji: '🎯', check: (stats) => stats.totalWins >= 1 },
    { id: 'ten_wins', name: 'Sharpshooter', description: 'Win 10 Arena battles', emoji: '🏹', check: (stats) => stats.totalWins >= 10 },
    { id: 'fifty_wins', name: 'Arena Master', description: 'Win 50 Arena battles', emoji: '⚔️', check: (stats) => stats.totalWins >= 50 },
    { id: 'hundred_wins', name: 'Legendary', description: 'Win 100 Arena battles', emoji: '💀', check: (stats) => stats.totalWins >= 100 },
    { id: 'streak_5', name: 'Hot Streak', description: 'Achieve a 5-win streak', emoji: '🔥', check: (stats) => stats.bestWinStreak >= 5 },
    { id: 'streak_10', name: 'Unstoppable', description: 'Achieve a 10-win streak', emoji: '⚡', check: (stats) => stats.bestWinStreak >= 10 },
    { id: 'day_streak_7', name: 'Weekly Warrior', description: 'Play Arena 7 days in a row', emoji: '🗓️', check: (stats) => stats.longestDayStreak >= 7 },
    { id: 'day_streak_30', name: 'Arena Legend', description: 'Play Arena 30 days in a row', emoji: '👑', check: (stats) => stats.longestDayStreak >= 30 },
    { id: 'hundred_battles', name: 'Battle Hardened', description: 'Complete 100 Arena battles', emoji: '🛡️', check: (stats) => stats.totalBattles >= 100 }
]

export const getUnlockedMilestones = () => {
    const stats = getAllTimeStats()
    const winStreak = getWinStreakData()
    const dayStreak = getStreakData()

    const combinedStats = {
        ...stats,
        bestWinStreak: Math.max(stats.bestWinStreak, winStreak.bestWinStreak),
        longestDayStreak: Math.max(stats.longestDayStreak, dayStreak.longestStreak)
    }

    return MILESTONES.filter(m => m.check(combinedStats))
}

export const getNextMilestone = () => {
    const stats = getAllTimeStats()
    const winStreak = getWinStreakData()
    const dayStreak = getStreakData()

    const combinedStats = {
        ...stats,
        bestWinStreak: Math.max(stats.bestWinStreak, winStreak.bestWinStreak),
        longestDayStreak: Math.max(stats.longestDayStreak, dayStreak.longestStreak)
    }

    return MILESTONES.find(m => !m.check(combinedStats)) || null
}

// ============================================
// SEASON COUNTDOWN
// ============================================

export const getSeasonTimeRemaining = () => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysUntilSunday = (7 - dayOfWeek) % 7 || 7 // Next Sunday

    const nextSunday = new Date(now)
    nextSunday.setDate(now.getDate() + daysUntilSunday)
    nextSunday.setHours(0, 0, 0, 0)

    const diff = nextSunday - now
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    return { days, hours, endDate: nextSunday }
}
