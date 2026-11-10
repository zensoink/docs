import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

test('Brand logo matches zenso-website 28px sizing', () => {
	const siteTitlePath = path.join(ROOT_DIR, 'src/components/SiteTitle.astro');
	const content = fs.readFileSync(siteTitlePath, 'utf-8');

	// Logo image must be constrained to 28px width/height matching <zen-zenso-mark [size]="28" />
	assert.match(
		content,
		/width:\s*28px/i,
		'Logo img must have width: 28px matching zenso-website size 28'
	);
	assert.match(
		content,
		/height:\s*28px/i,
		'Logo img must have height: 28px matching zenso-website size 28'
	);
	assert.doesNotMatch(
		content,
		/height:\s*calc\(var\(--sl-nav-height\)/,
		'Logo must not be oversized to full navbar height'
	);
});

test('Brand text matches zenso-website foreground color and text-lg typography', () => {
	const siteTitlePath = path.join(ROOT_DIR, 'src/components/SiteTitle.astro');
	const content = fs.readFileSync(siteTitlePath, 'utf-8');

	// .site-title must use foreground color var(--sl-color-text)
	assert.match(
		content,
		/\.site-title\s*\{[^}]*?color:\s*var\(--sl-color-text\);/,
		'.site-title must use var(--sl-color-text) to match website foreground'
	);
	assert.doesNotMatch(
		content,
		/\.site-title\s*\{[^}]*?color:\s*var\(--sl-color-text-accent\);/,
		'.site-title must not be brown text-accent'
	);

	// Font size must be 1.125rem (text-lg / 18px) matching zenso-website text-lg
	assert.match(
		content,
		/font-size:\s*1\.125rem/,
		'Brand text size must be 1.125rem matching zenso-website text-lg'
	);
});

test('Search input keyboard shortcut has clean unified chip styling without nested borders', () => {
	const headerPath = path.join(ROOT_DIR, 'src/components/Header.astro');
	const content = fs.readFileSync(headerPath, 'utf-8');

	// Inner kbd must not inherit double borders/backgrounds
	assert.match(
		content,
		/kbd\s+kbd/,
		'Header must explicitly style inner kbd or reset nested borders'
	);
});

test('Mobile search input maintains visible border and background container', () => {
	const headerPath = path.join(ROOT_DIR, 'src/components/Header.astro');
	const content = fs.readFileSync(headerPath, 'utf-8');

	// On mobile, button must NOT have transparent border and transparent background
	assert.doesNotMatch(
		content,
		/border:\s*1px\s+solid\s+transparent;[\s\S]*?background:\s*transparent;/,
		'Mobile search button must have a visible border and background'
	);
});

test('Custom MobileMenuToggle is registered and matches zenso-website styles', () => {
	const astroConfig = fs.readFileSync(path.join(ROOT_DIR, 'astro.config.mjs'), 'utf-8');
	assert.match(
		astroConfig,
		/MobileMenuToggle:\s*'\.\/src\/components\/MobileMenuToggle\.astro'/,
		'astro.config.mjs must register custom MobileMenuToggle'
	);

	const togglePath = path.join(ROOT_DIR, 'src/components/MobileMenuToggle.astro');
	assert.ok(fs.existsSync(togglePath), 'src/components/MobileMenuToggle.astro must exist');
	const toggleContent = fs.readFileSync(togglePath, 'utf-8');

	// Must not be a 50% circle button with box-shadow
	assert.doesNotMatch(toggleContent, /border-radius:\s*50%/, 'Mobile menu button must not be 50% circle');
	assert.doesNotMatch(toggleContent, /box-shadow:\s*var\(--sl-shadow/, 'Mobile menu button must not have drop shadow');

	// Must explicitly hide on desktop viewports to prevent overlapping external links
	assert.match(
		toggleContent,
		/@media\s*\((?:min-width:\s*50(?:rem|em)|width\s*>=\s*50(?:rem|em))\)[\s\S]*?display:\s*none/i,
		'Mobile menu toggle must explicitly set display: none on desktop viewports'
	);
});
