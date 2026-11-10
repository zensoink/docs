/**
 * Cloudflare Worker: Reverse Proxy for Zenso Documentation
 *
 * Routes documentation traffic under https://zenso.ink:
 * - https://zenso.ink/{en,pl,ja}/docs/* -> Docs origin (zenso-docs)
 * - https://zenso.ink/docs*             -> Docs origin (zenso-docs)
 * - https://zenso.ink/_docs_assets/*    -> Docs origin (zenso-docs)
 * - https://zenso.ink/pagefind/*        -> Docs origin (zenso-docs)
 * - https://zenso.ink/docs-sitemap.xml  -> Rewritten to /sitemap-index.xml on docs origin
 * - https://zenso.ink/sitemap-*.xml     -> Docs origin (zenso-docs)
 * - All other routes                    -> Passed through to main website (zenso-website)
 */

export interface Env {
	DOCS_ORIGIN?: string;
}

export function isDocsRoute(pathname: string): boolean {
	return (
		pathname === '/docs' ||
		pathname.startsWith('/docs/') ||
		pathname === '/en/docs' ||
		pathname.startsWith('/en/docs/') ||
		pathname === '/pl/docs' ||
		pathname.startsWith('/pl/docs/') ||
		pathname === '/ja/docs' ||
		pathname.startsWith('/ja/docs/') ||
		pathname.startsWith('/_docs_assets/') ||
		pathname.startsWith('/pagefind/') ||
		pathname === '/docs-sitemap.xml' ||
		pathname === '/sitemap-index.xml' ||
		/^(\/docs)?\/sitemap(-[0-9]+)?\.xml$/.test(pathname)
	);
}

export function resolveTargetPathname(pathname: string): string {
	if (pathname === '/docs-sitemap.xml') {
		return '/sitemap-index.xml';
	}
	return pathname;
}

export default {
	async fetch(request: Request, env?: Env): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;

		// If this is not a documentation route, pass through directly to main application
		if (!isDocsRoute(pathname)) {
			return fetch(request);
		}

		// Target backend origin (configure via Cloudflare Worker Environment Variables)
		const DOCS_ORIGIN = env?.DOCS_ORIGIN || 'https://zenso-docs.pages.dev';

		// Rewrite sitemap path if requested
		const targetPathname = resolveTargetPathname(pathname);
		const targetUrl = new URL(targetPathname + url.search, DOCS_ORIGIN);

		// Clone request while preserving method, headers, and manual redirect handling
		const requestInit: RequestInit = {
			method: request.method,
			headers: request.headers,
			redirect: 'manual',
		};

		if (request.method !== 'GET' && request.method !== 'HEAD') {
			requestInit.body = request.body;
			// @ts-expect-error duplex is required for streaming request bodies in modern Fetch
			requestInit.duplex = 'half';
		}

		const modifiedRequest = new Request(targetUrl.toString(), requestInit);

		const response = await fetch(modifiedRequest);

		// Return proxied response with unmodified status, statusText, and headers
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
		});
	},
};
