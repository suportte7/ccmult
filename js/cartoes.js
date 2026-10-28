// ============================================
// cartoes.js
// ============================================
const CARTOES = {
  render(cartoes) {
    const content = document.getElementById('appContent');
    content.innerHTML = `
      <div class="section-header">
        <h2>Meus Cartões</h2>
        <button class="btn-primary btn-small" id="btnAddCartao">
          <i class="fas fa-plus"></i> Novo
        </button>
      </div>
      <div id="listaCartoes"></div>
    `;
    document.getElementById('btnAddCartao').onclick = () => this.formCartao();
    this.renderLista(cartoes);
  },

  renderLista(cartoes) {
    const lista = document.getElementById('listaCartoes');
    if (!cartoes.length) {
      lista.innerHTML = `<div class="section-empty"><i class="fas fa-credit-card"></i><p>Nenhum cartão ainda</p></div>`;
      return;
    }
    lista.innerHTML = cartoes.map(c => `
      <div class="cc-visual" style="background:linear-gradient(135deg,${UI.corCartao(c.cor)},${UI.corCartao(c.cor)}cc)">
        <div class="cc-nome">${c.nome}</div>
        <div class="cc-numero">**** **** **** ${String(c.numero).slice(-4)}</div>
        <div class="cc-info">
          <span>Vence dia ${c.vencimento}</span>
          <span>Corte dia ${c.diaCorte || '-'}</span>
        </div>
        <div class="cc-limite">Limite ${UI.moeda(c.limite)}</div>
        <div style="position:absolute;bottom:12px;right:12px;display:flex;gap:8px">
          <button class="btn-icon" onclick="CARTOES.formCartao(${JSON.stringify(c).replace(/"/g,'&quot;')})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon" onclick="CARTOES.deletar('${c.id}','${c.nome}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  },

  formCartao(c = null) {
    const edit = !!c;
    UI.modal(edit ? 'Editar Cartão' : 'Novo Cartão', `
      <div class="form-group">
        <label>Nome do Cartão</label>
        <input id="cNome" type="text" value="${c ? c.nome : ''}" placeholder="Ex: Nubank">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Número (últimos 4 dígitos)</label>
          <input id="cNumero" type="number" value="${c ? c.numero : ''}" placeholder="1234" maxlength="4">
        </div>
        <div class="form-group">
          <label>Limite (R$)</label>
          <input id="cLimite" type="number" value="${c ? c.limite : ''}" placeholder="5000">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Dia Vencimento</label>
          <input id="cVenc" type="number" value="${c ? c.vencimento : ''}" placeholder="15" min="1" max="31">
        </div>
        <div class="form-group">
          <label>Dia Corte</label>
          <input id="cCorte" type="number" value="${c ? c.diaCorte : ''}" placeholder="8" min="1" max="31">
        </div>
      </div>
      <div class="form-group">
        <label>Cor</label>
        <select id="cCor">
          ${CONFIG.CORES.map(cor => `<option value="${cor}" ${c && c.cor === cor ? 'selected' : ''}>${cor}</option>`).join('')}
        </select>
      </div>
    `, `
      <button class="btn-secondary modal-close">Cancelar</button>
      <button class="btn-primary" id="btnSalvarCartao"><i class="fas fa-save"></i> Salvar</button>
    `);
    document.getElementById('btnSalvarCartao').onclick = () => this.salvar(c);
  },

  async salvar(c) {
    const item = {
      nome:       document.getElementById('cNome').value.trim(),
      numero:     document.getElementById('cNumero').value.trim(),
      limite:     document.getElementById('cLimite').value,
      vencimento: document.getElementById('cVenc').value,
      diaCorte:   document.getElementById('cCorte').value,
      cor:        document.getElementById('cCor').value,
    };
    if (!item.nome || !item.numero) { UI.toast('Preencha nome e número', 'danger'); return; }
    if (c) item.id = c.id;
    UI.loading(true);
    const res = c ? await API.editCartao(item) : await API.addCartao(item);
    UI.loading(false);
    if (!res.ok) { UI.toast(res.error, 'danger'); return; }
    UI.fecharModal();
    UI.toast(c ? 'Cartão atualizado!' : 'Cartão adicionado!', 'success');
    await APP.reload();
  },

  deletar(id, nome) {
    UI.confirmar(`Deletar cartão "${nome}"?`, async () => {
      UI.loading(true);
      const res = await API.deleteCartao(id);
      UI.loading(false);
      if (!res.ok) { UI.toast(res.error, 'danger'); return; }
      UI.toast('Cartão removido', 'success');
      await APP.reload();
    });
  },
};