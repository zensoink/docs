import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

test('Landing page CardGrid displays cards aligned without stagger offset artifact', () => {
	const indexMdx = fs.readFileSync(path.join(ROOT_DIR, 'src/content/docs/index.mdx'), 'utf-8');

	// CardGrid should not have stagger attribute which offsets the second column by 5rem
	// and conflicts with hover translateY animations
	const hasStagger = /<CardGrid\s+[^>]*stagger[^>]*>/i.test(indexMdx) || /<CardGrid\s+stagger>/i.test(indexMdx);
	assert.strictEqual(
		hasStagger,
		false,
		'CardGrid on docs/index.mdx has "stagger" attribute causing 5rem vertical shift and glitchy hover jumps'
	);
});

test('Card hover CSS accounts for staggered cards so translateY does not collapse', () => {
	const globalCss = fs.readFileSync(path.join(ROOT_DIR, 'src/styles/global.css'), 'utf-8');

	// Must have hover rule for staggered 2n cards to prevent 5rem snap
	assert.match(
		globalCss,
		/\.stagger\s*>\s*(\.card|\.starlight-card):nth-child\(2n\):hover[\s\S]*?var\(--stagger-height/,
		'global.css must preserve stagger-height transform on hover for nth-child(2n) cards'
	);
});
