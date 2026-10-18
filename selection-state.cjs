const fs=require('node:fs/promises');const path=require('node:path');
const {targets}=require('./convert.cjs');
function createSelectionState(){const allowed=new Set();
 async function prepare(files){const entries=[];for(const file of [...new Set(files)].slice(0,100)){if(typeof file!=='string'||!file)continue;try{if(!(await fs.stat(file)).isFile())continue;entries.push({path:file,name:path.basename(file),targets:targets(file)});}catch{}}return entries;}
 function commit(entries,{retainWhenEmpty=false}={}){if(!entries.length&&retainWhenEmpty)return snapshot();allowed.clear();for(const entry of entries)allowed.add(entry.path);return entries;}
 function snapshot(){return [...allowed].map(file=>({path:file,name:path.basename(file),targets:targets(file)}));}
 return {allowed,prepare,commit,snapshot};
}
module.exports={createSelectionState};
