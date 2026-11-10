// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: 'https://zenso.ink',
	base: '/docs',
	integrations: [
		starlight({
			title: 'Zenso',
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
