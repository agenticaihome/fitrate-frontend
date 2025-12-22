export default function ModalHeader({ title, subtitle, icon, onClose }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                {icon && <span className="text-2xl">{icon}</span>}
                <div>
                    <h2 className="text-xl font-bold text-white leading-tight">{title}</h2>
                    {subtitle && <p className="text-xs text-gray-400 font-medium">{subtitle}</p>}
                </div>
            </div>

            {/* Consistent Close Button */}
            <button
                onClick={onClose}
                className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all active:scale-90"
                aria-label="Close"
            >
                <span className="text-white text-xl leading-none mt-[-2px]">✕</span>
            </button>
        </div>
    )
}
