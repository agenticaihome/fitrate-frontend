/**
 * Cloudflare Pages Function: Challenge Party OG Meta Tags
 *
 * Injects custom Open Graph meta tags for Challenge links
 * so they preview beautifully in iMessage, WhatsApp, Instagram DMs, etc.
 *
 * Route: /c/:challengeId
 */

export async function onRequest(context) {
    const { request, next, params } = context;
    const challengeId = params.challengeId;

    try {
        // Get the original response (the SPA HTML)
        const response = await next();

        // Only modify HTML responses
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) {
            return response;
        }

        // Clone the response since we need to read it
        const html = await response.text();

        // Challenge OG meta tags
        const challengeMeta = `
    <!-- Challenge Party OG Tags -->
    <meta property="og:title" content="⚔️ FitRate Challenge" />
    <meta property="og:description" content="Think you can beat my fit? Scan yours and find out! 👀" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://fitrate.app/c/${challengeId}" />
    <meta property="og:image" content="https://fitrate.app/og/challenge.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="⚔️ FitRate Challenge" />
    <meta name="twitter:description" content="Think you can beat my fit? Scan yours and find out! 👀" />
    <meta name="twitter:image" content="https://fitrate.app/og/challenge.png" />
`;

        // Safely inject meta tags
        let modifiedHtml = html;

        // Update title tag
        modifiedHtml = modifiedHtml.replace(
            /<title>[^<]*<\/title>/,
            '<title>⚔️ FitRate Challenge — Can You Beat This?</title>'
        );

        // Inject our OG tags right after the opening head tag
        modifiedHtml = modifiedHtml.replace(
            /<head>/i,
            '<head>' + challengeMeta
        );

        // Return modified response
        return new Response(modifiedHtml, {
            status: response.status,
            statusText: response.statusText,
            headers: {
                'content-type': 'text/html; charset=utf-8'
            }
        });
    } catch (error) {
        console.error('[Challenge OG] Error:', error);
        return await next();
    }
}
