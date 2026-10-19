const {BrowserWindow,ipcMain,shell,nativeTheme}=require('electron'),path=require('node:path');
const tools=require('./quick-tools.cjs'),appearance=require('./appearance.cjs');
function createQuickWindow({openStudio}){let window,files=[],action,busy=false,glass;try{if(process.platform==='darwin')glass=require('./native/glass.node');}catch{}
 const snapshot=async()=>({action,label:tools.labels[action],files:[...files],thumbnails:await tools.thumbnails(files,800),...await tools.inspect(files),appearance:appearance.getAppearance()});
 function handle(name,fn){ipcMain.handle('quick:'+name,(event,...args)=>{if(!window||window.isDestroyed()||event.sender!==window.webContents)throw Error('Invalid quick-tool session');return fn(...args);});}
 handle('info',snapshot);handle('preview',async options=>{if(busy)throw Error('Wait for saving to finish');return tools.preview(files,action==='edit'&&!String(options?.text||'').trim()?'compress':action,options);});
 handle('studio',async()=>{if(busy)throw Error('Wait for saving to finish');await openStudio(files,files.every(file=>/\.pdf$/i.test(file)));window?.close();});
 handle('close',()=>{if(!busy)window.close();});handle('reveal',file=>{if(lastOutput===file)shell.showItemInFolder(file);});let lastOutput;
 // Remember only outputs created by this session for Finder/Explorer reveal.
 handle('save',async options=>{if(busy)throw Error('Already saving');busy=true;try{const result=await tools.save(files,action,options);lastOutput=result.path;return result;}finally{busy=false;}});
 async function open(nextFiles,nextAction){if(busy)throw Error('Wait for the current quick tool to finish');if(nextAction==='studio')return openStudio(nextFiles,nextFiles.every(file=>/\.pdf$/i.test(file)));if(!tools.toolsFor(nextFiles).includes(nextAction))throw Error('This tool is unavailable for the selected files');await tools.inspect(nextFiles);window?.destroy();files=[...nextFiles];action=nextAction;lastOutput=undefined;
  window=new BrowserWindow({width:420,height:650,minWidth:360,minHeight:480,minimizable:false,maximizable:false,fullscreenable:false,title:tools.labels[action]+' · Morphlet',backgroundColor:glass?'#00000000':'#202020',transparent:!!glass,...(process.platform==='darwin'?{titleBarStyle:'hiddenInset',trafficLightPosition:{x:14,y:15}}:{}),webPreferences:{preload:path.join(__dirname,'quick-preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  let key='',applying=false;const update=()=>{if(!glass||window?.isDestroyed()||applying)return;const [width,height]=window.getContentSize(),theme=appearance.getAppearance().theme,next=JSON.stringify([width,height,theme]);if(next===key)return;applying=true;try{glass.apply(window.getNativeWindowHandle(),[{x:0,y:0,width,height,radius:18}],false,theme,true);key=next;}finally{applying=false;}};
  const current=window;const theme=()=>{if(current.isDestroyed())return;update();current.webContents.send('appearance',appearance.getAppearance());};current.on('resize',update);nativeTheme.on('updated',theme);current.on('closed',()=>nativeTheme.removeListener('updated',theme));current.webContents.setWindowOpenHandler(()=>({action:'deny'}));current.webContents.on('will-navigate',e=>e.preventDefault());await current.loadFile(path.join(__dirname,'ui/quick/index.html'));update();current.show();
 }
 return {open};
}
module.exports={createQuickWindow};
