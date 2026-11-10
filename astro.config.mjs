// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import templateI18nCompiler from './src/plugins/template-i18n-compiler.js';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './src/lib/routing.ts';

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
				}

				if (fs.existsSync(sitemap0Path)) {
					fs.copyFileSync(sitemap0Path, path.join(outDir, 'docs-sitemap-0.xml'));
				}
			},
		},
	};
}

// https://astro.build/config
export default defineConfig({
	site: 'https://zenso.ink',
	build: {
		assets: '_docs_assets',
	},
	redirects: {
		'/': '/en/docs',
		'/docs': '/en/docs',
	},
	integrations: [
		templateI18nCompiler(),
		starlight({
			title: 'Zenso',
			defaultLocale: DEFAULT_LOCALE,
			locales: starlightLocales,
			logo: {
				src: './src/assets/logo.svg',
				alt: 'Zenso Logo',
			},
			components: {
				SiteTitle: './src/components/SiteTitle.astro',
				Header: './src/components/Header.astro',
				PageFrame: './src/components/PageFrame.astro',
				MobileMenuFooter: './src/components/MobileMenuFooter.astro',
				MobileMenuToggle: './src/components/MobileMenuToggle.astro',
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/zensoink' },
				{ icon: 'discord', label: 'Discord', href: 'https://discord.gg/vTjzkwz3XV' },
				{ icon: 'external', label: 'Zenso.ink', href: 'https://zenso.ink' },
			],
			sidebar: [
				{
					label: 'Documentation',
					items: [{ autogenerate: { directory: 'docs' } }],
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
