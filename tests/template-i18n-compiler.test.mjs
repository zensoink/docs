import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { compileTemplateContent, compileAllTemplates } from '../src/plugins/template-i18n-compiler.js';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

test('compileTemplateContent interpolates tokens and falls back to EN when key is missing', () => {
	const template = 'title: {{site.title}}\nmissing: {{hero.missing_key}}\nasset: {{assets_prefix}}logo.svg';
	const enDict = {
		site: { title: 'Zenso Docs' },
		hero: { missing_key: 'English Fallback Value' }
	};
	const plDict = {
		site: { title: 'Dokumentacja Zenso' }
		// missing_key is intentionally omitted in PL
	};

	const plCompiled = compileTemplateContent(template, plDict, enDict, '../../../../');
	assert.match(plCompiled, /title:\s*Dokumentacja Zenso/);
	assert.match(plCompiled, /missing:\s*English Fallback Value/);
	assert.match(plCompiled, /asset:\s*\.\.\/\.\.\/\.\.\/\.\.\/logo\.svg/);

	const enCompiled = compileTemplateContent(template, enDict, enDict, '../../../');
	assert.match(enCompiled, /title:\s*Zenso Docs/);
	assert.match(enCompiled, /missing:\s*English Fallback Value/);
	assert.match(enCompiled, /asset:\s*\.\.\/\.\.\/\.\.\/logo\.svg/);
});

test('compileAllTemplates reads src/templates and generates docs, pl/docs, ja/docs MDX files', () => {
	const templatesDir = path.join(ROOT_DIR, 'src/templates');
	const i18nDir = path.join(ROOT_DIR, 'src/i18n');
	const outputDocsDir = path.join(ROOT_DIR, 'src/content/docs');

	compileAllTemplates({ templatesDir, i18nDir, outputDocsDir });

	const enPath = path.join(outputDocsDir, 'en/docs/index.mdx');
	const plPath = path.join(outputDocsDir, 'pl/docs/index.mdx');
	const jaPath = path.join(outputDocsDir, 'ja/docs/index.mdx');

	assert.ok(fs.existsSync(enPath), 'src/content/docs/en/docs/index.mdx must exist');
	assert.ok(fs.existsSync(plPath), 'src/content/docs/pl/docs/index.mdx must exist');
	assert.ok(fs.existsSync(jaPath), 'src/content/docs/ja/docs/index.mdx must exist');

	const enContent = fs.readFileSync(enPath, 'utf-8');
	const plContent = fs.readFileSync(plPath, 'utf-8');
	const jaContent = fs.readFileSync(jaPath, 'utf-8');

	// Verify no unresolved {{...}} placeholders remain
	assert.doesNotMatch(enContent, /\{\{[^}]+\}\}/, 'EN content must not contain unresolved {{tokens}}');
	assert.doesNotMatch(plContent, /\{\{[^}]+\}\}/, 'PL content must not contain unresolved {{tokens}}');
	assert.doesNotMatch(jaContent, /\{\{[^}]+\}\}/, 'JA content must not contain unresolved {{tokens}}');

	// Verify localized titles
	assert.match(enContent, /title:\s*Zenso Documentation/);
	assert.match(plContent, /title:\s*Dokumentacja Zenso/);
	assert.match(jaContent, /title:\s*Zenso ドキュメント/);

	// Verify user-facing overview content and navigation cards are compiled
	assert.match(enContent, /Updates that follow your rhythm/);
	assert.match(plContent, /Aktualizacje dostosowane do Twojego rytmu/);
	assert.match(jaContent, /あなたのリズムに合わせた更新/);
	assert.match(enContent, /Your data stays yours/);
	assert.match(plContent, /Twoje dane pozostają Twoje/);
	assert.match(jaContent, /データはあなたのもの/);
	assert.match(enContent, /Zenso Web Panel/);
	assert.match(plContent, /Panel webowy Zenso/);
	assert.match(jaContent, /Zenso Web パネル/);
	assert.match(enContent, /Self-Host on Your Hardware/);
	assert.match(plContent, /Samodzielny hosting na Twoim sprzęcie/);
	assert.match(jaContent, /自分のハードウェアでセルフホスト/);
	assert.doesNotMatch(enContent, /Open Source & Community/);
	assert.doesNotMatch(plContent, /Open Source i społeczność/);
	assert.doesNotMatch(jaContent, /オープンソースとコミュニティ/);

	// Verify Getting Started documentation pages are compiled
	const enQuickstartPath = path.join(outputDocsDir, 'en/docs/getting-started/quickstart.mdx');
	const plQuickstartPath = path.join(outputDocsDir, 'pl/docs/getting-started/quickstart.mdx');
	const jaQuickstartPath = path.join(outputDocsDir, 'ja/docs/getting-started/quickstart.mdx');

	assert.ok(fs.existsSync(enQuickstartPath), 'en/docs/getting-started/quickstart.mdx must exist');
	assert.ok(fs.existsSync(plQuickstartPath), 'pl/docs/getting-started/quickstart.mdx must exist');
	assert.ok(fs.existsSync(jaQuickstartPath), 'ja/docs/getting-started/quickstart.mdx must exist');

	// Verify standalone overview.mdx is removed (merged into index)
	assert.ok(!fs.existsSync(path.join(outputDocsDir, 'en/docs/getting-started/overview.mdx')), 'Standalone overview.mdx must be removed');
});
