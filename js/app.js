// ============================================
// app.js — Orquestrador principal
// ============================================
const APP = {
  dados: { cartoes: [], pessoas: [], gastos: [], acordos: [], pagamentos: [] },
  user:  null,
  telaAtual: 'dashboard',

  async iniciar(user) {
    this.user = user;
    mostrarTela('telaApp');
    document.getElementById('headerUserNome').textContent = user.nome;
    if (user.isAdmin) {
      document.querySelector('.nav-admin-btn').style.display = 'flex';
    }
    this.bindNav();
    await this.carregarDados();
    this.renderTela('dashboard');
  },

  async carregarDados() {
    UI.loading(true);
    const res = await API.getAllMyData();
    UI.loading(false);
    if (!res.ok) { UI.toast('Erro ao carregar dados: ' + res.error, 'danger'); return; }
    this.dados = res;
    // Processar juros automaticamente ao carregar
    API.processarJuros();
  },

  bindNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('ativo'));
        btn.classList.add('ativo');
        this.renderTela(btn.dataset.tela);
      });
    });
  },

  renderTela(tela) {
    this.telaAtual = tela;
    document.getElementById('headerTitulo').textContent = {
      dashboard: 'ControlCard',
      cartoes:   'Meus Cartões',
      pessoas:   'Pessoas',
      gastos:    'Gastos',
      acordos:   'Acordos',
      backup:    'Backup',
      admin:     'Administração',
    }[tela] || 'ControlCard';

    const content = document.getElementById('appContent');
    switch (tela) {
      case 'dashboard': content.innerHTML = DASHBOARD.render(this.dados); break;
      case 'cartoes':   CARTOES.render(this.dados.cartoes); break;
      case 'pessoas':   PESSOAS.render(this.dados.pessoas, this.dados.cartoes); break;
      case 'gastos':    GASTOS.render(this.dados.gastos, this.dados.pessoas, this.dados.cartoes); break;
      case 'acordos':   ACORDOS.render(this.dados.acordos, this.dados.pessoas, this.dados.cartoes, this.dados.pagamentos); break;
      case 'backup':    BACKUP.render(); break;
      case 'admin':
        if (this.user.isAdmin) ADMIN.render();
        else UI.toast('Sem permissão', 'danger');
        break;
    }
  },

  async reload() {
    await this.carregarDados();
    this.renderTela(this.telaAtual);
  },
};

// --- DASHBOARD ---
const DASHBOARD = {
  render(dados) {
    const totalCartoes  = dados.cartoes.length;
    const totalPessoas  = dados.pessoas.length;
    const totalGastos   = dados.gastos.reduce((s, g) => s + parseFloat(g.valor || 0), 0);
    const acordosAbertos= dados.acordos.filter(a => a.status !== 'quitado' && a.status !== 'cancelado');
    const totalAcordos  = acordosAbertos.reduce((s, a) => s + parseFloat(a.valorAtual || 0), 0);

    return `
      <div class="stats-grid">
        <div class="stat-card">
          <i class="fas fa-credit-card"></i>
          <div class="stat-valor">${totalCartoes}</div>
          <div class="stat-label">Cartões</div>
        </div>
        <div class="stat-card">
          <i class="fas fa-users"></i>
          <div class="stat-valor">${totalPessoas}</div>
          <div class="stat-label">Pessoas</div>
        </div>
        <div class="stat-card">
          <i class="fas fa-receipt"></i>
          <div class="stat-valor">${UI.moeda(totalGastos)}</div>
          <div class="stat-label">Total Gastos</div>
        </div>
        <div class="stat-card">
          <i class="fas fa-handshake"></i>
          <div class="stat-valor">${UI.moeda(totalAcordos)}</div>
          <div class="stat-label">Acordos em Aberto</div>
        </div>
      </div>

      <div class="section-header">
        <h2>Acordos Vencidos</h2>
      </div>
      ${this.acordosVencidos(dados)}

      <div class="section-header" style="margin-top:20px">
        <h2>Últimos Gastos</h2>
      </div>
      ${this.ultimosGastos(dados)}
    `;
  },

  acordosVencidos(dados) {
    const vencidos = dados.acordos.filter(a => a.status === 'vencido');
    if (!vencidos.length) return `<p style="color:var(--text3);font-size:14px">Nenhum acordo vencido ✅</p>`;
    return vencidos.map(a => {
      const p = dados.pessoas.find(x => x.id === a.pessoaId);
      return `<div class="card">
        <div class="card-header">
          <h3>${a.descricao}</h3>${UI.badge('vencido')}
        </div>
        <div class="card-body">
          <p><strong>${p ? p.nome : '-'}</strong> · Saldo: <span class="valor valor-neg">${UI.moeda(a.valorAtual)}</span></p>
          <p>Venceu em ${UI.data(a.dataVenc)}</p>
        </div>
      </div>`;
    }).join('');
  },

  ultimosGastos(dados) {
    const ultimos = [...dados.gastos].slice(-5).reverse();
    if (!ultimos.length) return `<p style="color:var(--text3);font-size:14px">Nenhum gasto registrado</p>`;
    return ultimos.map(g => {
      const p = dados.pessoas.find(x => x.id === g.pessoaId);
      return `<div class="card">
        <div class="card-header">
          <h3>${g.descricao}</h3>
          <span class="valor valor-neg">${UI.moeda(g.valor)}</span>
        </div>
        <div class="card-body">
          <p>${p ? p.nome : '-'} · ${UI.data(g.data)}</p>
        </div>
      </div>`;
    }).join('');
  },
};

// Inicializar ao carregar página
document.addEventListener('DOMContentLoaded', () => Auth.init());