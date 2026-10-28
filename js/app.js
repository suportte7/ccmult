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
// EVENTOS
// ================================================================
function bindEventos() {
  // Login
  document.getElementById('btnLogin').addEventListener('click', fazerLogin);
  document.getElementById('loginPin').addEventListener('keyup', e => {
    if (e.key === 'Enter') fazerLogin();
  });

  // Registro
  document.getElementById('btnShowReg').addEventListener('click', () => showTela('telaRegistro'));
  document.getElementById('btnShowLogin').addEventListener('click', () => showTela('telaLogin'));
  document.getElementById('btnRegistrar').addEventListener('click', fazerRegistro);

  // Reset PIN
  document.getElementById('btnEsqueceuPin').addEventListener('click', () => showTela('telaReset'));
  document.getElementById('btnVoltarLogin').addEventListener('click', () => showTela('telaLogin'));
  document.getElementById('btnEnviarToken').addEventListener('click', enviarToken);
  document.getElementById('btnConfirmarReset').addEventListener('click', confirmarReset);

  // App
  document.getElementById('btnLogout').addEventListener('click', fazerLogout);
  document.getElementById('btnSync').addEventListener('click', sincronizar);
  document.getElementById('btnTema').addEventListener('click', abrirTemas);

  // Dock
  document.querySelectorAll('.dock-btn').forEach(btn => {
    btn.addEventListener('click', () => navegar(btn.dataset.tela));
  });
}

// ================================================================
// AUTH
// ================================================================
async function fazerLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pin   = document.getElementById('loginPin').value.trim();
  if (!email || !pin) return toast('Preencha email e PIN', 'erro');
  if (pin.length !== 4) return toast('PIN deve ter 4 dígitos', 'erro');
  loading(true);
  const r = await api('login', { email, senha: pin });
  loading(false);
  if (!r.ok) return toast(r.error, 'erro');
  Auth.salvar(r.token, r.user);
  showTela('telaApp');
  Dados.carregarLocal();
  navegar('dashboard');
  await Dados.carregar();
  navegar('dashboard');
}

async function fazerRegistro() {
  const nome  = document.getElementById('regNome').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pin   = document.getElementById('regPin').value.trim();
  if (!nome || !email || !pin) return toast('Preencha todos os campos', 'erro');
  if (pin.length !== 4) return toast('PIN deve ter 4 dígitos', 'erro');
  loading(true);
  const r = await api('register', { email, senha: pin, nome });
  loading(false);
  if (!r.ok) return toast(r.error, 'erro');
  toast('Conta criada! Faça login.', 'ok');
  showTela('telaLogin');
}

async function enviarToken() {
  const email = document.getElementById('resetEmail').value.trim();
  if (!email) return toast('Digite seu email', 'erro');
  loading(true);
  const r = await api('solicitarReset', { email });
  loading(false);
  if (!r.ok) return toast(r.error, 'erro');
  toast('Token enviado para seu email!', 'ok');
  document.getElementById('resetStep1').style.display = 'none';
  document.getElementById('resetStep2').style.display = 'block';
}

async function confirmarReset() {
  const email  = document.getElementById('resetEmail').value.trim();
  const token  = document.getElementById('resetToken').value.trim().toUpperCase();
  const novoPin = document.getElementById('resetNovoPin').value.trim();
  if (!token || !novoPin) return toast('Preencha token e novo PIN', 'erro');
  if (novoPin.length !== 4) return toast('PIN deve ter 4 dígitos', 'erro');
  loading(true);
  const r = await api('confirmarReset', { email, token, novoPin });
  loading(false);
  if (!r.ok) return toast(r.error, 'erro');
  toast('PIN redefinido! Faça login.', 'ok');
  showTela('telaLogin');
}

function fazerLogout() {
  Auth.logout();
  Dados.limpar();
  showTela('telaLogin');
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPin').value = '';
}

async function sincronizar() {
  loading(true);
  await Dados.carregar();
  loading(false);
  toast('Dados sincronizados!', 'ok');
  navegar(document.querySelector('.dock-btn.ativo')?.dataset.tela || 'dashboard');
}
