const path=require('node:path');
function nativeScript(name,base=__dirname){return path.join(base,'native',name).replace(/([\\/])app\.asar([\\/])/,'$1app.asar.unpacked$2');}
module.exports={nativeScript};
