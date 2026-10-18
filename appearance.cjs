const {app,nativeTheme,BrowserWindow}=require('electron');const fs=require('node:fs'),path=require('node:path');
let initialized=false;
function getAppearance(){return {source:nativeTheme.themeSource,theme:nativeTheme.shouldUseDarkColors?'dark':'light'};}
function broadcast(){for(const window of BrowserWindow.getAllWindows())if(!window.isDestroyed())window.webContents.send('appearance',getAppearance());}
function initAppearance(){if(initialized)return;initialized=true;try{const saved=JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'appearance.json'),'utf8'));if(['dark','light','system'].includes(saved.theme))nativeTheme.themeSource=saved.theme;}catch{}nativeTheme.on('updated',broadcast);}
function setAppearance(theme){if(!['dark','light','system'].includes(theme))throw Error('Invalid theme');fs.mkdirSync(app.getPath('userData'),{recursive:true});fs.writeFileSync(path.join(app.getPath('userData'),'appearance.json'),JSON.stringify({theme}));nativeTheme.themeSource=theme;broadcast();return getAppearance();}
module.exports={initAppearance,getAppearance,setAppearance};
