const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const PDFDocument = require('pdfkit');
const { convert: htmlToText } = require('html-to-text');
const images = ['png','jpg','jpeg','webp','avif','tif','tiff','gif','svg'];
const text = ['txt','md','markdown','html','htm'];
const ext = file => path.extname(file).slice(1).toLowerCase();
function targets(file) {
  const type = ext(file);
  if (images.includes(type)) return ['png','jpg','webp','avif','tiff','pdf'];
  if (text.includes(type)) return ['txt','md','html','pdf'];
  if (type === 'pdf') return ['zip','png','jpg','webp','txt','md'];
  if (type === 'json') return ['json','csv','tsv','txt'];
  if (['csv','tsv'].includes(type)) return ['csv','tsv','json','txt'];
  return [];
}
function parseDelimited(source, separator) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i=0;i<source.length;i++) {
    const c = source[i];
    if (c === '"') { if (quoted && source[i+1] === '"') { cell+='"'; i++; } else if (quoted || cell === '') quoted = !quoted; else throw Error('Invalid quote in table'); }
    else if (c === separator && !quoted) { row.push(cell); cell=''; }
    else if ((c === '\n' || c === '\r') && !quoted) { if (c==='\r' && source[i+1]==='\n') i++; row.push(cell); rows.push(row); row=[]; cell=''; }
    else cell+=c;
  }
  if (quoted) throw Error('Unclosed quote in table');
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
const escapeHTML = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
async function documentText(source, type) {
  if (['html','htm'].includes(type)) return htmlToText(source, {wordwrap:false});
  if (['md','markdown'].includes(type)) { const { marked } = await import('marked'); return htmlToText(marked.parse(source), {wordwrap:false}); }
  return source;
}
async function makePDF(content, image) {
  return new Promise((resolve,reject) => {
    const doc = new PDFDocument({size:'A4', margin:48}); const chunks=[];
    doc.on('data', c=>chunks.push(c)); doc.on('error',reject); doc.on('end',()=>resolve(Buffer.concat(chunks)));
    if (image) doc.image(content,48,48,{fit:[499,746],align:'center',valign:'center'});
    else doc.fontSize(11).text(content, {lineGap:4});
    doc.end();
  });
}
async function convert(file, target, options={}) {
  if (!targets(file).includes(target)) throw Error('Unsupported conversion');
  const type=ext(file); const stat=await fs.stat(file);
  if (!stat.isFile() || stat.size>100*1024*1024) throw Error('Choose a file smaller than 100 MB');
  if(type==='pdf'&&target==='zip')return require('./pdf-ai.cjs').exportPDF(file,options);
  let output;
  if (images.includes(type)) {
    let image=sharp(file,{limitInputPixels:80_000_000}).rotate();
    if (options.crop) {
      const {left,top,width,height}=options.crop;
      if (![left,top,width,height].every(Number.isInteger) || left<0 || top<0 || width<1 || height<1) throw Error('Invalid crop rectangle');
      image=image.extract({left,top,width,height});
    }
    if(options.flip)image=image.flip();
    if(options.flop)image=image.flop();
    if (options.width) { const width=Number(options.width); if (!Number.isInteger(width)||width<1||width>16000) throw Error('Width must be 1–16000 pixels'); image=image.resize({width,withoutEnlargement:true}); }
    const quality=Number(options.quality ?? 85);
    if (!Number.isInteger(quality)||quality<1||quality>100) throw Error('Quality must be 1–100');
    if (target==='pdf') output=await makePDF(await image.png().toBuffer(),true);
    else { if (target==='jpg') image=image.flatten({background:'#ffffff'}); output=await image.toFormat(target==='jpg'?'jpeg':target,{quality}).toBuffer(); }
  } else if (type==='pdf') {
    const { PDFParse }=require('pdf-parse'); const parser=new PDFParse({data:await fs.readFile(file)});
    try {
      if (['png','jpg','webp'].includes(target)) {
        const rendered=await parser.getScreenshot({partial:[1],desiredWidth:1600});
        if (!rendered.pages.length) throw Error('This PDF has no pages');
        let image=sharp(rendered.pages[0].data);
        if(target==='jpg')image=image.flatten({background:'#ffffff'});
        output=await image.toFormat(target==='jpg'?'jpeg':target).toBuffer();
      } else {
        const extracted=await parser.getText({pageJoiner:''});
        if(target==='md'){
          const reader=await require('./pdf-markdown.cjs').createMarkdownReader(await fs.readFile(file));const pages=[];
          try{for(const page of extracted.pages){let tables=[];try{tables=(await parser.getTable({partial:[page.num]})).pages[0]?.tables||[];}catch{}const structured=await reader.page(page.num,tables);pages.push(`## Page ${page.num}\n\n`+structured.markdown);}}finally{await reader.destroy();}
          output=pages.join('\n\n');
        }else output=extracted.pages.map(page=>`--- Page ${page.num} ---\n\n`+page.text.trim()).join('\n\n');
        if (!extracted.pages.some(page=>page.text.trim())) throw Error('No embedded text found. Scanned PDFs need OCR.');
      }
    } finally { await parser.destroy(); }
  } else if (['json','csv','tsv'].includes(type)) {
    const source=await fs.readFile(file,'utf8');
    let rows;
    if (type==='json') {
      const value=JSON.parse(source);
      if (target==='json' || target==='txt') output=JSON.stringify(value,null,2);
      else {
        if (!Array.isArray(value)||!value.every(v=>v && typeof v==='object' && !Array.isArray(v))) throw Error('Table export requires a JSON array of objects');
        const keys=[...new Set(value.flatMap(Object.keys))];
        rows=[keys,...value.map(v=>keys.map(k=>v[k] == null ? '' : typeof v[k]==='object' ? JSON.stringify(v[k]) : String(v[k])))];
      }
    } else {
      rows=parseDelimited(source.replace(/^\uFEFF/,''),type==='csv'?',':'\t');
      if (target==='json') { const [keys,...data]=rows; if (!keys || new Set(keys).size!==keys.length) throw Error('Table needs unique column headers'); if (data.some(r=>r.length!==keys.length)) throw Error('Rows must match header width'); output=JSON.stringify(data.map(r=>Object.fromEntries(keys.map((k,i)=>[k,r[i]]))),null,2); }
    }
    if (output===undefined) { const separator=target==='csv'?',':'\t'; output=rows.map(r=>r.map(v=>/["\r\n,\t]/.test(v)?'"'+v.replaceAll('"','""')+'"':v).join(separator)).join('\n'); }
  } else {
    const source=await fs.readFile(file,'utf8'); const plain=await documentText(source,type);
    if (target==='pdf') output=['md','markdown'].includes(type)?await require('./markdown-pdf.cjs').markdownPDF(source,{sourceDir:path.dirname(file)}):await makePDF(plain,false);
    else if (target==='html') { const {marked}=await import('marked'); output='<!doctype html><meta charset="utf-8"><title>Converted document</title><body>' + (['md','markdown'].includes(type) ? await safeMarkdown(marked.parse(source)) : '<pre>'+escapeHTML(plain)+'</pre>')+'</body>'; }
    else output=target==='md' && ['md','markdown'].includes(type) ? source : plain;
  }
  const parsed=path.parse(file); const folder=options.outputDir || parsed.dir;
  // Exclusive creation preserves originals and existing outputs, including concurrent jobs.
  for (let i=0;i<10000;i++) {
    const destination=path.join(folder,`${parsed.name}-converted${i?'-'+i:''}.${target}`);
    try { await fs.writeFile(destination,output,{flag:'wx'}); return destination; } catch(error) { if(error.code!=='EEXIST') throw error; }
  }
  throw Error('Too many files with this name');
}
async function safeMarkdown(html) {
  // Generated HTML is deliberately text-only: no active HTML, scripts, links, or remote assets.
  return '<pre>'+escapeHTML(htmlToText(html,{wordwrap:false}))+'</pre>';
}
module.exports={convert,targets,parseDelimited};
