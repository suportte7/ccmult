function renderGastos(el) {
  const mes = mesAtual();
  el.innerHTML = `
    <div class="page-header">
      <h2>Gastos</h2>
      <p>Mês atual: ${nomeMes(mes)}</p>
    </div>
    <div class="dash-tabs" id="gastosTabs">
      <button class="dash-tab ativo" onclick="filtrarGastos('todos', this)">Todos</button>
      <button class="dash-tab" onclick="filtrarGastos('mes', this)">Este mês</button>
      <button class="dash-tab" onclick="filtrarGastos('pessoa', this)">Por pessoa</button>
      <button class="dash-tab" onclick="filtrarGastos('cartao', this)">Por cartão</button>
    </div>
    <div id="listaGastos">${listarGastos('todos')}</div>
  `;
  let fab = document.getElementById('fab');
  if (!fab) {
    fab = document.createElement('button');
    fab.className = 'fab';
    fab.id = 'fab';
    document.body.appendChild(fab);
  }
  fab.innerHTML = '+';
  fab.onclick = () => modalGasto();
}

function filtrarGastos(tipo, btn) {
  document.querySelectorAll('.dash-tab').forEach(b => b.classList.remove('ativo'));
  btn.classList.add('ativo');
  document.getElementById('listaGastos').innerHTML = listarGastos(tipo);
}

function listarGastos(tipo) {
  const mes = mesAtual();
  let lista = [...Dados.gastos].sort((a, b) => new Date(b.data) - new Date(a.data));

  if (tipo === 'mes') {
    lista = lista.filter(g => (g.mesRef || '').substring(0, 7) === mes);
    if (!lista.length) return '<p class="vazio">Nenhum gasto neste mês.</p>';
    const total = lista.reduce((s, g) => s + (parseFloat(g.valor) || 0), 0);
    return `
      <div class="metric-grid" style="margin-bottom:10px">
        <div class="metric" style="grid-column:span 2"><small>Total do mês</small><strong>${fmt(total)}</strong></div>
        <div class="metric"><small>Lançamentos</small><strong>${lista.length}</strong></div>
      </div>
      ${lista.map(g => rowGasto(g)).join('')}
    `;
  }

  if (tipo === 'pessoa') {
    if (!lista.length) return '<p class="vazio">Nenhum gasto registrado.</p>';
    const grupos = {};
    lista.forEach(g => {
      const key = g.pessoaId || 'sem';
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(g);
    });
    return Object.keys(grupos).map(key => {
      const p = Dados.pessoas.find(x => x.id === key);
      const total = grupos[key].reduce((s, g) => s + (parseFloat(g.valor) || 0), 0);
      return `
        <div class="tree-card">
          <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
            <div style="display:flex;align-items:center;gap:8px">
              <div class="avatar">${p ? p.nome.charAt(0).toUpperCase() : '?'}</div>
              <strong>${p ? p.nome : 'Sem pessoa'}</strong>
            </div>
            <span style="font-weight:700;color:var(--danger)">${fmt(total)}</span>
          </div>
          <div class="tree-body">
            ${grupos[key].map(g => rowGasto(g)).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  if (tipo === 'cartao') {
    if (!lista.length) return '<p class="vazio">Nenhum gasto registrado.</p>';
    const grupos = {};
    lista.forEach(g => {
      const key = g.cartaoId || 'sem';
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(g);
    });
    return Object.keys(grupos).map(key => {
      const c = Dados.cartoes.find(x => x.id === key);
      const total = grupos[key].reduce((s, g) => s + (parseFloat(g.valor) || 0), 0);
      return `
        <div class="tree-card">
          <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:10px;height:10px;border-radius:50%;background:${c ? c.cor : '#888'};flex-shrink:0"></div>
              <strong>${c ? c.nome : 'Sem cartão'}</strong>
            </div>
            <span style="font-weight:700;color:var(--danger)">${fmt(total)}</span>
          </div>
          <div class="tree-body">
            ${grupos[key].map(g => rowGasto(g)).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  // todos
  if (!lista.length) return '<p class="vazio">Nenhum gasto registrado.</p>';
  return lista.map(g => rowGasto(g)).join('');
}

function rowGasto(g) {
  const p = Dados.pessoas.find(x => x.id === g.pessoaId);
  const c = Dados.cartoes.find(x => x.id === g.cartaoId);
  const parc = g.totalParcelas > 1
    ? `<span class="parc-badge">${g.parcelaAtual}/${g.totalParcelas}</span>` : '';
  return `
    <div class="t-row">
      <div class="t-desc">
        <strong>${g.descricao} ${parc}</strong>
        <span>${p ? p.nome : '-'} · ${c ? c.nome : '-'} · ${fmtData(g.data)}</span>
        ${g.categoria ? `<span class="cat-badge">${g.categoria}</span>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <span class="t-val desp">${fmt(g.valor)}</span>
        <button class="btn-icon" onclick="modalGasto('${g.id}')">
          <span class="material-icons-outlined">edit</span>
        </button>
        <button class="btn-icon del" onclick="deletarGasto('${g.id}')">
          <span class="material-icons-outlined">delete</span>
        </button>
      </div>
    </div>
  `;
}

function modalGasto(id = null) {
  const g = id ? Dados.gastos.find(x => x.id === id) : null;
  const optsPessoa = Dados.pessoas.map(p => `
    <option value="${p.id}" ${g && g.pessoaId === p.id ? 'selected' : ''}>${p.nome}</option>
  `).join('');
  const optsCartao = Dados.cartoes.map(c => `
    <option value="${c.id}" ${g && g.cartaoId === c.id ? 'selected' : ''}>${c.nome}</option>
  `).join('');
  const categorias = ['Alimentação','Transporte','Saúde','Educação','Lazer','Vestuário','Mercado','Outros'];
  const optsCat = categorias.map(cat => `
    <option value="${cat}" ${g && g.categoria === cat ? 'selected' : ''}>${cat}</option>
  `).join('');

  abrirModal(
    g ? 'Editar Gasto' : 'Novo Gasto',
    `
      <div class="f-group">
        <label>Descrição</label>
        <input type="text" id="fGastoDesc" value="${g ? g.descricao : ''}" placeholder="Ex: Mercado">
      </div>
      <div class="f-row">
        <div class="f-group">
          <label>Valor (R$)</label>
          <input type="number" id="fGastoValor" value="${g ? g.valor : ''}" placeholder="0,00">
        </div>
        <div class="f-group">
          <label>Data</label>
          <input type="date" id="fGastoData" value="${g ? g.data : new Date().toISOString().substring(0,10)}">
        </div>
      </div>
      <div class="f-row">
        <div class="f-group">
          <label>Pessoa</label>
          <select id="fGastoPessoa">
            <option value="">Nenhuma</option>
            ${optsPessoa}
          </select>
        </div>
        <div class="f-group">
          <label>Cartão</label>
          <select id="fGastoCartao">
            <option value="">Nenhum</option>
            ${optsCartao}
          </select>
        </div>
      </div>
      <div class="f-row">
        <div class="f-group">
          <label>Categoria</label>
          <select id="fGastoCat">
            <option value="">Sem categoria</option>
            ${optsCat}
          </select>
        </div>
        <div class="f-group">
          <label>Mês referência</label>
          <input type="month" id="fGastoMes" value="${g ? g.mesRef : mesAtual()}">
        </div>
      </div>
      <div class="f-row">
        <div class="f-group">
          <label>Parcela atual</label>
          <input type="number" id="fGastoParc" min="1" value="${g ? g.parcelaAtual : 1}">
        </div>
        <div class="f-group">
          <label>Total parcelas</label>
          <input type="number" id="fGastoTotalParc" min="1" value="${g ? g.totalParcelas : 1}">
        </div>
      </div>
    `,
    `
      <button class="btn-sec" onclick="fecharModal()">Cancelar</button>
      <button class="btn-prim" onclick="salvarGasto(${g ? `'${g.id}'` : null})">Salvar</button>
    `
  );
}

async function salvarGasto(id = null) {
  const item = {
    descricao:     document.getElementById('fGastoDesc').value.trim(),
    valor:         document.getElementById('fGastoValor').value,
    data:          document.getElementById('fGastoData').value,
    pessoaId:      document.getElementById('fGastoPessoa').value,
    cartaoId:      document.getElementById('fGastoCartao').value,
    categoria:     document.getElementById('fGastoCat').value,
    mesRef:        document.getElementById('fGastoMes').value,
    parcelaAtual:  document.getElementById('fGastoParc').value,
    totalParcelas: document.getElementById('fGastoTotalParc').value,
  };
  if (!item.descricao) { toast('Informe a descrição', 'erro'); return; }
  if (!item.valor)     { toast('Informe o valor', 'erro'); return; }
  loading(true);
  let r;
  if (id) {
    item.id = id;
    r = await api('editGasto', { item });
  } else {
    r = await api('addGasto', { item });
  }
  loading(false);
  if (r.ok) {
    fecharModal();
    toast(id ? 'Gasto atualizado!' : 'Gasto adicionado!', 'ok');
    await Dados.carregar();
    renderGastos(document.getElementById('appContent'));
  } else {
    toast(r.error, 'erro');
  }
}

async function deletarGasto(id) {
  if (!confirm('Excluir este gasto?')) return;
  loading(true);
  const r = await api('deleteGasto', { id });
  loading(false);
  if (r.ok) {
    toast('Gasto excluído!', 'ok');
    await Dados.carregar();
    renderGastos(document.getElementById('appContent'));
  } else {
    toast(r.error, 'erro');
  }
}
