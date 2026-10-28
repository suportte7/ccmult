// ============================================
// auth.js — Login, registro, sessão
// ============================================
const Auth = {
  user: null,

  init() {
    const token = API.token;
    const user  = localStorage.getItem('cc_user');
    if (token && user) {
      try {
        this.user = JSON.parse(user);
        APP.iniciar(this.user);
        return;
      } catch (e) { this.logout(); }
    }
    mostrarTela('telaLogin');
  },

  async fazerLogin(email, senha) {
    UI.loading(true);
    const res = await API.login(email, senha);
    UI.loading(false);
    if (!res.ok) { UI.toast(res.error, 'danger'); return; }
    API.setToken(res.token);
    localStorage.setItem('cc_user', JSON.stringify(res.user));
    this.user = res.user;
    APP.iniciar(res.user);
  },

  async fazerRegistro(email, senha, nome) {
    UI.loading(true);
    const res = await API.register(email, senha, nome);
    UI.loading(false);
    if (!res.ok) { UI.toast(res.error, 'danger'); return; }
    API.setToken(res.token);
    localStorage.setItem('cc_user', JSON.stringify(res.user));
    this.user = res.user;
    APP.iniciar(res.user);
  },

  logout() {
    API.clearToken();
    localStorage.removeItem('cc_user');
    this.user = null;
    mostrarTela('telaLogin');
    UI.toast('Sessão encerrada', 'info');
  },
};

// --- Eventos de formulário ---
document.getElementById('formLogin').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value;
  await Auth.fazerLogin(email, senha);
});

document.getElementById('formRegistro').addEventListener('submit', async e => {
  e.preventDefault();
  const nome  = document.getElementById('regNome').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const senha = document.getElementById('regSenha').value;
  await Auth.fazerRegistro(email, senha, nome);
});

document.getElementById('btnShowRegister').addEventListener('click', e => {
  e.preventDefault(); mostrarTela('telaRegistro');
});
document.getElementById('btnShowLogin').addEventListener('click', e => {
  e.preventDefault(); mostrarTela('telaLogin');
});
document.getElementById('btnLogout').addEventListener('click', () => {
  UI.confirmar('Deseja sair?', () => Auth.logout());
});

function mostrarTela(id) {
  document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
  document.getElementById(id).classList.add('ativa');
}