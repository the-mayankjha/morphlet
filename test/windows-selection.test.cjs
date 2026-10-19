const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {createSelectionReader}=require('../selection.cjs'),{nativeScript}=require('../native-path.cjs');
test('Windows selected files come from Explorer and preserve Unicode, spaces and multiple selections',async()=>{
 let call;const files=['C:\\Users\\Test\\My photo.png','D:\\資料\\book.pdf'];
 const read=createSelectionReader({platform:'win32',run:async(...args)=>{call=args;return {stdout:'\uFEFF'+JSON.stringify({files:[...files,files[0]]})};}});
 assert.deepEqual(await read(),files);assert.equal(call[0],'powershell.exe');assert(call[1].includes('-SelectionOnly'));assert.equal(call[2].windowsHide,true);
});
test('Windows selection does not accept malformed output and gives platform-specific guidance',async()=>{
 for(const stdout of ['not json','{}','{"files":[1]}']){
  const read=createSelectionReader({platform:'win32',run:async()=>({stdout})});await assert.rejects(read,/File Explorer.*Alt\+C/);
 }
 const read=createSelectionReader({platform:'win32',run:async()=>({stdout:'{"files":[]}'})});assert.deepEqual(await read(),[]);
});
test('external Windows helper points outside app.asar in installed builds',()=>{
 const base=path.join(path.parse(process.cwd()).root,'resources','app.asar');
 assert.equal(nativeScript('drag-windows.ps1',base),path.join(path.dirname(base),'app.asar.unpacked','native','drag-windows.ps1'));
 assert.equal(nativeScript('drag-windows.ps1','source'),path.join('source','native','drag-windows.ps1'));
 assert(require('../package.json').build.asarUnpack.includes('native/*.ps1'));
});
