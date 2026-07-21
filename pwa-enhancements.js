(function(){
'use strict';
const HOTFIX='2026.07.21.14';
function carregar(src,id){return new Promise((ok,erro)=>{if(document.getElementById(id))return ok();const s=document.createElement('script');s.id=id;s.src=src;s.async=false;s.onload=ok;s.onerror=()=>erro(new Error('Falha ao carregar '+src));document.head.appendChild(s)})}
carregar('tipo-numeros-mobile.js?v=3','scpTipoNumerosLoader').catch(console.error);
carregar('ai-performance-accelerator.js?v=1','scpPerformanceLoader').catch(console.error);
carregar('edit-sale-definitive-fix.js?v=4','scpEditSaleLoader').catch(console.error);
carregar('user-management-unified.js?v=1','scpUserManagementUnified').catch(console.error);
async function limpar(){const chave='scp-cache-'+HOTFIX;if(localStorage.getItem(chave))return false;try{const nomes=await caches.keys();await Promise.all(nomes.filter(n=>n.startsWith('samuel-comissoes-pro-')).map(n=>caches.delete(n)));localStorage.setItem(chave,'1');return true}catch(e){return false}}
if('serviceWorker'in navigator)window.addEventListener('load',async()=>{try{const limpou=await limpar();const r=await navigator.serviceWorker.register('./sw.js?v=83',{updateViaCache:'none'});await r.update().catch(()=>{});if(r.waiting)r.waiting.postMessage({type:'ACTIVATE_TESTED_VERSION'});navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!sessionStorage.getItem('scpReloadV24')){sessionStorage.setItem('scpReloadV24','1');location.reload()}});if(limpou&&!sessionStorage.getItem('scpHotfixV24')){sessionStorage.setItem('scpHotfixV24','1');setTimeout(()=>location.reload(),300)}}catch(e){console.error('Falha ao atualizar o app:',e)}});
window.__SCP_PWA_HOTFIX__=HOTFIX;
})();
