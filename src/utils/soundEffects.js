/**
 * Simple Synthesized Sound Effects using Web Audio API
 * No external assets required.
 */

const AudioContext = window.AudioContext || window.webkitAudioContext;
let ctx = null;

const initAudio = () => {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
};

export const playSound = (type) => {
    try {
        initAudio();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        switch (type) {
            case 'pop':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;

            case 'reaction':
                // Quick satisfying pop for reactions
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);
                osc.frequency.exponentialRampToValueAtTime(1100, now + 0.12);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                osc.start(now);
                osc.stop(now + 0.12);
                break;

            case 'click':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(1500, now);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;

            case 'shutter':
                // White noise buffer for shutter sound
                const bufferSize = ctx.sampleRate * 0.1; // 100ms
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                const noiseGain = ctx.createGain();
                noiseGain.gain.setValueAtTime(0.5, now);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                noise.connect(noiseGain);
                noiseGain.connect(ctx.destination);
                noise.start(now);
                break;

            case 'success':
                // Ascending chime
                ['sine', 'sine'].forEach((wave, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.connect(g);
                    g.connect(ctx.destination);
                    o.type = wave;
                    const freq = i === 0 ? 523.25 : 783.99; // C5, G5
                    o.frequency.setValueAtTime(freq, now + i * 0.1);
                    g.gain.setValueAtTime(0.1, now + i * 0.1);
                    g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.5);
                    o.start(now + i * 0.1);
                    o.stop(now + i * 0.1 + 0.5);
                });
                break;

            case 'roast':
                // Low discord
                ['sawtooth', 'square'].forEach((wave, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.connect(g);
                    g.connect(ctx.destination);
                    o.type = wave;
                    const freq = i === 0 ? 100 : 145;
                    o.frequency.setValueAtTime(freq, now);
                    o.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.4);
                    g.gain.setValueAtTime(0.2, now);
                    g.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                    o.start(now);
                    o.stop(now + 0.4);
                });
                break;

            case 'share':
                // Satisfying whoosh/swoosh for share card
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
                break;

            case 'tick':
                // Subtle tick for progress milestones
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1800, now);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
                osc.start(now);
                osc.stop(now + 0.03);
                break;

            case 'legendary':
                // Epic fanfare for rare easter eggs
                [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.connect(g);
                    g.connect(ctx.destination);
                    o.type = 'sine';
                    o.frequency.setValueAtTime(freq, now + i * 0.12);
                    g.gain.setValueAtTime(0.3, now + i * 0.12);
                    g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.4);
                    o.start(now + i * 0.12);
                    o.stop(now + i * 0.12 + 0.4);
                });
                break;

            case 'whoosh':
                // Swooshing slide-in sound for battle photos
                osc.type = 'sine';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
                osc.frequency.exponentialRampToValueAtTime(400, now + 0.3);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;

            case 'impact':
                // Heavy collision/crash sound for battle photo smash
                // Low thump + noise burst
                osc.type = 'square';
                osc.frequency.setValueAtTime(80, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
                gain.gain.setValueAtTime(0.6, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                // Add noise burst
                const impactBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
                const impactData = impactBuffer.getChannelData(0);
                for (let i = 0; i < impactData.length; i++) {
                    impactData[i] = (Math.random() * 2 - 1) * (1 - i / impactData.length);
                }
                const impactNoise = ctx.createBufferSource();
                impactNoise.buffer = impactBuffer;
                const impactGain = ctx.createGain();
                impactGain.gain.setValueAtTime(0.5, now);
                impactGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                impactNoise.connect(impactGain);
                impactGain.connect(ctx.destination);
                impactNoise.start(now);
                break;

            case 'celebrate':
                // Victory fanfare with ascending triumphant chords
                [392, 523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.connect(g);
                    g.connect(ctx.destination);
                    o.type = 'sine';
                    o.frequency.setValueAtTime(freq, now + i * 0.08);
                    g.gain.setValueAtTime(0.35, now + i * 0.08);
                    g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.5);
                    o.start(now + i * 0.08);
                    o.stop(now + i * 0.08 + 0.5);
                });
                break;
        }
    } catch (e) {
        // Audio probably not allowed yet
    }
};

export const vibrate = (pattern) => {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};
