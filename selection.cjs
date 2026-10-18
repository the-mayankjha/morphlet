const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const run=promisify(execFile);
async function selectedFiles(){
 if(process.platform!=='darwin')throw Error('Automatic file selection is currently available in macOS Finder. Use Choose files on this platform.');
 const script=`ObjC.import('Foundation'); const finder=Application('Finder'); if(!finder.frontmost()) throw Error('Select a file in Finder first.'); JSON.stringify(finder.selection().map(item=>ObjC.unwrap($.NSURL.URLWithString(item.url()).path)));`;
 try{const {stdout}=await run('/usr/bin/osascript',['-l','JavaScript','-e',script],{timeout:15000,maxBuffer:1024*1024});const files=JSON.parse(stdout.trim());if(!Array.isArray(files)||!files.every(f=>typeof f==='string'))throw Error('Invalid Finder selection');return files;}
 catch(error){if(/1743|not authorized|not permitted/i.test(error.message))throw Error('Allow Morphlet to access Finder in System Settings → Privacy & Security → Automation, then try Option+C again.');throw Error('Select a file in Finder, then press Option+C. If prompted, allow Finder access.');}
}
module.exports={selectedFiles};
