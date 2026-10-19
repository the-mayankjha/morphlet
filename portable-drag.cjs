
const {spawn}=require('node:child_process'),path=require('node:path'),readline=require('node:readline'),{fileURLToPath}=require('node:url');
function parseFileUris(text){return [...new Set(String(text).split(/\r?\n/).filter(line=>line&&!line.startsWith('#')).map(line=>{try{const url=new URL(line);return url.protocol==='file:'&&(!url.hostname||url.hostname==='localhost')?fileURLToPath(url):null;}catch{return null;}}).filter(Boolean))].slice(0,100);}
function createPortableGesture(){let origin,wasDown=false,fired=false;return state=>{if(!state.down){origin={x:state.x,y:state.y};wasDown=false;fired=false;return;}if(!wasDown){origin=origin||{x:state.x,y:state.y};wasDown=true;}if(!fired&&state.option&&state.active&&state.ready&&Math.hypot(state.x-origin.x,state.y-origin.y)>=8){fired=true;return state.files||[];}};}
function startPortableDrag({onTrigger,onRelease,onUnavailable,modifier="control",convertModifier="shift"}){
 if(process.platform==='win32'){
  const child=spawn('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',require('./native-path.cjs').nativeScript('drag-windows.ps1'),'-Modifier',modifier,'-ConvertModifier',convertModifier],{windowsHide:true,stdio:['ignore','pipe','pipe']});let failed=false;const unavailable=()=>{if(!failed){failed=true;onUnavailable('Windows drag monitor unavailable');}};
  const lines=readline.createInterface({input:child.stdout});lines.on('line',line=>{try{const event=JSON.parse(line.replace(/^\uFEFF/,''));if(event.type==='trigger'&&Array.isArray(event.files))onTrigger(event.files.filter(f=>typeof f==='string').slice(0,100));else if(event.type==='selection'&&Array.isArray(event.files)&&event.files.length)onTrigger(event.files.filter(f=>typeof f==='string').slice(0,100),false,event.mode==='tools'?'tools':'convert');else if(event.type==='release')onRelease();}catch{}});child.stderr.on('data',()=>{});child.on('error',unavailable);child.on('exit',unavailable);return {mode:'windows',stop:()=>{failed=true;lines.close();child.kill();}};
 }
 if(process.platform==='linux'){
  if(process.env.WAYLAND_DISPLAY||process.env.XDG_SESSION_TYPE==='wayland'){onUnavailable('Wayland restricts global drag monitoring');return {mode:'fallback',stop(){}};}
  try{const native=require('./native/drag-x11.node');if(!native.poll().supported)throw Error('No X11 display');const detect=createPortableGesture();let down=false;const timer=setInterval(()=>{try{const state=native.poll();if(!state.supported)return;state.files=parseFileUris(state.uris);if(down&&!state.down)onRelease();down=state.down;const files=detect(state);if(files)onTrigger(files);}catch{}},30);timer.unref();return {mode:'x11',stop:()=>clearInterval(timer)};}catch{onUnavailable('X11 drag bridge unavailable');return {mode:'fallback',stop(){}};}
 }
 return {mode:'none',stop(){}};
}
module.exports={startPortableDrag,parseFileUris,createPortableGesture};
