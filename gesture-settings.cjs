const fs=require('node:fs'),path=require('node:path');
function createGestureSettings({directory,platform=process.platform,onChange=()=>{}}){
 const defaults={modifier:platform==='darwin'?'command':'control',convertModifier:'shift',scrollWheel:true};let value={...defaults};const file=path.join(directory,'gesture.json');
 const keys=platform==='darwin'?['command','control','alt','shift','disabled']:['control','alt','shift','disabled'];
 const valid=v=>v&&Object.keys(v).every(k=>['modifier','convertModifier','scrollWheel'].includes(k))&&typeof v.scrollWheel==='boolean'&&keys.includes(v.modifier)&&keys.includes(v.convertModifier)&&!(v.modifier!=='disabled'&&v.modifier===v.convertModifier);
 try{const saved=JSON.parse(fs.readFileSync(file,'utf8'));const migrated={...defaults,...saved};if(valid(migrated))value=migrated;}catch{}
 return {get:()=>({...value}),set:next=>{next={...value,...next};if(!valid(next))throw Error('Choose a supported modifier key');fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(file,JSON.stringify(next));value={...next};onChange();return {...value};}};
}
function createModifierTap(){let previous=false,used=false,owner;return state=>{if(state.pressed&&!previous){used=false;owner=state.owner;}if(state.pressed&&(state.other||state.down))used=true;const fire=!state.pressed&&previous&&!used&&!state.other&&!state.down&&owner===state.owner;previous=state.pressed;return fire;};}
module.exports={createGestureSettings,createModifierTap};
