// ============================================
// pessoas.js
// ============================================
const PESSOAS = {
  render(pessoas, cartoes) {
    const content = document.getElementById('appContent');
    content.innerHTML = `
      <div class="section-header">
        <h2>Pessoas</h2>
        <button class="btn-primary btn-small" id="btnAddPessoa">
          <i class="fas fa-plus"></i> Nova
        </button>
      </div>
      <div id="listaPessoas"></div>
    `;
    document.getElementById('btnAddPessoa').onclick = () => this.form(null, cartoes);
    this.renderLista(pessoas, cartoes);
  },

  renderLista(pessoas, cartoes) {
    const lista = document.getElementById('listaPessoas');
    if (!pessoas.length) {
      lista.innerHTML = `<div class="section-empty"><i class="fas fa-users"></i><p>Nenhuma pessoa ainda</p></div>`;
      return;
    }
    lista.innerHTML = pessoas.map(p => {
      const c = cartoes.find(x => x.id === p.cartaoId);
      return `<div class="card">
        <div class="card-header">
          <h3><i class="fas fa-user" style="color:var(--primary);margin-right:8px"></i>${p.nome}</h3>
          <div class="btn-group">
            <button class="btn-icon" onclick="PESSOAS.form(${JSON.stringify(p).replace(/"/g,'&quot;')}, APP.dados.cartoes)">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon" onclick="PESSOAS.deletar('${p.id}','${p.nome}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="card-body">
          <p>Cartão: <strong>${c ? c.nome : 'Não vinculado'}</strong></p>
          ${p.telefone ? `<p>Tel: ${p.telefone}</p>` : ''}
          ${p.observacao ? `<p>${p.observacao}</p>` : ''}
        </div>
      </div>`;
    }).join('');
  },

  form(p, cartoes) {
    UI.modal(p ? 'Editar Pessoa' : 'Nova Pessoa', `
      <div class="form-group">
        <label>Nome</label>
        <input id="pNome" type="text" value="${p ? p.nome : ''}" placeholder="Nome da pessoa">
      </div>
      <div class="form-group">
        <label>Cartão vinculado</label>
        <select id="pCartao">${UI.selectCartoes(cartoes, p ? p.cartaoId : '')}</select>
      </div>
      <div class="form-group">
        <label>Telefone (opcional)</label>
        <input id="pTel" type="tel" value="${p ? p.telefone || '' : ''}" placeholder="(00) 00000-0000">
      </div>
      <div class="form-group">
        <label>Observação (opcional)</label>
        <textarea id="pObs">${p ? p.observacao || '' : ''}</textarea>
      </div>
    `, `
      <button class="btn-secondary modal-close">Cancelar</button>
      <button class="btn-primary" id="btnSalvarPessoa"><i class="fas fa-save"></i> Salvar</button>
    `);
    document.getElementById('btnSalvarPessoa').onclick = () => this.salvar(p);
  },

  async salvar(p) {
    const item = {
      nome:      document.getElementById('pNome').value.trim(),
      cartaoId:  document.getElementById('pCartao').value,
      telefone:  document.getElementById('pTel').value.trim(),
      observacao:document.getElementById('pObs').value.trim(),
    };
    if (!item.nome) { UI.toast('Informe o nome', 'danger'); return; }
    if (p) item.id = p.id;
    UI.loading(true);
    const res = p ? await API.editPessoa(item) : await API.addPessoa(item);
    UI.loading(false);
    if (!res.ok) { UI.toast(res.error, 'danger'); return; }
    UI.fecharModal();
    UI.toast(p ? 'Pessoa atualizada!' : 'Pessoa adicionada!', 'success');
    await APP.reload();
  },

  deletar(id, nome) {
    UI.confirmar(`Deletar "${nome}"?`, async () => {
      UI.loading(true);
      const res = await API.deletePessoa(id);
      UI.loading(false);
      if (!res.ok) { UI.toast(res.error, 'danger'); return; }
      UI.toast('Pessoa removida', 'success');
      await APP.reload();
    });
  },
};