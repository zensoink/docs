/**
 * Zenso Documentation Route Navigator Module
 *
 * Deep in-process module providing canonical locale resolution,
 * path localization, and route invariants across SSR and client runtimes.
 */

export interface LocaleConfig {
	readonly code: 'en' | 'pl' | 'ja';
	readonly label: string;
	readonly starlightLabel: string;
	readonly lang: string;
}

export const SUPPORTED_LOCALES = [
	{ code: 'en', label: 'EN', starlightLabel: 'English', lang: 'en' },
	{ code: 'pl', label: 'PL', starlightLabel: 'Polski', lang: 'pl' },
	{ code: 'ja', label: 'JA', starlightLabel: '日本語', lang: 'ja' },
] as const satisfies readonly LocaleConfig[];

export type Locale = (typeof SUPPORTED_LOCALES)[number]['code'];

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_CODES: readonly Locale[] = SUPPORTED_LOCALES.map((item) => item.code);

export const LOCALE_STORAGE_KEY = 'zenso.lang';
export const SCROLL_STORAGE_KEY = 'zenso.lang_switch_scroll';

/**
 * Check if a given string is a supported locale code
 */
export function isSupportedLocale(candidate: string | null | undefined): candidate is Locale {
	if (!candidate) return false;
	return LOCALE_CODES.includes(candidate as Locale);
}

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
