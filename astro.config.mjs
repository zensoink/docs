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

/**
 * Injects client-side language preference resolver into root redirect pages (/ and /docs)
 * while preserving static meta refresh fallback for bots and tests.
 * @returns {import('astro').AstroIntegration}
 */
function entryRedirectEnhancer() {
	return {
		name: 'entry-redirect-enhancer',
		hooks: {
			'astro:build:done': ({ dir }) => {
				const outDir = new URL(dir).pathname;
				const redirectPaths = [
					path.join(outDir, 'index.html'),
					path.join(outDir, 'docs/index.html'),
				];

				const script = `<script>(function(){try{var s=localStorage.getItem('zenso.lang');var v=['en','pl','ja'].indexOf(s)!==-1?s:null;if(!v&&typeof navigator!=='undefined'){var ls=navigator.languages||[navigator.language];for(var i=0;i<ls.length;i++){var b=(ls[i]||'').split('-')[0].toLowerCase();if(['en','pl','ja'].indexOf(b)!==-1){v=b;break;}}}var t='/'+(v||'en')+'/docs/';if(window.location.pathname!==t){window.location.replace(t);}}catch(e){}})();</script>`;

				for (const filePath of redirectPaths) {
					if (fs.existsSync(filePath)) {
						const original = fs.readFileSync(filePath, 'utf-8');
						if (!original.includes('zenso.lang')) {
							fs.writeFileSync(filePath, `${script}${original}`, 'utf-8');
						}
					}
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
			head: [
				{
					tag: 'script',
					content: `(function(){try{var t=localStorage.getItem('zenso.theme')||localStorage.getItem('starlight-theme');if(t==='light'||t==='dark'){localStorage.setItem('starlight-theme',t);localStorage.setItem('zenso.theme',t);document.documentElement.dataset.theme=t;document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.style.colorScheme=t;}}catch(e){}})();`,
				},
				{
					tag: 'link',
					attrs: { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
				},
				{
					tag: 'link',
					attrs: { rel: 'icon', href: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
				},
				{
					tag: 'link',
					attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' },
				},
			],
			favicon: '/favicon.svg',
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
		entryRedirectEnhancer(),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
