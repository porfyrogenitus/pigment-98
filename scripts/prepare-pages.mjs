import {cp,mkdir,writeFile,rm,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),docs=new URL('docs/',root),dist=new URL('dist/',root);
await mkdir(docs,{recursive:true});
// Remove only generated hashed assets, preserving all scientific documentation.
await rm(new URL('assets/',docs),{recursive:true,force:true});
await cp(new URL('assets/',dist),new URL('assets/',docs),{recursive:true});
await cp(new URL('index.html',dist),new URL('index.html',docs));
await writeFile(new URL('.nojekyll',docs),'');
console.log('Prepared GitHub Pages at '+fileURLToPath(docs));
