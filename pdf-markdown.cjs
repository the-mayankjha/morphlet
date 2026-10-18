const {pathToFileURL}=require('node:url');
const compact=text=>String(text??'').replace(/\s+/g,'');
function tableMarkdown(rows){
 const width=Math.max(0,...rows.map(row=>row.length));if(width<2||rows.length<2)return '';
 const cell=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\\/g,'&#92;').replace(/\|/g,'&#124;').replace(/\r?\n/g,'<br>');
 const line=row=>'| '+Array.from({length:width},(_,i)=>cell(row[i])).join(' | ')+' |';
 return [line(rows[0]),line(Array(width).fill('---')),...rows.slice(1).map(line)].join('\n');
}
function codeFence(text){const ticks=Math.max(3,...[...text.matchAll(/`+/g)].map(match=>match[0].length+1));const fence='`'.repeat(ticks);return fence+'\n'+text+'\n'+fence;}
function layoutLines(content,viewport,Util){
 const lines=[];
 for(const item of content.items){if(!('str'in item)||!item.str)continue;const transform=Util.transform(viewport.transform,item.transform),x=transform[4],y=transform[5],height=Math.hypot(transform[2],transform[3])||item.height||10;const mono=/mono|courier|consolas|menlo|code|typewriter/i.test(content.styles[item.fontName]?.fontFamily||'');let line=lines.find(line=>Math.abs(line.y-y)<Math.max(2,height*.18));if(!line){line={y,height,items:[]};lines.push(line);}line.items.push({text:item.str,x,width:item.width,height,mono});}
 return lines.sort((a,b)=>a.y-b.y).map(line=>{line.items.sort((a,b)=>a.x-b.x);let text='';for(const [i,item]of line.items.entries()){const previous=line.items[i-1];if(previous){const gap=item.x-(previous.x+previous.width);if(gap>item.height*.15&&!text.endsWith(' ')&&!item.text.startsWith(' '))text+=' ';}text+=item.text;}return {...line,text:text.trimEnd(),x:line.items[0].x,mono:line.items.filter(i=>i.mono).reduce((n,i)=>n+i.text.trim().length,0)>text.trim().length*.65};});
}
function formatPage(lines,tables=[]){
 const replaced=new Map(),removed=new Set(),appendices=[],notes=[];let tableCount=0,codeBlocks=0;
 for(const rows of tables){const markdown=tableMarkdown(rows);if(!markdown)continue;tableCount++;let cursor=0;const matches=[];
  for(const row of rows){const expected=compact(row.join(''));let found;for(let i=cursor;i<lines.length&&!found;i++){if(removed.has(i))continue;for(let count=1;count<=3&&i+count<=lines.length;count++){const text=compact(lines.slice(i,i+count).map(l=>l.text).join(''));if(text===expected){found=Array.from({length:count},(_,offset)=>i+offset);break;}}}if(!found){matches.length=0;break;}matches.push(...found);cursor=found.at(-1)+1;}
  if(matches.length){replaced.set(matches[0],markdown);for(const index of matches)removed.add(index);}else{appendices.push('### Detected table\n\n'+markdown);notes.push('A detected table could not be positioned reliably; it is appended and original text is retained.');}
 }
 const blocks=[];
 for(let i=0;i<lines.length;){if(replaced.has(i))blocks.push(replaced.get(i));if(removed.has(i)){i++;continue;}
  if(lines[i].mono){const run=[lines[i++]];while(i<lines.length&&!removed.has(i)&&lines[i].mono&&lines[i].y-run.at(-1).y<run.at(-1).height*2.8)run.push(lines[i++]);const left=Math.min(...run.map(l=>l.x));const characterWidth=run.flatMap(l=>l.items).filter(t=>t.mono&&t.text.trim()).map(t=>t.width/t.text.length).sort((a,b)=>a-b);const unit=characterWidth[Math.floor(characterWidth.length/2)]||6;const gaps=run.slice(1).map((line,i)=>line.y-run[i].y).sort((a,b)=>a-b),step=gaps[0]||run[0].height*1.4;const code=[];for(const [index,line]of run.entries()){if(index){const blanks=Math.min(3,Math.max(0,Math.round((line.y-run[index-1].y)/step)-1));for(let blank=0;blank<blanks;blank++)code.push('');}code.push(' '.repeat(Math.min(120,Math.max(0,Math.round((line.x-left)/unit))))+line.text);}blocks.push(codeFence(code.join('\n')));codeBlocks++;continue;}
  const paragraph=[lines[i++]];while(i<lines.length&&!removed.has(i)&&!lines[i].mono&&lines[i].y-paragraph.at(-1).y<paragraph.at(-1).height*1.6)paragraph.push(lines[i++]);blocks.push(paragraph.map(line=>line.text).join('\n'));
 }
 blocks.push(...appendices);return {markdown:blocks.join('\n\n'),blocks,tables:tableCount,codeBlocks,notes};
}
// Split complete Markdown blocks, repeating table headers and code fences when needed.
function markdownParts(blocks,limit=10000){const parts=[];let current='';const add=block=>{if(current&&current.length+block.length+2>limit){parts.push(current);current='';}current+=(current?'\n\n':'')+block;};
 for(const block of blocks){if(block.length<=limit){add(block);continue;}const fence=block.match(/^(`{3,})\n/);if(fence){const content=block.slice(fence[0].length,-fence[1].length-1);let piece='';for(const line of content.split('\n')){if(piece.length+line.length>limit-200&&piece){add(codeFence(piece));piece='';}piece+=(piece?'\n':'')+line;}if(piece)add(codeFence(piece));}
 else if(block.startsWith('| ')&&block.split('\n')[1]?.includes('---')){const [header,separator,...rows]=block.split('\n');let piece=header+'\n'+separator;for(const row of rows){if(piece.length+row.length>limit-200){add(piece);piece=header+'\n'+separator;}piece+='\n'+row;}add(piece);}
 else{let at=0;while(at<block.length){let end=Math.min(at+limit,block.length);if(end<block.length&&/[\uD800-\uDBFF]/.test(block[end-1]))end--;add(block.slice(at,end));at=end;}}}
 if(current)parts.push(current);return parts;
}
async function createMarkdownReader(data){const pdfjs=await import(pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href);const task=pdfjs.getDocument({data:new Uint8Array(data),verbosity:0,isEvalSupported:false});const document=await task.promise;return {async page(number,tables){const page=await document.getPage(number);try{return formatPage(layoutLines(await page.getTextContent(),page.getViewport({scale:1}),pdfjs.Util),tables);}finally{page.cleanup();}},destroy:()=>task.destroy()};}
module.exports={tableMarkdown,codeFence,formatPage,markdownParts,createMarkdownReader};
