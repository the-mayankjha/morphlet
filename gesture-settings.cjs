const fs=require('node:fs'),path=require('node:path');
function createGestureSettings({directory,platform=process.platform,onChange=()=>{}}){
 const defaults={modifier:platform==='darwin'?'command':'control'};let value={...defaults};const file=path.join(directory,'gesture.json');
 const valid=v=>v&&Object.keys(v).length===1&&(platform==='darwin'?['command','control','alt','disabled']:['control','alt','disabled']).includes(v.modifier);
 try{const saved=JSON.parse(fs.readFileSync(file,'utf8'));if(valid(saved))value=saved;}catch{}
 return {get:()=>({...value}),set:next=>{if(!valid(next))throw Error('Choose a supported modifier key');fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(file,JSON.stringify(next));value={...next};onChange();return {...value};}};
}
function createModifierTap(){let previous=false,used=false,owner;return state=>{if(state.pressed&&!previous){used=false;owner=state.owner;}if(state.pressed&&(state.other||state.down))used=true;const fire=!state.pressed&&previous&&!used&&!state.other&&!state.down&&owner===state.owner;previous=state.pressed;return fire;};}
module.exports={createGestureSettings,createModifierTap};
