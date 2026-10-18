
const {spawnSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const required=process.argv.includes('--required');const candidates=[process.env.npm_config_nodedir&&path.join(process.env.npm_config_nodedir,'include/node'),path.resolve(path.dirname(process.execPath),'../include/node'),'/usr/include/node','/usr/local/include/node'].filter(Boolean);const headers=candidates.find(p=>fs.existsSync(path.join(p,'node_api.h')));
if(!headers){console.warn('X11 drag bridge not built: Node development headers are missing. Floating drop target remains available.');process.exit(required?1:0);}
const result=spawnSync(process.env.CXX||'c++',['-std=c++17','-shared','-fPIC','-I'+headers,path.join(__dirname,'drag-x11.cc'),'-o',path.join(__dirname,'drag-x11.node'),'-lX11'],{stdio:'inherit'});
if(result.status!==0){console.warn('X11 drag bridge not built: install a C++ compiler and libx11-dev. Floating drop target remains available.');if(required)process.exit(1);}
