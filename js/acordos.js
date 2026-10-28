function renderAcordos(el) {
  el.innerHTML = `
    <div class="page-header">
      <h2>Acordos</h2>
      <p>Empréstimos e cobranças com juros</p>
    </div>
    <div class="dash-tabs">
      <button class="dash-tab ativo" onclick="filtrarAcordos('ativos', this)">Ativos</button>
      <button class="dash-tab" onclick="filtrarAcordos('vencidos', this)">Vencidos</button>
      <button class="dash-tab" onclick="filtrarAcordos('quitados', this)">Quitados</button>
      <button class="dash-tab" onclick="filtrarAcordos('todos', this)">Todos</button>
    </div>
    <div id="listaAcordos">${listarAcordos('ativos')}</div>
  `;
  let fab = document.getElementById('fab');
  if (!fab) {
    fab = document.createElement('button');
    fab.className = 'fab';
    fab.id = 'fab';
    document.body.appendChild(fab);
  }
  fab.innerHTML = '+';
  fab.onclick = () => modalAcordo();
}

function filtrarAcordos(tipo, btn) {
  document.querySelectorAll('.dash-tab').forEach(b => b.classList.remove('ativo'));
  btn.classList.add('ativo');
  document.getElementById('listaAcordos').innerHTML = listarAcordos(tipo);
}

function listarAcordos(tipo) {
  let lista = [...Dados.acordos];

  if (tipo === 'ativos') {
    lista = lista.filter(a => a.status === 'pendente');
  } else if (tipo === 'vencidos') {
    lista = lista.filter(a => a.status === 'vencido');
  } else if (tipo === 'quitados') {
    lista = lista.filter(a => a.status === 'quitado');
  }

  if (!lista.length) return '<p class="vazio">Nenhum acordo encontrado.</p>';

  return lista.map(a => {
    const p       = Dados.pessoas.find(x => x.id === a.pessoaId);
    const pagos   = Dados.pagamentos.filter(x => x.acordoId === a.id);
    const totalPago = pagos.reduce((s, x) => s + (parseFloat(x.valorPago) || 0), 0);
    const isQuit  = a.status === 'quitado';
    const isVenc  = a.status === 'vencido';

    return `
      <div class="tree-card">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <div style="display:flex;align-items:center;gap:8px;flex:1">
            <div class="avatar">${p ? p.nome.charAt(0).toUpperCase() : '?'}</div>
            <div class="t-desc">
              <strong>${a.descricao}</strong>
              <span>${p ? p.nome : '-'} · Início: ${fmtData(a.dataInicio)}</span>
              <span class="status-badge ${isQuit ? 'quitado' : isVenc ? 'vencido' : 'pendente'}">
                ${isQuit ? '✓ Quitado' : isVenc ? '⚠ Vencido' : 'Pendente'}
              </span>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div class="t-val desp">${fmt(a.valorAtual)}</div>
            <div style="font-size:0.65rem;color:var(--text-light)">
              ${a.jurosPercent}% ${a.jurosTipo}
            </div>
          </div>
        </div>
        <div class="tree-body">

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">
            <div class="metric">
              <small>Valor original</small>
              <strong>${fmt(a.valorOriginal)}</strong>
            </div>
            <div class="metric">
              <small>Saldo atual</small>
              <strong style="color:var(--danger)">${fmt(a.valorAtual)}</strong>
            </div>
            <div class="metric">
              <small>Total pago</small>
              <strong style="color:var(--success)">${fmt(totalPago)}</strong>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
            <div class="metric">
              <small>Vencimento</small>
              <strong>${fmtData(a.dataVenc)}</strong>
            </div>
            <div class="metric">
              <small>Juros</small>
              <strong>${a.jurosPercent}% ${a.jurosTipo}</strong>
            </div>
          </div>

          ${a.obs ? `<p class="helper">${a.obs}</p>` : ''}

          ${pagos.length ? `
            <div class="section-label" style="margin-top:8px">Pagamentos</div>
            ${pagos.map(pg => `
              <div class="t-row">
                <div class="t-desc">
                  <strong>${fmtData(pg.dataPgto)}</strong>
                  <span>${pg.obs || 'Pagamento'} · ${nomeMes(pg.mesRef)}</span>
                </div>
                <span class="t-val pag">+${fmt(pg.valorPago)}</span>
              </div>
            `).join('')}
          ` : ''}

          <div class="modal-acoes" style="margin-top:10px">
            ${!isQuit ? `
              <button class="btn-prim" onclick="modalPagarAcordo('${a.id}')">
                <span class="material-icons-outlined" style="font-size:0.9rem;vertical-align:middle">payments</span>
                Registrar Pagamento
              </button>
            ` : ''}
            <button class="btn-sec" onclick="modalAcordo('${a.id}')">
              <span class="material-icons-outlined" style="font-size:0.9rem;vertical-align:middle">edit</span>
              Editar
            </button>
            <button class="btn-danger" onclick="deletarAcordo('${a.id}')">
              <span class="material-icons-outlined" style="font-size:0.9rem;vertical-align:middle">delete</span>
              Excluir
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function modalAcordo(id = null) {
  const a = id ? Dados.acordos.find(x => x.id === id) : null;
  const optsPessoa = Dados.pessoas.map(p => `
    <option value="${p.id}" ${a && a.pessoaId === p.id ? 'selected' : ''}>${p.nome}</option>
  `).join('');

  abrirModal(
    a ? 'Editar Acordo' : 'Novo Acordo',
    `
      <div class="f-group">
        <label>Descrição</label>
        <input type="text" id="fAcordoDesc" value="${a ? a.descricao : ''}" placeholder="Ex: Empréstimo pessoal">
      </div>
      <div class="f-group">
        <label>Pessoa</label>
        <select id="fAcordoPessoa">
          <option value="">Selecione...</option>
          ${optsPessoa}
        </select>
      </div>
      <div class="f-row">
        <div class="f-group">
          <label>Valor original (R$)</label>
          <input type="number" id="fAcordoValOrig" value="${a ? a.valorOriginal : ''}" placeholder="0,00">
        </div>
        <div class="f-group">
          <label>Saldo atual (R$)</label>
          <input type="number" id="fAcordoValAtual" value="${a ? a.valorAtual : ''}" placeholder="0,00">
        </div>
      </div>
      <div class="f-row">
        <div class="f-group">
          <label>Juros (%)</label>
          <input type="number" id="fAcordoJuros" value="${a ? a.jurosPercent : ''}" placeholder="5">
        </div>
        <div class="f-group">
          <label>Tipo de juros</label>
          <select id="fAcordoJurosTipo">
            <option value="mensal"  ${a && a.jurosTipo === 'mensal'  ? 'selected' : ''}>Mensal</option>
            <option value="diario"  ${a && a.jurosTipo === 'diario'  ? 'selected' : ''}>Diário</option>
            <option value="anual"   ${a && a.jurosTipo === 'anual'   ? 'selected' : ''}>Anual</option>
            <option value="fixo"    ${a && a.jurosTipo === 'fixo'    ? 'selected' : ''}>Fixo</option>
          </select>
        </div>
      </div>
      <div class="f-row">
        <div class="f-group">
          <label>Data início</label>
          <input type="date" id="fAcordoInicio" value="${a ? a.dataInicio : new Date().toISOString().substring(0,10)}">
        </div>
        <div class="f-group">
          <label>Data vencimento</label>
          <input type="date" id="fAcordoVenc" value="${a ? a.dataVenc : ''}">
        </div>
      </div>
      <div class="f-row">
        <div class="f-group">
          <label>Mês referência</label>
          <input type="month" id="fAcordoMes" value="${a ? a.mesRef : mesAtual()}">
        </div>
        <div class="f-group">
          <label>Status</label>
          <select id="fAcordoStatus">
            <option value="pendente"  ${!a || a.status === 'pendente'  ? 'selected' : ''}>Pendente</option>
            <option value="vencido"   ${a && a.status === 'vencido'   ? 'selected' : ''}>Vencido</option>
            <option value="quitado"   ${a && a.status === 'quitado'   ? 'selected' : ''}>Quitado</option>
            <option value="cancelado" ${a && a.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
          </select>
        </div>
      </div>
      <div class="f-group">
        <label>Observação</label>
        <textarea id="fAcordoObs" rows="2">${a ? a.obs || '' : ''}</textarea>
      </div>
    `,
    `
      <button class="btn-sec" onclick="fecharModal()">Cancelar</button>
      <button class="btn-prim" onclick="salvarAcordo(${a ? `'${a.id}'` : null})">Salvar</button>
    `
  );
}

async function salvarAcordo(id = null) {
  const item = {
    descricao:    document.getElementById('fAcordoDesc').value.trim(),
    pessoaId:     document.getElementById('fAcordoPessoa').value,
    valorOriginal:document.getElementById('fAcordoValOrig').value,
    valorAtual:   document.getElementById('fAcordoValAtual').value,
    jurosPercent: document.getElementById('fAcordoJuros').value,
    jurosTipo:    document.getElementById('fAcordoJurosTipo').value,
    dataInicio:   document.getElementById('fAcordoInicio').value,
    dataVenc:     document.getElementById('fAcordoVenc').value,
    mesRef:       document.getElementById('fAcordoMes').value,
    status:       document.getElementById('fAcordoStatus').value,
    obs:          document.getElementById('fAcordoObs').value.trim(),
  };
  if (!item.descricao)     { toast('Informe a descrição', 'erro'); return; }
  if (!item.valorOriginal) { toast('Informe o valor', 'erro'); return; }
  if (!item.pessoaId)      { toast('Selecione a pessoa', 'erro'); return; }
  loading(true);
  let r;
  if (id) {
    item.id = id;
    r = await api('editAcordo', { item });
  } else {
    r = await api('addAcordo', { item });
  }
  loading(false);
  if (r.ok) {
    fecharModal();
    toast(id ? 'Acordo atualizado!' : 'Acordo adicionado!', 'ok');
    await Dados.carregar();
    renderAcordos(document.getElementById('appContent'));
  } else {
    toast(r.error, 'erro');
  }
}

function modalPagarAcordo(acordoId) {
  const a = Dados.acordos.find(x => x.id === acordoId);
  if (!a) return;
  abrirModal(
    'Registrar Pagamento',
    `
      <p class="helper">Acordo: <strong>${a.descricao}</strong> · Saldo: <strong style="color:var(--danger)">${fmt(a.valorAtual)}</strong></p>
      <div class="f-row">
        <div class="f-group">
          <label>Valor pago (R$)</label>
          <input type="number" id="fPagValor" placeholder="0,00" value="${a.valorAtual}">
        </div>
        <div class="f-group">
          <label>Data pagamento</label>
          <input type="date" id="fPagData" value="${new Date().toISOString().substring(0,10)}">
        </div>
      </div>
      <div class="f-group">
        <label>Mês referência</label>
        <input type="month" id="fPagMes" value="${mesAtual()}">
      </div>
      <div class="f-group">
        <label>Observação</label>
        <input type="text" id="fPagObs" placeholder="Opcional...">
      </div>
    `,
    `
      <button class="btn-sec" onclick="fecharModal()">Cancelar</button>
      <button class="btn-prim" onclick="salvarPagamento('${acordoId}')">Confirmar</button>
    `
  );
}

async function salvarPagamento(acordoId) {
  const pagamento = {
    acordoId,
    valorPago:   document.getElementById('fPagValor').value,
    dataPgto:    document.getElementById('fPagData').value,
    mesRef:      document.getElementById('fPagMes').value,
    obs:         document.getElementById('fPagObs').value.trim(),
  };
  if (!pagamento.valorPago) { toast('Informe o valor pago', 'erro'); return; }
  loading(true);
  const r = await api('pagarAcordo', { pagamento });
  loading(false);
  if (r.ok) {
    fecharModal();
    toast('Pagamento registrado!', 'ok');
    await Dados.carregar();
    renderAcordos(document.getElementById('appContent'));
  } else {
    toast(r.error, 'erro');
  }
}

async function deletarAcordo(id) {
  if (!confirm('Excluir este acordo?')) return;
  loading(true);
  const r = await api('deleteAcordo', { id });
  loading(false);
  if (r.ok) {
    toast('Acordo excluído!', 'ok');
    await Dados.carregar();
    renderAcordos(document.getElementById('appContent'));
  } else {
    toast(r.error, 'erro');
  }
}
