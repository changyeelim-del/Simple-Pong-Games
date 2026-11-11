const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(projectRoot, 'www');

fs.mkdirSync(outputDir, { recursive: true });
fs.copyFileSync(
  path.join(projectRoot, 'index_Version4.html'),
  path.join(outputDir, 'index.html')
);

console.log('Copied index_Version4.html to www/index.html');
