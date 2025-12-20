export const trackShare = (method, contentType = 'outfit_rating', score = null) => {
    if (typeof window.gtag === 'function') {
        window.gtag('event', 'share', {
            method: method,
            content_type: contentType,
            item_id: score ? `score_${score}` : 'unknown'
        })
    }
}
