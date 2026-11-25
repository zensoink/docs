import test from 'node:test';
import assert from 'node:assert/strict';
import {
	buildDocsBreadcrumbs,
	buildDocsStructuredData,
	getDocsOgImageAlt,
	getDocsOgImageUrl,
	serializeJsonLd,
} from '../src/lib/seo.ts';

test('getDocsOgImageUrl returns localized https://zenso.ink/og/{locale}.png URLs', () => {
	assert.equal(getDocsOgImageUrl('en'), 'https://zenso.ink/og/en.png');
	assert.equal(getDocsOgImageUrl('pl'), 'https://zenso.ink/og/pl.png');
	assert.equal(getDocsOgImageUrl('ja'), 'https://zenso.ink/og/ja.png');
});

test('getDocsOgImageAlt returns non-empty localized alt text', () => {
	for (const locale of ['en', 'pl', 'ja']) {
		const alt = getDocsOgImageAlt(locale);
		assert.ok(alt.length > 10, `Alt text for ${locale} should be descriptive`);
	}
	assert.notEqual(getDocsOgImageAlt('en'), getDocsOgImageAlt('pl'));
	assert.notEqual(getDocsOgImageAlt('en'), getDocsOgImageAlt('ja'));
});

test('buildDocsBreadcrumbs builds 2-item trail for docs root and 3-item trail for subpages', () => {
	const rootTrail = buildDocsBreadcrumbs({
		localizedRoute: '/en/docs/',
		title: 'Zenso Documentation',
		locale: 'en',
	});
	assert.equal(rootTrail['@type'], 'BreadcrumbList');
	assert.equal(rootTrail.itemListElement.length, 2);
	assert.deepEqual(
		rootTrail.itemListElement.map((item) => [item.position, item.item]),
		[
			[1, 'https://zenso.ink/en/'],
			[2, 'https://zenso.ink/en/docs/'],
		]
	);

	const subpageTrail = buildDocsBreadcrumbs({
		localizedRoute: '/pl/docs/developer-guide/docker-setup/',
		title: 'Konfiguracja Docker',
		locale: 'pl',
	});
	assert.equal(subpageTrail.itemListElement.length, 3);
	assert.deepEqual(
		subpageTrail.itemListElement.map((item) => [item.position, item.name, item.item]),
		[
			[1, 'Zenso', 'https://zenso.ink/pl/'],
			[2, 'Dokumentacja', 'https://zenso.ink/pl/docs/'],
			[3, 'Konfiguracja Docker', 'https://zenso.ink/pl/docs/developer-guide/docker-setup/'],
		]
	);
});

test('buildDocsStructuredData emits Organization, WebSite, BreadcrumbList, and TechArticle without FAQPage', () => {
	const data = buildDocsStructuredData({
		localizedRoute: '/en/docs/getting-started/faq/',
		title: 'Non-Technical FAQ & Daily Experience',
		description: 'Everyday answers about Zenso.',
		locale: 'en',
	});

	assert.equal(data['@context'], 'https://schema.org');
	const graph = data['@graph'];
	assert.deepEqual(
		graph.map((node) => node['@type']),
		['Organization', 'WebSite', 'BreadcrumbList', 'TechArticle']
	);

	const org = graph[0];
	assert.equal(org.name, 'Zenso');
	assert.equal(org.url, 'https://zenso.ink/en/');
	assert.equal(org.logo, 'https://zenso.ink/icon.svg');

	const article = graph[3];
	assert.equal(article.headline, 'Non-Technical FAQ & Daily Experience');
	assert.equal(article.description, 'Everyday answers about Zenso.');
	assert.equal(article.url, 'https://zenso.ink/en/docs/getting-started/faq/');
	assert.equal(article.inLanguage, 'en');
	assert.equal(article.image, 'https://zenso.ink/og/en.png');
	assert.equal(article.publisher.name, 'Zenso');
	assert.equal(article.publisher.logo.url, 'https://zenso.ink/icon.svg');
});

test('serializeJsonLd escapes script-breaking < characters', () => {
	const raw = serializeJsonLd({ title: 'Hello </script> world' });
	assert.equal(raw.includes('</script>'), false);
	assert.deepEqual(JSON.parse(raw), { title: 'Hello </script> world' });
});
