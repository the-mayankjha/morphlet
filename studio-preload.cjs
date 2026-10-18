
const {contextBridge,ipcRenderer,webUtils}=require('electron');let dropped=[];
document.addEventListener('drop',event=>{dropped=Array.from(event.dataTransfer?.files||[],file=>webUtils.getPathForFile(file)).filter(Boolean);},true);
const invoke=(name,...args)=>ipcRenderer.invoke('studio:'+name,...args);
contextBridge.exposeInMainWorld('studio',{
 platform:process.platform,cancel:()=>invoke('cancel'),onPDFProgress:callback=>ipcRenderer.on('studio:pdf-progress',(_e,value)=>callback(value)),setTheme:theme=>invoke('theme',theme),onAppearance:callback=>ipcRenderer.on('appearance',(_event,value)=>callback(value)),state:()=>invoke('state'),pick:()=>invoke('pick'),drop:()=>{const files=dropped;dropped=[];return invoke('drop',files);},remove:file=>invoke('remove',file),folder:()=>invoke('folder'),resetFolder:()=>invoke('reset-folder'),preview:file=>invoke('preview',file),run:jobs=>invoke('run',jobs),reveal:file=>invoke('reveal',file),quicklook:file=>invoke('quicklook',file),wheel:file=>invoke('wheel',file),onState:callback=>ipcRenderer.on('studio:state',(_e,value)=>callback(value)),onProgress:callback=>ipcRenderer.on('studio:progress',(_e,value)=>callback(value))
});
