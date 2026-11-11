import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

test('astro.config.mjs configures custom Header and MobileMenuFooter components', () => {
	const astroConfig = fs.readFileSync(path.join(ROOT_DIR, 'astro.config.mjs'), 'utf-8');
	assert.match(
		astroConfig,
		/Header:\s*'\.\/src\/components\/Header\.astro'/,
		'astro.config.mjs must register custom Header component'
	);
	assert.match(
		astroConfig,
		/MobileMenuFooter:\s*'\.\/src\/components\/MobileMenuFooter\.astro'/,
		'astro.config.mjs must register custom MobileMenuFooter component'
	);
});

test('Header.astro contains 3-part layout: brand, search, and right controls group', () => {
	const headerPath = path.join(ROOT_DIR, 'src/components/Header.astro');
	assert.ok(fs.existsSync(headerPath), 'src/components/Header.astro must exist');
	const headerContent = fs.readFileSync(headerPath, 'utf-8');

	// Brand section
	assert.match(headerContent, /SiteTitle/, 'Header must render SiteTitle or brand section');

	// Search section
	assert.match(headerContent, /Search/, 'Header must render Search component');

	// Right group: Language switcher, Theme toggle, and External links
	assert.match(headerContent, /LanguageSwitcher/, 'Header must include LanguageSwitcher');
	assert.match(headerContent, /ThemeToggle/, 'Header must include ThemeToggle');
	assert.match(headerContent, /ExternalLinks/, 'Header must include ExternalLinks');
});

test('LanguageSwitcher renders EN · PL · JA and synchronizes with localStorage zenso.lang', () => {
	const langPath = path.join(ROOT_DIR, 'src/components/LanguageSwitcher.astro');
	assert.ok(fs.existsSync(langPath), 'src/components/LanguageSwitcher.astro must exist');
	const content = fs.readFileSync(langPath, 'utf-8');

	assert.match(content, /EN/, 'Must include EN option');
	assert.match(content, /PL/, 'Must include PL option');
	assert.match(content, /JA/, 'Must include JA option');
	assert.match(content, /zenso\.lang/, 'Must reference localStorage key zenso.lang');
});

test('ThemeToggle supports circular view-transition animation and toggles dark/light', () => {
	const themePath = path.join(ROOT_DIR, 'src/components/ThemeToggle.astro');
	assert.ok(fs.existsSync(themePath), 'src/components/ThemeToggle.astro must exist');
	const content = fs.readFileSync(themePath, 'utf-8');

	assert.match(content, /startViewTransition/, 'Must support startViewTransition');
	assert.match(content, /clipPath/, 'Must use circular clipPath animation');
	assert.match(content, /data-theme/, 'Must set data-theme attribute');
	assert.match(content, /storage/, 'Must listen to storage events for cross-tab sync');
	assert.match(content, /THEME_STORAGE_KEY/, 'Must use THEME_STORAGE_KEY');
	assert.match(content, /STARLIGHT_THEME_STORAGE_KEY/, 'Must use STARLIGHT_THEME_STORAGE_KEY');
});

test('ExternalLinks renders GitHub, Discord, and localized Zenso Web via getExternalLinks', () => {
	const extPath = path.join(ROOT_DIR, 'src/components/ExternalLinks.astro');
	assert.ok(fs.existsSync(extPath), 'src/components/ExternalLinks.astro must exist');
	const content = fs.readFileSync(extPath, 'utf-8');

	assert.match(content, /getExternalLinks\(locale\)/, 'Must delegate links to getExternalLinks');
	assert.match(content, /noopener noreferrer/, 'Must include noopener for external links');
	assert.match(content, /_blank/, 'Must include _blank for external links');
});

test('MobileMenuFooter renders language switcher, theme toggle, and external links for mobile drawer', () => {
	const footerPath = path.join(ROOT_DIR, 'src/components/MobileMenuFooter.astro');
	assert.ok(fs.existsSync(footerPath), 'src/components/MobileMenuFooter.astro must exist');
	const content = fs.readFileSync(footerPath, 'utf-8');

	assert.match(content, /LanguageSwitcher/, 'MobileMenuFooter must include LanguageSwitcher');
	assert.match(content, /ThemeToggle/, 'MobileMenuFooter must include ThemeToggle');
	assert.match(content, /ExternalLinks/, 'MobileMenuFooter must include ExternalLinks');
});
