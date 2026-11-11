import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

const LOCALES = ['en', 'pl', 'ja'];

const EXPECTED_SLUGS = [
	// Start Here
	'docs',
	'docs/getting-started/quickstart',
	'docs/getting-started/faq',

	// User Guide (streamlined to dashboard & feature management)
	'docs/user-guide/panel-basics',
	'docs/user-guide/screens-and-layouts',
	'docs/user-guide/refresh-and-battery',
	'docs/user-guide/plugins-image',
	'docs/user-guide/plugins-calendar',
	'docs/user-guide/troubleshooting-faq',

	// Developer Guide
	'docs/developer-guide/overview',
	'docs/developer-guide/docker-setup',
	'docs/developer-guide/environment-variables',
	'docs/developer-guide/cold-boot-setup',
	'docs/developer-guide/plugin-architecture',
	'docs/developer-guide/widget-sdk-quickstart',
	'docs/developer-guide/manifest-and-schemas',
	'docs/developer-guide/building-and-publishing',

	// Hardware & BYOD
	'docs/hardware-protocol/overview',
	'docs/hardware-protocol/zenso-firmware',
	'docs/hardware-protocol/byod-guide',
];

test('astro.config.mjs configures all 3 main sections and Start Here sourced from src/i18n dictionaries', () => {
	const astroConfig = fs.readFileSync(path.join(ROOT_DIR, 'astro.config.mjs'), 'utf-8');

	// Verify astro.config.mjs sources sidebar sections dynamically from i18n
	assert.ok(
		astroConfig.includes('enDict.sidebar.sections'),
		'astro.config.mjs must source sidebar section labels from i18n dictionaries'
	);

	const enDict = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'src/i18n/en.json'), 'utf-8'));
	const plDict = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'src/i18n/pl.json'), 'utf-8'));
	const jaDict = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'src/i18n/ja.json'), 'utf-8'));

	for (const loc of [enDict, plDict, jaDict]) {
		assert.ok(loc.sidebar?.sections?.start_here, 'Must contain start_here section label');
		assert.ok(loc.sidebar?.sections?.user_guide, 'Must contain user_guide section label');
		assert.ok(loc.sidebar?.sections?.developer_guide, 'Must contain developer_guide section label');
		assert.ok(loc.sidebar?.sections?.hardware_protocol, 'Must contain hardware_protocol section label');
	}

	assert.equal(enDict.sidebar.sections.start_here, 'Start Here');
	assert.equal(enDict.sidebar.sections.user_guide, 'User Guide');
	assert.equal(enDict.sidebar.sections.developer_guide, 'Developer Guide');
	assert.equal(enDict.sidebar.sections.hardware_protocol, 'Hardware & BYOD');

	assert.equal(plDict.sidebar.sections.start_here, 'Pierwsze kroki');
	assert.equal(plDict.sidebar.sections.user_guide, 'Podręcznik Użytkownika');
	assert.equal(plDict.sidebar.sections.developer_guide, 'Podręcznik Dewelopera');
	assert.equal(plDict.sidebar.sections.hardware_protocol, 'Sprzęt i BYOD');

	assert.equal(jaDict.sidebar.sections.start_here, 'はじめに');
	assert.equal(jaDict.sidebar.sections.user_guide, 'ユーザーガイド');
	assert.equal(jaDict.sidebar.sections.developer_guide, '開発者ガイド');
	assert.equal(jaDict.sidebar.sections.hardware_protocol, 'ハードウェアとBYOD');

	// Verify sidebar Overview & Philosophy item label
	assert.equal(enDict.sidebar.items.overview, 'Overview & Philosophy');
	assert.equal(plDict.sidebar.items.overview, 'Przegląd i Filozofia');
	assert.equal(jaDict.sidebar.items.overview, '概要と哲学');
});

test('Astro config registers redirects for consolidated User Guide routes', () => {
	const astroConfig = fs.readFileSync(path.join(ROOT_DIR, 'astro.config.mjs'), 'utf-8');

	for (const loc of LOCALES) {
		assert.ok(
			astroConfig.includes(`'/${loc}/docs/user-guide/overview': '/${loc}/docs/'`),
			`Redirect for /${loc}/docs/user-guide/overview must be configured`
		);
		assert.ok(
			astroConfig.includes(`'/${loc}/docs/user-guide/quickstart': '/${loc}/docs/getting-started/quickstart/'`),
			`Redirect for /${loc}/docs/user-guide/quickstart must be configured`
		);
	}
});

test('All expected routes exist in astro.config.mjs sidebar and consolidated routes are removed', () => {
	const astroConfig = fs.readFileSync(path.join(ROOT_DIR, 'astro.config.mjs'), 'utf-8');

	for (const slug of EXPECTED_SLUGS) {
		assert.ok(
			astroConfig.includes(`'${slug}'`),
			`Sidebar must register slug: '${slug}'`
		);
	}

	assert.ok(
		!astroConfig.includes(`'docs/user-guide/overview'`),
		'Sidebar must not contain removed docs/user-guide/overview'
	);
	assert.ok(
		!astroConfig.includes(`'docs/user-guide/quickstart'`),
		'Sidebar must not contain removed docs/user-guide/quickstart'
	);
});

test('Every expected slug has a corresponding content file across en, pl, and ja locales', () => {
	for (const slug of EXPECTED_SLUGS) {
		for (const locale of LOCALES) {
			const filePath = slug === 'docs'
				? path.join(ROOT_DIR, 'src/content/docs', locale, 'docs/index.mdx')
				: path.join(ROOT_DIR, 'src/content/docs', locale, `${slug}.mdx`);

			assert.ok(
				fs.existsSync(filePath),
				`File must exist for locale ${locale}: ${filePath}`
			);

			const content = fs.readFileSync(filePath, 'utf-8');
			assert.match(content, /^---\ntitle:/m, `${filePath} must contain frontmatter title`);
			assert.match(content, /^description:/m, `${filePath} must contain frontmatter description`);
		}
	}
});

test('SEO meta tags and OpenGraph tags are populated across all built HTML documentation pages', () => {
	const distDir = path.join(ROOT_DIR, 'dist');
	if (!fs.existsSync(distDir)) return;

	for (const slug of EXPECTED_SLUGS) {
		for (const locale of LOCALES) {
			const relHtmlPath = slug === 'docs'
				? `${locale}/docs/index.html`
				: `${locale}/${slug}/index.html`;

			const htmlPath = path.join(distDir, relHtmlPath);
			if (fs.existsSync(htmlPath)) {
				const html = fs.readFileSync(htmlPath, 'utf-8');
				assert.match(html, /<meta name="description"[^>]*content="[^"]+"/, `${relHtmlPath} must have meta description`);
				assert.match(html, /<meta property="og:title"[^>]*content="[^"]+"/, `${relHtmlPath} must have og:title`);
			}
		}
	}
});

test('docs-sitemap-0.xml contains all routes across en, pl, and ja locales', () => {
	const sitemapPath = path.join(ROOT_DIR, 'dist/docs-sitemap-0.xml');
	if (!fs.existsSync(sitemapPath)) return;

	const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
	for (const slug of EXPECTED_SLUGS) {
		for (const locale of LOCALES) {
			const expectedUrl = slug === 'docs'
				? `https://www.zenso.ink/${locale}/docs/`
				: `https://www.zenso.ink/${locale}/${slug}/`;

			assert.ok(
				sitemapContent.includes(expectedUrl),
				`Sitemap must contain: ${expectedUrl}`
			);
		}
	}
});

