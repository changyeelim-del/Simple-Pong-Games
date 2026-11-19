const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'www'),game=path.join(root,'index_Version7.html'),firebaseConfig=path.join(root,'firebase-config.js');
const assets=['controller-smoothing.js','countdown.js','game-pages.js','boss-effects.js','multiplayer.js'].map(f=>path.join(__dirname,f));
for(const f of [game,firebaseConfig,...assets])if(!fs.existsSync(f))throw new Error('Required file not found: '+f);
fs.mkdirSync(path.join(out,'scripts'),{recursive:true});let html=fs.readFileSync(game,'utf8');
if(!html.includes('</body>'))throw new Error('Could not find </body>');
html=html.replace(/\s*<script\b[^>]*\bsrc=["'][^"']*(?:firebase-config\.js|scripts\/(?:controller-smoothing|countdown|game-pages|boss-effects|multiplayer)\.js)[^"']*["'][^>]*>\s*<\/script>/gi,'\n');
let patched=html.replace("if(mode==='boss')cpu.h=148;else","if(mode==='boss')cpu.h=118;else");patched=patched.replace("const base=mode==='boss'?390:","const base=mode==='boss'?300:");patched=patched.replace("target=mode==='powerup'?7:mode==='boss'?9:5,won=", "target=mode==='powerup'?7:mode==='boss'?7:5,won=");patched=patched.replace("if(mode==='powerup'){powerTimer-=dt;","if(mode==='powerup'||mode==='boss'){powerTimer-=dt;");
const version=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);const tags=['firebase-config.js','scripts/controller-smoothing.js','scripts/countdown.js','scripts/game-pages.js','scripts/boss-effects.js','scripts/multiplayer.js'].map(p=>`<script src="${p}?v=${version}"></script>`).join('\n');patched=patched.replace('</body>',tags+'\n</body>');fs.writeFileSync(path.join(out,'index.html'),patched);fs.copyFileSync(firebaseConfig,path.join(out,'firebase-config.js'));for(const f of assets){const d=path.join(out,'scripts',path.basename(f));fs.mkdirSync(path.dirname(d),{recursive:true});fs.copyFileSync(f,d)}
let multiplayer=fs.readFileSync(path.join(__dirname,'multiplayer.js'),'utf8');fs.writeFileSync(path.join(out,'scripts','multiplayer.js'),multiplayer);
console.log('Built enhanced Pong with separate settings/shop pages, guest smoothing, boss powerups, and countdown '+version);
