import React, { useState } from 'react'

export default function ProEmailPromptScreen({
    emailInput,
    setEmailInput,
    onSubmit, // Wraps handleEmailSubmit
    checking, // emailChecking
}) {
    const [emailError, setEmailError] = useState('')

    // Basic email validation
    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return regex.test(email)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!validateEmail(emailInput.trim())) {
            setEmailError('Please enter a valid email address')
            return
        }
        setEmailError('')
        onSubmit(e)
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0f] text-white" style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
        }}>
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-3xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-center mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Enter the email you used to pay<br />to activate your Pro access
            </p>
            <p className="text-center mb-6 text-xs" style={{ color: 'rgba(0,212,255,0.8)' }}>
                ⚠️ We need your email to activate Pro
            </p>

            <form onSubmit={handleSubmit} className="w-full max-w-sm">
                <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => { setEmailInput(e.target.value); setEmailError(''); }}
                    placeholder="your@email.com"
                    className="w-full px-5 py-4 rounded-xl text-white text-lg mb-2"
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: emailError ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.2)',
                        outline: 'none'
                    }}
                    required
                />
                {emailError && (
                    <p className="text-red-400 text-xs mb-2 ml-1">{emailError}</p>
                )}
                <button
                    type="submit"
                    disabled={checking || !emailInput.trim()}
                    className="w-full py-4 rounded-xl text-white font-bold text-lg transition-all hover:scale-[1.02] disabled:opacity-50 mt-2"
                    style={{
                        background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                        boxShadow: '0 4px 20px rgba(0,212,255,0.4)'
                    }}
                >
                    {checking ? 'Checking...' : 'Activate Pro ⚡'}
                </button>
            </form>

            <p className="text-xs mt-6 text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Your Pro access will work across all devices
            </p>
        </div>
    )
}

