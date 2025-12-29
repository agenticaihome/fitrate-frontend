import React, { useState, useEffect } from 'react'

/**
 * EventCountdown
 * 
 * Live countdown timer showing time until event ends.
 * Updates every second for last hour, every minute otherwise.
 */
export default function EventCountdown({ endDate }) {
    const [timeLeft, setTimeLeft] = useState(null)

    useEffect(() => {
        if (!endDate) return

        const calculateTimeLeft = () => {
            const end = new Date(endDate).getTime()
            const now = Date.now()
            const diff = end - now

            if (diff <= 0) {
                return { expired: true }
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)

            return { days, hours, minutes, seconds, expired: false }
        }

        setTimeLeft(calculateTimeLeft())

        // Update every second if less than 1 hour, otherwise every minute
        const interval = setInterval(() => {
            const newTime = calculateTimeLeft()
            setTimeLeft(newTime)
        }, 1000)

        return () => clearInterval(interval)
    }, [endDate])

    if (!timeLeft || timeLeft.expired) {
        return (
            <div className="flex items-center gap-1 text-amber-400 font-bold text-sm animate-pulse">
                <span>⏰</span>
                <span>Week ending...</span>
            </div>
        )
    }

    const { days, hours, minutes, seconds } = timeLeft
    const isUrgent = days === 0 && hours < 6
    const isVeryUrgent = days === 0 && hours === 0

    return (
        <div className={`flex items-center gap-2 ${isUrgent ? 'animate-pulse' : ''}`}>
            <span className="text-lg">⏱️</span>
            <div className="flex items-center gap-1">
                {days > 0 && (
                    <div className="flex items-center">
                        <span className={`font-black text-lg ${isUrgent ? 'text-amber-400' : 'text-white'}`}>
                            {days}
                        </span>
                        <span className="text-xs text-gray-400 ml-0.5 mr-2">d</span>
                    </div>
                )}
                <div className="flex items-center">
                    <span className={`font-black text-lg ${isUrgent ? 'text-amber-400' : 'text-white'}`}>
                        {String(hours).padStart(2, '0')}
                    </span>
                    <span className="text-xs text-gray-400 ml-0.5 mr-1">h</span>
                </div>
                <div className="flex items-center">
                    <span className={`font-black text-lg ${isUrgent ? 'text-amber-400' : 'text-white'}`}>
                        {String(minutes).padStart(2, '0')}
                    </span>
                    <span className="text-xs text-gray-400 ml-0.5 mr-1">m</span>
                </div>
                {isVeryUrgent && (
                    <div className="flex items-center">
                        <span className="font-black text-lg text-red-400">
                            {String(seconds).padStart(2, '0')}
                        </span>
                        <span className="text-xs text-gray-400 ml-0.5">s</span>
                    </div>
                )}
            </div>
            {isUrgent && (
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                    HURRY!
                </span>
            )}
        </div>
    )
}
