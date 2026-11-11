import test from 'node:test';
import assert from 'node:assert/strict';
import {
	SUPPORTED_LOCALES,
	DEFAULT_LOCALE,
	LOCALE_CODES,
	isSupportedLocale,
	ECOSYSTEM_URLS,
	SITE_URL,
	MAIN_SITE_BASE_URL,
	GITHUB_URL,
	DISCORD_URL,
	PANEL_URL,
	STORAGE_KEYS,
	LOCALE_STORAGE_KEY,
	SCROLL_STORAGE_KEY,
	THEME_STORAGE_KEY,
	STARLIGHT_THEME_STORAGE_KEY,
	SITE_CONFIG,
	SITE_TITLE,
	DOCS_ASSETS_DIR,
	LOGO_CONFIG,
	STARLIGHT_SOCIAL_LINKS,
	getMainSiteUrl,
	getExternalLinks,
} from '../src/lib/constants.ts';

test('constants: ecosystem URLs are canonical and consistent', () => {
	assert.equal(ECOSYSTEM_URLS.mainSite, 'https://www.zenso.ink');
	assert.equal(ECOSYSTEM_URLS.github, 'https://github.com/zensoink');
	assert.equal(ECOSYSTEM_URLS.discord, 'https://discord.gg/vTjzkwz3XV');
	assert.equal(ECOSYSTEM_URLS.panel, 'https://panel.zenso.ink');

	assert.equal(SITE_URL, ECOSYSTEM_URLS.mainSite);
	assert.equal(MAIN_SITE_BASE_URL, ECOSYSTEM_URLS.mainSite);
	assert.equal(GITHUB_URL, ECOSYSTEM_URLS.github);
	assert.equal(DISCORD_URL, ECOSYSTEM_URLS.discord);
	assert.equal(PANEL_URL, ECOSYSTEM_URLS.panel);
});

test('constants: storage keys match ecosystem conventions', () => {
	assert.equal(STORAGE_KEYS.locale, 'zenso.lang');
	assert.equal(STORAGE_KEYS.scroll, 'zenso.lang_switch_scroll');
	assert.equal(STORAGE_KEYS.theme, 'zenso.theme');
	assert.equal(STORAGE_KEYS.starlightTheme, 'starlight-theme');

	assert.equal(LOCALE_STORAGE_KEY, 'zenso.lang');
	assert.equal(SCROLL_STORAGE_KEY, 'zenso.lang_switch_scroll');
	assert.equal(THEME_STORAGE_KEY, 'zenso.theme');
	assert.equal(STARLIGHT_THEME_STORAGE_KEY, 'starlight-theme');
});

test('constants: site config and metadata are well-formed', () => {
	assert.equal(SITE_CONFIG.title, 'Zenso');
	assert.equal(SITE_CONFIG.assetsDir, '_docs_assets');
	assert.equal(SITE_CONFIG.logo.src, './src/assets/logo.svg');
	assert.equal(SITE_CONFIG.logo.alt, 'Zenso Logo');

	assert.equal(SITE_TITLE, 'Zenso');
	assert.equal(DOCS_ASSETS_DIR, '_docs_assets');
	assert.deepEqual(LOGO_CONFIG, { src: './src/assets/logo.svg', alt: 'Zenso Logo' });
});

test('constants: starlight social links match ecosystem URLs', () => {
	assert.equal(STARLIGHT_SOCIAL_LINKS.length, 3);
	assert.deepEqual(STARLIGHT_SOCIAL_LINKS[0], { icon: 'github', label: 'GitHub', href: 'https://github.com/zensoink' });
	assert.deepEqual(STARLIGHT_SOCIAL_LINKS[1], { icon: 'discord', label: 'Discord', href: 'https://discord.gg/vTjzkwz3XV' });
	assert.deepEqual(STARLIGHT_SOCIAL_LINKS[2], { icon: 'external', label: 'Zenso.ink', href: 'https://www.zenso.ink' });
});

test('constants: locale invariants and helpers behave correctly', () => {
	assert.equal(DEFAULT_LOCALE, 'en');
	assert.deepEqual(LOCALE_CODES, ['en', 'pl', 'ja']);
	assert.equal(SUPPORTED_LOCALES.length, 3);
	assert.equal(isSupportedLocale('en'), true);
	assert.equal(isSupportedLocale('pl'), true);
	assert.equal(isSupportedLocale('ja'), true);
	assert.equal(isSupportedLocale('fr'), false);
});

test('constants: getMainSiteUrl formats localized root routes', () => {
	assert.equal(getMainSiteUrl('en'), 'https://www.zenso.ink/en/');
	assert.equal(getMainSiteUrl('pl'), 'https://www.zenso.ink/pl/');
	assert.equal(getMainSiteUrl('ja'), 'https://www.zenso.ink/ja/');
	assert.equal(getMainSiteUrl('invalid'), 'https://www.zenso.ink/en/');
	assert.equal(getMainSiteUrl(), 'https://www.zenso.ink/en/');
});

test('constants: getExternalLinks provides localized same-window zenso.ink and new-tab socials', () => {
	const plLinks = getExternalLinks('pl');
	assert.equal(plLinks.length, 3);

	const github = plLinks.find((l) => l.label === 'GitHub');
	assert.ok(github);
	assert.equal(github.href, 'https://github.com/zensoink');
	assert.equal(github.external, true);

	const discord = plLinks.find((l) => l.label === 'Discord');
	assert.ok(discord);
	assert.equal(discord.href, 'https://discord.gg/vTjzkwz3XV');
	assert.equal(discord.external, true);

	const zensoWeb = plLinks.find((l) => l.label === 'zenso.ink');
	assert.ok(zensoWeb);
	assert.equal(zensoWeb.href, 'https://www.zenso.ink/pl/');
	assert.equal(zensoWeb.external, false);

	const enLinks = getExternalLinks('en');
	const enZensoWeb = enLinks.find((l) => l.label === 'zenso.ink');
	assert.equal(enZensoWeb?.href, 'https://www.zenso.ink/en/');
	assert.equal(enZensoWeb?.external, false);
});
