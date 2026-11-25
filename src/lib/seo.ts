/**
 * Zenso Documentation SEO Helpers
 *
 * Pure helpers for Open Graph / Twitter image tags and schema.org JSON-LD
 * structured data (`Organization`, `WebSite`, `BreadcrumbList`, `TechArticle`).
 */

import {
	DISCORD_URL,
	GITHUB_URL,
	LOCALE_CODES,
	SITE_TITLE,
	SITE_URL,
	getMainSiteUrl,
	type Locale,
} from './constants.ts';
import { getDocsHome, localizePath } from './routing.ts';

const OG_IMAGE_ALTS: Record<Locale, string> = {
	en: 'Zenso color e-paper smart photo frame in natural wood',
	pl: 'Kolorowa ramka na zdjęcia z e-papieru Zenso w naturalnym drewnie',
	ja: '天然木フレームのZensoカラー電子ペーパーフォトフレーム',
};

const DOCS_ROOT_LABELS: Record<Locale, string> = {
	en: 'Documentation',
	pl: 'Dokumentacja',
	ja: 'ドキュメント',
};

export interface BreadcrumbItem {
	readonly '@type': 'ListItem';
	readonly position: number;
	readonly name: string;
	readonly item: string;
}

export interface BreadcrumbListSchema {
	readonly '@type': 'BreadcrumbList';
	readonly itemListElement: readonly BreadcrumbItem[];
}

export interface DocsPageSeoInput {
	readonly localizedRoute: string;
	readonly title: string;
	readonly description: string;
	readonly locale: Locale;
}

/** Return the localized Open Graph / Twitter preview image URL hosted on zenso.ink. */
export function getDocsOgImageUrl(locale: Locale): string {
	return `${SITE_URL}/og/${locale}.png`;
}

/** Return localized accessible alt text for the docs Open Graph / Twitter image. */
export function getDocsOgImageAlt(locale: Locale): string {
	return OG_IMAGE_ALTS[locale];
}

/** Build a schema.org `BreadcrumbList` from the main site to the current docs page. */
export function buildDocsBreadcrumbs(
	input: Pick<DocsPageSeoInput, 'localizedRoute' | 'title' | 'locale'>
): BreadcrumbListSchema {
	const canonicalRoute = localizePath(input.localizedRoute, input.locale);
	const docsHomeRoute = getDocsHome(input.locale);

	const items: BreadcrumbItem[] = [
		{
			'@type': 'ListItem',
			position: 1,
			name: SITE_TITLE,
			item: getMainSiteUrl(input.locale),
		},
		{
			'@type': 'ListItem',
			position: 2,
			name: DOCS_ROOT_LABELS[input.locale],
			item: `${SITE_URL}${docsHomeRoute}`,
		},
	];

	if (canonicalRoute !== docsHomeRoute) {
		items.push({
			'@type': 'ListItem',
			position: 3,
			name: input.title,
			item: `${SITE_URL}${canonicalRoute}`,
		});
	}

	return {
		'@type': 'BreadcrumbList',
		itemListElement: items,
	};
}

/** Build a schema.org `@graph` containing Organization, WebSite, BreadcrumbList, and TechArticle. */
export function buildDocsStructuredData(input: DocsPageSeoInput): Record<string, unknown> {
	const canonicalRoute = localizePath(input.localizedRoute, input.locale);
	const canonicalUrl = `${SITE_URL}${canonicalRoute}`;
	const mainSiteUrl = getMainSiteUrl(input.locale);
	const logoUrl = `${SITE_URL}/icon.svg`;
	const organization = {
		'@type': 'Organization',
		name: SITE_TITLE,
		url: mainSiteUrl,
	};

	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				...organization,
				logo: logoUrl,
				sameAs: [DISCORD_URL, GITHUB_URL],
			},
			{
				'@type': 'WebSite',
				name: SITE_TITLE,
				url: mainSiteUrl,
				inLanguage: LOCALE_CODES,
			},
			buildDocsBreadcrumbs({
				localizedRoute: canonicalRoute,
				title: input.title,
				locale: input.locale,
			}),
			{
				'@type': 'TechArticle',
				headline: input.title,
				description: input.description,
				url: canonicalUrl,
				inLanguage: input.locale,
				image: getDocsOgImageUrl(input.locale),
				author: organization,
				publisher: {
					...organization,
					logo: {
						'@type': 'ImageObject',
						url: logoUrl,
					},
				},
				mainEntityOfPage: {
					'@type': 'WebPage',
					'@id': canonicalUrl,
				},
			},
		],
	};
}

/** Serialize JSON-LD safely so `<` inside translated strings cannot close `<script>`. */
export function serializeJsonLd(data: Record<string, unknown>): string {
	return JSON.stringify(data).replaceAll('<', String.raw`\u003c`);
}
