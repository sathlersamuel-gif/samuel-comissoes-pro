(function(){
  const NOME_KEY='scp_nome_perfil';
  const FOTO_KEY='scp_foto_perfil';

  function aplicarEstilos(){
    if(document.getElementById('perfilCompactoFix')) return;
    const style=document.createElement('style');
    style.id='perfilCompactoFix';
    style.textContent=`
      .topo{padding:10px 16px!important;min-height:58px!important}
      .marca{display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important}
      .yamaha-emblema{width:34px!important;height:34px!important;max-width:34px!important;object-fit:contain!important;display:block!important}
      .marca-yamaha-samuel-texto{font-size:14px!important;line-height:1!important;color:#ef2638!important;letter-spacing:.2px!important;font-weight:800!important;white-space:nowrap!important}
      .perfil-boas-vindas{display:grid!important;grid-template-columns:54px 1fr auto!important;align-items:center!important;gap:12px!important;margin:8px 0 18px!important}
      .avatar-perfil{position:relative!important;width:52px!important;height:52px!important;min-width:52px!important;border-radius:50%!important;border:1px solid #24558a!important;background:#0d2a4c!important;color:#fff!important;padding:0!important;overflow:hidden!important;display:grid!important;place-items:center!important;box-shadow:none!important}
      .avatar-perfil img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}
      .avatar-perfil>span{font-size:20px!important;font-weight:800!important}
      .avatar-perfil small{position:absolute!important;right:0!important;bottom:0!important;width:18px!important;height:18px!important;border-radius:50%!important;background:#0877ff!important;display:grid!important;place-items:center!important;font-size:9px!important}
      .perfil-textos{min-width:0!important}
      .nome-editavel{display:flex!important;align-items:center!important;gap:6px!important;border:0!important;background:transparent!important;color:#fff!important;padding:0!important;box-shadow:none!important;text-align:left!important;width:auto!important;max-width:100%!important}
      .nome-editavel h1{font-size:27px!important;line-height:1.12!important;color:#fff!important;white-space:normal!important}
      .nome-editavel span{font-size:13px!important;opacity:.75!important}
      .perfil-textos p{color:#9fb0c8!important;margin-top:5px!important;font-size:15px!important}
      .perfil-boas-vindas .data-hoje{font-size:13px!important;padding:8px 10px!important;border-radius:12px!important;white-space:nowrap!important}
      @media(max-width:390px){
        .perfil-boas-vindas{grid-template-columns:48px 1fr!important}
        .perfil-boas-vindas .data-hoje{grid-column:2!important;justify-self:start!important;margin-top:2px!important}
        .avatar-perfil{width:46px!important;height:46px!important;min-width:46px!important}
        .nome-editavel h1{font-size:23px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function aplicarMarcaTopo(){
    const marca=document.querySelector('.marca');
    if(!marca) return;
    let texto=marca.querySelector('.marca-yamaha-samuel-texto');
    if(!texto){
      texto=document.createElement('strong');
      texto.className='marca-yamaha-samuel-texto';
      marca.appendChild(texto);
    }
    texto.textContent='Yamaha Samuel';
  }

  function aplicarPerfil(){
    const nome=(localStorage.getItem(NOME_KEY)||'Usuário').trim()||'Usuário';
    const foto=localStorage.getItem(FOTO_KEY)||'';
    const nomeEl=document.getElementById('nomePerfil');
    const fotoEl=document.getElementById('fotoPerfil');
    const iniciaisEl=document.getElementById('iniciaisPerfil');
    if(nomeEl) nomeEl.textContent=`Olá, ${nome}! 👋`;
    if(fotoEl){
      if(foto){
        fotoEl.src=foto;
        fotoEl.hidden=false;
        if(iniciaisEl) iniciaisEl.hidden=true;
      }else{
        fotoEl.hidden=true;
        if(iniciaisEl){
          iniciaisEl.hidden=false;
          iniciaisEl.textContent=nome.charAt(0).toUpperCase();
        }
      }
    }
  }

  function abrirEditor(){
    const nomeAtual=(localStorage.getItem(NOME_KEY)||'').trim();
    const novoNome=window.prompt('Digite o nome que deve aparecer no painel:',nomeAtual);
    if(novoNome===null) return;
    const nomeLimpo=novoNome.trim();
    if(nomeLimpo) localStorage.setItem(NOME_KEY,nomeLimpo);
    aplicarPerfil();
  }

  function escolherFoto(){
    const input=document.getElementById('inputFotoPerfil');
    if(input) input.click();
  }

  document.addEventListener('DOMContentLoaded',function(){
    aplicarEstilos();
    aplicarMarcaTopo();
    const editar=document.getElementById('editarNomePerfil');
    const avatar=document.getElementById('avatarPerfil');
    const input=document.getElementById('inputFotoPerfil');

    if(editar) editar.addEventListener('click',abrirEditor);
    if(avatar) avatar.addEventListener('click',escolherFoto);
    if(input) input.addEventListener('change',function(event){
      const arquivo=event.target.files&&event.target.files[0];
      if(!arquivo) return;
      if(!arquivo.type.startsWith('image/')){
        alert('Escolha uma imagem válida.');
        return;
      }
      if(arquivo.size>2*1024*1024){
        alert('Escolha uma imagem com até 2 MB.');
        return;
      }
      const leitor=new FileReader();
      leitor.onload=function(){
        localStorage.setItem(FOTO_KEY,String(leitor.result));
        aplicarPerfil();
      };
      leitor.readAsDataURL(arquivo);
    });
    aplicarPerfil();
  });
})();