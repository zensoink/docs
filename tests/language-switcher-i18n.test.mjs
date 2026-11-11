import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

test('astro.config.mjs configures Starlight defaultLocale and locales for en, pl, and ja', () => {
	const astroConfig = fs.readFileSync(path.join(ROOT_DIR, 'astro.config.mjs'), 'utf-8');

	assert.match(
		astroConfig,
		/defaultLocale:\s*(?:['"]en['"]|DEFAULT_LOCALE)/,
		'astro.config.mjs must configure defaultLocale: "en"'
	);
	assert.match(
		astroConfig,
		/locales:\s*(?:\{[\s\S]*?en:[\s\S]*?pl:[\s\S]*?ja:[\s\S]*?\}|starlightLocales)/,
		'astro.config.mjs must configure locales with en, pl, and ja'
	);
});

test('Localized content index files exist for pl and ja', () => {
	const plIndexPath = path.join(ROOT_DIR, 'src/content/docs/pl/docs/index.mdx');
	const jaIndexPath = path.join(ROOT_DIR, 'src/content/docs/ja/docs/index.mdx');

	assert.ok(fs.existsSync(plIndexPath), 'src/content/docs/pl/docs/index.mdx must exist');
	assert.ok(fs.existsSync(jaIndexPath), 'src/content/docs/ja/docs/index.mdx must exist');

	const plContent = fs.readFileSync(plIndexPath, 'utf-8');
	assert.match(plContent, /title:\s*Dokumentacja Zenso/, 'PL doc must have Polish title');
	assert.match(plContent, /Ekosystem Zenso|Poznaj ekosystem/, 'PL doc must have Polish section heading');

	const jaContent = fs.readFileSync(jaIndexPath, 'utf-8');
	assert.match(jaContent, /title:\s*Zenso ドキュメント/, 'JA doc must have Japanese title');
	assert.match(jaContent, /エコシステム/, 'JA doc must have Japanese section heading');
});

test('LanguageSwitcher handles live navigation for en, pl, and ja locales under /{lang}/docs pattern', () => {
	const langPath = path.join(ROOT_DIR, 'src/components/LanguageSwitcher.astro');
	const content = fs.readFileSync(langPath, 'utf-8');

	// Must compute localized paths or navigate for all supported locales via Route Navigator
	assert.match(
		content,
		/localizePath|computeLocalizedPath|data-href|window\.location\.pathname\s*=/i,
		'LanguageSwitcher must compute localized paths for navigation'
	);

	// Must import and delegate to routing module
	assert.match(
		content,
		/from\s+['"]\.\.\/lib\/routing['"]/,
		'LanguageSwitcher must delegate route calculations to the Route Navigator module'
	);

	// Must not have the old bug where only code === "en" triggers navigation
	assert.doesNotMatch(
		content,
		/if\s*\(\s*code\s*===\s*'en'\s*\)\s*\{[\s\S]*?\}\s*\}\s*\)\s*;\s*\}\s*\)\s*;/,
		'LanguageSwitcher must not only navigate when code === "en"'
	);
});

test('Static build outputs localized HTML pages with correct lang attributes and active switcher states under /{lang}/docs', () => {
	const enHtmlPath = path.join(ROOT_DIR, 'dist/en/docs/index.html');
	const plHtmlPath = path.join(ROOT_DIR, 'dist/pl/docs/index.html');
	const jaHtmlPath = path.join(ROOT_DIR, 'dist/ja/docs/index.html');

	assert.ok(fs.existsSync(enHtmlPath), 'dist/en/docs/index.html must exist');
	assert.ok(fs.existsSync(plHtmlPath), 'dist/pl/docs/index.html must exist');
	assert.ok(fs.existsSync(jaHtmlPath), 'dist/ja/docs/index.html must exist');

	const enHtml = fs.readFileSync(enHtmlPath, 'utf-8');
	const plHtml = fs.readFileSync(plHtmlPath, 'utf-8');
	const jaHtml = fs.readFileSync(jaHtmlPath, 'utf-8');

	assert.match(enHtml, /<html[^>]*lang=["']en["']/i, 'EN page must have lang="en"');
	assert.match(plHtml, /<html[^>]*lang=["']pl["']/i, 'PL page must have lang="pl"');
	assert.match(jaHtml, /<html[^>]*lang=["']ja["']/i, 'JA page must have lang="ja"');

	// Active states in rendered switcher
	assert.match(
		enHtml,
		/data-lang=["']en["'][^>]*class=["'][^"']*active[^"']*["']/,
		'EN page must mark EN as active'
	);
	assert.match(
		plHtml,
		/data-lang=["']pl["'][^>]*class=["'][^"']*active[^"']*["']/,
		'PL page must mark PL as active'
	);
	assert.match(
		jaHtml,
		/data-lang=["']ja["'][^>]*class=["'][^"']*active[^"']*["']/,
		'JA page must mark JA as active'
	);

	// Target URLs in rendered switcher buttons
	assert.match(enHtml, /data-href="\/pl\/docs\/"/, 'EN switcher button for PL must point to /pl/docs/');
	assert.match(enHtml, /data-href="\/ja\/docs\/"/, 'EN switcher button for JA must point to /ja/docs/');
	assert.match(plHtml, /data-href="\/en\/docs\/"/, 'PL switcher button for EN must point to /en/docs/');

	// Verify /docs redirects dynamically based on zenso.lang with static fallback
	const docsRedirect = fs.readFileSync(path.join(ROOT_DIR, 'dist/docs/index.html'), 'utf-8');
	assert.match(docsRedirect, /zenso\.lang/, '/docs redirect must check stored language zenso.lang');
	assert.match(docsRedirect, /url=\/en\/docs/, '/docs must redirect to /en/docs');
});

test('LanguageSwitcher preserves scroll position across language switches', () => {
	const langPath = path.join(ROOT_DIR, 'src/components/LanguageSwitcher.astro');
	const content = fs.readFileSync(langPath, 'utf-8');

	// Must save scroll position on click
	assert.match(
		content,
		/sessionStorage\.setItem\([^)]*scrollY/i,
		'LanguageSwitcher must save scroll position before navigation'
	);

	// Must restore scroll position on page load
	assert.match(
		content,
		/scrollTo\(\{[\s\S]*?top[\s\S]*?\}|window\.scrollTo/i,
		'LanguageSwitcher must restore scroll position on load'
	);
});
