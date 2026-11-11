const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(projectRoot, 'www');
const gameFile = path.join(projectRoot, 'index_Version5.html');

fs.mkdirSync(outputDir, { recursive: true });
fs.copyFileSync(gameFile, path.join(outputDir, 'index.html'));

console.log('Copied index_Version5.html to www/index.html');
