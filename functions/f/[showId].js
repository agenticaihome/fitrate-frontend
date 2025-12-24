/**
 * Cloudflare Pages Function: Fashion Show OG Meta Tags
 * 
 * Injects custom Open Graph meta tags for Fashion Show invite links
 * so they preview beautifully in iMessage, WhatsApp, Instagram DMs, etc.
 * 
 * Route: /f/:showId
 */

export async function onRequest(context) {
    const { request, next, params } = context;
    const showId = params.showId;

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

        // Fashion Show OG meta tags - with v2 cache-bust
        const fashionShowMeta = `
    <!-- Fashion Show OG Tags -->
    <meta property="og:title" content="🎭 FitRate Fashion Show" />
    <meta property="og:description" content="Invite-only. Drop your fit. Crown the look 👑" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://fitrate.app/f/${showId}" />
    <meta property="og:image" content="https://fitrate.app/og/fashion-show.png?v=2" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="🎭 FitRate Fashion Show" />
    <meta name="twitter:description" content="Invite-only. Drop your fit. Crown the look 👑" />
    <meta name="twitter:image" content="https://fitrate.app/og/fashion-show.png?v=2" />
`;

        // Safely inject meta tags - just replace the title and add meta after head
        let modifiedHtml = html;

        // Update title tag
        modifiedHtml = modifiedHtml.replace(
            /<title>[^<]*<\/title>/,
            '<title>🎭 FitRate Fashion Show — Invite Only</title>'
        );

        // Inject our OG tags right after the opening head tag
        // This is safer than trying to replace existing OG tags with complex regex
        modifiedHtml = modifiedHtml.replace(
            /<head>/i,
            '<head>' + fashionShowMeta
        );

        // Return modified response with new headers (can't reuse immutable headers)
        return new Response(modifiedHtml, {
            status: response.status,
            statusText: response.statusText,
            headers: {
                'content-type': 'text/html; charset=utf-8'
            }
        });
    } catch (error) {
        // If anything goes wrong, just pass through the original request
        console.error('[FashionShow OG] Error:', error);
        return await next();
    }
}
