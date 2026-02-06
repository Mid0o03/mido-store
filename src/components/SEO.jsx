import React, { useEffect } from 'react';

export default function SEO({ title, description, keywords, image, url, type = 'website', structuredData }) {
    const siteTitle = 'Mido - Digital Creations';
    const siteUrl = 'https://www.midodev.fr';

    const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
    const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
    const metaImage = image ? `${siteUrl}${image}` : `${siteUrl}/og-image.jpg`;

    useEffect(() => {
        // Update Title
        document.title = fullTitle;

        // Helper to upsert meta tags
        const updateMeta = (selector, content) => {
            if (!content) return;
            let element = document.querySelector(selector);
            if (!element) {
                element = document.createElement('meta');

                // Parse selector to basic attributes for creation
                if (selector.includes('name=')) element.setAttribute('name', selector.match(/name="([^"]+)"/)[1]);
                if (selector.includes('property=')) element.setAttribute('property', selector.match(/property="([^"]+)"/)[1]);

                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        // Standard Meta
        updateMeta('meta[name="description"]', description);
        updateMeta('meta[name="keywords"]', keywords);

        // Open Graph
        updateMeta('meta[property="og:type"]', type);
        updateMeta('meta[property="og:title"]', fullTitle);
        updateMeta('meta[property="og:description"]', description);
        updateMeta('meta[property="og:url"]', fullUrl);
        updateMeta('meta[property="og:image"]', metaImage);

        // Twitter
        updateMeta('meta[name="twitter:card"]', 'summary_large_image');
        updateMeta('meta[name="twitter:title"]', fullTitle);
        updateMeta('meta[name="twitter:description"]', description);
        updateMeta('meta[name="twitter:image"]', metaImage);

        // Canonical
        let link = document.querySelector('link[rel="canonical"]');
        if (!link) {
            link = document.createElement('link');
            link.setAttribute('rel', 'canonical');
            document.head.appendChild(link);
        }
        link.setAttribute('href', fullUrl);

        // JSON-LD
        if (structuredData) {
            let script = document.querySelector('#seo-json-ld');
            if (!script) {
                script = document.createElement('script');
                script.id = 'seo-json-ld';
                script.type = 'application/ld+json';
                document.head.appendChild(script);
            }
            script.textContent = JSON.stringify(structuredData);
        }

        // Cleanup function (optional, resetting to default if needed)

    }, [fullTitle, description, keywords, metaImage, fullUrl, type, structuredData]);

    return null;
}

SEO.defaultProps = {
    title: null,
    description: 'Discover premium digital creations, templates, and web experiences at Mido.',
    keywords: 'web design, templates, react, digital agency, mido',
    image: null,
    url: null,
};
