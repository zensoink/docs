// @ts-check
import fs from 'node:fs';
import path from 'node:path';

/**
 * Retrieve nested object property by dot path
 * @param {Record<string, unknown> | undefined} obj
 * @param {string} dotPath
 * @returns {string | undefined}
 */
export function getNestedValue(obj, dotPath) {
	if (!obj || typeof obj !== 'object') return undefined;
	const parts = dotPath.split('.');
	/** @type {unknown} */
	let current = obj;
	for (const part of parts) {
		if (current && typeof current === 'object' && part in current) {
			current = Reflect.get(current, part);
		} else {
			return undefined;
		}
	}
	return typeof current === 'string' || typeof current === 'number' ? String(current) : undefined;
}

/**
 * Interpolate {{key.subkey}} and {{assets_prefix}} into template content
 * @param {string} templateContent
 * @param {Record<string, unknown>} dict
 * @param {Record<string, unknown>} fallbackDict
 * @param {string} assetsPrefix
 * @returns {string}
 */
export function compileTemplateContent(templateContent, dict, fallbackDict, assetsPrefix) {
	// First replace {{assets_prefix}}
	let result = templateContent.replace(/\{\{\s*assets_prefix\s*\}\}/g, assetsPrefix);

	// Then replace any other {{namespace.key}} tokens
	result = result.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, token) => {
		if (token === 'assets_prefix') return assetsPrefix;
		const value = getNestedValue(dict, token);
		if (value !== undefined) return value;
		const fallbackValue = getNestedValue(fallbackDict, token);
		if (fallbackValue !== undefined) return fallbackValue;
		return match; // Keep token if neither target nor fallback exists
	});

	return result;
}

/**
 * @typedef {Object} CompileTemplatesOptions
 * @property {string} [templatesDir]
 * @property {string} [i18nDir]
 * @property {string} [outputDocsDir]
 * @property {string[]} [locales]
 */

/**
 * Compile all template files across all supported locales
 * @param {CompileTemplatesOptions} [options]
 */
export function compileAllTemplates({
	templatesDir = path.resolve('src/templates'),
	i18nDir = path.resolve('src/i18n'),
	outputDocsDir = path.resolve('src/content/docs'),
	locales = ['en', 'pl', 'ja'],
} = {}) {
	const enDictPath = path.join(i18nDir, 'en.json');
	if (!fs.existsSync(enDictPath)) {
		throw new Error(`Base dictionary not found at ${enDictPath}`);
	}
	/** @type {Record<string, unknown>} */
	const enDict = JSON.parse(fs.readFileSync(enDictPath, 'utf-8'));

	/** @type {Record<string, Record<string, unknown>>} */
	const dictionaries = { en: enDict };
	for (const loc of locales) {
		if (loc === 'en') continue;
		const locPath = path.join(i18nDir, `${loc}.json`);
		if (fs.existsSync(locPath)) {
			dictionaries[loc] = JSON.parse(fs.readFileSync(locPath, 'utf-8'));
		} else {
			dictionaries[loc] = {};
		}
	}

	/**
	 * @param {string} dir
	 * @param {string} [base]
	 * @returns {{ fullPath: string; relPath: string }[]}
	 */
	function findTemplateFiles(dir, base = '') {
		const entries = fs.readdirSync(dir, { withFileTypes: true });
		/** @type {{ fullPath: string; relPath: string }[]} */
		let files = [];
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			const relPath = base ? `${base}/${entry.name}` : entry.name;
			if (entry.isDirectory()) {
				files = files.concat(findTemplateFiles(fullPath, relPath));
			} else if (entry.isFile() && entry.name.endsWith('.template.mdx')) {
				files.push({ fullPath, relPath });
			}
		}
		return files;
	}

	if (!fs.existsSync(templatesDir)) return;
	const templateFiles = findTemplateFiles(templatesDir);

	for (const { fullPath, relPath } of templateFiles) {
		const rawTemplate = fs.readFileSync(fullPath, 'utf-8');
		const targetRelativeName = relPath.replace(/\.template\.mdx$/, '.mdx');

		for (const loc of locales) {
			const dict = dictionaries[loc] || {};
			const destRelPath = `${loc}/${targetRelativeName}`;
			const segments = destRelPath.split('/');
			const assetsPrefix = '../'.repeat(segments.length + 1);

			const compiledContent = compileTemplateContent(rawTemplate, dict, enDict, assetsPrefix);
			const destFullPath = path.join(outputDocsDir, destRelPath);

			fs.mkdirSync(path.dirname(destFullPath), { recursive: true });
			fs.writeFileSync(destFullPath, compiledContent, 'utf-8');
		}
	}
}

/**
 * Astro Integration Plugin for Template-based i18n
 * @returns {import('astro').AstroIntegration}
 */
export default function templateI18nCompiler() {
	return {
		name: 'starlight-template-i18n-compiler',
		hooks: {
			'astro:config:setup': ({ config }) => {
				const rootDir = config.root ? new URL(config.root).pathname : process.cwd();
				const templatesDir = path.join(rootDir, 'src/templates');
				const i18nDir = path.join(rootDir, 'src/i18n');
				const outputDocsDir = path.join(rootDir, 'src/content/docs');

				compileAllTemplates({ templatesDir, i18nDir, outputDocsDir });
			},
			'astro:server:setup': ({ server }) => {
				const rootDir = process.cwd();
				const templatesDir = path.join(rootDir, 'src/templates');
				const i18nDir = path.join(rootDir, 'src/i18n');
				const outputDocsDir = path.join(rootDir, 'src/content/docs');

				server.watcher.add([templatesDir, i18nDir]);
				server.watcher.on('all', (_event, filePath) => {
					if (filePath.includes('src/templates') || filePath.includes('src/i18n')) {
						try {
							compileAllTemplates({ templatesDir, i18nDir, outputDocsDir });
						} catch (err) {
							console.error('[template-i18n-compiler] Compilation error:', err);
						}
					}
				});
			},
		},
	};
}
