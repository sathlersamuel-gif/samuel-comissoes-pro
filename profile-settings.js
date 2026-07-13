(function(){
  const NOME_KEY='scp_nome_perfil';
  const FOTO_KEY='scp_foto_perfil';

  function aplicarEstilos(){
    if(document.getElementById('perfilCompactoFix')) return;
    const style=document.createElement('style');
    style.id='perfilCompactoFix';
    style.textContent=`
      .topo{padding:8px 14px!important;min-height:48px!important}
      .marca{display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;min-height:32px!important}
      .yamaha-emblema{width:30px!important;height:30px!important;max-width:30px!important;max-height:30px!important;object-fit:contain!important;display:block!important}
      .marca-yamaha-samuel-texto{font-size:14px!important;line-height:1!important;color:#ef2638!important;letter-spacing:.2px!important;font-weight:800!important;white-space:nowrap!important}
      .perfil-boas-vindas{display:grid!important;grid-template-columns:50px minmax(0,1fr) auto!important;align-items:center!important;gap:11px!important;margin:5px 0 18px!important}
      .avatar-perfil{position:relative!important;width:50px!important;height:50px!important;min-width:50px!important;border-radius:50%!important;border:1px solid #28588c!important;background:linear-gradient(145deg,#14355d,#0a1f39)!important;color:#fff!important;display:grid!important;place-items:center!important;overflow:hidden!important;padding:0!important;box-shadow:0 8px 18px rgba(0,0,0,.22)!important;cursor:pointer!important;-webkit-tap-highlight-color:transparent!important}
      .avatar-perfil img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}
      .avatar-perfil>span{font-size:20px!important;font-weight:800!important}
      .avatar-perfil small{position:absolute!important;right:0!important;bottom:0!important;width:18px!important;height:18px!important;border-radius:50%!important;background:#0877ff!important;display:grid!important;place-items:center!important;font-size:9px!important;border:2px solid #061326!important}
      .perfil-textos{min-width:0!important}
      .nome-editavel{display:flex!important;align-items:center!important;gap:5px!important;width:auto!important;max-width:100%!important;border:0!important;background:transparent!important;color:#fff!important;padding:0!important;margin:0!important;box-shadow:none!important;text-align:left!important}
      .nome-editavel h1{font-size:25px!important;line-height:1.1!important;color:#fff!important;background:transparent!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;margin:0!important;padding:0!important}
      .nome-editavel>span{font-size:13px!important;opacity:.72!important;flex:0 0 auto!important}
      .perfil-textos p{color:#9fb0c8!important;margin-top:6px!important;font-size:14px!important}
      .perfil-boas-vindas .data-hoje{background:rgba(8,119,255,.12)!important;border:1px solid rgba(8,119,255,.42)!important;color:#cfe3ff!important;border-radius:13px!important;padding:8px 10px!important;font-weight:700!important;font-size:13px!important;white-space:nowrap!important}
      @media(max-width:430px){
        .perfil-boas-vindas{grid-template-columns:46px minmax(0,1fr)!important;gap:10px!important}
        .avatar-perfil{width:46px!important;height:46px!important;min-width:46px!important}
        .nome-editavel h1{font-size:23px!important}
        .perfil-textos p{font-size:13px!important}
        .perfil-boas-vindas .data-hoje{grid-column:2!important;justify-self:start!important;margin-top:1px!important;padding:7px 9px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function aplicarMarcaTopo(){
    const marca=document.querySelector('.marca');
    if(!marca) return;
    const emblema=marca.querySelector('.yamaha-emblema');
    if(emblema) emblema.src='yamaha-emblem.svg?v=3';
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

  document.addEventListener('DOMContentLoaded',function(){
    aplicarEstilos();
    aplicarMarcaTopo();
    const editar=document.getElementById('editarNomePerfil');
    const input=document.getElementById('inputFotoPerfil');
    if(editar) editar.addEventListener('click',abrirEditor);
    if(input) input.addEventListener('change',function(event){
      const arquivo=event.target.files&&event.target.files[0];
      if(!arquivo) return;
      if(!arquivo.type.startsWith('image/')){alert('Escolha uma imagem válida.');return;}
      if(arquivo.size>5*1024*1024){alert('Escolha uma imagem com até 5 MB.');event.target.value='';return;}
      const leitor=new FileReader();
      leitor.onload=function(){
        try{
          localStorage.setItem(FOTO_KEY,String(leitor.result));
          aplicarPerfil();
        }catch(erro){
          alert('Não foi possível salvar essa foto. Escolha uma imagem menor.');
        }
        event.target.value='';
      };
      leitor.onerror=function(){alert('Não foi possível ler a imagem selecionada.');};
      leitor.readAsDataURL(arquivo);
    });
    aplicarPerfil();
  });
})();