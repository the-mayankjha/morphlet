const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const {nativeScript}=require('./native-path.cjs');
function createSelectionReader({platform=process.platform,run=promisify(execFile)}={}){
 return async function selectedFiles(){
  if(platform==='win32'){
   try{const {stdout}=await run('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',nativeScript('drag-windows.ps1'),'-SelectionOnly'],{windowsHide:true,timeout:15000,maxBuffer:1024*1024});const value=JSON.parse(stdout.replace(/^\uFEFF/,'').trim());if(!Array.isArray(value.files)||!value.files.every(f=>typeof f==='string'))throw Error('Invalid Explorer selection');return [...new Set(value.files)].slice(0,100);}
   catch{throw Error('Select files in an active File Explorer window, then press Alt+C. You can also use Choose files.');}
  }
  if(platform!=='darwin')throw Error('Automatic file selection is available in Finder and Windows File Explorer. Use Choose files or drag files into Studio on this desktop.');
  const script=`ObjC.import('Foundation'); const finder=Application('Finder'); if(!finder.frontmost()) throw Error('Select a file in Finder first.'); JSON.stringify(finder.selection().map(item=>ObjC.unwrap($.NSURL.URLWithString(item.url()).path)));`;
  try{const {stdout}=await run('/usr/bin/osascript',['-l','JavaScript','-e',script],{timeout:15000,maxBuffer:1024*1024});const files=JSON.parse(stdout.trim());if(!Array.isArray(files)||!files.every(f=>typeof f==='string'))throw Error('Invalid Finder selection');return files;}
  catch(error){if(/1743|not authorized|not permitted/i.test(error.message))throw Error('Allow Morphlet to access Finder in System Settings → Privacy & Security → Automation, then try Option+C again.');throw Error('Select a file in Finder, then press Option+C. If prompted, allow Finder access.');}
 };
}
module.exports={selectedFiles:createSelectionReader(),createSelectionReader};
