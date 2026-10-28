// ============================================
// acordos.js
// ============================================
const ACORDOS = {
  render(acordos, pessoas, cartoes, pagamentos) {
    const content = document.getElementById('appContent');
    content.innerHTML = `
      <div class="section-header">
        <h2>Acordos</h2>
        <button class="btn-primary btn-small" id="btnAddAcordo">
          <i class="fas fa-plus"></i> Novo
        </button>
      </div>
      <div class="filtros">
        <button class="filtro-btn ativo" data-status="">Todos</button>
        <button class="filtro-btn" data-status="pendente">Pendentes</button>
        <button class="filtro-btn" data-status="vencido">Vencidos</button>
        <button class="filtro-btn" data-status="quitado">Quitados</button>
      </div>
      <div id="listaAcordos"></div>
    `;
    document.getElementById('btnAddAcordo').onclick = () => this.form(null, pessoas, cartoes);
    document.querySelectorAll('.filtro-btn').forEach(b => {
      b.onclick = () => {
        document.querySelectorAll('.filtro-btn').forEach(x => x.classList.remove('ativo'));
        b.classList.add('ativo');
        const status = b.dataset.status;
        const filtrados = status ? acordos.filter(a => a.status === status) : acordos;
        this.renderLista(filtrados, pessoas, pagamentos);
      };
    });
    this.renderLista(acordos, pessoas, pagamentos);
  },

  renderLista(acordos, pessoas, pagamentos) {
    const lista = document.getElementById('listaAcordos');
    if (!acordos.length) {
      lista.innerHTML = `<div class="section-empty"><i class="fas fa-handshake"></i><p>Nenhum acordo</p></div>`;
      return;
    }
    lista.innerHTML = acordos.map(a => {
      const p    = pessoas.find(x => x.id === a.pessoaId);
      const pgts = pagamentos.filter(x => x.acordoId === a.id);
      return `<div class="card">
        <div class="card-header">
          <h3>${a.descricao}</h3>
          ${UI.badge(a.status)}
        </div>
        <div class="card-body">
          <p><strong>${p ? p.nome : '-'}</strong></p>
          <p>Original: ${UI.moeda(a.valorOriginal)} · Saldo: <strong class="${a.status === 'quitado' ? 'valor-pos' : 'valor-neg'}">${UI.moeda(a.valorAtual)}</strong></p>
          <p>Juros: ${a.jurosPercent}% ${a.jurosTipo === 'composto' ? '(composto)' : '(simples)'} · Vence: ${UI.data(a.dataVenc)}</p>
          <p>Parcela ${a.parcelaAtual || 1} de ${a.totalParcelas || 1} · Pagamentos: ${pgts.length}</p>
        </div>
        <div class="card-footer">
          ${a.status !== 'quitado' ? `<button class="btn-success btn-small" onclick="ACORDOS.formPagar('${a.id}', '${a.valorAtual}')"><i class="fas fa-dollar-sign"></i> Pagar</button>` : ''}
          <button class="btn-icon" onclick="ACORDOS.form(${JSON.stringify(a).replace(/"/g,'&quot;')}, APP.dados.pessoas, APP.dados.cartoes)">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon" onclick="ACORDOS.deletar('${a.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>`;
    }).join('');
  },

  form(a, pessoas, cartoes) {
    UI.modal(a ? 'Editar Acordo' : 'Novo Acordo', `
      <div class="form-group">
        <label>Descrição</label>
        <input id="aDesc" type="text" value="${a ? a.descricao : ''}" placeholder="Ex: Empréstimo TV">
      </div>
      <div class="form-group">
        <label>Pessoa</label>
        <select id="aPessoa">${UI.selectPessoas(pessoas, '', a ? a.pessoaId : '')}</select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Valor (R$)</label>
          <input id="aValor" type="number" step="0.01" value="${a ? a.valorOriginal : ''}">
        </div>
        <div class="form-group">
          <label>Total de parcelas</label>
          <input id="aParcelas" type="number" min="1" value="${a ? a.totalParcelas || 1 : 1}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Juros (%)</label>
          <input id="aJuros" type="number" step="0.01" min="0" value="${a ? a.jurosPercent || 0 : 0}">
        </div>
        <div class="form-group">
          <label>Tipo de juros</label>
          <select id="aTipoJuros">
            <option value="simples" ${a && a.jurosTipo === 'simples' ? 'selected' : ''}>Simples</option>
            <option value="composto" ${a && a.jurosTipo === 'composto' ? 'selected' : ''}>Composto</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Data início</label>
          <input id="aInicio" type="date" value="${a ? a.dataInicio : new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label>Data vencimento</label>
          <input id="aVenc" type="date" value="${a ? a.dataVenc : ''}">
        </div>
      </div>
      <div class="form-group">
        <label>Observação</label>
        <textarea id="aObs">${a ? a.obs || '' : ''}</textarea>
      </div>
    `, `
      <button class="btn-secondary modal-close">Cancelar</button>
      <button class="btn-primary" id="btnSalvarAcordo"><i class="fas fa-save"></i> Salvar</button>
    `);
    document.getElementById('btnSalvarAcordo').onclick = () => this.salvar(a);
  },

  async salvar(a) {
    const valor = document.getElementById('aValor').value;
    const item = {
      pessoaId:     document.getElementById('aPessoa').value,
      descricao:    document.getElementById('aDesc').value.trim(),
      valorOriginal:valor,
      valorAtual:   a ? a.valorAtual : valor,
      jurosPercent: document.getElementById('aJuros').value,
      jurosTipo:    document.getElementById('aTipoJuros').value,
      dataInicio:   document.getElementById('aInicio').value,
      dataVenc:     document.getElementById('aVenc').value,
      totalParcelas:document.getElementById('aParcelas').value,
      parcelaAtual: a ? a.parcelaAtual : 1,
      status:       a ? a.status : 'pendente',
      mesRef:       new Date().toISOString().substring(0, 7),
      obs:          document.getElementById('aObs').value.trim(),
    };
    if (!item.descricao || !item.valorOriginal || !item.dataVenc) {
      UI.toast('Preencha descrição, valor e vencimento', 'danger'); return;
    }
    if (a) item.id = a.id;
    UI.loading(true);
    const res = a ? await API.editAcordo(item) : await API.addAcordo(item);
    UI.loading(false);
    if (!res.ok) { UI.toast(res.error, 'danger'); return; }
    UI.fecharModal();
    UI.toast(a ? 'Acordo atualizado!' : 'Acordo criado!', 'success');
    await APP.reload();
  },

  formPagar(acordoId, valorAtual) {
    UI.modal('Registrar Pagamento', `
      <div class="form-group">
        <label>Valor a pagar (Saldo: ${UI.moeda(valorAtual)})</label>
        <input id="pgValor" type="number" step="0.01" value="${parseFloat(valorAtual).toFixed(2)}">
      </div>
      <div class="form-group">
        <label>Data do pagamento</label>
        <input id="pgData" type="date" value="${new Date().toISOString().split('T')[0]}">
      </div>
      <div class="form-group">
        <label>Observação</label>
        <input id="pgObs" type="text" placeholder="Opcional">
      </div>
    `, `
      <button class="btn-secondary modal-close">Cancelar</button>
      <button class="btn-success" id="btnConfirmarPgto"><i class="fas fa-check"></i> Confirmar</button>
    `);
    document.getElementById('btnConfirmarPgto').onclick = () => this.confirmarPagamento(acordoId);
  },

  async confirmarPagamento(acordoId) {
    const pgto = {
      acordoId,
      valorPago: document.getElementById('pgValor').value,
      dataPgto:  document.getElementById('pgData').value,
      obs:       document.getElementById('pgObs').value.trim(),
    };
    if (!pgto.valorPago || parseFloat(pgto.valorPago) <= 0) {
      UI.toast('Informe o valor pago', 'danger'); return;
    }
    UI.loading(true);
    const res = await API.pagarAcordo(pgto);
    UI.loading(false);
    if (!res.ok) { UI.toast(res.error, 'danger'); return; }
    UI.fecharModal();
    UI.toast(res.status === 'quitado' ? '✅ Acordo quitado!' : 'Pagamento registrado!', 'success');
    await APP.reload();
  },

  deletar(id) {
    UI.confirmar('Deletar este acordo?', async () => {
      UI.loading(true);
      const res = await API.deleteAcordo(id);
      UI.loading(false);
      if (!res.ok) { UI.toast(res.error, 'danger'); return; }
      UI.toast('Acordo removido', 'success');
      await APP.reload();
    });
  },
};