const {pathToFileURL}=require('node:url');
const compact=text=>String(text??'').replace(/\s+/g,'');
function tableMarkdown(rows){
 const width=Math.max(0,...rows.map(row=>row.length));if(width<2||rows.length<2)return '';
 const cell=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\\/g,'&#92;').replace(/\|/g,'&#124;').replace(/\r?\n/g,'<br>');
 const line=row=>'| '+Array.from({length:width},(_,i)=>cell(row[i])).join(' | ')+' |';
 return [line(rows[0]),line(Array(width).fill('---')),...rows.slice(1).map(line)].join('\n');
}
function codeFence(text){const ticks=Math.max(3,...[...text.matchAll(/`+/g)].map(match=>match[0].length+1));const fence='`'.repeat(ticks);return fence+'\n'+text+'\n'+fence;}
function layoutLines(content,viewport,Util,fonts={}){
 const lines=[];
 for(const item of content.items){if(!('str'in item)||!item.str)continue;const transform=Util.transform(viewport.transform,item.transform),x=transform[4],y=transform[5],height=Math.hypot(transform[2],transform[3])||item.height||10;const mono=/mono|courier|consolas|menlo|code|typewriter/i.test(content.styles[item.fontName]?.fontFamily||'');let line=lines.find(line=>Math.abs(line.y-y)<Math.max(2,height*.18));if(!line){line={y,height,items:[]};lines.push(line);}line.items.push({text:item.str,x,width:item.width,height,mono,bold:fonts[item.fontName]?.bold||false});}
 return lines.sort((a,b)=>a.y-b.y).map(line=>{line.items.sort((a,b)=>a.x-b.x);let text='';for(const [i,item]of line.items.entries()){const previous=line.items[i-1];if(previous){const gap=item.x-(previous.x+previous.width);if(gap>item.height*.15&&!text.endsWith(' ')&&!item.text.startsWith(' '))text+=' ';}text+=item.text;}return {...line,text:text.trimEnd(),x:line.items[0].x,bold:line.items.filter(i=>i.bold).reduce((n,i)=>n+i.text.trim().length,0)>text.trim().length*.65,mono:line.items.filter(i=>i.mono).reduce((n,i)=>n+i.text.trim().length,0)>text.trim().length*.65};});
}
function headingCandidate(line,body,previous,next){
 const text=line.text.trim(),gap=previous?line.y-previous.y:Infinity;
 if(line.mono||text.length>160||text.split(/\s+/).length>24||/^(figure|fig\.|table|equation|source|note)\s*\d*[:. ]/i.test(text)||/^[\d\s./-]+$/.test(text))return false;
 if(line.height>body*1.13)return true;
 const isolated=gap>line.height*1.5||!previous;
 if(line.bold&&line.height>=body*.95&&!/[.!?;:,]$/.test(text)&&isolated)return true;
 return line.height>=body*.95&&isolated&&text.length<75&&(/^(chapter|part|appendix)\s+\S/i.test(text)||(/^[A-Z\d][A-Z\d &/-]+$/.test(text)&&/[A-Z]{3}/.test(text)));
}
function hierarchyProfile(pages){
 const frequencies=new Map(),running=new Map();
 for(const page of pages)for(const line of page.lines){if(!line.mono){const key=Math.round(line.height*2)/2;frequencies.set(key,(frequencies.get(key)||0)+line.text.trim().length);}if(line.y<page.height*.1||line.y>page.height*.9){const key=Math.round(line.height)+':'+line.text.trim().replace(/\d+/g,'#');if(!running.has(key))running.set(key,new Set());running.get(key).add(page.number);}}
 const body=[...frequencies].sort((a,b)=>b[1]-a[1])[0]?.[0]||11;
 const repeated=new Set([...running].filter(([,numbers])=>pages.length>=3&&numbers.size>=Math.max(2,Math.ceil(pages.length*.5))).map(([key])=>key));
 const isRunning=(line,height)=>((line.y<height*.1||line.y>height*.9)&&repeated.has(Math.round(line.height)+':'+line.text.trim().replace(/\d+/g,'#')))||((line.y<height*.1||line.y>height*.9)&&/^(?:page\s+)?\d+(?:\s*(?:of|\/)\s*\d+)?$/i.test(line.text.trim()));
 const candidates=pages.flatMap(page=>page.lines.filter((line,i)=>!isRunning(line,page.height)&&headingCandidate(line,body,page.lines[i-1],page.lines[i+1])));
 const sizes=[];for(const size of candidates.map(l=>l.height).sort((a,b)=>b-a))if(!sizes.some(other=>Math.abs(size-other)<other*.08))sizes.push(size);
 const sizeLevel=line=>{const match=sizes.findIndex(size=>Math.abs(size-line.height)<size*.08);return Math.min(6,match>=0?match+1:sizes.filter(size=>size>line.height).length+1);};
 const numbered=candidates.map(line=>{const match=line.text.trim().match(/^(\d+(?:\.\d+)*)(?:[.)])?\s+\S/);return match?sizeLevel(line)-match[1].split('.').length+1:null;}).filter(n=>n!==null);
 const numberBase=numbered.length?Math.max(1,Math.min(...numbered)):1;
 return {body,isRunning,level(line,previous,next){if(!headingCandidate(line,body,previous,next))return 0;const number=line.text.trim().match(/^(\d+(?:\.\d+)*)(?:[.)])?\s+\S/);return number?Math.min(6,numberBase+number[1].split('.').length-1):sizeLevel(line);}};
}
function formatPage(lines,tables=[],profile){
 const replaced=new Map(),removed=new Set(),appendices=[],notes=[];let tableCount=0,codeBlocks=0;
 for(const rows of tables){const markdown=tableMarkdown(rows);if(!markdown)continue;tableCount++;let cursor=0;const matches=[];
  for(const row of rows){const expected=compact(row.join(''));let found;for(let i=cursor;i<lines.length&&!found;i++){if(removed.has(i))continue;for(let count=1;count<=3&&i+count<=lines.length;count++){const text=compact(lines.slice(i,i+count).map(l=>l.text).join(''));if(text===expected){found=Array.from({length:count},(_,offset)=>i+offset);break;}}}if(!found){matches.length=0;break;}matches.push(...found);cursor=found.at(-1)+1;}
  if(matches.length){replaced.set(matches[0],markdown);for(const index of matches)removed.add(index);}else{appendices.push('### Detected table\n\n'+markdown);notes.push('A detected table could not be positioned reliably; it is appended and original text is retained.');}
 }
 const blocks=[],headings=[];const level=i=>profile?.level(lines[i],lines[i-1],lines[i+1])||0;
 for(let i=0;i<lines.length;){if(replaced.has(i))blocks.push(replaced.get(i));if(removed.has(i)){i++;continue;}
  if(level(i)){const depth=level(i),run=[lines[i++]];while(i<lines.length&&!removed.has(i)&&level(i)===depth&&Math.abs(lines[i].height-run[0].height)<1&&lines[i].y-run.at(-1).y<run[0].height*1.45)run.push(lines[i++]);const text=run.map(line=>line.text.trim()).join(' ');blocks.push('#'.repeat(depth)+' '+text);headings.push({level:depth,text});continue;}
  if(lines[i].mono){const run=[lines[i++]];while(i<lines.length&&!removed.has(i)&&lines[i].mono&&lines[i].y-run.at(-1).y<run.at(-1).height*2.8)run.push(lines[i++]);const left=Math.min(...run.map(l=>l.x));const characterWidth=run.flatMap(l=>l.items).filter(t=>t.mono&&t.text.trim()).map(t=>t.width/t.text.length).sort((a,b)=>a-b);const unit=characterWidth[Math.floor(characterWidth.length/2)]||6;const gaps=run.slice(1).map((line,i)=>line.y-run[i].y).sort((a,b)=>a-b),step=gaps[0]||run[0].height*1.4;const code=[];for(const [index,line]of run.entries()){if(index){const blanks=Math.min(3,Math.max(0,Math.round((line.y-run[index-1].y)/step)-1));for(let blank=0;blank<blanks;blank++)code.push('');}code.push(' '.repeat(Math.min(120,Math.max(0,Math.round((line.x-left)/unit))))+line.text);}blocks.push(codeFence(code.join('\n')));codeBlocks++;continue;}
  const paragraph=[lines[i++]];while(i<lines.length&&!removed.has(i)&&!lines[i].mono&&!level(i)&&lines[i].y-paragraph.at(-1).y<paragraph.at(-1).height*1.6)paragraph.push(lines[i++]);blocks.push(paragraph.map(line=>line.text).join('\n'));
 }
 blocks.push(...appendices);return {markdown:blocks.join('\n\n'),blocks,tables:tableCount,codeBlocks,headings,notes};
}
// Split complete Markdown blocks, repeating table headers and code fences when needed.
function markdownParts(blocks,limit=10000){const parts=[];let current='';const add=block=>{if(current&&current.length+block.length+2>limit){parts.push(current);current='';}current+=(current?'\n\n':'')+block;};
 for(const block of blocks){if(block.length<=limit){add(block);continue;}const fence=block.match(/^(`{3,})\n/);if(fence){const content=block.slice(fence[0].length,-fence[1].length-1);let piece='';for(const line of content.split('\n')){if(piece.length+line.length>limit-200&&piece){add(codeFence(piece));piece='';}piece+=(piece?'\n':'')+line;}if(piece)add(codeFence(piece));}
 else if(block.startsWith('| ')&&block.split('\n')[1]?.includes('---')){const [header,separator,...rows]=block.split('\n');let piece=header+'\n'+separator;for(const row of rows){if(piece.length+row.length>limit-200){add(piece);piece=header+'\n'+separator;}piece+='\n'+row;}add(piece);}
 else{let at=0;while(at<block.length){let end=Math.min(at+limit,block.length);if(end<block.length&&/[\uD800-\uDBFF]/.test(block[end-1]))end--;add(block.slice(at,end));at=end;}}}
 if(current)parts.push(current);return parts;
}
async function createMarkdownReader(data,{signal}={}){
 const pdfjs=await import(pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href),task=pdfjs.getDocument({data:new Uint8Array(data),verbosity:0,isEvalSupported:false,fontExtraProperties:true});
 const document=await task.promise,cache=new Map();let profile;
 async function read(number){signal?.throwIfAborted();if(cache.has(number))return cache.get(number);const page=await document.getPage(number);try{await page.getOperatorList();const content=await page.getTextContent(),fonts={};for(const name of Object.keys(content.styles)){try{fonts[name]=page.commonObjs.get(name);}catch{}}const viewport=page.getViewport({scale:1});return {number,height:viewport.height,lines:layoutLines(content,viewport,pdfjs.Util,fonts)};}finally{page.cleanup();}}
 try{const samples=[];const count=Math.min(document.numPages,12);for(let i=0;i<count;i++){const number=count===1?1:1+Math.round(i*(document.numPages-1)/(count-1));const page=await read(number);cache.set(number,page);samples.push(page);}profile=hierarchyProfile(samples);}catch(error){await task.destroy();throw error;}
 return {async page(number,tables){const page=await read(number),lines=page.lines.filter(line=>!profile.isRunning(line,page.height));return formatPage(lines,tables,profile);},destroy:()=>task.destroy()};
}
module.exports={tableMarkdown,codeFence,formatPage,markdownParts,createMarkdownReader,hierarchyProfile};
