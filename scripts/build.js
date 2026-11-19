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

fs.mkdirSync(path.join(output, 'scripts'), { recursive: true });
let html = fs.readFileSync(sourceHtml, 'utf8');
if (!html.includes('</body>')) throw new Error('Could not find </body> in game HTML');
html = html.replace(/\s*<script\b[^>]*\bsrc=["'][^"']*(?:firebase-config\.js|scripts\/(?:controller-smoothing|countdown|game-pages|boss-effects|multiplayer)\.js)[^"']*["'][^>]*>\s*<\/script>/gi, '\n');
const version = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const scriptTags = [
  `<script src="firebase-config.js?v=${version}"></script>`,
  ...scriptNames.map(name => `<script src="scripts/${name}?v=${version}"></script>`)
].join('\n');
html = html.replace('</body>', `${scriptTags}\n</body>`);
fs.writeFileSync(path.join(output, 'index.html'), html);
fs.copyFileSync(firebaseConfig, path.join(output, 'firebase-config.js'));
for (const file of scriptFiles) {
  fs.copyFileSync(file, path.join(output, 'scripts', path.basename(file)));
}

const builtHtml = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
for (const name of scriptNames) {
  if (!builtHtml.includes(`scripts/${name}?v=${version}`)) throw new Error(`Build output is missing ${name}`);
}
console.log(`Built game and multiplayer assets (version ${version}).`);
