
// Aesthetics logic could go here too if shared
export const getScoreColor = (score) => {
    if (score >= 90) return '#00ff88' // Green
    if (score >= 70) return '#00d4ff' // Cyan
    if (score >= 50) return '#ffd700' // Gold/Yellow
    return '#ff4444' // Red
}

export const getPercentile = (score) => {
    if (score >= 95) return 99
    if (score >= 90) return 96
    if (score >= 85) return 91
    if (score >= 80) return 84
    if (score >= 75) return 73
    if (score >= 70) return 61
    if (score >= 65) return 48
    if (score >= 60) return 35
    return Math.floor(score * 0.4)
}
