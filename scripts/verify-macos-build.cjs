// Reject malformed signatures before any macOS installers reach a release.
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
if(process.platform!=='darwin')throw Error('macOS build validation must run on macOS');
const root=path.resolve(process.argv[2]||'dist');
function run(command,args){execFileSync(command,args,{stdio:'inherit'});}
function verify(app){run('codesign',['--verify','--deep','--strict','--verbose=2',app]);run('codesign',['--display','--verbose=2',app]);}
const bundles=fs.readdirSync(root).filter(name=>/^mac(?:-|$)/.test(name)).map(name=>path.join(root,name,'Morphlet.app')).filter(p=>fs.existsSync(p));
if(!bundles.length)throw Error('No packaged Morphlet.app found');
bundles.forEach(verify);
for(const name of fs.readdirSync(root).filter(name=>name.endsWith('.dmg'))){
 const image=path.join(root,name),mount=fs.mkdtempSync(path.join(os.tmpdir(),'morphlet-verify-'));let attached=false;
 try{run('hdiutil',['verify',image]);run('hdiutil',['attach','-readonly','-nobrowse','-mountpoint',mount,image]);attached=true;verify(path.join(mount,'Morphlet.app'));}
 finally{if(attached)run('hdiutil',['detach',mount]);fs.rmSync(mount,{recursive:true,force:true});}
}
console.log('macOS bundle signatures verified. This is integrity validation, not Apple notarization.');
