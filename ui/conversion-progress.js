// Report measured work only. Unknown-duration operations use an activity sweep.
const MorphProgress=(()=>{
 const panel=document.getElementById('conversion-progress'),bar=document.getElementById('conversion-bar'),fill=document.getElementById('conversion-fill');
 let totalFiles=1;
 function activity(active){bar.classList.toggle('indeterminate',active);if(active)bar.removeAttribute('aria-valuenow');}
 function begin(files,target){totalFiles=files.length;document.getElementById('menu').hidden=true;document.getElementById('editor').hidden=true;document.getElementById('result').hidden=true;panel.hidden=false;panel.setAttribute('aria-busy','true');document.getElementById('conversion-title').textContent=target==='zip'?'Preparing your AI bundle':'Converting your files';document.getElementById('conversion-file').textContent=files.length===1?files[0].name:`${files.length} files`;document.getElementById('conversion-stage').textContent='Preparing conversion';document.getElementById('conversion-count').textContent=files.length===1?'Processing locally':`0 of ${totalFiles} files`;fill.style.width='0%';activity(true);}
 function update(progress){if(panel.hidden)return;document.getElementById('conversion-stage').textContent=progress.stage||'Converting';if(progress.name)document.getElementById('conversion-file').textContent=progress.name;
  if(progress.kind==='pages'){
   const done=Math.max(0,Math.min(progress.completed||0,progress.total));document.getElementById('conversion-count').textContent=`${done} of ${progress.total} pages`+(totalFiles>1?` · file ${progress.fileIndex+1} of ${totalFiles}`:'');activity(false);bar.setAttribute('aria-valuenow',String(Math.round(done/progress.total*100)));fill.style.width=`${done/progress.total*100}%`;
  }else if(progress.kind==='packaging'){activity(true);document.getElementById('conversion-count').textContent='Finalizing bundle';
  }else{const done=progress.completed||0;document.getElementById('conversion-count').textContent=`${done} of ${totalFiles} files`;activity(done===0||progress.kind==='file-start');if(done){bar.setAttribute('aria-valuenow',String(Math.round(done/totalFiles*100)));fill.style.width=`${done/totalFiles*100}%`;}}
 }
 function end(){panel.hidden=true;panel.setAttribute('aria-busy','false');activity(false);}
 return {begin,update,end};
})();
window.desktop.onConversionProgress?.(MorphProgress.update);
