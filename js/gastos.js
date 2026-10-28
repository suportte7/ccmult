// ============================================
// gastos.js
// ============================================
const GASTOS = {
  render(gastos, pessoas, cartoes) {
    const content = document.getElementById('appContent');
    content.innerHTML = `
      <div class="section-header">
        <h2>Gastos</h2>
        <button class="btn-primary btn-small" id="btnAddGasto">
          <i class="fas fa-plus"></i> Novo
        </button>
      </div>
      <div class="filtros" id="filtrosGasto">
        <button class="filtro-btn ativo" data-mes="">Todos</button>
        ${this.mesesDisponiveis(gastos).map(m =>
          `<button class="filtro-btn" data-mes="${m}">${UI.mesAno(m)}</button>`
        ).join('')}
      </div>
      <div id="listaGastos"></div>
    `;
    document.getElementById('btnAddGasto').onclick = () => this.form(null, pessoas, cartoes);
    document.querySelectorAll('.filtro-btn').forEach(b => {
      b.onclick = () => {
        document.querySelectorAll('.filtro-btn').forEach(x => x.classList.remove('ativo'));
        b.classList.add('ativo');
        const mes = b.dataset.mes;
        const filtrados = mes ? gastos.filter(g => (g.mesRef || '').startsWith(mes)) : gastos;
        this.renderLista(filtrados, pessoas, cartoes);
      };
    });
    this.renderLista(gastos, pessoas, cartoes);
  },

  mesesDisponiveis(gastos) {
    const meses = [...new Set(gastos.map(g => (g.mesRef || '').substring(0, 7)).filter(Boolean))];
    return meses.sort().reverse();
  },

  renderLista(gastos, pessoas, cartoes) {
    const lista = document.getElementById('listaGastos');
    if (!gastos.length) {
      lista.innerHTML = `<div class="section-empty"><i class="fas fa-receipt"></i><p>Nenhum gasto</p></div>`;
      return;
    }
    const sorted = [...gastos].sort((a, b) => new Date(b.data) - new Date(a.data));
    lista.innerHTML = sorted.map(g => {
      const p = pessoas.find(x => x.id === g.pessoaId);
      const c = cartoes.find(x => x.id === g.cartaoId);
      const parcelas = parseInt(g.totalParcelas) > 1 ? ` (${g.parcelaAtual}/${g.totalParcelas})` : '';
      return `<div class="card">
        <div class="card-header">
          <h3>${g.descricao}${parcelas}</h3>
          <span class="valor valor-neg">${UI.moeda(g.valor)}</span>
        </div>
        <div class="card-body">
          <p>${p ? p.nome : '-'} · ${c ? c.nome : '-'}</p>
          <p>${UI.data(g.data)} · ${g.categoria || 'Outros'}</p>
        </div>
        <div class="card-footer">
          <button class="btn-icon" onclick="GASTOS.form(${JSON.stringify(g).replace(/"/g,'&quot;')}, APP.dados.pessoas, APP.dados.cartoes)">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon" onclick="GASTOS.deletar('${g.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>`;
    }).join('');
  },

  form(g, pessoas, cartoes) {
    UI.modal(g ? 'Editar Gasto' : 'Novo Gasto', `
      <div class="form-group">
        <label>Descrição</label>
        <input id="gDesc" type="text" value="${g ? g.descricao : ''}" placeholder="Ex: Mercado">
      </div>
      <div class="form-group">
        <label>Cartão</label>
        <select id="gCartao">${UI.selectCartoes(cartoes, g ? g.cartaoId : '')}</select>
      </div>
      <div class="form-group">
        <label>Pessoa</label>
        <select id="gPessoa">${UI.selectPessoas(pessoas, '', g ? g.pessoaId : '')}</select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Valor (R$)</label>
          <input id="gValor" type="number" step="0.01" value="${g ? g.valor : ''}">
        </div>
        <div class="form-group">
          <label>Data</label>
          <input id="gData" type="date" value="${g ? g.data : new Date().toISOString().split('T')[0]}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Parcelas</label>
          <input id="gParcelas" type="number" min="1" value="${g ? g.totalParcelas || 1 : 1}">
        </div>
        <div class="form-group">
          <label>Parcela atual</label>
          <input id="gParcelaAtual" type="number" min="1" value="${g ? g.parcelaAtual || 1 : 1}">
        </div>
      </div>
      <div class="form-group">
        <label>Categoria</label>
        <select id="gCat">${UI.selectCategorias(g ? g.categoria : '')}</select>
      </div>
      <div class="form-group">
        <label>Mês referência</label>
        <input id="gMes" type="month" value="${g ? g.mesRef : new Date().toISOString().substring(0,7)}">
      </div>
    `, `
      <button class="btn-secondary modal-close">Cancelar</button>
      <button class="btn-primary" id="btnSalvarGasto"><i class="fas fa-save"></i> Salvar</button>
    `);
    document.getElementById('btnSalvarGasto').onclick = () => this.salvar(g);
  },

  async salvar(g) {
    const item = {
      descricao:    document.getElementById('gDesc').value.trim(),
      cartaoId:     document.getElementById('gCartao').value,
      pessoaId:     document.getElementById('gPessoa').value,
      valor:        document.getElementById('gValor').value,
      data:         document.getElementById('gData').value,
      totalParcelas:document.getElementById('gParcelas').value,
      parcelaAtual: document.getElementById('gParcelaAtual').value,
      categoria:    document.getElementById('gCat').value,
      mesRef:       document.getElementById('gMes').value,
    };
    if (!item.descricao || !item.valor) { UI.toast('Preencha descrição e valor', 'danger'); return; }
    if (g) item.id = g.id;
    UI.loading(true);
    const res = g ? await API.editGasto(item) : await API.addGasto(item);
    UI.loading(false);
    if (!res.ok) { UI.toast(res.error, 'danger'); return; }
    UI.fecharModal();
    UI.toast(g ? 'Gasto atualizado!' : 'Gasto adicionado!', 'success');
    await APP.reload();
  },

  deletar(id) {
    UI.confirmar('Deletar este gasto?', async () => {
      UI.loading(true);
      const res = await API.deleteGasto(id);
      UI.loading(false);
      if (!res.ok) { UI.toast(res.error, 'danger'); return; }
      UI.toast('Gasto removido', 'success');
      await APP.reload();
    });
  },
};