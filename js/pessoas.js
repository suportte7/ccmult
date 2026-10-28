function renderPessoas(el) {
  el.innerHTML = `
    <div class="page-header">
      <h2>Pessoas</h2>
      <p>${Dados.pessoas.length} pessoa(s) cadastrada(s)</p>
    </div>
    <div id="listaPessoas">${listarPessoas()}</div>
  `;
  let fab = document.getElementById('fab');
  if (!fab) {
    fab = document.createElement('button');
    fab.className = 'fab';
    fab.id = 'fab';
    document.body.appendChild(fab);
  }
  fab.innerHTML = '+';
  fab.onclick = () => modalPessoa();
}

function listarPessoas() {
  if (!Dados.pessoas.length) return '<p class="vazio">Nenhuma pessoa cadastrada.</p>';
  return Dados.pessoas.map(p => {
    const cartao = Dados.cartoes.find(c => c.id === p.cartaoId);
    const gastosPessoa = Dados.gastos.filter(g => g.pessoaId === p.id);
    const totalGastos  = gastosPessoa.reduce((s, g) => s + (parseFloat(g.valor) || 0), 0);
    const acordosPessoa = Dados.acordos.filter(a => a.pessoaId === p.id && a.status !== 'quitado' && a.status !== 'cancelado');
    const totalAcordos  = acordosPessoa.reduce((s, a) => s + (parseFloat(a.valorAtual) || 0), 0);
    return `
      <div class="tree-card">
        <div class="tree-header" onclick="this.parentElement.classList.toggle('open')">
          <div style="display:flex;align-items:center;gap:8px">
            <div class="avatar">${p.nome.charAt(0).toUpperCase()}</div>
            <div class="t-desc">
              <strong>${p.nome}</strong>
              <span>${cartao ? cartao.nome : 'Sem cartão'} ${p.telefone ? '· ' + p.telefone : ''}</span>
            </div>
          </div>
          <span class="material-icons-outlined" style="font-size:1rem;color:var(--text-light)">expand_more</span>
        </div>
        <div class="tree-body">
          <div style="display:flex;gap:8px;padding:4px 0">
            <div class="metric" style="flex:1">
              <small>Gastos</small>
              <strong>${fmt(totalGastos)}</strong>
            </div>
            <div class="metric" style="flex:1">
              <small>Acordos</small>
              <strong>${fmt(totalAcordos)}</strong>
            </div>
          </div>
          ${p.observacao ? `<p class="helper" style="margin-top:8px">${p.observacao}</p>` : ''}
          <div class="modal-acoes" style="margin-top:8px">
            <button class="btn-sec" onclick="modalPessoa('${p.id}')">
              <span class="material-icons-outlined" style="font-size:0.9rem;vertical-align:middle">edit</span>
              Editar
            </button>
            <button class="btn-danger" onclick="deletarPessoa('${p.id}')">
              <span class="material-icons-outlined" style="font-size:0.9rem;vertical-align:middle">delete</span>
              Excluir
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function modalPessoa(id = null) {
  const p = id ? Dados.pessoas.find(x => x.id === id) : null;
  const optsCartao = Dados.cartoes.map(c => `
    <option value="${c.id}" ${p && p.cartaoId === c.id ? 'selected' : ''}>${c.nome}</option>
  `).join('');

  abrirModal(
    p ? 'Editar Pessoa' : 'Nova Pessoa',
    `
      <div class="f-group">
        <label>Nome</label>
        <input type="text" id="fPessoaNome" value="${p ? p.nome : ''}" placeholder="Ex: Esposa">
      </div>
      <div class="f-group">
        <label>Cartão vinculado</label>
        <select id="fPessoaCartao">
          <option value="">Nenhum</option>
          ${optsCartao}
        </select>
      </div>
      <div class="f-group">
        <label>Telefone</label>
        <input type="tel" id="fPessoaTel" value="${p ? p.telefone || '' : ''}" placeholder="(11) 99999-9999">
      </div>
      <div class="f-group">
        <label>Observação</label>
        <textarea id="fPessoaObs" rows="2" placeholder="Opcional...">${p ? p.observacao || '' : ''}</textarea>
      </div>
    `,
    `
      <button class="btn-sec" onclick="fecharModal()">Cancelar</button>
      <button class="btn-prim" onclick="salvarPessoa(${p ? `'${p.id}'` : null})">Salvar</button>
    `
  );
}

async function salvarPessoa(id = null) {
  const item = {
    nome:       document.getElementById('fPessoaNome').value.trim(),
    cartaoId:   document.getElementById('fPessoaCartao').value,
    telefone:   document.getElementById('fPessoaTel').value.trim(),
    observacao: document.getElementById('fPessoaObs').value.trim(),
  };
  if (!item.nome) { toast('Informe o nome', 'erro'); return; }
  loading(true);
  let r;
  if (id) {
    item.id = id;
    r = await api('editPessoa', { item });
  } else {
    r = await api('addPessoa', { item });
  }
  loading(false);
  if (r.ok) {
    fecharModal();
    toast(id ? 'Pessoa atualizada!' : 'Pessoa adicionada!', 'ok');
    await Dados.carregar();
    renderPessoas(document.getElementById('appContent'));
  } else {
    toast(r.error, 'erro');
  }
}

async function deletarPessoa(id) {
  if (!confirm('Excluir esta pessoa?')) return;
  loading(true);
  const r = await api('deletePessoa', { id });
  loading(false);
  if (r.ok) {
    toast('Pessoa excluída!', 'ok');
    await Dados.carregar();
    renderPessoas(document.getElementById('appContent'));
  } else {
    toast(r.error, 'erro');
  }
}
