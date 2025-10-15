import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('src/main.tsx');
if (!fs.existsSync(file)) {
  console.error(`[verify-mount] File not found: ${file}`);
  process.exit(1);
}

let src = fs.readFileSync(file, 'utf8');

const OK_PATTERNS = [
  /root\.render\s*\(\s*<App\s*\/>\s*\)\s*;?/i,
  /root\.render\s*\(\s*<React\.StrictMode>\s*<App\s*\/>\s*<\/React\.StrictMode>\s*\)\s*;?/i,
  /root\.render\s*\(\s*<App\s*>\s*<\/App>\s*\)\s*;?/i
];

if (OK_PATTERNS.some((rx) => rx.test(src))) {
  console.log('[verify-mount] OK: main.tsx already renders <App />.');
  process.exit(0);
}

const BLANK_RENDER = /root\.render\s*\(\s*\)\s*;?/i;
const hasAppImport = /import\s+App\s+from\s+['"].+App(\.tsx|)['"];?/i.test(src);

const preferred = hasAppImport
  ? 'root.render(<App />);'
  : `import App from './App';\n\nroot.render(<App />);`;

if (BLANK_RENDER.test(src)) {
  src = src.replace(BLANK_RENDER, preferred);
  fs.writeFileSync(file, src, 'utf8');
  console.log('[verify-mount] FIXED: replaced blank root.render() with <App />.');
  process.exit(0);
}

const RENDER_CALL = /root\.render\s*\(([\s\S]*?)\)\s*;?/i;
const m = src.match(RENDER_CALL);

if (m) {
  if (!hasAppImport) {
    src = src.replace(/(^\s*import[\s\S]*?;\s*)/m, (all) => all + `import App from './App';\n`);
  }
  src = src.replace(RENDER_CALL, 'root.render(<App />);');
  fs.writeFileSync(file, src, 'utf8');
  console.log('[verify-mount] FIXED: replaced root.render(...) with <App />.');
  process.exit(0);
}

console.error('[verify-mount] FAILED: Could not identify root.render() to fix. Please check src/main.tsx manually.');
process.exit(2);


