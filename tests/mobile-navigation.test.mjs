import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

test('Mobile hamburger menu button and drawer are present on the docs landing page and doc pages', () => {
	const indexPath = fs.existsSync(path.join(ROOT_DIR, 'dist/docs/index.html'))
		? path.join(ROOT_DIR, 'dist/docs/index.html')
		: path.join(ROOT_DIR, 'dist/index.html');
	assert.ok(fs.existsSync(indexPath), 'Landing page HTML must exist');
	const indexHtml = fs.readFileSync(indexPath, 'utf-8');

	// Symptom 1: Hamburger menu button is missing on mobile landing page
	assert.match(
		indexHtml,
		/popovertarget="starlight__sidebar"/,
		'Landing page (/docs/) must contain mobile menu toggle button with popovertarget="starlight__sidebar"'
	);

	assert.match(
		indexHtml,
		/id="starlight__sidebar"/,
		'Landing page (/docs/) must contain sidebar popover drawer id="starlight__sidebar"'
	);

	// Symptom 3: Side nav content must NOT be empty inside the sidebar drawer on landing page
	const sidebarMatch = indexHtml.match(/<sl-sidebar-pane[^>]*id="starlight__sidebar"[^>]*>([\s\S]*?)<\/sl-sidebar-pane>/);
	assert.ok(sidebarMatch, 'Must find sl-sidebar-pane in HTML');
	const sidebarContent = sidebarMatch[1];
	assert.match(
		sidebarContent,
		/<a\s+[^>]*href=/i,
		'Side nav drawer must contain navigation links and not be empty'
	);
	assert.match(
		sidebarContent,
		/zen-mobile-menu-footer|zen-language-switcher/i,
		'Side nav drawer must contain mobile menu footer / controls'
	);
});

test('Mobile search input does not collapse into a weird label-less square', () => {
	const headerPath = path.join(ROOT_DIR, 'src/components/Header.astro');
	const headerContent = fs.readFileSync(headerPath, 'utf-8');

	// Symptom 2: Search input on mobile collapsed into a weird icon box without label text
	// Header styles must ensure Search label text is visible on mobile inside button[data-open-modal]
	assert.match(
		headerContent,
		/\.zen-header-center\s+:global\(button\[data-open-modal\]\s+(?:span|\.sl-hidden)\)[\s\S]*?display:\s*(?:inline|inline-block|block|flex)/i,
		'Header must explicitly display search text label on mobile instead of hiding it'
	);

	// Must not have an awkward hardcoded margin-inline-end pushing it away when hamburger is properly integrated
	assert.doesNotMatch(
		headerContent,
		/margin-inline-end:\s*2\.75rem/,
		'Header must not use hardcoded 2.75rem margin-inline-end hack on search center'
	);
});
