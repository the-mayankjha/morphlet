const {app,BrowserWindow,ipcMain,dialog,globalShortcut,shell,screen,Tray,Menu,nativeImage}=require('electron');
const path=require('node:path');const fs=require('node:fs/promises');const sharp=require('sharp');
const {convert,targets}=require('./convert.cjs');const {selectedFiles}=require('./selection.cjs');
let win,tray,busy=false,opening=false;const allowed=new Set(),results=new Set();
const ready=()=>new Promise(resolve=>{if(win.webContents.isLoading())win.webContents.once('did-finish-load',resolve);else resolve();});
async function register(files){const entries=[];for(const file of files.slice(0,100)){try{if(!(await fs.stat(file)).isFile())continue;allowed.add(file);entries.push({path:file,name:path.basename(file),targets:targets(file)});}catch{}}return entries;}
function position(){const p=screen.getCursorScreenPoint(),b=screen.getDisplayNearestPoint(p).workArea;win.setPosition(Math.round(Math.max(b.x,Math.min(p.x-220,b.x+b.width-440))),Math.round(Math.max(b.y,Math.min(p.y-220,b.y+b.height-490))));}
async function show(files=[],message=''){await ready();if(busy){win.show();win.focus();return;}allowed.clear();results.clear();const entries=await register(files);position();win.webContents.send('selection',{files:entries,message});win.show();win.focus();}
async function summon(){if(opening)return;if(busy){win.show();win.focus();return;}opening=true;try{const files=await selectedFiles();await show(files,files.length?'':'Select a file in Finder, then press Option+C.');}catch(e){await show([],e.message);}finally{opening=false;}}
if(!app.requestSingleInstanceLock())app.quit();else{
app.on('second-instance',summon);
app.whenReady().then(async()=>{
 app.dock?.hide();
 win=new BrowserWindow({width:440,height:490,show:false,frame:false,transparent:true,resizable:false,hasShadow:false,skipTaskbar:true,alwaysOnTop:true,title:'Morphlet',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 win.setVisibleOnAllWorkspaces(true,{visibleOnFullScreen:true});win.loadFile('ui/index.html');
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());win.on('blur',()=>{if(!busy)win.hide();});
 const icon=nativeImage.createFromDataURL('data:image/png;base64,'+await sharp(Buffer.from('<svg width="22" height="22" xmlns="http://www.w3.org/2000/svg"><path d="M4 16V6h4l3 5 3-5h4v10h-3v-5l-4 6-4-6v5z" fill="black"/></svg>')).png().toBuffer().then(b=>b.toString('base64')));icon.setTemplateImage(true);tray=new Tray(icon);tray.setToolTip('Morphlet · Option+C');
 const registered=globalShortcut.register('Alt+C',summon);
 tray.setContextMenu(Menu.buildFromTemplate([{label:registered?'Convert Finder selection · Option+C':'Option+C unavailable (shortcut conflict)',click:summon},{label:'Choose files…',click:async()=>{await show();const r=await dialog.showOpenDialog({properties:['openFile','multiSelections']});if(!r.canceled)await show(r.filePaths);}},{type:'separator'},{label:'Quit Morphlet',click:()=>app.quit()}]));
 if(!registered)dialog.showErrorBox('Morphlet shortcut unavailable','Option+C is already used by another app. You can still use Morphlet from its menu bar icon.');
 ipcMain.handle('hide',()=>{if(!busy)win.hide();});
 ipcMain.handle('pick',async()=>{const r=await dialog.showOpenDialog({properties:['openFile','multiSelections']});if(!r.canceled)await show(r.filePaths);});
 ipcMain.handle('drop',async(_e,files)=>{if(Array.isArray(files)&&files.every(f=>typeof f==='string'))await show(files);});
 ipcMain.handle('convert',async(_e,{target})=>{if(busy)throw Error('Conversion already running');const files=[...allowed];if(!files.length||!files.every(f=>targets(f).includes(target)))throw Error('Choose a supported output format');busy=true;const output=[];try{for(const file of files){try{const destination=await convert(file,target);results.add(destination);output.push({path:destination,name:path.basename(destination)});}catch(error){output.push({name:path.basename(file),error:error.message});}}return output;}finally{busy=false;}});
 ipcMain.handle('preview',async(_e,file)=>{if(!results.has(file))throw Error('Unknown output');const type=path.extname(file).toLowerCase();if(['.png','.jpg','.webp','.avif','.tiff'].includes(type)){return {image:'data:image/png;base64,'+(await sharp(file).resize({width:720,height:600,fit:'inside',withoutEnlargement:true}).png().toBuffer()).toString('base64')};}if(type==='.pdf'){const {PDFParse}=require('pdf-parse');const parser=new PDFParse({data:await fs.readFile(file)});try{return {text:(await parser.getText()).text.slice(0,30000)||'Image PDF. Use Quick Look to preview its page.'};}finally{await parser.destroy();}}const handle=await fs.open(file);try{const buffer=Buffer.alloc(30000);const {bytesRead}=await handle.read(buffer,0,buffer.length,0);return {text:buffer.subarray(0,bytesRead).toString('utf8')};}finally{await handle.close();}});
 ipcMain.handle('reveal',(_e,file)=>{if(results.has(file))shell.showItemInFolder(file);});
 ipcMain.handle('quicklook',(_e,file)=>{if(results.has(file)){if(process.platform==='darwin')win.previewFile(file);else shell.openPath(file);}});
 app.on('activate',()=>show());
});app.on('will-quit',()=>globalShortcut.unregisterAll());
}
