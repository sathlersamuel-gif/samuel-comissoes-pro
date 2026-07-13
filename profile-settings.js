(function(){
  const NOME_KEY='scp_nome_perfil';
  const FOTO_KEY='scp_foto_perfil';

  function aplicarMarcaTopo(){
    const marca=document.querySelector('.marca');
    if(!marca) return;
    let texto=marca.querySelector('.marca-yamaha-samuel-texto');
    if(!texto){
      texto=document.createElement('strong');
      texto.className='marca-yamaha-samuel-texto';
      texto.textContent='Yamaha Samuel';
      marca.appendChild(texto);
    }else{
      texto.textContent='Yamaha Samuel';
    }
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