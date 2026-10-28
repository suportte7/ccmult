// ================================================================
// INICIALIZAÇÃO
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  carregarTema();
  iniciarApp();
});

async function iniciarApp() {
  const logado = Auth.init();
  if (logado) {
    showTela('telaApp');
    Dados.carregarLocal();
    navegar('dashboard');
    await Dados.carregar();
    navegar('dashboard');
  } else {
    showTela('telaLogin');
  }
  bindEventos();
}

// ================================================================
// EVENTOS GLOBAIS
// ================================================================
function bindEventos() {
  // LOGIN
  document.getElementById('btnLogin').addEventListener('click', fazerLogin);
  document.getElementById('loginEmail').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('loginPin').focus();
  });
  document.getElementById('loginPin').addEventListener('keydown', e => {
    if (e.key === 'Enter') fazerLogin();
  });

  // REGISTRO
  document.getElementById('btnRegistrar').addEventListener('click', fazerRegistro);
  document.getElementById('btnShowReg').addEventListener('click', () => showTela('telaRegistro'));
  document.getElementById('btnShowLogin').addEventListener('click', () => showTela('telaLogin'));

  // RESET PIN
  document.getElementById('btnEsqueceuPin').addEventListener('click', () => showTela('telaReset'));
  document.getElementById('btnVoltarLogin').addEventListener('click', () => showTela('telaLogin'));
  document.getElementById('btnEnviarToken').addEventListener('click', enviarTokenReset);
  document.getElementById('btnConfirmarReset').addEventListener('click', confirmarReset);

  // HEADER
  document.getElementById('btnSync').addEventListener('click', async () => {
    toast('Sincronizando...');
    await Dados.carregar();
    const ativa = document.querySelector('.dock-btn.ativo');
    if (ativa) navegar(ativa.dataset.tela);
    toast('Dados atualizados!', 'ok');
  });
  document.getElementById('btnTema').addEventListener('click', abrirTemas);
  document.getElementById('btnLogout').addEventListener('click', fazerLogout);

  // DOCK
  document.querySelectorAll('.dock-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tela = btn.dataset.tela;
      const fab  = document.getElementById('fab');
      if (fab) fab.style.display = '';
      navegar(tela);
    });
  });
}

// ================================================================
// LOGIN
// ================================================================
async function fazerLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pin   = document.getElementById('loginPin').value.trim();
  if (!email)      { toast('Informe o email', 'erro'); return; }
  if (pin.length < 4) { toast('PIN deve ter 4 dígitos', 'erro'); return; }
  loading(true);
  const r = await api('login', { email, senha: pin });
  loading(false);
  if (r.ok) {
    Auth.salvar(r.token, r.user);
    showTela('telaApp');
    await Dados.carregar();
    navegar('dashboard');
  } else {
    toast(r.error, 'erro');
  }
}

// ================================================================
// REGISTRO
// ================================================================
async function fazerRegistro() {
  const nome  = document.getElementById('regNome').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pin   = document.getElementById('regPin').value.trim();
  if (!nome)         { toast('Informe o nome', 'erro'); return; }
  if (!email)        { toast('Informe o email', 'erro'); return; }
  if (pin.length < 4){ toast('PIN deve ter 4 dígitos', 'erro'); return; }
  loading(true);
  const r = await api('register', { email, senha: pin, nome });
  loading(false);
  if (r.ok) {
    toast('Conta criada! Faça login.', 'ok');
    document.getElementById('loginEmail').value = email;
    showTela('telaLogin');
  } else {
    toast(r.error, 'erro');
  }
}

// ================================================================
// RESET PIN
// ================================================================
async function enviarTokenReset() {
  const email = document.getElementById('resetEmail').value.trim();
  if (!email) { toast('Informe o email', 'erro'); return; }
  loading(true);
  const r = await api('solicitarReset', { email });
  loading(false);
  if (r.ok) {
    document.getElementById('resetStep1').style.display = 'none';
    document.getElementById('resetStep2').style.display = 'block';
    toast('Token enviado para seu email!', 'ok');
  } else {
    toast(r.error, 'erro');
  }
}

async function confirmarReset() {
  const email  = document.getElementById('resetEmail').value.trim();
  const token  = document.getElementById('resetToken').value.trim().toUpperCase();
  const novoPin = document.getElementById('resetNovoPin').value.trim();
  if (!token)           { toast('Informe o token', 'erro'); return; }
  if (novoPin.length < 4) { toast('PIN deve ter 4 dígitos', 'erro'); return; }
  loading(true);
  const r = await api('confirmarReset', { email, token, novoPin });
  loading(false);
  if (r.ok) {
    toast('PIN redefinido com sucesso!', 'ok');
    document.getElementById('resetStep1').style.display = 'block';
    document.getElementById('resetStep2').style.display = 'none';
    showTela('telaLogin');
  } else {
    toast(r.error, 'erro');
  }
}

// ================================================================
// NAVEGAÇÃO ADMIN
// ================================================================
const _navegar = navegar;
navegar = function(tela) {
  if (tela === 'admin') {
    if (!Auth.isAdmin()) { toast('Acesso negado', 'erro'); return; }
    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('ativo'));
    renderAdmin(document.getElementById('appContent'));
    return;
  }
  _navegar(tela);
};
