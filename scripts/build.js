const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(projectRoot, 'www');
const gameFile = path.join(projectRoot, 'index_Version7.html');
const scriptsDir = path.join(__dirname);
const firebaseConfigFile = path.join(projectRoot, 'firebase-config.js');
const assets = [
  { source: path.join(scriptsDir, 'controller-smoothing.js'), output: 'scripts/controller-smoothing.js' },
  { source: path.join(scriptsDir, 'multiplayer.js'), output: 'scripts/multiplayer.js' }
];

for (const file of [gameFile, firebaseConfigFile, ...assets.map(asset => asset.source)]) {
  if (!fs.existsSync(file)) throw new Error(`Required file not found: ${file}`);
}

fs.mkdirSync(path.join(outputDir, 'scripts'), { recursive: true });
let html = fs.readFileSync(gameFile, 'utf8');
if (!html.includes('</body>')) throw new Error('Could not find </body> in game HTML');

// Always replace injected asset tags. The previous conditional skipped newly added
// scripts if multiplayer.js was already present in the source HTML.
html = html.replace(/\s*<script\b[^>]*\bsrc=["'][^"']*(?:firebase-config\.js|scripts\/(?:multiplayer|controller-smoothing)\.js)[^"']*["'][^>]*>\s*<\/script>/gi, '\n');
const version = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const tags = [
  `<script src="firebase-config.js?v=${version}"></script>`,
  ...assets.map(asset => `<script src="${asset.output}?v=${version}"></script>`)
].join('\n');
html = html.replace('</body>', `${tags}\n</body>`);
fs.writeFileSync(path.join(outputDir, 'index.html'), html);
fs.copyFileSync(firebaseConfigFile, path.join(outputDir, 'firebase-config.js'));
for (const asset of assets) {
  const destination = path.join(outputDir, asset.output);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(asset.source, destination);
}

const builtHtml = fs.readFileSync(path.join(outputDir, 'index.html'), 'utf8');
for (const required of ['controller-smoothing.js?v=', 'multiplayer.js?v=']) {
  if (!builtHtml.includes(required)) throw new Error(`Build output is missing ${required}`);
}
console.log(`Built game, shared controller settings, and multiplayer (asset version ${version}).`);
