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
	assert.match(siteTitleAstro, /href="https:\/\/zenso\.ink"/, 'SiteTitle must link brand to zenso.ink');
	assert.match(siteTitleAstro, /docs-home-pill/, 'SiteTitle must include Docs home pill');
	assert.match(siteTitleAstro, /setupBodyDitherScroll/, 'SiteTitle must bundle scroll fade handler');
});

test('Build distribution contains styled documentation landing page', () => {
	const distDir = path.join(ROOT_DIR, 'dist');
	assert.ok(fs.existsSync(distDir), 'dist/ directory must exist from build');

	const indexHtmlPath = path.join(distDir, 'index.html');
	assert.ok(fs.existsSync(indexHtmlPath), 'Landing page dist/index.html must exist');
	const content = fs.readFileSync(indexHtmlPath, 'utf-8');
	assert.ok(content.length > 500, 'Landing page must not be empty');
	assert.match(content, /Zenso Documentation/, 'Must render page title');
});
