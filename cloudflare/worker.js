/**
 * Cloudflare Worker: Multi-App Subpath Router for zenso.ink
 *
 * Routes incoming requests on https://www.zenso.ink:
 * - https://www.zenso.ink/{lang}/docs -> Docs deployment (zenso-docs)
 * - https://www.zenso.ink/docs        -> Docs deployment (zenso-docs)
 * - https://www.zenso.ink/_docs_assets-> Docs deployment (zenso-docs)
 * - All other routes                  -> Main website (zenso-website)
 */

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const pathname = url.pathname;

		// Backend origins (configure via Cloudflare Worker Environment Variables)
		const DOCS_ORIGIN = env.DOCS_ORIGIN || 'https://zenso-docs.pages.dev';
		const MAIN_ORIGIN = env.MAIN_ORIGIN || 'https://zenso-website.pages.dev';

		// Match docs subpaths and dedicated docs static assets
		const isDocsRoute =
			pathname === '/docs' ||
			pathname.startsWith('/docs/') ||
			pathname === '/en/docs' ||
			pathname.startsWith('/en/docs/') ||
			pathname === '/pl/docs' ||
			pathname.startsWith('/pl/docs/') ||
			pathname === '/ja/docs' ||
			pathname.startsWith('/ja/docs/') ||
			pathname.startsWith('/_docs_assets/') ||
			pathname.startsWith('/pagefind/');

		const targetOrigin = isDocsRoute ? DOCS_ORIGIN : MAIN_ORIGIN;
		const targetUrl = new URL(url.pathname + url.search, targetOrigin);

		// Clone request with target origin while preserving headers and methods
		const proxyRequest = new Request(targetUrl.toString(), {
			method: request.method,
			headers: request.headers,
			body: request.body,
			redirect: 'manual',
		});

		// Forward host header appropriately for Cloudflare Pages / origin SSL
		proxyRequest.headers.set('X-Forwarded-Host', url.host);
		proxyRequest.headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

		return fetch(proxyRequest);
	},
};
