if(process.platform==='linux'){require('./build-linux.cjs');return;}

const {spawnSync}=require('node:child_process');const fs=require('node:fs');const path=require('node:path');
if(process.platform!=='darwin')process.exit(0);
const candidates=[process.env.npm_config_nodedir&&path.join(process.env.npm_config_nodedir,'include/node'),path.resolve(path.dirname(process.execPath),'../include/node'),'/opt/homebrew/include/node','/usr/local/include/node'].filter(Boolean);
const headers=candidates.find(p=>fs.existsSync(path.join(p,'node_api.h')));
if(!headers){console.warn('Native glass not built: install Node development headers, then run npm run build:native.');process.exit(process.argv.includes('--required')?1:0);}
const result=spawnSync('xcrun',['clang++','-std=c++17','-shared','-fobjc-arc','-undefined','dynamic_lookup','-framework','Cocoa','-framework','QuartzCore','-I'+headers,path.join(__dirname,'glass.mm'),'-o',path.join(__dirname,'glass.node')],{stdio:'inherit'});
if(result.status!==0){console.warn('Native glass build failed; the portable styling remains available.');if(process.argv.includes('--required'))process.exit(1);}
