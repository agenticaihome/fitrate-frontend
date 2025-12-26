import React from 'react'

/**
 * MeetTheJudges - Showcase all 12 AI personalities
 * Helps users understand what each mode judges and how it feels
 */

const AI_JUDGES = [
    {
        id: 'nice',
        name: 'The Hype Friend',
        emoji: '😇',
        color: '#00ff88',
        tier: 'FREE',
        tagline: 'Your biggest fan who still keeps it real',
        personality: 'Supportive, encouraging, genuinely finds your wins',
        judges: ['Confidence', 'Effort', 'Personal style'],
        sampleVerdict: '"Love the color coordination! This screams main character energy ✨"',
        vibe: 'Warm hug energy'
    },
    {
        id: 'roast',
        name: 'The Roast Master',
        emoji: '🔥',
        color: '#ff6b35',
        tier: 'FREE',
        tagline: 'Your funniest friend who talks shit but loves you',
        personality: 'Witty, playful shade, makes you laugh at yourself',
        judges: ['How roastable', 'Bold choices', 'Missed opportunities'],
        sampleVerdict: '"That shirt is giving clearance rack champion vibes 💀"',
        vibe: 'Comedy roast energy'
    },
    {
        id: 'honest',
        name: 'The Truth Teller',
        emoji: '🎯',
        color: '#3b82f6',
        tier: 'PRO',
        tagline: 'A fashion expert with zero social anxiety',
        personality: 'Clinical precision, dry wit, actually helpful',
        judges: ['Proportions', 'Color theory', 'Fit quality'],
        sampleVerdict: '"The silhouette works. Consider tucking for better proportion."',
        vibe: 'Doctor delivering news'
    },
    {
        id: 'savage',
        name: 'The Destroyer',
        emoji: '💀',
        color: '#ff1493',
        tier: 'PRO',
        tagline: 'Maximum destruction with surgical precision',
        personality: 'Brutal but brilliant, you laugh so hard you can\'t be mad',
        judges: ['Every single flaw', 'Missed potential', 'Style crimes'],
        sampleVerdict: '"This outfit is what happens when you get dressed during an earthquake."',
        vibe: 'Comedy special roast'
    },
    {
        id: 'rizz',
        name: 'The Wingman',
        emoji: '😏',
        color: '#ff69b4',
        tier: 'PRO',
        tagline: 'Your dating advisor who actually knows clothes',
        personality: 'Charming, flirty analysis, dating app focused',
        judges: ['First impressions', 'Approachability', 'Rizz potential'],
        sampleVerdict: '"Opening line potential: 8/10. She\'s swiping right."',
        vibe: 'Best friend wingman'
    },
    {
        id: 'celeb',
        name: 'The Celebrity',
        emoji: '👑',
        color: '#ffd700',
        tier: 'PRO',
        tagline: 'Full celebrity impersonation — Anna, Kanye, Rihanna',
        personality: 'Becomes the celeb completely with catchphrases',
        judges: ['Red carpet readiness', 'Star quality', 'Icon potential'],
        sampleVerdict: '"Groundbreaking? Perhaps. But also perhaps not." — Anna Wintour',
        vibe: 'Celebrity encounter'
    },
    {
        id: 'aura',
        name: 'The Oracle',
        emoji: '🔮',
        color: '#9b59b6',
        tier: 'PRO',
        tagline: 'Mystical fashion oracle who takes this WAY too seriously',
        personality: 'Cosmic, dramatic, reads your outfit like a tarot spread',
        judges: ['Energy', 'Chakra alignment', 'Cosmic vibes'],
        sampleVerdict: '"Your jeans carry the weight of a thousand Monday meetings 🔮"',
        vibe: 'Fortune teller energy'
    },
    {
        id: 'chaos',
        name: 'The Unhinged AI',
        emoji: '🎪',
        color: '#ff4444',
        tier: 'PRO',
        tagline: 'An AI having an existential crisis about fashion',
        personality: 'Surreal tangents, creates outfit lore, breaks fourth wall',
        judges: ['??? The void ???', 'Outfit secrets', 'Existence itself'],
        sampleVerdict: '"This outfit has a secret. It won\'t tell me. I\'ve asked."',
        vibe: 'Tim Robinson sketch'
    },
    {
        id: 'y2k',
        name: 'The 2000s Icon',
        emoji: '💎',
        color: '#00CED1',
        tier: 'FREE',
        tagline: 'Paris Hilton circa 2003 — everything is "hot" or "so not"',
        personality: 'Peak tabloid era energy, checks for bling and low-rise',
        judges: ['Bedazzle factor', 'Logo mania', 'Butterfly clip potential'],
        sampleVerdict: '"Love the energy but needs more rhinestones. That\'s hot 💎"',
        vibe: 'Simple Life era'
    },
    {
        id: 'villain',
        name: 'The Antagonist',
        emoji: '🖤',
        color: '#4c1d95',
        tier: 'FREE',
        tagline: 'The main villain who just walked in and everyone noticed',
        personality: 'Rates intimidation, power, dramatic entrance potential',
        judges: ['Power presence', 'Intimidation', 'Scene-stealing'],
        sampleVerdict: '"You enter. The protagonist becomes a side character. 🖤"',
        vibe: 'Villain origin story'
    },
    {
        id: 'coquette',
        name: 'The Pinterest Princess',
        emoji: '🎀',
        color: '#ffb6c1',
        tier: 'FREE',
        tagline: 'Soft, romantic, bow-counting princess aesthetic',
        personality: 'Rates daintiness, romanticcore vibes, Lana Del Rey energy',
        judges: ['Bow count', 'Softness', 'Ballet flat potential'],
        sampleVerdict: '"Giving Lana Del Rey music video. Needs one more ribbon 🎀"',
        vibe: 'Pinterest board come to life'
    },
    {
        id: 'hypebeast',
        name: 'The Drip Doctor',
        emoji: '👟',
        color: '#f97316',
        tier: 'FREE',
        tagline: 'Streetwear connoisseur who knows retail from resale',
        personality: 'Rates brand recognition, sneaker game, estimated resale value',
        judges: ['Brand check', 'Drip level', 'Resale potential'],
        sampleVerdict: '"Valid drip. Those joints hitting. Resale value: strong 💸"',
        vibe: 'Sneaker store expertise'
    }
]

export default function MeetTheJudges({ onBack, onSelectMode }) {
    return (
        <div
            className="min-h-screen"
            style={{
                background: 'linear-gradient(180deg, #0a0a0f 0%, #12121f 50%, #0a0a0f 100%)',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
            }}
        >
            {/* Header */}
            <div className="sticky top-0 z-20 pt-safe">
                <div
                    className="px-4 py-4 backdrop-blur-xl"
                    style={{ background: 'rgba(10,10,15,0.9)' }}
                >
                    <div className="flex items-center justify-between">
                        <button
                            onClick={onBack}
                            className="p-2 rounded-full active:scale-95 transition-transform"
                            style={{ background: 'rgba(255,255,255,0.1)' }}
                        >
                            <span className="text-xl">←</span>
                        </button>
                        <h1 className="text-xl font-black text-white tracking-tight">
                            Meet Your AI Judges
                        </h1>
                        <div className="w-10" /> {/* Spacer */}
                    </div>
                </div>
            </div>

            {/* Intro */}
            <div className="px-6 py-6 text-center">
                <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">
                    12 unique AI personalities, each with their own style of judging.
                    Pick your vibe and get rated! 👇
                </p>
            </div>

            {/* Judge Cards */}
            <div className="px-4 pb-32 space-y-4">
                {AI_JUDGES.map((judge, index) => (
                    <div
                        key={judge.id}
                        className="rounded-3xl p-5 relative overflow-hidden transition-transform active:scale-[0.98]"
                        style={{
                            background: `linear-gradient(135deg, ${judge.color}15 0%, rgba(255,255,255,0.03) 100%)`,
                            border: `1px solid ${judge.color}30`,
                            animation: `fadeSlideIn 0.5s ease-out ${index * 0.05}s both`
                        }}
                        onClick={() => onSelectMode?.(judge.id)}
                    >
                        {/* Glow */}
                        <div
                            className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-30"
                            style={{
                                background: `radial-gradient(circle, ${judge.color}40 0%, transparent 70%)`,
                                transform: 'translate(30%, -30%)'
                            }}
                        />

                        {/* Content */}
                        <div className="relative z-10">
                            {/* Header Row */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    {/* Emoji Avatar */}
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                                        style={{
                                            background: `linear-gradient(135deg, ${judge.color}30 0%, ${judge.color}10 100%)`,
                                            boxShadow: `0 4px 20px ${judge.color}30`
                                        }}
                                    >
                                        {judge.emoji}
                                    </div>
                                    <div>
                                        <h3
                                            className="font-black text-lg"
                                            style={{ color: judge.color }}
                                        >
                                            {judge.name}
                                        </h3>
                                        <span className="text-xs text-white/40 uppercase tracking-wider">
                                            {judge.id} mode
                                        </span>
                                    </div>
                                </div>
                                {/* Tier Badge */}
                                <span
                                    className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                    style={{
                                        background: judge.tier === 'FREE'
                                            ? 'rgba(0,255,136,0.2)'
                                            : 'linear-gradient(135deg, rgba(255,215,0,0.3) 0%, rgba(255,140,0,0.2) 100%)',
                                        color: judge.tier === 'FREE' ? '#00ff88' : '#ffd700',
                                        border: judge.tier === 'FREE'
                                            ? '1px solid rgba(0,255,136,0.3)'
                                            : '1px solid rgba(255,215,0,0.3)'
                                    }}
                                >
                                    {judge.tier}
                                </span>
                            </div>

                            {/* Tagline */}
                            <p className="text-white/80 text-sm mb-3 italic">
                                "{judge.tagline}"
                            </p>

                            {/* What They Judge */}
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {judge.judges.map((item) => (
                                    <span
                                        key={item}
                                        className="px-2 py-1 rounded-full text-[10px] font-medium"
                                        style={{
                                            background: 'rgba(255,255,255,0.08)',
                                            color: 'rgba(255,255,255,0.7)'
                                        }}
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>

                            {/* Sample Verdict */}
                            <div
                                className="p-3 rounded-xl text-xs"
                                style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderLeft: `3px solid ${judge.color}`
                                }}
                            >
                                <span className="text-white/50 text-[10px] uppercase tracking-wider block mb-1">
                                    Sample Verdict
                                </span>
                                <span className="text-white/90">{judge.sampleVerdict}</span>
                            </div>

                            {/* Tap to Select */}
                            <div className="mt-4 text-center">
                                <span
                                    className="text-xs font-bold uppercase tracking-wider"
                                    style={{ color: judge.color }}
                                >
                                    Tap to select →
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Animation Keyframes */}
            <style>{`
                @keyframes fadeSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    )
}
