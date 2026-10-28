// ============================================
// api.js — Comunicação com Google Apps Script
// ============================================
const API = {
  token: localStorage.getItem('cc_token') || null,

  async call(action, data = {}) {
    const body = { action, ...data };
    if (this.token) body.token = this.token;
    try {
      const res  = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.error === 'Sessão expirada') { Auth.logout(); return json; }
      return json;
    } catch (err) {
      console.error('API:', err);
      return { ok: false, error: 'Sem conexão. Verifique sua internet.' };
    }
  },

  setToken(t)  { this.token = t; localStorage.setItem('cc_token', t); },
  clearToken() { this.token = null; localStorage.removeItem('cc_token'); },

  // Auth
  login(email, senha)        { return this.call('login',    { email, senha }); },
  register(email, senha, nome){ return this.call('register', { email, senha, nome }); },

  // Dados gerais
  getAllMyData() { return this.call('getAllMyData'); },

  // Cartões
  getCartoes()     { return this.call('getCartoes'); },
  addCartao(item)  { return this.call('addCartao',  { item }); },
  editCartao(item) { return this.call('editCartao', { item }); },
  deleteCartao(id) { return this.call('deleteCartao',{ id }); },

  // Pessoas
  getPessoas()     { return this.call('getPessoas'); },
  addPessoa(item)  { return this.call('addPessoa',  { item }); },
  editPessoa(item) { return this.call('editPessoa', { item }); },
  deletePessoa(id) { return this.call('deletePessoa',{ id }); },

  // Gastos
  getGastos()     { return this.call('getGastos'); },
  addGasto(item)  { return this.call('addGasto',  { item }); },
  editGasto(item) { return this.call('editGasto', { item }); },
  deleteGasto(id) { return this.call('deleteGasto',{ id }); },

  // Acordos
  getAcordos()         { return this.call('getAcordos'); },
  addAcordo(item)      { return this.call('addAcordo',       { item }); },
  editAcordo(item)     { return this.call('editAcordo',      { item }); },
  deleteAcordo(id)     { return this.call('deleteAcordo',    { id }); },
  pagarAcordo(pgto)    { return this.call('pagarAcordo',     { pagamento: pgto }); },
  getPagamentos()      { return this.call('getPagamentos'); },
  processarJuros()     { return this.call('processarJuros'); },

  // Backup
  backupMeu()    { return this.call('backupMeu'); },
  backupGeral()  { return this.call('backupGeral'); },
  getBackupLog() { return this.call('getBackupLog'); },

  // Admin
  getUsuarios()               { return this.call('getUsuarios'); },
  criarUsuario(novo)          { return this.call('criarUsuario',  { novo }); },
  toggleUsuario(email, ativo) { return this.call('toggleUsuario', { email, ativo }); },
  deletarUsuario(email)       { return this.call('deletarUsuario',{ email }); },
};