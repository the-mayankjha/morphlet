const fs=require('node:fs/promises'),path=require('node:path');
function launchFiles(argv){const index=argv.indexOf('--morphlet-files');return index<0?[]:[...new Set(argv.slice(index+1).filter(v=>typeof v==='string'&&path.isAbsolute(v)&&!v.includes('\0')))].slice(0,100);}
function scriptSource(executable){return `#!/usr/bin/env python3
# Morphlet action for GNOME Files. No shell evaluation of selected filenames.
import os, subprocess
from urllib.parse import urlsplit, unquote
exe = ${JSON.stringify(executable)}
files = []
for value in os.environ.get('NAUTILUS_SCRIPT_SELECTED_URIS', '').splitlines():
    uri = urlsplit(value)
    if uri.scheme == 'file' and uri.netloc in ('', 'localhost'):
        file = unquote(uri.path)
        if os.path.isfile(file):
            files.append(file)
if files:
    subprocess.Popen([exe, '--morphlet-files', *files[:100]], start_new_session=True)
`;}
async function installNautilusAction({home,executable}){const folder=path.join(home,'.local/share/nautilus/scripts');await fs.mkdir(folder,{recursive:true});const destination=path.join(folder,'Morphlet');await fs.writeFile(destination,scriptSource(executable),{mode:0o700});await fs.chmod(destination,0o700);return {path:destination};}
module.exports={launchFiles,scriptSource,installNautilusAction};
