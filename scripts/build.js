const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'www');
const sourceHtml = path.join(root, 'index_Version7.html');
const firebaseConfig = path.join(root, 'firebase-config.js');
const scriptNames = [
  'controller-smoothing.js',
  'countdown.js',
  'game-pages.js',
  'boss-effects.js',
  'multiplayer.js'
];
const scriptFiles = scriptNames.map(name => path.join(__dirname, name));

for (const file of [sourceHtml, firebaseConfig, ...scriptFiles]) {
  if (!fs.existsSync(file)) throw new Error(`Required file not found: ${file}`);
}

let html = fs.readFileSync(sourceHtml, 'utf8');
if (!html.includes('</body>')) throw new Error('Could not find </body> in game HTML');

// Keep the Version 4 mouse-hover paddle behavior and allow pointer/touch dragging.
const mouseButtonGuard = "if(e.pointerType==='mouse'&&e.buttons===0)return;";
if (html.includes(mouseButtonGuard)) html = html.replace(mouseButtonGuard, '');
if (!html.includes("canvas.addEventListener('pointermove'")) {
  throw new Error('Could not find the game pointermove handler');
}

const pagesSource = fs.readFileSync(path.join(__dirname, 'game-pages.js'), 'utf8');
if (!pagesSource.includes("new Option('Online Multiplayer', 'multiplayer')")) {
  throw new Error('game-pages.js is missing the multiplayer mode option');
}

const version = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
html = html.replace(/\s*<script\b[^>]*\bsrc=["'][^"']*(?:firebase-config\.js|scripts\/(?:controller-smoothing|countdown|game-pages|boss-effects|multiplayer)\.js)[^"']*["'][^>]*>\s*<\/script>/gi, '\n');
const tags = [
  `<script src="firebase-config.js?v=${version}"></script>`,
  ...scriptNames.map(name => `<script src="scripts/${name}?v=${version}"></script>`)
].join('\n');
html = html.replace('</body>', `${tags}\n</body>`);

// Validate before touching output files, so a failed build cannot leave stale or partial assets.
for (const name of scriptNames) {
  if (!tags.includes(`scripts/${name}?v=${version}`)) throw new Error(`Build output is missing ${name}`);
}
if (html.includes(mouseButtonGuard)) throw new Error('Mouse hover control patch did not apply');

fs.mkdirSync(path.join(output, 'scripts'), { recursive: true });
fs.writeFileSync(path.join(output, 'index.html'), html);
fs.copyFileSync(firebaseConfig, path.join(output, 'firebase-config.js'));
for (const file of scriptFiles) {
  fs.copyFileSync(file, path.join(output, 'scripts', path.basename(file)));
}
console.log(`Built game with mode-selector multiplayer and hover controls (version ${version}).`);
