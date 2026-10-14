import DOMPurify from 'isomorphic-dompurify';

export interface SanitizeOptions {
    blockImages?: boolean; // Default true, replaces src with data-src
    disableLinks?: boolean; // Default false, makes links unclickable
}

export class SafeSanitizer {
    static sanitize(html: string, options: SanitizeOptions = {}): string {
        const { blockImages = true } = options;

        // Configure strict defense-in-depth sanitization
        const clean = DOMPurify.sanitize(html, {
            WHOLE_DOCUMENT: true,
            // 1. Tag Whitelist: Layout, Typo, Tables, Images, Links, CSS
            ALLOWED_TAGS: [
                'html', 'body', 'head', 'meta', 'div', 'span', 'p',
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'ul', 'ol', 'li', 'dl', 'dt', 'dd',
                'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot', 'caption', 'colgroup', 'col',
                'style', 'img', 'a', 'blockquote', 'pre', 'code',
                'br', 'hr', 'strong', 'em', 'b', 'i', 'u', 's', 'strike', 'small', 'big', 'center', 'font'
            ],

            // 2. Attribute Whitelist: Safe visual attributes
            ALLOWED_ATTR: [
                'style', 'class', 'id',
                'href', 'src', 'width', 'height',
                'align', 'valign', 'color', 'bgcolor', 'border', 'cellpadding', 'cellspacing',
                'target', 'alt', 'title', 'type' // needed for styles
            ],

            // 3. Forbidden Tags: Active content
            FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'link', 'base', 'applet', 'video', 'audio', 'canvas', 'svg', 'math'],

            // 4. Forbidden Attributes: Event handlers & binding
            FORBID_ATTR: ['on*', 'action', 'method', 'data-*', 'form*', 'xlink:href'],

            // 5. URI Sanitization
            ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,

            // 6. CSS Hooks
            FORCE_BODY: false,

            // Custom Hooks for Image/Link handling
        });

        // Post-Processing on the distinct DOM tree (safer than string manipulation)
        if (typeof window !== 'undefined') {
            const parser = new DOMParser();
            const doc = parser.parseFromString(clean, 'text/html');

            // A. Handle Images (Tracking Protection)
            if (blockImages) {
                doc.querySelectorAll('img').forEach(img => {
                    const src = img.getAttribute('src');
                    if (src && src.startsWith('http')) {
                        img.setAttribute('data-original-src', src);
                        img.setAttribute('src', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgYXJpYS1oaWRkZW49InRydWUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtaW1hZ2Utc2xhc2giPjxsaW5lIHgxPSIyIiB4Mj0iMjIiIHkxPSIyIiB5Mj0iMjIiLz48cGF0aCBkPSJNMTAuNDEgMTkuMzlMMTZWMThhNCA0IDAgMCAwLTQtNCIvPjxwYXRoIGQ9Ik05LjY4IDZIMThh MiAyIDAgMCAxIDIgMnYzIi8+PHBhdGggZD0iTTMueTMxIDloMi44NiIvPjwvc3ZnPg=='); // Placeholder icon
                        img.setAttribute('style', `${img.getAttribute('style') || ''}; border: 1px dashed #ccc; padding: 10px; min-width: 50px; min-height: 50px;`);
                        img.setAttribute('title', 'Image blocked for privacy');
                    }
                });
            }

            // B. Handle Links (Safety)
            doc.querySelectorAll('a').forEach(a => {
                if (options.disableLinks) {
                    // Disable link completely
                    a.removeAttribute('href');
                    a.removeAttribute('target');
                    a.removeAttribute('rel');
                    a.setAttribute('style', `${a.getAttribute('style') || ''}; pointer-events: none; cursor: default; text-decoration: line-through; opacity: 0.7;`);
                    a.setAttribute('title', 'Link disabled for safety');
                } else {
                    // Just ensure it opens in new tab if enabled
                    a.setAttribute('target', '_blank');
                    a.setAttribute('rel', 'noopener noreferrer');
                }
            });

            return doc.documentElement.outerHTML;
        }

        return clean;
    }
}
