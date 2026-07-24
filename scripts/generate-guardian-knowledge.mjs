import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();
const ignore=new Set(['.git','node_modules']);
const textExt=new Set(['.js','.mjs','.cjs','.html','.css','.json','.md','.yml','.yaml','.rules','.txt']);
const files=[];

function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(ignore.has(entry.name))continue;
    const abs=path.join(dir,entry.name);
    const rel=path.relative(root,abs).replaceAll('\\','/');
    if(entry.isDirectory())walk(abs);else files.push({abs,rel});
  }
}

function uniq(arr){return [...new Set(arr)].sort();}
function matches(text,re){const out=[];for(const m of text.matchAll(re))out.push(m[1]);return out;}

walk(root);
const manifest={
  app:'Samuel Comissões PRO',
  generatedAt:new Date().toISOString(),
  commit:process.env.GITHUB_SHA||null,
  files:[],symbols:[],domIds:[],storageKeys:[],firestoreCollections:[],assets:[]
};

for(const file of files){
  const stat=fs.statSync(file.abs);
  const ext=path.extname(file.rel).toLowerCase();
  const buffer=fs.readFileSync(file.abs);
  const item={path:file.rel,size:stat.size,sha256:crypto.createHash('sha256').update(buffer).digest('hex'),type:ext||'file'};
  manifest.files.push(item);
  if(!textExt.has(ext))continue;
  const text=buffer.toString('utf8');
  if(['.js','.mjs','.cjs'].includes(ext)){
    manifest.symbols.push(...matches(text,/function\s+([A-Za-z_$][\w$]*)\s*\(/g).map(name=>({name,file:file.rel,kind:'function'})));
    manifest.symbols.push(...matches(text,/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g).map(name=>({name,file:file.rel,kind:'function'})));
    manifest.symbols.push(...matches(text,/window\.([A-Za-z_$][\w$]*)\s*=/g).map(name=>({name,file:file.rel,kind:'window-export'})));
    manifest.storageKeys.push(...matches(text,/(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*['"]([^'"]+)['"]/g));
    manifest.firestoreCollections.push(...matches(text,/\.collection\(\s*['"]([^'"]+)['"]\s*\)/g));
  }
  if(['.html','.js','.mjs','.cjs'].includes(ext)){
    manifest.domIds.push(...matches(text,/\bid=["']([^"']+)["']/g));
    manifest.domIds.push(...matches(text,/getElementById\(\s*['"]([^'"]+)['"]\s*\)/g));
  }
  if(['.html','.js','.mjs','.cjs','.css'].includes(ext)){
    manifest.assets.push(...matches(text,/["']([^"']+\.(?:js|css|json|svg|png|jpg|jpeg|webp|html)(?:\?[^"']*)?)["']/gi));
  }
}

manifest.files.sort((a,b)=>a.path.localeCompare(b.path));
manifest.symbols=manifest.symbols.filter((v,i,a)=>a.findIndex(x=>x.name===v.name&&x.file===v.file&&x.kind===v.kind)===i).sort((a,b)=>a.name.localeCompare(b.name));
manifest.domIds=uniq(manifest.domIds);
manifest.storageKeys=uniq(manifest.storageKeys);
manifest.firestoreCollections=uniq(manifest.firestoreCollections);
manifest.assets=uniq(manifest.assets);
manifest.summary={files:manifest.files.length,symbols:manifest.symbols.length,domIds:manifest.domIds.length,storageKeys:manifest.storageKeys.length,firestoreCollections:manifest.firestoreCollections.length,assets:manifest.assets.length};

fs.writeFileSync(path.join(root,'guardian-app-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Mapa da IA Guardiã gerado:',manifest.summary);
