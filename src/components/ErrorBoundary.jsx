import React from 'react';

/**
 * ErrorBoundary - Catches React errors and provides graceful recovery
 * 
 * Prevents iOS PWA from going completely black on JS errors.
 * Provides a user-friendly recovery option instead of a frozen screen.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error for debugging
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Could send to error tracking service here
        // e.g., Sentry, LogRocket, etc.
    }

    handleReset = () => {
        // Clear any stored state that might be causing issues
        this.setState({ hasError: false, error: null });

        // Attempt to recover by going home
        if (this.props.onReset) {
            this.props.onReset();
        } else {
            // Fallback: reload the page
            window.location.reload();
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    className="min-h-screen flex flex-col items-center justify-center p-6"
                    style={{
                        background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%)',
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
                    }}
                >
                    {/* Error Icon */}
                    <div className="text-6xl mb-6">😅</div>

                    {/* Title */}
                    <h1 className="text-2xl font-black text-white mb-2 text-center">
                        Oops! Something Glitched
                    </h1>

                    {/* Message */}
                    <p className="text-gray-300 text-center mb-8 max-w-xs">
                        Don't worry, your data is safe. Let's get you back on track.
                    </p>

                    {/* Recovery Button */}
                    <button
                        onClick={this.handleReset}
                        className="px-8 py-4 min-h-[48px] rounded-2xl font-bold text-lg transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                        style={{
                            background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                            color: '#000',
                            boxShadow: '0 4px 20px rgba(0,212,255,0.3)'
                        }}
                        aria-label="Try again and reload the application"
                    >
                        Try Again 🔄
                    </button>

                    {/* Debug info (only in dev) */}
                    {process.env.NODE_ENV !== 'production' && this.state.error && (
                        <div className="mt-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl max-w-sm">
                            <p className="text-xs text-red-400 font-mono break-all">
                                {this.state.error.toString()}
                            </p>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
