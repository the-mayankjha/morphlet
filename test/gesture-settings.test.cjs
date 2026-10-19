const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {createGestureSettings,createModifierTap}=require('../gesture-settings.cjs');
test('modifier-only tap fires once on release and suppresses shortcuts, Ctrl-click and focus changes',()=>{
 const tap=createModifierTap(),base={pressed:false,other:false,down:false,owner:'Explorer'};
 assert.equal(tap({...base,pressed:true}),false);assert.equal(tap(base),true);assert.equal(tap(base),false);
 tap({...base,pressed:true});tap({...base,pressed:true,other:true});assert.equal(tap(base),false);
 tap({...base,pressed:true,down:true});assert.equal(tap(base),false);
 tap({...base,pressed:true});assert.equal(tap({...base,owner:'other-app'}),false);
});
test('gesture setting persists, validates modifiers and uses platform defaults',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'morphlet-gesture-'));try{
 let changes=0;const settings=createGestureSettings({directory,platform:'win32',onChange:()=>changes++});assert.equal(settings.get().modifier,'control');settings.set({modifier:'alt',convertModifier:'shift'});assert.equal(changes,1);assert.equal(createGestureSettings({directory,platform:'win32'}).get().modifier,'alt');assert.throws(()=>settings.set({modifier:'command',convertModifier:'shift'}));assert.throws(()=>settings.set({modifier:'control',extra:true}));assert.equal(settings.get().modifier,'alt');
 assert.equal(createGestureSettings({directory:path.join(directory,'mac'),platform:'darwin'}).get().modifier,'command');
 }finally{await fs.rm(directory,{recursive:true,force:true});}
});
test('Nautilus action passes selected files as arguments and creates an executable user action',async()=>{
 const {launchFiles,installNautilusAction}=require('../nautilus.cjs');const home=await fs.mkdtemp(path.join(os.tmpdir(),'morphlet-nautilus-'));try{
 const file=path.join(home,'space name.png');assert.deepEqual(launchFiles(['morphlet','--morphlet-files',file,file,'relative']),[file]);const result=await installNautilusAction({home,executable:'/Applications with space/Morphlet'});const script=await fs.readFile(result.path,'utf8');assert(script.includes('NAUTILUS_SCRIPT_SELECTED_URIS'));assert(script.includes("subprocess.Popen([exe, '--morphlet-files', *files[:100]]"));assert(!script.includes('shell=True'));
 }finally{await fs.rm(home,{recursive:true,force:true});}
});

test('scroll navigation defaults on, persists off, and migrates old settings',async()=>{const directory=await fs.mkdtemp(path.join(os.tmpdir(),'morphlet-scroll-'));try{await fs.writeFile(path.join(directory,'gesture.json'),JSON.stringify({modifier:'control',convertModifier:'shift'}));const settings=createGestureSettings({directory,platform:'win32'});assert.equal(settings.get().scrollWheel,true);settings.set({...settings.get(),scrollWheel:false});assert.equal(createGestureSettings({directory,platform:'win32'}).get().scrollWheel,false);settings.set({modifier:'alt',convertModifier:'shift'});assert.equal(settings.get().scrollWheel,false);assert.throws(()=>settings.set({scrollWheel:'false'}));}finally{await fs.rm(directory,{recursive:true,force:true});}});
