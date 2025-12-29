/**
 * Image Compression Utility
 * Compresses outfit photos before upload for ~40% faster uploads
 */

/**
 * Compress an image to reduce file size
 * @param {string} base64Image - Base64 encoded image (with or without data URL prefix)
 * @param {Object} options - Compression options
 * @param {number} options.maxWidth - Max width (default: 1200)
 * @param {number} options.maxHeight - Max height (default: 1600)
 * @param {number} options.quality - JPEG quality 0-1 (default: 0.8)
 * @returns {Promise<string>} Compressed base64 image
 */
export async function compressImage(base64Image, options = {}) {
    const {
        maxWidth = 1200,
        maxHeight = 1600,
        quality = 0.8
    } = options;

    return new Promise((resolve, reject) => {
        try {
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions maintaining aspect ratio
                let { width, height } = img;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }

                // Create canvas and draw resized image
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to compressed JPEG
                const compressed = canvas.toDataURL('image/jpeg', quality);

                // Log compression stats
                const originalSize = base64Image.length;
                const compressedSize = compressed.length;
                const savings = Math.round((1 - compressedSize / originalSize) * 100);
                console.log(`[ImageCompression] ${savings}% smaller (${Math.round(originalSize / 1024)}KB → ${Math.round(compressedSize / 1024)}KB)`);

                resolve(compressed);
            };

            img.onerror = () => {
                console.warn('[ImageCompression] Failed to load image, returning original');
                resolve(base64Image);
            };

            // Handle both with and without data URL prefix
            img.src = base64Image.startsWith('data:')
                ? base64Image
                : `data:image/jpeg;base64,${base64Image}`;

        } catch (error) {
            console.error('[ImageCompression] Error:', error);
            resolve(base64Image); // Return original on error
        }
    });
}

/**
 * Create a thumbnail for quick display
 * @param {string} base64Image - Base64 encoded image
 * @param {number} size - Thumbnail size (default: 200)
 * @returns {Promise<string>} Thumbnail base64
 */
export async function createThumbnail(base64Image, size = 200) {
    return compressImage(base64Image, {
        maxWidth: size,
        maxHeight: size,
        quality: 0.6
    });
}

export default { compressImage, createThumbnail };
