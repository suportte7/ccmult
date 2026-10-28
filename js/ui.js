// ================================================================
// TELAS
// ================================================================
function showTela(id) {
  document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
  document.getElementById(id).classList.add('ativa');
}

// ================================================================
// LOADING
// ================================================================
function loading(s) {
  document.getElementById('loading').classList.toggle('ativo', s);
}

// ================================================================
// TOAST
// ================================================================
function toast(msg, tipo = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ativo ' + tipo;
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('ativo'), 3000);
}

// ================================================================
// MODAL
// ================================================================
function abrirModal(titulo, body, acoes = '') {
  document.getElementById('modalTitulo').textContent = titulo;
  document.getElementById('modalBody').innerHTML     = body;
  document.getElementById('modalAcoes').innerHTML    = acoes;
  document.getElementById('modal').classList.add('ativo');
}

function fecharModal() {
  document.getElementById('modal').classList.remove('ativo');
}

// ================================================================
// NAVEGAÇÃO
// ================================================================
function navegar(tela) {
  document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('ativo'));
  const btn = document.querySelector(`.dock-btn[data-tela="${tela}"]`);
  if (btn) btn.classList.add('ativo');
  const el = document.getElementById('appContent');
  const mapa = {
    dashboard: () => renderDashboard(el),
    cartoes:   () => renderCartoes(el),
    pessoas:   () => renderPessoas(el),
    gastos:    () => renderGastos(el),
    acordos:   () => renderAcordos(el),
    mais:      () => renderMais(el),
  };
  if (mapa[tela]) mapa[tela]();
}

// ================================================================
// TEMA
// ================================================================
const temas = [
  { id: 'midnight', nome: 'Midnight', cor: '#c084fc' },
  { id: 'ambar',    nome: 'Âmbar',    cor: '#f59e0b' },
  { id: 'dracula',  nome: 'Drácula',  cor: '#50fa7b' },
  { id: 'ocean',    nome: 'Ocean',    cor: '#0284c7' },
  { id: 'nubank',   nome: 'Nubank',   cor: '#820ad1' },
  { id: 'floresta', nome: 'Floresta', cor: '#34d399' },
  { id: 'ameixa',   nome: 'Ameixa',   cor: '#f472b6' },
  { id: 'cobre',    nome: 'Cobre',    cor: '#fb923c' },
  { id: 'neon',     nome: 'Neon',     cor: '#22d3ee' },
  { id: 'lagoa',    nome: 'Lagoa',    cor: '#2dd4bf' },
  { id: 'menta',    nome: 'Menta',    cor: '#059669' },
  { id: 'algodao',  nome: 'Algodão',  cor: '#db2777' },
  { id: 'areia',    nome: 'Areia',    cor: '#b45309' },
  { id: 'lavanda',  nome: 'Lavanda',  cor: '#6d28d9' },
  { id: 'papel',    nome: 'Papel',    cor: '#1d4ed8' },
];

function abrirTemas() {
  const atual = document.documentElement.getAttribute('data-theme') || 'midnight';
  const grid  = temas.map(t => `
    <div class="tema-op ${t.id === atual ? 'sel' : ''}" onclick="aplicarTema('${t.id}')">
      <div class="tema-dot" style="background:${t.cor}"></div>
      ${t.nome}
    </div>
  `).join('');
  abrirModal('Escolher Tema', `<div class="tema-grid">${grid}</div>`);
}

function aplicarTema(id) {
  document.documentElement.setAttribute('data-theme', id);
  localStorage.setItem('ccm_tema', id);
  fecharModal();
}

function carregarTema() {
  const t = localStorage.getItem('ccm_tema') || 'midnight';
  document.documentElement.setAttribute('data-theme', t);
}

// ================================================================
// HELPERS
// ================================================================
function fmt(v) {
  return 'R$ ' + parseFloat(v || 0).toFixed(2).replace('.', ',');
}

function fmtData(d) {
  if (!d) return '-';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('pt-BR');
}

function mesAtual() {
  return new Date().toISOString().substring(0, 7);
}

function nomeMes(mes) {
  if (!mes) return '-';
  const [ano, m] = mes.split('-');
  const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return nomes[parseInt(m) - 1] + '/' + ano;
}

function gerarCores() {
  return ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16'];
}
