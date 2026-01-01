/**
 * Toast Notification System
 * 
 * In-app toast notifications for reactions, events, etc.
 * Slides in from top, auto-dismisses
 */

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react'

// Toast context for global access
const ToastContext = createContext(null)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

// Toast types with styling
const TOAST_STYLES = {
    success: {
        bg: 'bg-emerald-500/20',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        icon: '✓'
    },
    error: {
        bg: 'bg-red-500/20',
        border: 'border-red-500/30',
        text: 'text-red-400',
        icon: '✕'
    },
    info: {
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        icon: 'ℹ'
    },
    reaction: {
        bg: 'bg-orange-500/20',
        border: 'border-orange-500/30',
        text: 'text-orange-400',
        icon: '🔥'
    },
    celebration: {
        bg: 'bg-purple-500/20',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        icon: '🎉'
    }
}

// Single Toast Component
function Toast({ id, type = 'info', message, emoji, onDismiss }) {
    const [isExiting, setIsExiting] = useState(false)
    const style = TOAST_STYLES[type] || TOAST_STYLES.info

    const handleDismiss = useCallback(() => {
        setIsExiting(true)
        setTimeout(() => onDismiss(id), 200)
    }, [id, onDismiss])

    useEffect(() => {
        const timer = setTimeout(handleDismiss, 3000)
        return () => clearTimeout(timer)
    }, [handleDismiss])

    return (
        <div
            onClick={handleDismiss}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl cursor-pointer
                ${style.bg} ${style.border} ${style.text}
                transition-all duration-200 shadow-lg`}
            style={{
                animation: isExiting
                    ? 'toast-exit 0.2s ease-in forwards'
                    : 'toast-enter 0.3s ease-out forwards'
            }}
        >
            <span className="text-lg">{emoji || style.icon}</span>
            <span className="text-sm font-medium flex-1">{message}</span>
        </div>
    )
}

// Toast Container - renders all toasts
function ToastContainer({ toasts, removeToast }) {
    if (toasts.length === 0) return null

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[100] flex flex-col items-center gap-2 p-4 pointer-events-none"
            style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
            {toasts.map(toast => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast {...toast} onDismiss={removeToast} />
                </div>
            ))}
            <style>{`
                @keyframes toast-enter {
                    0% {
                        transform: translateY(-100%);
                        opacity: 0;
                    }
                    100% {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                @keyframes toast-exit {
                    0% {
                        transform: translateY(0);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-50%);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    )
}

// Toast Provider - wrap app with this
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = 'info', emoji = null) => {
        const id = Date.now() + Math.random()
        setToasts(prev => [...prev, { id, message, type, emoji }])
        return id
    }, [])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    // Convenience methods
    const toast = {
        success: (msg, emoji) => addToast(msg, 'success', emoji),
        error: (msg, emoji) => addToast(msg, 'error', emoji),
        info: (msg, emoji) => addToast(msg, 'info', emoji),
        reaction: (msg, emoji) => addToast(msg, 'reaction', emoji || '🔥'),
        celebration: (msg, emoji) => addToast(msg, 'celebration', emoji || '🎉'),
        custom: addToast
    }

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    )
}

export default ToastProvider
