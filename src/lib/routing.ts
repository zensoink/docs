/**
 * Zenso Documentation Route Navigator Module
 *
 * Deep in-process module providing canonical locale resolution,
 * path localization, and route invariants across SSR and client runtimes.
 */

import {
	SUPPORTED_LOCALES,
	DEFAULT_LOCALE,
	LOCALE_CODES,
	LOCALE_STORAGE_KEY,
	SCROLL_STORAGE_KEY,
	THEME_STORAGE_KEY,
	STARLIGHT_THEME_STORAGE_KEY,
	ECOSYSTEM_URLS,
	SITE_URL,
	MAIN_SITE_BASE_URL,
	GITHUB_URL,
	DISCORD_URL,
	PANEL_URL,
	STORAGE_KEYS,
	SITE_CONFIG,
	SITE_TITLE,
	DOCS_ASSETS_DIR,
	LOGO_CONFIG,
	STARLIGHT_SOCIAL_LINKS,
	isSupportedLocale,
	getMainSiteUrl,
	getExternalLinks,
	type Locale,
	type LocaleConfig,
	type ExternalLinkItem,
	type StarlightSocialIcon,
	type StarlightSocialLink,
} from './constants.ts';

export {
	SUPPORTED_LOCALES,
	DEFAULT_LOCALE,
	LOCALE_CODES,
	LOCALE_STORAGE_KEY,
	SCROLL_STORAGE_KEY,
	THEME_STORAGE_KEY,
	STARLIGHT_THEME_STORAGE_KEY,
	ECOSYSTEM_URLS,
	SITE_URL,
	MAIN_SITE_BASE_URL,
	GITHUB_URL,
	DISCORD_URL,
	PANEL_URL,
	STORAGE_KEYS,
	SITE_CONFIG,
	SITE_TITLE,
	DOCS_ASSETS_DIR,
	LOGO_CONFIG,
	STARLIGHT_SOCIAL_LINKS,
	isSupportedLocale,
	getMainSiteUrl,
	getExternalLinks,
	type Locale,
	type LocaleConfig,
	type ExternalLinkItem,
	type StarlightSocialIcon,
	type StarlightSocialLink,
};

/**
 * Resolve the active locale from a URL pathname
 * Falls back to DEFAULT_LOCALE ('en') for missing or unrecognized prefixes
 */
export function resolveLocale(pathname: string): Locale {
	if (!pathname) return DEFAULT_LOCALE;

	const clean = pathname.startsWith('/') ? pathname.slice(1) : pathname;
	const firstSegment = clean.split('/')[0];

	if (isSupportedLocale(firstSegment)) {
		return firstSegment;
	}

	return DEFAULT_LOCALE;
}

/**
 * Transform any documentation pathname to the target locale,
 * preserving subpaths, query strings, and hash fragments
 */
export function localizePath(pathname: string, targetLocale: string): string {
	const validLocale = isSupportedLocale(targetLocale) ? targetLocale : DEFAULT_LOCALE;

	if (!pathname || pathname === '/') {
		return `/${validLocale}/docs/`;
	}

	// Separate query / hash from the pathname
	const queryIndex = pathname.search(/[?#]/);
	const rawPath = queryIndex >= 0 ? pathname.slice(0, queryIndex) : pathname;
	const queryOrHash = queryIndex >= 0 ? pathname.slice(queryIndex) : '';

	let pathBody = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;

	// Strip existing supported locale prefix if present
	for (const loc of LOCALE_CODES) {
		if (pathBody === `/${loc}` || pathBody === `/${loc}/`) {
			pathBody = '/';
			break;
		}
		if (pathBody.startsWith(`/${loc}/`)) {
			pathBody = pathBody.slice(loc.length + 1);
			break;
		}
	}

	if (!pathBody.startsWith('/')) {
		pathBody = `/${pathBody}`;
	}

	// Ensure the path is prefixed with /docs
	if (!pathBody.startsWith('/docs')) {
		if (pathBody === '/') {
			pathBody = '/docs/';
		} else {
			pathBody = `/docs${pathBody}`;
		}
	}

	return `/${validLocale}${pathBody}${queryOrHash}`;
}

/**
 * Get canonical documentation landing route for a locale
 */
export function getDocsHome(locale: string = DEFAULT_LOCALE): string {
	const validLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
	return `/${validLocale}/docs/`;
}
