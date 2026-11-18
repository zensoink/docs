import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

test('wrangler.jsonc is the single source of truth in root directory and cloudflare/ folder is removed', () => {
	const wranglerPath = path.join(ROOT_DIR, 'wrangler.jsonc');
	const legacyCloudflareDir = path.join(ROOT_DIR, 'cloudflare');
	const legacyTomlPath = path.join(ROOT_DIR, 'wrangler.toml');

	assert.ok(fs.existsSync(wranglerPath), 'wrangler.jsonc must exist in the root directory');
	assert.ok(!fs.existsSync(legacyCloudflareDir), 'Legacy ./cloudflare directory must be removed');
	assert.ok(!fs.existsSync(legacyTomlPath), 'Legacy wrangler.toml must not exist');
});

test('wrangler.jsonc configures Cloudflare Workers Static Assets with strict, least-privilege routes', () => {
	const wranglerPath = path.join(ROOT_DIR, 'wrangler.jsonc');
	const content = fs.readFileSync(wranglerPath, 'utf-8');

	// Strip single-line comments for JSON parsing
	const jsonClean = content.replace(/\/\/.*$/gm, '');
	/** @type {{ name: string; assets?: { directory: string; not_found_handling: string }; routes?: { pattern: string; zone_name: string }[] }} */
	const config = JSON.parse(jsonClean);

	assert.equal(config.name, 'zenso-docs');
	assert.equal(config.assets?.directory, './dist');
	assert.equal(config.assets?.not_found_handling, '404-page');

	const routes = config.routes || [];
	const patterns = routes.map((r) => r.pattern);

	// Must contain all 7 documentation-specific routes
	const expectedPatterns = [
		'zenso.ink/en/docs*',
		'zenso.ink/pl/docs*',
		'zenso.ink/ja/docs*',
		'zenso.ink/docs*',
		'zenso.ink/_docs_assets/*',
		'zenso.ink/pagefind/*',
		'zenso.ink/docs-sitemap*',
	];

	for (const expected of expectedPatterns) {
		assert.ok(
			patterns.includes(expected),
			`wrangler.jsonc routes must include ${expected}`
		);
	}

	// Must NEVER contain greedy catch-all patterns that hijack Angular website
	assert.ok(
		!patterns.includes('zenso.ink/*'),
		'wrangler.jsonc must not contain catch-all zenso.ink/*'
	);
	assert.ok(
		!patterns.includes('www.zenso.ink/*'),
		'wrangler.jsonc must not contain catch-all www.zenso.ink/*'
	);
});

test('Static build outputs docs-sitemap files matching wrangler.jsonc route pattern', () => {
	const docsSitemapPath = path.join(ROOT_DIR, 'dist/docs-sitemap.xml');
	const docsSitemap0Path = path.join(ROOT_DIR, 'dist/docs-sitemap-0.xml');

	assert.ok(
		fs.existsSync(docsSitemapPath),
		'dist/docs-sitemap.xml must exist for static serving'
	);
	assert.ok(
		fs.existsSync(docsSitemap0Path),
		'dist/docs-sitemap-0.xml must exist for static serving'
	);

	const indexContent = fs.readFileSync(docsSitemapPath, 'utf-8');
	assert.match(
		indexContent,
		/https:\/\/zenso\.ink\/docs-sitemap-0\.xml/,
		'docs-sitemap.xml must point to docs-sitemap-0.xml without www'
	);
	assert.doesNotMatch(
		indexContent,
		/www\.zenso\.ink/,
		'docs-sitemap.xml must not contain www.zenso.ink'
	);

	const urlsetContent = fs.readFileSync(docsSitemap0Path, 'utf-8');
	assert.match(urlsetContent, /https:\/\/zenso\.ink\/en\/docs\//);
	assert.match(urlsetContent, /https:\/\/zenso\.ink\/pl\/docs\//);
	assert.match(urlsetContent, /https:\/\/zenso\.ink\/ja\/docs\//);
	assert.doesNotMatch(
		urlsetContent,
		/www\.zenso\.ink/,
		'docs-sitemap-0.xml must not contain www.zenso.ink'
	);

	// Redundant sitemaps must be removed to prevent duplicates
	assert.ok(
		!fs.existsSync(path.join(ROOT_DIR, 'dist/sitemap-index.xml')),
		'dist/sitemap-index.xml must be removed in favor of docs-sitemap.xml'
	);
	assert.ok(
		!fs.existsSync(path.join(ROOT_DIR, 'dist/sitemap-0.xml')),
		'dist/sitemap-0.xml must be removed in favor of docs-sitemap-0.xml'
	);
});

test('public/_redirects configures 301 trailing slash redirects and sitemap alias', () => {
	const redirectsPath = path.join(ROOT_DIR, 'public/_redirects');
	assert.ok(fs.existsSync(redirectsPath), 'public/_redirects must exist');

	const content = fs.readFileSync(redirectsPath, 'utf-8');
	assert.match(content, /^\/docs\s+\/en\/docs\/\s+301/m, 'Must 301 redirect /docs to /en/docs/');
	assert.match(content, /^\/en\/docs\s+\/en\/docs\/\s+301/m, 'Must 301 redirect /en/docs to /en/docs/');
	assert.match(content, /^\/pl\/docs\s+\/pl\/docs\/\s+301/m, 'Must 301 redirect /pl/docs to /pl/docs/');
	assert.match(content, /^\/ja\/docs\s+\/ja\/docs\/\s+301/m, 'Must 301 redirect /ja/docs to /ja/docs/');
	assert.match(content, /^\/sitemap-index\.xml\s+\/docs-sitemap\.xml\s+200/m, 'Must 200 rewrite /sitemap-index.xml to /docs-sitemap.xml');
});
