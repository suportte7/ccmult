// ============================================
// ui.js — Utilitários de interface
// ============================================
const UI = {

  // --- Loading ---
  loading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
  },

  // --- Toast ---
  toast(msg, tipo = 'info', dur = 3000) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className   = 'toast ativo toast-' + tipo;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => { el.className = 'toast'; }, dur);
  },

  // --- Modal ---
  modal(titulo, bodyHTML, footerHTML = '') {
    document.getElementById('modalTitulo').textContent = titulo;
    document.getElementById('modalBody').innerHTML     = bodyHTML;
    document.getElementById('modalFooter').innerHTML   = footerHTML;
    const m = document.getElementById('modal');
    m.style.display = 'flex';
    m.querySelector('.modal-close').onclick = () => this.fecharModal();
    m.onclick = (e) => { if (e.target === m) this.fecharModal(); };
  },

  fecharModal() {
    document.getElementById('modal').style.display = 'none';
  },

  // --- Confirmar ---
  confirmar(msg, onSim) {
    this.modal('Confirmar', `<p style="color:var(--text2)">${msg}</p>`,
      `<button class="btn-secondary modal-close">Cancelar</button>
       <button class="btn-danger" id="btnConfirmarSim">Confirmar</button>`
    );
    document.getElementById('btnConfirmarSim').onclick = () => { this.fecharModal(); onSim(); };
  },

  // --- Formatar valores ---
  moeda(v) {
    return 'R$ ' + parseFloat(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  data(d) {
    if (!d) return '-';
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('pt-BR');
  },

  mesAno(m) {
    if (!m) return '-';
    const [ano, mes] = m.split('-');
    const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return (nomes[parseInt(mes) - 1] || mes) + '/' + ano;
  },

  // --- Badge de status ---
  badge(status) {
    const map = {
      quitado:   ['badge-success','Quitado'],
      pendente:  ['badge-warning','Pendente'],
      vencido:   ['badge-danger', 'Vencido'],
      cancelado: ['badge-info',   'Cancelado'],
      ativo:     ['badge-success','Ativo'],
      inativo:   ['badge-danger', 'Inativo'],
    };
    const [cls, label] = map[status] || ['badge-info', status];
    return `<span class="card-badge ${cls}">${label}</span>`;
  },

  // --- Cor do cartão ---
  corCartao(cor) {
    return cor && cor.startsWith('#') ? cor : CONFIG.CORES[0];
  },

  // --- Select de cartões ---
  selectCartoes(cartoes, selectedId = '') {
    if (!cartoes || cartoes.length === 0) return '<option value="">Nenhum cartão</option>';
    return cartoes.map(c =>
      `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${c.nome} (**** ${String(c.numero).slice(-4)})</option>`
    ).join('');
  },

  // --- Select de pessoas ---
  selectPessoas(pessoas, cartaoId = '', selectedId = '') {
    const filtradas = cartaoId ? pessoas.filter(p => p.cartaoId === cartaoId) : pessoas;
    if (!filtradas.length) return '<option value="">Nenhuma pessoa</option>';
    return filtradas.map(p =>
      `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${p.nome}</option>`
    ).join('');
  },

  // --- Select de categorias ---
  selectCategorias(selected = '') {
    return CONFIG.CATEGORIAS.map(c =>
      `<option value="${c}" ${c === selected ? 'selected' : ''}>${c}</option>`
    ).join('');
  },
};

// Fechar modal pelo botão
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-close')) UI.fecharModal();
});