/**
 * Cloudflare Pages Function: Challenge Party OG Meta Tags
 *
 * Injects custom Open Graph meta tags for Challenge links
 * so they preview beautifully in iMessage, WhatsApp, Instagram DMs, etc.
 *
 * Route: /c/:challengeId
 */

export async function onRequest(context) {
    const { request, env, params } = context;
    const challengeId = params.challengeId;

    try {
        // Get the origin URL to fetch the SPA's index.html
        const url = new URL(request.url);
        const indexUrl = `${url.origin}/index.html`;

        // Fetch the SPA's index.html directly
        const response = await fetch(indexUrl);

        if (!response.ok) {
            // Fallback: redirect to home
            return Response.redirect(`${url.origin}/`, 302);
        }

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
            status: 200,
            headers: {
                'content-type': 'text/html; charset=utf-8',
                'cache-control': 'no-cache'
            }
        });
    } catch (error) {
        console.error('[Challenge OG] Error:', error);
        // Fallback: redirect to home
        const url = new URL(request.url);
        return Response.redirect(`${url.origin}/`, 302);
    }
}
