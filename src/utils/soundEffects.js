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
