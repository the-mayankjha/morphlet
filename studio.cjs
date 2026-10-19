
const {BrowserWindow,ipcMain,dialog,shell}=require('electron');
const fs=require('node:fs/promises'),path=require('node:path'),sharp=require('sharp');
const {convert}=require('./convert.cjs');const {createSelectionState}=require('./selection-state.cjs');
function createStudio({onWheel,keepWindow=()=>{},gestureSettings}){
 require('electron').app.once('will-quit',()=>{pdfEditor?.close().catch(()=>{});});const appearance=require('./appearance.cjs');let glass;try{if(process.platform==='darwin')glass=require('./native/glass.node');}catch{}let material='fallback';
 let window,busy=false,outputDir,controller,pdfEditor,studioMenu,applyMaterial;let sidebarBox={width:190,top:78};const selection=createSelectionState(),entries=new Map(),outputs=new Set(),history=[];
 const snapshot=()=>({files:[...entries.values()],history,outputDir,busy,appearance:appearance.getAppearance(),gesture:gestureSettings?.get(),material});
 async function add(files){const prepared=await selection.prepare(files);for(const entry of prepared){if(entries.size>=100)break;if(!entries.has(entry.path)){const stat=await fs.stat(entry.path);entries.set(entry.path,{...entry,size:stat.size});}}selection.commit([...entries.values()]);return snapshot();}
 async function open(files=[]){if(!window||window.isDestroyed()){
  window=new BrowserWindow({width:1280,height:860,minWidth:1020,minHeight:720,title:'Morphlet Studio',skipTaskbar:false,icon:path.join(__dirname,'assets/icon.png'),backgroundColor:glass?'#00000000':'#101010',transparent:!!glass,...(process.platform==='darwin'?{titleBarStyle:'hiddenInset',trafficLightPosition:{x:18,y:23}}:{}),webPreferences:{preload:path.join(__dirname,'studio-preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  studioMenu=require('./studio-menu.cjs').attachStudioMenu(window);keepWindow(window);window.loadFile('ui/studio/index.html');
  // Native appearance updates can synchronously emit nativeTheme.updated. Apply
  // only changed layouts/themes, and never reload previews for a material update.
  let materialKey='',applyingMaterial=false;
  const nativeMaterial=applyMaterial=()=>{
   if(!window||window.isDestroyed()||!glass||applyingMaterial)return;
   const [width,height]=window.getContentSize(),theme=appearance.getAppearance().theme;
   const top=Math.min(height-1,sidebarBox.top),side=Math.min(width-1,sidebarBox.width);
   const key=JSON.stringify([width,height,top,side,theme]);if(key===materialKey)return;
   applyingMaterial=true;
   try{
    const next=glass.apply(window.getNativeWindowHandle(),[{x:0,y:0,width,height:top,radius:0},{x:0,y:top,width:side,height:height-top,radius:0},{x:side,y:top,width:width-side,height:height-top,radius:0}],false,theme);
    materialKey=key;
    if(material!==next){material=next;window.webContents.send('studio:state',snapshot());}
   }finally{applyingMaterial=false;}
  };let resizeTimer;window.webContents.once('did-finish-load',nativeMaterial);window.on('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(nativeMaterial,80);});require('electron').nativeTheme.on('updated',nativeMaterial);window.on('closed',()=>{clearTimeout(resizeTimer);require('electron').nativeTheme.removeListener('updated',nativeMaterial);});window.webContents.setWindowOpenHandler(()=>({action:'deny'}));window.webContents.on('will-navigate',e=>e.preventDefault());

 }
 if(files.length)await add(files);window.show();window.focus();if(!window.webContents.isLoading())window.webContents.send('studio:state',snapshot());return snapshot();}
 function handle(name,fn){ipcMain.handle('studio:'+name,(event,...args)=>{if(!window||window.isDestroyed()||event.sender!==window.webContents)throw Error('Invalid Studio session');return fn(...args);});}
 handle('sidebar-layout',value=>{if(!value||!Number.isInteger(value.width)||value.width<40||value.width>300||!Number.isInteger(value.top)||value.top<20||value.top>180)throw Error('Invalid sidebar layout');if(sidebarBox.width!==value.width||sidebarBox.top!==value.top){sidebarBox=value;applyMaterial?.();}});handle('menu-state',state=>{if(!state||typeof state!=='object'||Array.isArray(state)||Object.keys(state).length>30||!Object.values(state).every(v=>typeof v==='boolean'))throw Error('Invalid menu state');studioMenu?.update(state);});handle('nautilus-install',async()=>{const {app}=require('electron');if(process.platform!=='linux'||!app.isPackaged)throw Error('Install the Linux app before adding the Nautilus action.');return require('./nautilus.cjs').installNautilusAction({home:app.getPath('home'),executable:process.env.APPIMAGE||app.getPath('exe')});});handle('gesture',value=>{if(!gestureSettings)throw Error('Gesture settings unavailable');return gestureSettings.set(value);});handle('state',snapshot);handle('theme',theme=>appearance.setAppearance(theme));
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
 handle('pdf-open',async file=>{if(busy)throw Error('Wait for the current operation');if(!selection.allowed.has(file)&&!outputs.has(file))throw Error('Choose a PDF first');await pdfEditor?.close();pdfEditor=await require('./pdf-editor.cjs').createPDFEditor(file);return pdfEditor.snapshot();});
 const editor=session=>{if(!pdfEditor||pdfEditor.session!==session)throw Error('Invalid PDF editing session');return pdfEditor;};
 handle('pdf-page',(session,page)=>editor(session).page(page));
 handle('pdf-image',async session=>{const active=editor(session);const picked=await dialog.showOpenDialog(window,{filters:[{name:'Images',extensions:['png','jpg','jpeg','webp','avif','tiff','svg']}],properties:['openFile']});if(picked.canceled)return null;const stat=await fs.stat(picked.filePaths[0]);if(!stat.isFile()||stat.size>20*1024*1024)throw Error('Choose an image smaller than 20 MB');return active.addImage(await fs.readFile(picked.filePaths[0]));});
 handle('pdf-signature',async(session,data)=>{if(typeof data!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(data)||data.length>4000000)throw Error('Invalid signature image');return editor(session).addImage(Buffer.from(data.split(',')[1],'base64'));});
 handle('pdf-merge',async session=>{const active=editor(session);const picked=await dialog.showOpenDialog(window,{filters:[{name:'PDF',extensions:['pdf']}],properties:['openFile']});return picked.canceled?[]:active.merge(picked.filePaths[0]);});
 handle('pdf-search',(session,query)=>editor(session).search(query));
 handle('pdf-save',async(session,pages,objects,values)=>{if(busy)throw Error('Wait for the current operation');busy=true;try{const destination=await editor(session).save(pages,objects,outputDir,values);outputs.add(destination);const stat=await fs.stat(destination);history.unshift({source:editor(session).sourceFile,kind:'edited',path:destination,name:path.basename(destination),size:stat.size,target:'pdf'});return {path:destination,name:path.basename(destination)};}finally{busy=false;}});
 handle('pdf-close',async session=>{if(busy)throw Error('Wait for saving to finish');await editor(session).close();pdfEditor=undefined;});
 handle('run',async jobs=>{if(busy)throw Error('Conversion already running');if(!Array.isArray(jobs)||!jobs.length||jobs.length>100)throw Error('Choose files to convert');for(const job of jobs){if(!selection.allowed.has(job.path)||!entries.get(job.path).targets.includes(job.target))throw Error('Choose a valid format for each file');}
  busy=true;controller=new AbortController();const results=[];try{for(let index=0;index<jobs.length;index++){if(controller.signal.aborted)break;const job=jobs[index],options=job.options||{};let result;try{const destination=await convert(job.path,job.target,{crop:options.crop,width:options.width,quality:options.quality,flip:options.flip===true,flop:options.flop===true,outputDir,pages:options.pages,pdfWidth:options.pdfWidth,ocr:options.ocr,ocrLanguage:options.ocrLanguage,svgMode:options.svgMode,signal:controller.signal,onProgress:progress=>{if(window&&!window.isDestroyed())window.webContents.send('studio:pdf-progress',progress);}});outputs.add(destination);const stat=await fs.stat(destination);result={source:job.path,path:destination,name:path.basename(destination),size:stat.size,target:job.target};history.unshift(result);history.splice(100);}catch(error){result={source:job.path,error:error.message};}results.push(result);if(window&&!window.isDestroyed())window.webContents.send('studio:progress',{index:index+1,total:jobs.length,result});}return results;}finally{busy=false;controller=undefined;}});
 handle('cancel',()=>{controller?.abort();});
 handle('reveal',file=>{if(outputs.has(file)||selection.allowed.has(file))shell.showItemInFolder(file);});
 handle('quicklook',file=>{if(outputs.has(file)||selection.allowed.has(file)){if(process.platform==='darwin')window.previewFile(file);else return shell.openPath(file);}});
 handle('wheel',async file=>{if(busy)throw Error('Wait for conversion to finish');if(!selection.allowed.has(file))throw Error('Select an input file');window.hide();await onWheel([file]);});
 return {open,isVisible:()=>!!window&&!window.isDestroyed()&&window.isVisible(),hasWindow:()=>!!window&&!window.isDestroyed()};
}
module.exports={createStudio};
