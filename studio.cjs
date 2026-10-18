
const {BrowserWindow,ipcMain,dialog,shell}=require('electron');
const fs=require('node:fs/promises'),path=require('node:path'),sharp=require('sharp');
const {convert}=require('./convert.cjs');const {createSelectionState}=require('./selection-state.cjs');
function createStudio({onWheel,keepWindow=()=>{}}){
 const appearance=require('./appearance.cjs');let glass;try{if(process.platform==='darwin')glass=require('./native/glass.node');}catch{}let material='fallback';
 let window,busy=false,outputDir,controller;const selection=createSelectionState(),entries=new Map(),outputs=new Set(),history=[];
 const snapshot=()=>({files:[...entries.values()],history,outputDir,busy,appearance:appearance.getAppearance(),material});
 async function add(files){const prepared=await selection.prepare(files);for(const entry of prepared){if(entries.size>=100)break;if(!entries.has(entry.path)){const stat=await fs.stat(entry.path);entries.set(entry.path,{...entry,size:stat.size});}}selection.commit([...entries.values()]);return snapshot();}
 async function open(files=[]){if(!window||window.isDestroyed()){
  window=new BrowserWindow({width:1280,height:860,minWidth:1020,minHeight:720,title:'Morphlet Studio',icon:path.join(__dirname,'assets/icon.png'),backgroundColor:glass?'#00000000':'#101010',transparent:!!glass,...(process.platform==='darwin'?{titleBarStyle:'hiddenInset',trafficLightPosition:{x:18,y:23}}:{}),webPreferences:{preload:path.join(__dirname,'studio-preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  keepWindow(window);window.loadFile('ui/studio/index.html');
  const nativeMaterial=()=>{if(!window||window.isDestroyed()||!glass)return;const [width,height]=window.getContentSize();material=glass.apply(window.getNativeWindowHandle(),[{x:0,y:0,width,height,radius:14}],false,appearance.getAppearance().theme);window.webContents.send('studio:state',snapshot());};let resizeTimer;window.webContents.once('did-finish-load',nativeMaterial);window.on('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(nativeMaterial,80);});require('electron').nativeTheme.on('updated',nativeMaterial);window.on('closed',()=>{clearTimeout(resizeTimer);require('electron').nativeTheme.removeListener('updated',nativeMaterial);});window.webContents.setWindowOpenHandler(()=>({action:'deny'}));window.webContents.on('will-navigate',e=>e.preventDefault());

 }
 if(files.length)await add(files);window.show();window.focus();if(!window.webContents.isLoading())window.webContents.send('studio:state',snapshot());return snapshot();}
 function handle(name,fn){ipcMain.handle('studio:'+name,(event,...args)=>{if(!window||window.isDestroyed()||event.sender!==window.webContents)throw Error('Invalid Studio session');return fn(...args);});}
 handle('state',snapshot);handle('theme',theme=>appearance.setAppearance(theme));
 handle('pick',async()=>{if(busy)throw Error('Wait for conversion to finish');const result=await dialog.showOpenDialog(window,{properties:['openFile','multiSelections']});return result.canceled?snapshot():add(result.filePaths);});
 handle('drop',files=>{if(busy)throw Error('Wait for conversion to finish');if(!Array.isArray(files)||!files.every(f=>typeof f==='string'))throw Error('Invalid files');return add(files);});
 handle('remove',file=>{if(busy)throw Error('Wait for conversion to finish');if(file===null)entries.clear();else entries.delete(file);selection.commit([...entries.values()]);return snapshot();});
 handle('folder',async()=>{if(busy)throw Error('Wait for conversion to finish');const result=await dialog.showOpenDialog(window,{properties:['openDirectory','createDirectory']});if(!result.canceled)outputDir=result.filePaths[0];return snapshot();});
 handle('reset-folder',()=>{if(busy)throw Error('Wait for conversion to finish');outputDir=undefined;return snapshot();});
 handle('preview',async file=>{
  if(!selection.allowed.has(file)&&!outputs.has(file))throw Error('Choose a file first');const stat=await fs.stat(file);if(!stat.isFile()||(stat.size>100*1024*1024&&!outputs.has(file)))throw Error('Choose a file smaller than 100 MB');
  const extension=path.extname(file).toLowerCase();if(extension==='.zip'&&outputs.has(file))return {...await require('./pdf-ai.cjs').previewBundle(file),size:stat.size};
  if(/\.(png|jpe?g|webp|avif|tiff?|gif|svg)$/.test(extension)){
   const buffer=await fs.readFile(file);const meta=await sharp(buffer,{limitInputPixels:80_000_000}).metadata();const swap=meta.orientation>=5&&meta.orientation<=8;
   return {image:'data:image/png;base64,'+(await sharp(buffer,{limitInputPixels:80_000_000}).rotate().resize({width:1600,height:1200,fit:'inside',withoutEnlargement:true}).png().toBuffer()).toString('base64'),width:swap?meta.height:meta.width,height:swap?meta.width:meta.height,size:stat.size};
  }
  if(extension==='.pdf'){const {PDFParse}=require('pdf-parse');const parser=new PDFParse({data:await fs.readFile(file)});try{const result=await parser.getScreenshot({partial:[1],desiredWidth:1100});if(!result.pages.length)throw Error('PDF has no pages');return {image:'data:image/png;base64,'+Buffer.from(result.pages[0].data).toString('base64'),note:'PDF · first page',size:stat.size};}finally{await parser.destroy();}}
  if(!entries.get(file)?.targets.length&&!outputs.has(file))throw Error('Preview is unavailable for this file type');
  const handle=await fs.open(file);try{const buffer=Buffer.alloc(64000);const {bytesRead}=await handle.read(buffer,0,buffer.length,0);return {text:buffer.subarray(0,bytesRead).toString('utf8'),note:stat.size>64000?'First 64 KB shown':'Text preview',size:stat.size};}finally{await handle.close();}
 });
 handle('run',async jobs=>{if(busy)throw Error('Conversion already running');if(!Array.isArray(jobs)||!jobs.length||jobs.length>100)throw Error('Choose files to convert');for(const job of jobs){if(!selection.allowed.has(job.path)||!entries.get(job.path).targets.includes(job.target))throw Error('Choose a valid format for each file');}
  busy=true;controller=new AbortController();const results=[];try{for(let index=0;index<jobs.length;index++){if(controller.signal.aborted)break;const job=jobs[index],options=job.options||{};let result;try{const destination=await convert(job.path,job.target,{crop:options.crop,width:options.width,quality:options.quality,flip:options.flip===true,flop:options.flop===true,outputDir,pages:options.pages,pdfWidth:options.pdfWidth,ocr:options.ocr,ocrLanguage:options.ocrLanguage,signal:controller.signal,onProgress:progress=>{if(window&&!window.isDestroyed())window.webContents.send('studio:pdf-progress',progress);}});outputs.add(destination);const stat=await fs.stat(destination);result={source:job.path,path:destination,name:path.basename(destination),size:stat.size,target:job.target};history.unshift(result);history.splice(100);}catch(error){result={source:job.path,error:error.message};}results.push(result);if(window&&!window.isDestroyed())window.webContents.send('studio:progress',{index:index+1,total:jobs.length,result});}return results;}finally{busy=false;controller=undefined;}});
 handle('cancel',()=>{controller?.abort();});
 handle('reveal',file=>{if(outputs.has(file)||selection.allowed.has(file))shell.showItemInFolder(file);});
 handle('quicklook',file=>{if(outputs.has(file)||selection.allowed.has(file)){if(process.platform==='darwin')window.previewFile(file);else return shell.openPath(file);}});
 handle('wheel',async file=>{if(busy)throw Error('Wait for conversion to finish');if(!selection.allowed.has(file))throw Error('Select an input file');window.hide();await onWheel([file]);});
 return {open};
}
module.exports={createStudio};
