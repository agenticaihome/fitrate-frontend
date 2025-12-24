/**
 * Image Utilities with iOS PWA Memory Optimization
 * 
 * iOS Safari WebView has strict memory limits. When exceeded, the PWA crashes
 * and shows a black screen. These utilities help prevent that by:
 * - More aggressive compression on iOS devices
 * - Proper cleanup of blob URLs to prevent memory leaks
 * - Smaller image dimensions for mobile
 */

// Detect iOS devices
const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.MSStream;

// Development mode check
const isDev = import.meta.env.DEV;

// Track blob URLs for cleanup
const activeBlobUrls = new Set();

/**
 * Compress image with iOS-optimized settings
 * iOS gets more aggressive compression to prevent memory crashes
 */
export const compressImage = (file, maxWidth = 1200, quality = 0.7) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                // iOS OPTIMIZATION: Use smaller dimensions and lower quality
                // to prevent WebView memory pressure
                const iosMode = isIOS();
                const targetMaxWidth = iosMode ? Math.min(maxWidth, 800) : maxWidth;
                const targetQuality = iosMode ? Math.min(quality, 0.5) : quality;

                // Calculate new dimensions (maintain aspect ratio)
                let width = img.width
                let height = img.height

                if (width > targetMaxWidth) {
                    height = (height * targetMaxWidth) / width
                    width = targetMaxWidth
                }

                // Also limit height for very tall images
                const maxHeight = iosMode ? 1200 : 1600;
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }

                // Create canvas and draw resized image
                const canvas = document.createElement('canvas')
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0, width, height)

                // Convert to JPEG with compression
                const compressedDataUrl = canvas.toDataURL('image/jpeg', targetQuality)

                // Clean up to free memory
                canvas.width = 0;
                canvas.height = 0;

                if (iosMode && isDev) {
                    console.log(`[iOS] Image compressed: ${img.width}x${img.height} → ${width}x${height} @ ${targetQuality} quality`);
                }

                resolve(compressedDataUrl)
            }
            img.onerror = reject
            img.src = e.target.result
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

/**
 * Download image with proper blob cleanup
 */
export const downloadImage = (blob, filename, shareText) => {
    const url = URL.createObjectURL(blob)
    activeBlobUrls.add(url);

    const link = document.createElement('a')
    link.href = url
    link.download = filename || `fitrate-score-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Revoke URL after a short delay to ensure download starts
    setTimeout(() => {
        URL.revokeObjectURL(url);
        activeBlobUrls.delete(url);
    }, 1000);

    // Copy caption to clipboard if provided
    if (shareText && navigator.clipboard) {
        navigator.clipboard.writeText(shareText).catch(err => {
            console.warn('[Clipboard] Copy caption failed:', err.message)
        })
    }
}

/**
 * Clean up all tracked blob URLs
 * Call this when navigating away from results or on memory pressure
 */
export const cleanupBlobUrls = () => {
    activeBlobUrls.forEach(url => {
        try {
            URL.revokeObjectURL(url);
        } catch (e) {
            // Ignore errors
        }
    });
    activeBlobUrls.clear();
    if (isDev) console.log('[Memory] Blob URLs cleaned up');
}

/**
 * Force garbage collection hint for iOS
 * Helps Safari know it can free memory
 */
export const hintGarbageCollection = () => {
    if (isIOS()) {
        // Force a small memory allocation and release to hint GC
        try {
            const temp = new ArrayBuffer(1024 * 1024); // 1MB
            // Immediately nullify
            void temp;
        } catch (e) {
            // Memory already tight, which is fine
        }
    }
}

/**
 * Create a small thumbnail from a base64 data URL
 * Used for Fashion Show leaderboard to display outfit previews
 * 
 * @param {string} imageDataUrl - Base64 data URL of the image
 * @param {number} maxSize - Maximum dimension (width or height) in pixels
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<string>} Compressed base64 data URL (~20-40KB)
 */
export const createThumbnail = (imageDataUrl, maxSize = 150, quality = 0.6) => {
    return new Promise((resolve) => {
        // Validate input
        if (!imageDataUrl || typeof imageDataUrl !== 'string') {
            console.error('[Thumbnail] Invalid image data:', typeof imageDataUrl);
            return resolve(null);
        }

        const img = new Image();

        // CORS-friendly (for data URLs this shouldn't matter but doesn't hurt)
        img.crossOrigin = 'anonymous';

        const createThumb = () => {
            try {
                // Validate image loaded correctly
                if (img.width === 0 || img.height === 0) {
                    console.error('[Thumbnail] Image has zero dimensions');
                    return resolve(null);
                }

                // Calculate dimensions maintaining aspect ratio
                let width = img.width;
                let height = img.height;

                const scale = Math.min(maxSize / width, maxSize / height, 1);
                width = Math.round(width * scale);
                height = Math.round(height * scale);

                // Create canvas at thumbnail size
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');

                // Fill with white background first (prevents black on transparent PNGs)
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);

                // Draw the image
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to JPEG with compression
                const thumbnailDataUrl = canvas.toDataURL('image/jpeg', quality);

                // Validate output (black images are very small ~2KB)
                const sizeKB = Math.round(thumbnailDataUrl.length / 1024);
                if (sizeKB < 3) {
                    console.warn(`[Thumbnail] Suspiciously small (${sizeKB}KB) - may be black`);
                }

                // Clean up canvas
                canvas.width = 0;
                canvas.height = 0;

                if (isDev) console.log(`[Thumbnail] Created ${width}x${height} (${sizeKB}KB)`);
                resolve(thumbnailDataUrl);
            } catch (err) {
                console.error('[Thumbnail] Creation failed:', err);
                resolve(null);
            }
        };

        img.onload = () => {
            // Use decode() if available for more reliable rendering
            if (img.decode) {
                img.decode()
                    .then(createThumb)
                    .catch((err) => {
                        console.warn('[Thumbnail] decode() failed, trying direct:', err);
                        createThumb(); // Fallback to direct creation
                    });
            } else {
                createThumb();
            }
        };

        img.onerror = (e) => {
            console.error('[Thumbnail] Failed to load image:', e);
            resolve(null);
        };

        img.src = imageDataUrl;
    });
}
