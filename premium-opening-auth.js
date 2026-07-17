(function () {
  const chart = '<svg class="cv-chart-logo" viewBox="0 0 140 110" aria-hidden="true"><defs><linearGradient id="cvGradient" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#0877ff"/><stop offset="1" stop-color="#26e2ff"/></linearGradient></defs><g class="cv-chart-bars" fill="url(#cvGradient)"><rect x="17" y="69" width="19" height="25" rx="3"/><rect x="45" y="55" width="19" height="39" rx="3"/><rect x="73" y="39" width="19" height="55" rx="3"/><rect x="101" y="22" width="19" height="72" rx="3"/></g><path class="cv-chart-arrow" d="M14 66 L46 43 L70 57 L111 15" fill="none" stroke="#33ddff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M101 14 L121 11 L116 31" fill="none" stroke="#33ddff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function addSplash() {
    const existing = document.getElementById('cvSplash');
    if (existing) {
      document.body.classList.add('cv-opening-mounted');
      return;
    }
    const splash = document.createElement('div');
    splash.id = 'cvSplash';
    splash.innerHTML = '<div class="cv-splash-content"><div class="cv-logo-wrap"><div class="cv-logo-ring"></div>' + chart + '</div><h1 class="cv-splash-title">Controle de <span>Vendas</span></h1><p class="cv-splash-sub">Gerencie • acompanhe • evolua</p><div class="cv-loading"><span></span></div><div class="cv-loading-text">Preparando seu painel...</div></div>';
    document.body.appendChild(splash);
    document.body.classList.add('cv-opening-mounted');
    window.setTimeout(function () {
      splash.classList.add('cv-hide');
      window.setTimeout(function () {
        splash.remove();
        document.body.classList.add('cv-opening-complete');
      }, 650);
    }, 2800);
  }

  function styleLogin() {
    const overlay = document.getElementById('firebaseAuthOverlay');
    const card = document.getElementById('firebaseAuthCard');
    if (!overlay || !card || overlay.getAttribute('data-cv-premium') === '1') return false;
    overlay.setAttribute('data-cv-premium', '1');
    const shell = document.createElement('div');
    shell.className = 'cv-auth-shell';
    const brand = document.createElement('div');
    brand.className = 'cv-auth-brand';
    brand.innerHTML = chart.replace('cv-chart-logo', 'cv-auth-logo') + '<h1>Controle de <span>Vendas</span></h1><p class="cv-auth-tagline">Gerencie • acompanhe • evolua</p>';
    overlay.insertBefore(shell, card);
    shell.appendChild(brand);
    shell.appendChild(card);
    const title = card.querySelector('h2');
    if (title) title.textContent = 'Bem-vindo!';
    const note = document.createElement('div');
    note.className = 'cv-approval-note';
    note.textContent = 'Seu acesso será liberado após a aprovação.';
    card.appendChild(note);
    return true;
  }

  function start() {
    addSplash();
    if (styleLogin()) return;
    const timer = window.setInterval(function () {
      if (styleLogin()) window.clearInterval(timer);
    }, 100);
    window.setTimeout(function () { window.clearInterval(timer); }, 10000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}());