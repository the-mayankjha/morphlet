const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),{EventEmitter}=require('node:events');
function harness(){
 const nativeTheme=new EventEmitter(),handlers=new Map(),sent=[];let theme='dark',applies=0,active;
 class Window extends EventEmitter{
  constructor(){super();active=this;this.webContents=new EventEmitter();this.webContents.send=(...args)=>sent.push(args);this.webContents.setWindowOpenHandler=()=>{};this.webContents.isLoading=()=>false;}
  isDestroyed(){return false;}getContentSize(){return [1280,860];}getNativeWindowHandle(){return Buffer.alloc(8);}loadFile(){}show(){}focus(){}
 }
 const electron={BrowserWindow:Window,nativeTheme,app:new EventEmitter(),ipcMain:{handle:(name,fn)=>handlers.set(name,fn)}};
 const glass={apply(){applies++;if(applies>8)throw Error('Unbounded material loop');nativeTheme.emit('updated');return 'liquid';}};
 const module={exports:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../studio.cjs'),'utf8'),{module,exports:module.exports,__dirname:require('node:path').resolve(__dirname,'..'),Buffer,setTimeout,clearTimeout,require:name=>{
  if(name==='electron')return electron;if(name==='sharp')return {};if(name==='./appearance.cjs')return {getAppearance:()=>({theme})};if(name==='./native/glass.node')return glass;if(name==='./convert.cjs')return {};if(name==='./selection-state.cjs')return {createSelectionState:()=>({prepare:async()=>[],commit(){}})};if(name==='./studio-menu.cjs')return {attachStudioMenu:()=>({update(){}})};return require(name);
 },process:{platform:'darwin'}});
 return {studio:module.exports.createStudio({onWheel(){}}),nativeTheme,handlers,sent,get window(){return active;},get applies(){return applies;},setTheme:value=>{theme=value;nativeTheme.emit('updated');}};
}
test('Studio material updates cannot recurse through native appearance notifications',async()=>{
 const h=harness();await h.studio.open();h.sent.length=0;h.window.webContents.emit('did-finish-load');assert.equal(h.applies,1);assert.equal(h.sent.length,1);
 for(let i=0;i<100;i++)h.nativeTheme.emit('updated');assert.equal(h.applies,1);assert.equal(h.sent.length,1);
 h.setTheme('light');assert.equal(h.applies,2);assert.equal(h.sent.length,1,'theme changes must not resend file state and reload previews');
 h.setTheme('dark');assert.equal(h.applies,3);assert.equal(h.sent.length,1);
});
test('Studio sidebar changes update glass once without resetting the selected-file state',async()=>{
 const h=harness();await h.studio.open();h.window.webContents.emit('did-finish-load');h.sent.length=0;
 const layout=h.handlers.get('studio:sidebar-layout'),event={sender:h.window.webContents};layout(event,{width:60,top:78});assert.equal(h.applies,2);assert.equal(h.sent.length,0);
 layout(event,{width:60,top:78});assert.equal(h.applies,2);
 h.window.emit('closed');assert.equal(h.nativeTheme.listenerCount('updated'),0);
});
