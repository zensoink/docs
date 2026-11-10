import test from 'node:test';
import assert from 'node:assert/strict';
import {
	SUPPORTED_LOCALES,
	DEFAULT_LOCALE,
	LOCALE_CODES,
	LOCALE_STORAGE_KEY,
	SCROLL_STORAGE_KEY,
	isSupportedLocale,
	resolveLocale,
	localizePath,
	getDocsHome,
} from '../src/lib/routing.ts';

test('Route Navigator exports invariants and configuration', () => {
	assert.equal(DEFAULT_LOCALE, 'en');
	assert.deepEqual(LOCALE_CODES, ['en', 'pl', 'ja']);
	assert.equal(LOCALE_STORAGE_KEY, 'zenso.lang');
	assert.equal(SCROLL_STORAGE_KEY, 'zenso.lang_switch_scroll');
	assert.equal(SUPPORTED_LOCALES.length, 3);
});

test('isSupportedLocale checks codes correctly', () => {
	assert.equal(isSupportedLocale('en'), true);
	assert.equal(isSupportedLocale('pl'), true);
	assert.equal(isSupportedLocale('ja'), true);
	assert.equal(isSupportedLocale('de'), false);
	assert.equal(isSupportedLocale(''), false);
	assert.equal(isSupportedLocale(null), false);
});

test('resolveLocale resolves active locale and falls back to default', () => {
	assert.equal(resolveLocale('/pl/docs'), 'pl');
	assert.equal(resolveLocale('/pl/docs/quickstart'), 'pl');
	assert.equal(resolveLocale('/ja/docs/firmware'), 'ja');
	assert.equal(resolveLocale('/en/docs'), 'en');
	assert.equal(resolveLocale('/docs'), 'en');
	assert.equal(resolveLocale('/'), 'en');
	assert.equal(resolveLocale('/unknown/path'), 'en');
	assert.equal(resolveLocale(''), 'en');
});

test('localizePath formats routes accurately across all locales', () => {
	// From unlocalized root
	assert.equal(localizePath('/', 'en'), '/en/docs/');
	assert.equal(localizePath('', 'pl'), '/pl/docs/');

	// From unlocalized /docs
	assert.equal(localizePath('/docs', 'en'), '/en/docs');
	assert.equal(localizePath('/docs/', 'ja'), '/ja/docs/');

	// Cross-locale switching
	assert.equal(localizePath('/en/docs', 'pl'), '/pl/docs');
	assert.equal(localizePath('/pl/docs/', 'ja'), '/ja/docs/');
	assert.equal(localizePath('/ja/docs/api/overview', 'en'), '/en/docs/api/overview');

	// Preserve query strings and hash anchors
	assert.equal(localizePath('/en/docs?search=e-ink#section-1', 'pl'), '/pl/docs?search=e-ink#section-1');
	assert.equal(localizePath('/pl/docs/hardware#assembly?view=full', 'ja'), '/ja/docs/hardware#assembly?view=full');

	// Fallback for invalid target locale
	assert.equal(localizePath('/pl/docs', 'invalid'), '/en/docs');
});

test('getDocsHome returns canonical docs landing route', () => {
	assert.equal(getDocsHome('en'), '/en/docs/');
	assert.equal(getDocsHome('pl'), '/pl/docs/');
	assert.equal(getDocsHome('ja'), '/ja/docs/');
	assert.equal(getDocsHome('invalid'), '/en/docs/');
});
