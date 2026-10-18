const {contextBridge,ipcRenderer,webUtils}=require('electron');
// Resolve native File paths in preload, before contextBridge serializes File objects.
let droppedPaths=[];
document.addEventListener('drop',event=>{droppedPaths=Array.from(event.dataTransfer?.files||[],file=>webUtils.getPathForFile(file)).filter(Boolean);},true);
contextBridge.exposeInMainWorld('desktop',{
 onSelection:callback=>ipcRenderer.on('selection',(_event,value)=>callback(value)),
 onDragHover:callback=>ipcRenderer.on('drag-hover',(_event,value)=>callback(value)),
 onDragRelease:callback=>ipcRenderer.on('drag-release',(_event,value)=>callback(value)),
 material:(regions,expand=false)=>ipcRenderer.invoke('material',regions,expand),
 appearance:()=>ipcRenderer.invoke('appearance'),setTheme:theme=>ipcRenderer.invoke('set-theme',theme),onAppearance:callback=>ipcRenderer.on('appearance',(_event,value)=>callback(value)),
 studio:()=>ipcRenderer.invoke('studio'),
 hide:()=>ipcRenderer.invoke('hide'),pick:()=>ipcRenderer.invoke('pick'),
 drop:()=>{const files=droppedPaths;droppedPaths=[];return ipcRenderer.invoke('drop',files);},
 convert:(target,options)=>ipcRenderer.invoke('convert',{target,options}),
 source:file=>ipcRenderer.invoke('source',file),
 preview:file=>ipcRenderer.invoke('preview',file),reveal:file=>ipcRenderer.invoke('reveal',file),quicklook:file=>ipcRenderer.invoke('quicklook',file)
});
