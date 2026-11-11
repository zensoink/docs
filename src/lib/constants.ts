/**
 * Zenso Documentation Constants & Shared Configuration Module
 *
 * Single source of truth for ecosystem URLs, storage keys, site metadata,
 * locale definitions, and shared external links.
 */

// --- Locales & Language Options ---

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

/**
 * Check if a given string is a supported locale code
 */
export function isSupportedLocale(candidate: string | null | undefined): candidate is Locale {
	if (!candidate) return false;
	return LOCALE_CODES.includes(candidate as Locale);
}

// --- Ecosystem URLs ---

export const ECOSYSTEM_URLS = {
	mainSite: 'https://www.zenso.ink',
	github: 'https://github.com/zensoink',
	discord: 'https://discord.gg/vTjzkwz3XV',
	panel: 'https://panel.zenso.ink',
} as const;

export const SITE_URL = ECOSYSTEM_URLS.mainSite;
export const MAIN_SITE_BASE_URL = ECOSYSTEM_URLS.mainSite;
export const GITHUB_URL = ECOSYSTEM_URLS.github;
export const DISCORD_URL = ECOSYSTEM_URLS.discord;
export const PANEL_URL = ECOSYSTEM_URLS.panel;

// --- Storage Keys ---

export const STORAGE_KEYS = {
	locale: 'zenso.lang',
	scroll: 'zenso.lang_switch_scroll',
	theme: 'zenso.theme',
	starlightTheme: 'starlight-theme',
} as const;

export const LOCALE_STORAGE_KEY = STORAGE_KEYS.locale;
export const SCROLL_STORAGE_KEY = STORAGE_KEYS.scroll;
export const THEME_STORAGE_KEY = STORAGE_KEYS.theme;
export const STARLIGHT_THEME_STORAGE_KEY = STORAGE_KEYS.starlightTheme;

// --- Site Metadata & Starlight Build Config ---

export const SITE_CONFIG = {
	title: 'Zenso',
	assetsDir: '_docs_assets',
	logo: {
		src: './src/assets/logo.svg',
		alt: 'Zenso Logo',
	},
} as const;

export const SITE_TITLE = SITE_CONFIG.title;
export const DOCS_ASSETS_DIR = SITE_CONFIG.assetsDir;
export const LOGO_CONFIG = SITE_CONFIG.logo;

// --- Starlight Social Icons Config ---

export type StarlightSocialIcon = 'github' | 'discord' | 'external';

export interface StarlightSocialLink {
	icon: StarlightSocialIcon;
	label: string;
	href: string;
}

export const STARLIGHT_SOCIAL_LINKS: StarlightSocialLink[] = [
	{ icon: 'github', label: 'GitHub', href: ECOSYSTEM_URLS.github },
	{ icon: 'discord', label: 'Discord', href: ECOSYSTEM_URLS.discord },
	{ icon: 'external', label: 'Zenso.ink', href: ECOSYSTEM_URLS.mainSite },
];

// --- Localized URLs & Navigation Helpers ---

/**
 * Get localized main website landing route for a locale
 */
export function getMainSiteUrl(locale: string = DEFAULT_LOCALE): string {
	const validLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
	return `${ECOSYSTEM_URLS.mainSite}/${validLocale}/`;
}

export interface ExternalLinkItem {
	readonly label: string;
	readonly href: string;
	readonly icon: 'github' | 'discord' | 'external';
	readonly title: string;
	readonly external: boolean;
}

/**
 * Get strongly-typed external link items for navigation headers and drawers
 */
export function getExternalLinks(locale: string = DEFAULT_LOCALE): readonly ExternalLinkItem[] {
	return [
		{
			label: 'GitHub',
			href: ECOSYSTEM_URLS.github,
			icon: 'github',
			title: 'Zenso GitHub Organization',
			external: true,
		},
		{
			label: 'Discord',
			href: ECOSYSTEM_URLS.discord,
			icon: 'discord',
			title: 'Zenso Community Discord',
			external: true,
		},
		{
			label: 'zenso.ink',
			href: getMainSiteUrl(locale),
			icon: 'external',
			title: 'Zenso Main Website',
			external: false,
		},
	];
}
