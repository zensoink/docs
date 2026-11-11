import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

test('CSS rules comply with Zenso visual system on body', () => {
	const globalCss = fs.readFileSync(path.join(ROOT_DIR, 'src/styles/global.css'), 'utf-8');

	// Must contain body::before dither background effect with scroll variable
	assert.match(
		globalCss,
		/body::before[\s\S]*?radial-gradient/,
		'body::before must contain radial-gradient dither background effect'
	);
	assert.match(
		globalCss,
		/--body-dither-opacity/,
		'body::before must use --body-dither-opacity for scroll fade'
	);

	// Must contain authentic dither pattern classes
	assert.match(globalCss, /\.dither-pattern\s*\{/, 'Must define .dither-pattern');
	assert.match(globalCss, /\.dither-pattern-light\s*\{/, 'Must define .dither-pattern-light');
	assert.match(globalCss, /\.dither-pattern-dense\s*\{/, 'Must define .dither-pattern-dense');

	// Must declare color-scheme for light and dark
	assert.match(globalCss, /color-scheme:\s*light/, 'Must declare color-scheme: light');
	assert.match(globalCss, /color-scheme:\s*dark/, 'Must declare color-scheme: dark');
});

test('Astro components keep background effect on body and not in hero sections', () => {
	// astro.config.mjs should not override Hero or ContentPanel with custom dither wrappers
	const astroConfig = fs.readFileSync(path.join(ROOT_DIR, 'astro.config.mjs'), 'utf-8');
	assert.doesNotMatch(astroConfig, /Hero:\s*'\.\/src\/components\/Hero\.astro'/, 'Hero must not be wrapped with dots');
	assert.doesNotMatch(astroConfig, /ContentPanel:\s*'\.\/src\/components\/ContentPanel\.astro'/, 'ContentPanel must not be wrapped with dots');

	const siteTitleAstro = fs.readFileSync(path.join(ROOT_DIR, 'src/components/SiteTitle.astro'), 'utf-8');
	assert.match(siteTitleAstro, /href=\{mainSiteHref\}/, 'SiteTitle must link brand to localized main website');
	assert.match(siteTitleAstro, /getMainSiteUrl\(locale\)/, 'SiteTitle must resolve mainSiteHref via getMainSiteUrl');
	assert.match(siteTitleAstro, /docs-home-pill/, 'SiteTitle must include Docs home pill');
	assert.match(siteTitleAstro, /setupBodyDitherScroll/, 'SiteTitle must bundle scroll fade handler');
});

test('Build distribution contains styled documentation landing page with full sidebar and no splash hero', () => {
	const distDir = path.join(ROOT_DIR, 'dist');
	assert.ok(fs.existsSync(distDir), 'dist/ directory must exist from build');

	const indexHtmlPath = path.join(distDir, 'en/docs/index.html');
	assert.ok(fs.existsSync(indexHtmlPath), 'Landing page HTML must exist');
	const content = fs.readFileSync(indexHtmlPath, 'utf-8');
	assert.ok(content.length > 500, 'Landing page must not be empty');
	assert.match(content, /Zenso Documentation/, 'Must render page title');

	// Verify template: splash / hero is eliminated
	assert.doesNotMatch(content, /<div class="hero/i, 'Docs landing must not have hero splash banner');

	// Verify desktop/mobile sidebar is present with Overview as active page
	assert.match(content, /<a href="\/en\/docs\/" aria-current="page"[^>]*><span[^>]*>Overview<\/span><\/a>/, 'Sidebar must render Overview as active page');
	assert.match(content, /Start Here/, 'Sidebar must render Start Here section');
});

test('Legacy overview localized routes redirect to canonical documentation paths', () => {
	const distDir = path.join(ROOT_DIR, 'dist');
	const enOverview = path.join(distDir, 'en/docs/getting-started/overview/index.html');
	const plOverview = path.join(distDir, 'pl/docs/getting-started/overview/index.html');
	const jaOverview = path.join(distDir, 'ja/docs/getting-started/overview/index.html');

	assert.ok(fs.existsSync(enOverview), 'en overview redirect must exist');
	assert.ok(fs.existsSync(plOverview), 'pl overview redirect must exist');
	assert.ok(fs.existsSync(jaOverview), 'ja overview redirect must exist');

	assert.match(fs.readFileSync(enOverview, 'utf-8'), /url=\/en\/docs\//);
	assert.match(fs.readFileSync(plOverview, 'utf-8'), /url=\/pl\/docs\//);
	assert.match(fs.readFileSync(jaOverview, 'utf-8'), /url=\/ja\/docs\//);
});
