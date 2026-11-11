// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import templateI18nCompiler from './src/plugins/template-i18n-compiler.js';
import {
	DEFAULT_LOCALE,
	SUPPORTED_LOCALES,
	SITE_URL,
	DOCS_ASSETS_DIR,
	SITE_TITLE,
	LOGO_CONFIG,
	STARLIGHT_SOCIAL_LINKS,
} from './src/lib/constants.ts';

const starlightLocales = Object.fromEntries(
	SUPPORTED_LOCALES.map((loc) => [loc.code, { label: loc.starlightLabel, lang: loc.lang }])
);

/**
 * Creates static docs-sitemap.xml pointing to docs-sitemap-0.xml
 * matching wrangler.jsonc route: zenso.ink/docs-sitemap*.xml
 * @returns {import('astro').AstroIntegration}
 */
function docsSitemapGenerator() {
	return {
		name: 'docs-sitemap-generator',
		hooks: {
			'astro:build:done': ({ dir }) => {
				const outDir = new URL(dir).pathname;
				const sitemapIndexPath = path.join(outDir, 'sitemap-index.xml');
				const sitemap0Path = path.join(outDir, 'sitemap-0.xml');

				if (fs.existsSync(sitemapIndexPath)) {
					const indexContent = fs.readFileSync(sitemapIndexPath, 'utf-8');
					const rewrittenIndex = indexContent.replaceAll('sitemap-0.xml', 'docs-sitemap-0.xml');
					fs.writeFileSync(path.join(outDir, 'docs-sitemap.xml'), rewrittenIndex, 'utf-8');
					fs.unlinkSync(sitemapIndexPath);
				}

				if (fs.existsSync(sitemap0Path)) {
					fs.copyFileSync(sitemap0Path, path.join(outDir, 'docs-sitemap-0.xml'));
					fs.unlinkSync(sitemap0Path);
				}
			},
		},
	};
}

// https://astro.build/config
export default defineConfig({
	site: SITE_URL,
	build: {
		assets: DOCS_ASSETS_DIR,
	},
	redirects: {
		'/': '/en/docs/',
		'/docs': '/en/docs/',
		'/en/docs/getting-started/overview': '/en/docs/',
		'/pl/docs/getting-started/overview': '/pl/docs/',
		'/ja/docs/getting-started/overview': '/ja/docs/',
	},
	integrations: [
		templateI18nCompiler(),
		starlight({
			title: SITE_TITLE,
			defaultLocale: DEFAULT_LOCALE,
			locales: starlightLocales,
			logo: LOGO_CONFIG,
			components: {
				SiteTitle: './src/components/SiteTitle.astro',
				Header: './src/components/Header.astro',
				PageFrame: './src/components/PageFrame.astro',
				MobileMenuFooter: './src/components/MobileMenuFooter.astro',
				MobileMenuToggle: './src/components/MobileMenuToggle.astro',
			},
			social: STARLIGHT_SOCIAL_LINKS,
			sidebar: [
				{
					label: 'Start Here',
					translations: {
						pl: 'Pierwsze kroki',
						ja: 'はじめに',
					},
					items: [
						{
							slug: 'docs',
							label: 'Overview',
							translations: {
								pl: 'Przegląd',
								ja: '概要',
							},
						},
						{ slug: 'docs/getting-started/quickstart' },
						{ slug: 'docs/getting-started/faq' },
					],
				},
			],
			customCss: ['./src/styles/global.css'],
		}),
		docsSitemapGenerator(),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
