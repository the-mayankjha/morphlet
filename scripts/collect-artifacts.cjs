const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
(async()=>{
 const output='release-artifacts';await fs.rm(output,{recursive:true,force:true});await fs.mkdir(output);
 const names=(await fs.readdir('dist')).filter(name=>/\.(dmg|zip|exe|AppImage|deb)$/.test(name));
 if(!names.length)throw Error('No installers were produced');
 for(const name of names){const file=await fs.readFile(path.join('dist',name));await fs.copyFile(path.join('dist',name),path.join(output,name));await fs.writeFile(path.join(output,name+'.sha256'),crypto.createHash('sha256').update(file).digest('hex')+'  '+name+'\n');}
 console.log('Collected '+names.length+' installers with SHA-256 checksums.');
})().catch(error=>{console.error(error);process.exitCode=1;});
