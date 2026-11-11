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

const enDict = JSON.parse(fs.readFileSync(new URL('./src/i18n/en.json', import.meta.url), 'utf-8'));
const plDict = JSON.parse(fs.readFileSync(new URL('./src/i18n/pl.json', import.meta.url), 'utf-8'));
const jaDict = JSON.parse(fs.readFileSync(new URL('./src/i18n/ja.json', import.meta.url), 'utf-8'));

/**
 * Helper to build a localized sidebar navigation item from i18n dictionaries
 * @param {string} slug
 * @param {string} enLabel
 * @param {string} plLabel
 * @param {string} jaLabel
 */
function createSidebarItem(slug, enLabel, plLabel, jaLabel) {
	return {
		slug,
		label: enLabel,
		translations: {
			pl: plLabel,
			ja: jaLabel,
		},
	};
}

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
					label: enDict.sidebar.sections.start_here,
					translations: {
						pl: plDict.sidebar.sections.start_here,
						ja: jaDict.sidebar.sections.start_here,
					},
					items: [
						createSidebarItem('docs', enDict.sidebar.items.overview, plDict.sidebar.items.overview, jaDict.sidebar.items.overview),
						createSidebarItem('docs/getting-started/quickstart', enDict.sidebar.items.quickstart, plDict.sidebar.items.quickstart, jaDict.sidebar.items.quickstart),
						createSidebarItem('docs/getting-started/faq', enDict.sidebar.items.faq, plDict.sidebar.items.faq, jaDict.sidebar.items.faq),
					],
				},
				{
					label: enDict.sidebar.sections.user_guide,
					translations: {
						pl: plDict.sidebar.sections.user_guide,
						ja: jaDict.sidebar.sections.user_guide,
					},
					items: [
						createSidebarItem('docs/user-guide/overview', enDict.user_guide.overview.title, plDict.user_guide.overview.title, jaDict.user_guide.overview.title),
						createSidebarItem('docs/user-guide/quickstart', enDict.user_guide.quickstart.title, plDict.user_guide.quickstart.title, jaDict.user_guide.quickstart.title),
						createSidebarItem('docs/user-guide/panel-basics', enDict.user_guide.panel_basics.title, plDict.user_guide.panel_basics.title, jaDict.user_guide.panel_basics.title),
						createSidebarItem('docs/user-guide/screens-and-layouts', enDict.user_guide.screens_and_layouts.title, plDict.user_guide.screens_and_layouts.title, jaDict.user_guide.screens_and_layouts.title),
						createSidebarItem('docs/user-guide/refresh-and-battery', enDict.user_guide.refresh_and_battery.title, plDict.user_guide.refresh_and_battery.title, jaDict.user_guide.refresh_and_battery.title),
						createSidebarItem('docs/user-guide/plugins-image', enDict.user_guide.plugins_image.title, plDict.user_guide.plugins_image.title, jaDict.user_guide.plugins_image.title),
						createSidebarItem('docs/user-guide/plugins-calendar', enDict.user_guide.plugins_calendar.title, plDict.user_guide.plugins_calendar.title, jaDict.user_guide.plugins_calendar.title),
						createSidebarItem('docs/user-guide/troubleshooting-faq', enDict.user_guide.troubleshooting_faq.title, plDict.user_guide.troubleshooting_faq.title, jaDict.user_guide.troubleshooting_faq.title),
					],
				},
				{
					label: enDict.sidebar.sections.developer_guide,
					translations: {
						pl: plDict.sidebar.sections.developer_guide,
						ja: jaDict.sidebar.sections.developer_guide,
					},
					items: [
						createSidebarItem('docs/developer-guide/overview', enDict.developer_guide.overview.title, plDict.developer_guide.overview.title, jaDict.developer_guide.overview.title),
						createSidebarItem('docs/developer-guide/docker-setup', enDict.developer_guide.docker_setup.title, plDict.developer_guide.docker_setup.title, jaDict.developer_guide.docker_setup.title),
						createSidebarItem('docs/developer-guide/environment-variables', enDict.developer_guide.environment_variables.title, plDict.developer_guide.environment_variables.title, jaDict.developer_guide.environment_variables.title),
						createSidebarItem('docs/developer-guide/cold-boot-setup', enDict.developer_guide.cold_boot_setup.title, plDict.developer_guide.cold_boot_setup.title, jaDict.developer_guide.cold_boot_setup.title),
						createSidebarItem('docs/developer-guide/plugin-architecture', enDict.developer_guide.plugin_architecture.title, plDict.developer_guide.plugin_architecture.title, jaDict.developer_guide.plugin_architecture.title),
						createSidebarItem('docs/developer-guide/widget-sdk-quickstart', enDict.developer_guide.widget_sdk_quickstart.title, plDict.developer_guide.widget_sdk_quickstart.title, jaDict.developer_guide.widget_sdk_quickstart.title),
						createSidebarItem('docs/developer-guide/manifest-and-schemas', enDict.developer_guide.manifest_and_schemas.title, plDict.developer_guide.manifest_and_schemas.title, jaDict.developer_guide.manifest_and_schemas.title),
						createSidebarItem('docs/developer-guide/building-and-publishing', enDict.developer_guide.building_and_publishing.title, plDict.developer_guide.building_and_publishing.title, jaDict.developer_guide.building_and_publishing.title),
					],
				},
				{
					label: enDict.sidebar.sections.hardware_protocol,
					translations: {
						pl: plDict.sidebar.sections.hardware_protocol,
						ja: jaDict.sidebar.sections.hardware_protocol,
					},
					items: [
						createSidebarItem('docs/hardware-protocol/overview', enDict.hardware_protocol.overview.title, plDict.hardware_protocol.overview.title, jaDict.hardware_protocol.overview.title),
						createSidebarItem('docs/hardware-protocol/zenso-firmware', enDict.hardware_protocol.zenso_firmware.title, plDict.hardware_protocol.zenso_firmware.title, jaDict.hardware_protocol.zenso_firmware.title),
						createSidebarItem('docs/hardware-protocol/byod-guide', enDict.hardware_protocol.byod_guide.title, plDict.hardware_protocol.byod_guide.title, jaDict.hardware_protocol.byod_guide.title),
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
