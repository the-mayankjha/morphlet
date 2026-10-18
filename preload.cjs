const {contextBridge,ipcRenderer,webUtils}=require('electron');
contextBridge.exposeInMainWorld('desktop',{
 onSelection:callback=>ipcRenderer.on('selection',(_event,value)=>callback(value)),
 hide:()=>ipcRenderer.invoke('hide'),pick:()=>ipcRenderer.invoke('pick'),
 drop:files=>ipcRenderer.invoke('drop',Array.from(files,f=>webUtils.getPathForFile(f))),
 convert:target=>ipcRenderer.invoke('convert',{target}),
 preview:file=>ipcRenderer.invoke('preview',file),reveal:file=>ipcRenderer.invoke('reveal',file),quicklook:file=>ipcRenderer.invoke('quicklook',file)
});
