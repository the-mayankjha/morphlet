const {contextBridge,ipcRenderer,webUtils}=require('electron');
contextBridge.exposeInMainWorld('desktop',{
 onSelection:callback=>ipcRenderer.on('selection',(_event,value)=>callback(value)),
 onDragHover:callback=>ipcRenderer.on('drag-hover',(_event,value)=>callback(value)),
 onDragRelease:callback=>ipcRenderer.on('drag-release',(_event,value)=>callback(value)),
 material:regions=>ipcRenderer.invoke('material',regions),
 hide:()=>ipcRenderer.invoke('hide'),pick:()=>ipcRenderer.invoke('pick'),
 drop:files=>ipcRenderer.invoke('drop',Array.from(files,f=>webUtils.getPathForFile(f))),
 convert:(target,options)=>ipcRenderer.invoke('convert',{target,options}),
 source:file=>ipcRenderer.invoke('source',file),
 preview:file=>ipcRenderer.invoke('preview',file),reveal:file=>ipcRenderer.invoke('reveal',file),quicklook:file=>ipcRenderer.invoke('quicklook',file)
});
