// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import templateI18nCompiler from './src/plugins/template-i18n-compiler.js';

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
			defaultLocale: 'en',
			locales: {
				en: {
					label: 'English',
					lang: 'en',
				},
				pl: {
					label: 'Polski',
					lang: 'pl',
				},
				ja: {
					label: '日本語',
					lang: 'ja',
				},
			},
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
			sidebar: [],
			customCss: ['./src/styles/global.css'],
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
