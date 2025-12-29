import React from 'react';

/**
 * ModalHeader - Reusable header component for modals
 * Provides consistent styling across all modals with icon, title, subtitle, and close button
 */
export default function ModalHeader({
    title,
    subtitle,
    icon,
    onClose,
    titleColor = 'text-white',
    subtitleColor = 'text-cyan-400'
}) {
    return (
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
                {icon && (
                    <span className="text-3xl">{icon}</span>
                )}
                <div>
                    <h2 className={`text-xl font-black ${titleColor}`}>
                        {title}
                    </h2>
                    {subtitle && (
                        <p className={`text-sm font-medium ${subtitleColor}`}>
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
                    aria-label="Close modal"
                >
                    ✕
                </button>
            )}
        </div>
    );
}
