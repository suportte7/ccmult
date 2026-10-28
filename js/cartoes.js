function renderCartoes(el) {
  el.innerHTML = `
    <div class="page-header">
      <h2>Cartões</h2>
      <p>${Dados.cartoes.length} cartão(ões) cadastrado(s)</p>
    </div>
    <div id="listaCartoes">${listarCartoes()}</div>
  `;
  // FAB
  let fab = document.getElementById('fab');
  if (!fab) {
    fab = document.createElement('button');
    fab.className = 'fab';
    fab.id = 'fab';
    document.body.appendChild(fab);
  }
  fab.innerHTML = '+';
  fab.onclick = () => modalCartao();
}

function listarCartoes() {
  if (!Dados.cartoes.length) return '<p class="vazio">Nenhum cartão cadastrado.</p>';
  return Dados.cartoes.map(c => `
    <div class="tree-card">
      <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:10px;height:10px;border-radius:50%;background:${c.cor || '#6366f1'};flex-shrink:0"></div>
          <div class="t-desc">
            <strong>${c.nome}</strong>
            <span>**** ${c.numero ? String(c.numero).slice(-4) : '0000'} · Vence dia ${c.vencimento || '-'}</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:0.8rem;font-weight:700;color:var(--success)">${fmt(c.limite)}</span>
          <span class="material-icons-outlined" style="font-size:1rem;color:var(--text-light)">expand_more</span>
        </div>
      </div>
      <div class="tree-body">
        <div style="display:flex;gap:8px;padding:4px 0">
          <div class="metric" style="flex:1">
            <small>Limite</small>
            <strong>${fmt(c.limite)}</strong>
          </div>
          <div class="metric" style="flex:1">
            <small>Vencimento</small>
            <strong>Dia ${c.vencimento || '-'}</strong>
          </div>
          <div class="metric" style="flex:1">
            <small>Corte</small>
            <strong>Dia ${c.diaCorte || '-'}</strong>
          </div>
        </div>
        <div class="modal-acoes" style="margin-top:8px">
          <button class="btn-sec" onclick="modalCartao('${c.id}')">
            <span class="material-icons-outlined" style="font-size:0.9rem;vertical-align:middle">edit</span>
            Editar
          </button>
          <button class="btn-danger" onclick="deletarCartao('${c.id}')">
            <span class="material-icons-outlined" style="font-size:0.9rem;vertical-align:middle">delete</span>
            Excluir
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function modalCartao(id = null) {
  const c = id ? Dados.cartoes.find(x => x.id === id) : null;
  const cores = gerarCores();
  const corAtual = c ? c.cor : cores[0];
  const pickers = cores.map(cor => `
    <div class="cor-op ${cor === corAtual ? 'sel' : ''}"
      style="background:${cor}"
      onclick="document.querySelectorAll('.cor-op').forEach(x=>x.classList.remove('sel'));this.classList.add('sel');document.getElementById('fCartaoCor').value='${cor}'">
    </div>
  `).join('');

  abrirModal(
    c ? 'Editar Cartão' : 'Novo Cartão',
    `
      <div class="f-group">
        <label>Nome do Cartão</label>
        <input type="text" id="fCartaoNome" value="${c ? c.nome : ''}" placeholder="Ex: Nubank">
      </div>
      <div class="f-row">
        <div class="f-group">
          <label>Últimos 4 dígitos</label>
          <input type="tel" id="fCartaoNumero" maxlength="4" value="${c ? c.numero : ''}" placeholder="0000">
        </div>
        <div class="f-group">
          <label>Limite (R$)</label>
          <input type="number" id="fCartaoLimite" value="${c ? c.limite : ''}" placeholder="0,00">
        </div>
      </div>
      <div class="f-row">
        <div class="f-group">
          <label>Dia Vencimento</label>
          <input type="number" id="fCartaoVenc" min="1" max="31" value="${c ? c.vencimento : ''}" placeholder="10">
        </div>
        <div class="f-group">
          <label>Dia Corte</label>
          <input type="number" id="fCartaoCorte" min="1" max="31" value="${c ? c.diaCorte : ''}" placeholder="3">
        </div>
      </div>
      <div class="f-group">
        <label>Cor</label>
        <input type="hidden" id="fCartaoCor" value="${corAtual}">
        <div class="cor-picker">${pickers}</div>
      </div>
    `,
    `
      <button class="btn-sec" onclick="fecharModal()">Cancelar</button>
      <button class="btn-prim" onclick="salvarCartao(${c ? `'${c.id}'` : null})">Salvar</button>
    `
  );
}

async function salvarCartao(id = null) {
  const item = {
    nome:       document.getElementById('fCartaoNome').value.trim(),
    numero:     document.getElementById('fCartaoNumero').value.trim(),
    limite:     document.getElementById('fCartaoLimite').value,
    vencimento: document.getElementById('fCartaoVenc').value,
    diaCorte:   document.getElementById('fCartaoCorte').value,
    cor:        document.getElementById('fCartaoCor').value,
  };
  if (!item.nome) { toast('Informe o nome do cartão', 'erro'); return; }
  loading(true);
  let r;
  if (id) {
    item.id = id;
    r = await api('editCartao', { item });
  } else {
    r = await api('addCartao', { item });
  }
  loading(false);
  if (r.ok) {
    fecharModal();
    toast(id ? 'Cartão atualizado!' : 'Cartão adicionado!', 'ok');
    await Dados.carregar();
    renderCartoes(document.getElementById('appContent'));
  } else {
    toast(r.error, 'erro');
  }
}

async function deletarCartao(id) {
  if (!confirm('Excluir este cartão?')) return;
  loading(true);
  const r = await api('deleteCartao', { id });
  loading(false);
  if (r.ok) {
    toast('Cartão excluído!', 'ok');
    await Dados.carregar();
    renderCartoes(document.getElementById('appContent'));
  } else {
    toast(r.error, 'erro');
  }
}
