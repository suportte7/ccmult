function renderAdmin(el) {
  if (!Auth.isAdmin()) {
    el.innerHTML = '<p class="vazio">Acesso negado.</p>';
    return;
  }

  el.innerHTML = `
    <div class="page-header">
      <h2>⚙️ Painel Admin</h2>
      <p>Gerenciamento de usuários e sistema</p>
    </div>

    <div class="section-label">Usuários</div>
    <div class="admin-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <h4 style="margin:0">Contas cadastradas</h4>
        <button class="btn-prim" style="padding:6px 12px;font-size:0.75rem" onclick="modalCriarUsuario()">
          + Novo usuário
        </button>
      </div>
      <div id="listaUsuarios">
        <p class="vazio">Carregando...</p>
      </div>
    </div>

    <div class="section-label">Backup Geral</div>
    <div class="admin-card">
      <p class="helper">Faz backup de TODAS as abas de todos os usuários para outra planilha.</p>
      <button class="btn-danger" style="width:100%" onclick="fazerBackupGeral()">
        <span class="material-icons-outlined" style="font-size:0.9rem;vertical-align:middle">backup</span>
        Backup Geral Agora
      </button>
    </div>

    <div class="section-label">Log de Backups</div>
    <div class="admin-card">
      <div id="listaBackupLog">
        <p class="vazio">Carregando...</p>
      </div>
    </div>

    <div style="margin-top:12px">
      <button class="btn-sec" style="width:100%" onclick="navegar('mais')">
        <span class="material-icons-outlined" style="font-size:0.9rem;vertical-align:middle">arrow_back</span>
        Voltar
      </button>
    </div>
  `;

  // Remove FAB nesta tela
  const fab = document.getElementById('fab');
  if (fab) fab.style.display = 'none';

  carregarUsuarios();
  carregarBackupLogAdmin();
}

async function carregarUsuarios() {
  const r = await api('getUsuarios');
  const el = document.getElementById('listaUsuarios');
  if (!el) return;
  if (!r.ok) { el.innerHTML = `<p class="vazio">${r.error}</p>`; return; }
  const users = r.items || [];
  if (!users.length) { el.innerHTML = '<p class="vazio">Nenhum usuário cadastrado.</p>'; return; }
  el.innerHTML = users.map(u => `
    <div class="user-row">
      <div class="user-info">
        <strong>${u.nome}</strong>
        <small>${u.email}</small>
        <small>Aba: ${u.aba} · ${u.isAdmin ? '👑 Admin' : 'Usuário'}</small>
      </div>
      <div class="user-acoes">
        <button class="btn-icon ${u.ativo ? '' : 'del'}" title="${u.ativo ? 'Desativar' : 'Ativar'}"
          onclick="toggleUsuario('${u.email}', ${!u.ativo})">
          <span class="material-icons-outlined">${u.ativo ? 'toggle_on' : 'toggle_off'}</span>
        </button>
        <button class="btn-icon del" title="Excluir" onclick="deletarUsuario('${u.email}', '${u.nome}')">
          <span class="material-icons-outlined">delete</span>
        </button>
      </div>
    </div>
  `).join('');
}

async function carregarBackupLogAdmin() {
  const r = await api('getBackupLog');
  const el = document.getElementById('listaBackupLog');
  if (!el) return;
  if (!r.ok) { el.innerHTML = `<p class="vazio">${r.error}</p>`; return; }
  const logs = r.items || [];
  if (!logs.length) { el.innerHTML = '<p class="vazio">Nenhum backup registrado.</p>'; return; }
  el.innerHTML = logs.slice(0, 30).map(l => `
    <div class="t-row">
      <div class="t-desc">
        <strong>${l.tipo || 'Backup'}</strong>
        <span>${l.data || '-'} · ${l.usuario || '-'}</span>
      </div>
      <span class="status-badge ${l.status === 'ok' ? 'quitado' : 'vencido'}">${l.status || '-'}</span>
    </div>
  `).join('');
}

function modalCriarUsuario() {
  abrirModal(
    'Novo Usuário',
    `
      <div class="f-group">
        <label>Nome</label>
        <input type="text" id="fNovoNome" placeholder="Nome completo">
      </div>
      <div class="f-group">
        <label>Email</label>
        <input type="email" id="fNovoEmail" placeholder="email@exemplo.com">
      </div>
      <div class="f-group">
        <label>PIN (4 dígitos)</label>
        <input type="password" id="fNovoPin" maxlength="4" inputmode="numeric" placeholder="••••">
      </div>
      <div class="f-group">
        <label>Perfil</label>
        <select id="fNovoAdmin">
          <option value="false">Usuário comum</option>
          <option value="true">Administrador</option>
        </select>
      </div>
    `,
    `
      <button class="btn-sec" onclick="fecharModal()">Cancelar</button>
      <button class="btn-prim" onclick="criarUsuario()">Criar</button>
    `
  );
}

async function criarUsuario() {
  const novo = {
    nome:    document.getElementById('fNovoNome').value.trim(),
    email:   document.getElementById('fNovoEmail').value.trim(),
    pin:     document.getElementById('fNovoPin').value,
    isAdmin: document.getElementById('fNovoAdmin').value === 'true',
  };
  if (!novo.nome)        { toast('Informe o nome', 'erro'); return; }
  if (!novo.email)       { toast('Informe o email', 'erro'); return; }
  if (novo.pin.length < 4) { toast('PIN deve ter 4 dígitos', 'erro'); return; }
  loading(true);
  const r = await api('criarUsuario', { novo });
  loading(false);
  if (r.ok) {
    fecharModal();
    toast('Usuário criado com sucesso!', 'ok');
    carregarUsuarios();
  } else {
    toast(r.error, 'erro');
  }
}

async function toggleUsuario(email, ativo) {
  loading(true);
  const r = await api('toggleUsuario', { email, ativo });
  loading(false);
  if (r.ok) {
    toast(ativo ? 'Usuário ativado!' : 'Usuário desativado!', 'ok');
    carregarUsuarios();
  } else {
    toast(r.error, 'erro');
  }
}

async function deletarUsuario(email, nome) {
  if (!confirm(`Excluir o usuário "${nome}"? Esta ação não pode ser desfeita.`)) return;
  loading(true);
  const r = await api('deletarUsuario', { email });
  loading(false);
  if (r.ok) {
    toast('Usuário excluído!', 'ok');
    carregarUsuarios();
  } else {
    toast(r.error, 'erro');
  }
}

async function fazerBackupGeral() {
  if (!confirm('Fazer backup geral de todos os usuários agora?')) return;
  loading(true);
  const r = await api('backupGeral');
  loading(false);
  if (r.ok) {
    toast('Backup geral realizado!', 'ok');
    carregarBackupLogAdmin();
  } else {
    toast(r.error, 'erro');
  }
}
