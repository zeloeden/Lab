import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');

function walk(dir, out = []){
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })){
		if (entry.name.startsWith('.')) continue;
		const p = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(p, out);
		else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) out.push(p);
	}
	return out;
}

function hasDefaultExport(src){
	return /export\s+default\s+/m.test(src);
}

function findLazyCalls(src){
	const matches = [];
	const rx = /lazy\s*\(\s*\(\)\s*=>\s*import\(\s*['\"]([^'\"]+)['\"]\s*\)\s*\)/g;
	let m; while ((m = rx.exec(src))) matches.push({ spec: m[1] });
	return matches;
}

const files = walk(root);
const offenders = [];
for (const f of files){
	const src = fs.readFileSync(f, 'utf8');
	const calls = findLazyCalls(src);
	for (const c of calls){
		try {
			const target = c.spec.startsWith('.') || c.spec.startsWith('/')
				? require.resolve(path.join(path.dirname(f), c.spec))
				: null;
			if (!target) continue;
			const code = fs.readFileSync(target, 'utf8');
			if (!hasDefaultExport(code)) {
				offenders.push({ file: f, importSpec: c.spec });
			}
		} catch {}
	}
}

if (offenders.length){
	console.log('[audit-lazy-named] Offenders (use lazyNamed):');
	for (const o of offenders){
		console.log('-', o.file, '→', o.importSpec);
	}
	process.exitCode = 1;
} else {
	console.log('[audit-lazy-named] OK: no issues found');
}


