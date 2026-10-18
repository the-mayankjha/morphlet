
const {ipcRenderer,webUtils}=require('electron');
document.addEventListener('dragover',event=>{event.preventDefault();document.body.classList.add('over');});document.addEventListener('dragleave',()=>document.body.classList.remove('over'));document.addEventListener('drop',event=>{event.preventDefault();document.body.classList.remove('over');const files=Array.from(event.dataTransfer?.files||[],file=>webUtils.getPathForFile(file)).filter(Boolean);if(files.length)ipcRenderer.invoke('dock-drop',files).catch(()=>{});});
