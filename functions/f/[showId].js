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

    // Get the original response (the SPA HTML)
    const response = await next();

    // Only modify HTML responses
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
        return response;
    }

    // Read the HTML
    let html = await response.text();

    // Fashion Show OG meta tags - EXACT COPY from requirements
    const fashionShowMeta = `
    <!-- Fashion Show OG Tags - Injected by Cloudflare Pages Function -->
    <meta property="og:title" content="🎭 FitRate Fashion Show" />
    <meta property="og:description" content="Invite-only. Drop your fit. Crown the look 👑" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://fitrate.app/f/${showId}" />
    <meta property="og:image" content="https://fitrate.app/og/fashion-show.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="🎭 FitRate Fashion Show" />
    <meta name="twitter:description" content="Invite-only. Drop your fit. Crown the look 👑" />
    <meta name="twitter:image" content="https://fitrate.app/og/fashion-show.png" />
  `;

    // Remove existing OG tags and inject Fashion Show ones
    // Replace the existing Open Graph section
    html = html.replace(
        /<!-- Open Graph \/ Facebook -->[\s\S]*?<!-- Twitter\/X -->[\s\S]*?<meta name="twitter:image"[^>]*>/,
        fashionShowMeta
    );

    // Update the title tag as well
    html = html.replace(
        /<title>[^<]*<\/title>/,
        '<title>🎭 FitRate Fashion Show — Invite Only</title>'
    );

    // Return modified response
    return new Response(html, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
    });
}
