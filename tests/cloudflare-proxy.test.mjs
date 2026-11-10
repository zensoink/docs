import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import worker, { isDocsRoute, resolveTargetPathname } from '../cloudflare/docs-proxy-worker.ts';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

test('isDocsRoute matches documentation paths, assets, and sitemaps', () => {
	// Documentation core paths
	assert.equal(isDocsRoute('/docs'), true);
	assert.equal(isDocsRoute('/docs/'), true);
	assert.equal(isDocsRoute('/docs/getting-started'), true);

	// Localized docs paths
	assert.equal(isDocsRoute('/en/docs'), true);
	assert.equal(isDocsRoute('/en/docs/'), true);
	assert.equal(isDocsRoute('/en/docs/installation'), true);

	assert.equal(isDocsRoute('/pl/docs'), true);
	assert.equal(isDocsRoute('/pl/docs/'), true);
	assert.equal(isDocsRoute('/pl/docs/instalacja'), true);

	assert.equal(isDocsRoute('/ja/docs'), true);
	assert.equal(isDocsRoute('/ja/docs/'), true);
	assert.equal(isDocsRoute('/ja/docs/setup'), true);

	// Static assets and search index
	assert.equal(isDocsRoute('/_docs_assets/style.css'), true);
	assert.equal(isDocsRoute('/_docs_assets/logo.svg'), true);
	assert.equal(isDocsRoute('/pagefind/pagefind.js'), true);
	assert.equal(isDocsRoute('/pagefind/pagefind-entry.json'), true);

	// Sitemaps
	assert.equal(isDocsRoute('/docs-sitemap.xml'), true);
	assert.equal(isDocsRoute('/sitemap-index.xml'), true);
	assert.equal(isDocsRoute('/sitemap-0.xml'), true);
	assert.equal(isDocsRoute('/docs/sitemap.xml'), true);
});

test('isDocsRoute returns false for main website (Angular) paths', () => {
	assert.equal(isDocsRoute('/'), false);
	assert.equal(isDocsRoute('/en'), false);
	assert.equal(isDocsRoute('/en/'), false);
	assert.equal(isDocsRoute('/pl'), false);
	assert.equal(isDocsRoute('/pl/'), false);
	assert.equal(isDocsRoute('/ja'), false);
	assert.equal(isDocsRoute('/ja/'), false);
	assert.equal(isDocsRoute('/about'), false);
	assert.equal(isDocsRoute('/en/pricing'), false);
	assert.equal(isDocsRoute('/pl/kontakt'), false);
	assert.equal(isDocsRoute('/assets/main.js'), false);
});

test('resolveTargetPathname rewrites /docs-sitemap.xml to /sitemap-index.xml', () => {
	assert.equal(resolveTargetPathname('/docs-sitemap.xml'), '/sitemap-index.xml');
	assert.equal(resolveTargetPathname('/en/docs/'), '/en/docs/');
	assert.equal(resolveTargetPathname('/_docs_assets/logo.svg'), '/_docs_assets/logo.svg');
});

test('Cloudflare Worker proxies docs requests and rewrites docs-sitemap.xml', async () => {
	const originalFetch = globalThis.fetch;
	/** @type {{ url: string; method: string; redirect?: RequestRedirect; headers: Headers }[]} */
	const intercepted = [];

	globalThis.fetch = async (input, init) => {
		const req = input instanceof Request ? input : new Request(input, init);
		intercepted.push({
			url: req.url,
			method: req.method,
			redirect: req.redirect,
			headers: req.headers,
		});

		return new Response('mock-response', {
			status: 200,
			statusText: 'OK',
			headers: { 'X-Custom-Header': 'ZensoDocs' },
		});
	};

	try {
		// 1. Docs route test
		const docsReq = new Request('https://zenso.ink/en/docs/', {
			method: 'GET',
			headers: { Accept: 'text/html', 'User-Agent': 'TestBot' },
		});
		const docsRes = await worker.fetch(docsReq, { DOCS_ORIGIN: 'https://custom-docs.pages.dev' });
		assert.equal(docsRes.status, 200);
		assert.equal(docsRes.headers.get('X-Custom-Header'), 'ZensoDocs');
		assert.equal(intercepted[0]?.url, 'https://custom-docs.pages.dev/en/docs/');
		assert.equal(intercepted[0]?.redirect, 'manual');

		// 2. Docs sitemap rewrite test
		const sitemapReq = new Request('https://zenso.ink/docs-sitemap.xml');
		await worker.fetch(sitemapReq, { DOCS_ORIGIN: 'https://custom-docs.pages.dev' });
		assert.equal(intercepted[1]?.url, 'https://custom-docs.pages.dev/sitemap-index.xml');

		// 3. Non-docs route passthrough test (to Angular)
		const mainReq = new Request('https://zenso.ink/pl/features');
		await worker.fetch(mainReq, { DOCS_ORIGIN: 'https://custom-docs.pages.dev' });
		assert.equal(intercepted[2]?.url, 'https://zenso.ink/pl/features');
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test('Wrangler configuration files are valid and point to docs-proxy-worker.ts', () => {
	const jsonPath = path.join(ROOT_DIR, 'cloudflare/wrangler.json');
	const tomlPath = path.join(ROOT_DIR, 'cloudflare/wrangler.toml');

	assert.ok(fs.existsSync(jsonPath), 'cloudflare/wrangler.json must exist');
	assert.ok(fs.existsSync(tomlPath), 'cloudflare/wrangler.toml must exist');

	const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
	assert.equal(json.main, 'docs-proxy-worker.ts');
	assert.equal(json.vars?.DOCS_ORIGIN, 'https://zenso-docs.pages.dev');

	const toml = fs.readFileSync(tomlPath, 'utf-8');
	assert.match(toml, /main\s*=\s*["']docs-proxy-worker\.ts["']/);
	assert.match(toml, /DOCS_ORIGIN\s*=\s*["']https:\/\/zenso-docs\.pages\.dev["']/);
});
