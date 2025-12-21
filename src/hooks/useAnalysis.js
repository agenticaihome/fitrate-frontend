/**
 * useAnalysis Hook
 * 
 * Manages analysis/scan state and logic.
 * Handles: scores, uploaded image, mode, share data.
 */

import { useState, useCallback } from 'react';

export const useAnalysis = () => {
    // Analysis Results
    const [scores, setScores] = useState(null);
    const [uploadedImage, setUploadedImage] = useState(null);

    // Mode Selection
    const [mode, setMode] = useState('roast'); // Default to roast - funnier, more shareable

    // Share State
    const [shareData, setShareData] = useState(null);
    const [shareFormat, setShareFormat] = useState('story'); // 'story' = 9:16, 'feed' = 1:1

    // Daily Streak
    const [dailyStreak, setDailyStreak] = useState(() => {
        try {
            const stored = localStorage.getItem('fitrate_streak');
            if (stored) {
                const { date, count } = JSON.parse(stored);
                const lastDate = new Date(date);
                const today = new Date();
                const diffTime = Math.abs(today - lastDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 2) return count;
                return 0;
            }
        } catch (e) { return 0; }
        return 0;
    });

    /**
     * Update streak after successful scan
     */
    const updateStreak = useCallback(() => {
        const stored = localStorage.getItem('fitrate_streak');
        let newStreak = 1;
        const today = new Date().toDateString();
        if (stored) {
            const { date, count } = JSON.parse(stored);
            if (date !== today) newStreak = count + 1;
            else newStreak = count;
        }
        localStorage.setItem('fitrate_streak', JSON.stringify({ date: today, count: newStreak }));
        setDailyStreak(newStreak);
        return newStreak;
    }, []);

    /**
     * Clear analysis state for new scan
     */
    const clearAnalysis = useCallback(() => {
        setScores(null);
        setUploadedImage(null);
        setShareData(null);
    }, []);

    /**
     * Set analysis results with enhanced data
     */
    const setAnalysisResults = useCallback((newScores, image) => {
        setScores(newScores);
        if (image) setUploadedImage(image);
    }, []);

    return {
        // Scores
        scores,
        setScores,
        setAnalysisResults,
        clearAnalysis,

        // Image
        uploadedImage,
        setUploadedImage,

        // Mode
        mode,
        setMode,

        // Share
        shareData,
        setShareData,
        shareFormat,
        setShareFormat,

        // Streak
        dailyStreak,
        setDailyStreak,
        updateStreak
    };
};

export default useAnalysis;
