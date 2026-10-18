const fs=require('node:fs'),path=require('node:path');
function createBackground(app,{platform=process.platform,env=process.env}={}){
 let quitting=false;
 app.on('before-quit',()=>{quitting=true;});
 // Closing every visible surface must never terminate the utility.
 app.on('window-all-closed',()=>{});
 const desktopFile=()=>path.join(env.XDG_CONFIG_HOME||path.join(app.getPath('home'),'.config'),'autostart','morphlet.desktop');
 function enabled(){if(platform==='linux')return fs.existsSync(desktopFile());return app.getLoginItemSettings().openAtLogin;}
 function setEnabled(value){if(!app.isPackaged)throw Error('Install Morphlet before enabling launch at login.');if(platform==='linux'){const file=desktopFile();if(value){fs.mkdirSync(path.dirname(file),{recursive:true});const executable=env.APPIMAGE||app.getPath('exe');const quoted='"'+executable.replace(/[\\"`$]/g,'\\$&')+'"';fs.writeFileSync(file,'[Desktop Entry]\nType=Application\nName=Morphlet\nExec='+quoted+' --background\nTerminal=false\nX-GNOME-Autostart-enabled=true\n');}else fs.rmSync(file,{force:true});}else app.setLoginItemSettings({openAtLogin:value,openAsHidden:true,args:['--background']});return enabled();}
 function keepWindow(window){window.on('close',event=>{if(!quitting){event.preventDefault();window.hide();}});}
 return {enabled,setEnabled,keepWindow};
}
module.exports={createBackground};
