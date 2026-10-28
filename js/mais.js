function renderMais(el) {
  const isAdmin = Auth.isAdmin();
  el.innerHTML = `
    <div class="page-header">
      <h2>Mais</h2>
      <p>Configurações e ferramentas</p>
    </div>

    <div class="section-label">Minha Conta</div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <div class="avatar" style="width:40px;height:40px;font-size:1.1rem;border-radius:10px">
          ${Auth.user.nome.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style="font-weight:700">${Auth.user.nome}</div>
          <div style="font-size:0.75rem;color:var(--text-light)">${Auth.user.email}</div>
          ${isAdmin ? `<span class="status-badge pendente" style="margin-top:4px;display:inline-block">Admin</span>` : ''}
        </div>
      </div>
      <button class="btn-sec" style="width:100%" onclick="modalAlterarPin()">
        <span class="material-icons-outlined" style="font-size:0.9rem;vertical-align:middle">lock</span>
        Alterar PIN
      </button>
    </div>

    <div class="section-label">Backup</div>
    <div class="card">
      <p class="helper">Salva seus dados em outra planilha Google como backup de segurança.</p>
      <button class="btn-sec" style="width:100%;margin-bottom:8px" onclick="fazerBackup()">
        <span class="material-icons-outlined" style="font-size:0.9rem;vertical-align:middle">backup</span>
        Fazer Backup Agora
      </button>
      <button class="btn-sec" style="width:100%" onclick="verBackupLog()">
        <span class="material-icons-outlined" style="font-size:0.9rem;vertical-align:middle">history</span>
        Ver Histórico de Backups
      </button>
    </div>

    <div class="section-label">Ferramentas</div>
    <div class="card">
      <p class="helper">Processa juros pendentes nos acordos ativos.</p>
      <button class="btn-sec" style="width:100%;margin-bottom:8px" onclick="processarJuros()">
        <span class="material-icons-outlined" style="font-size:0.9rem;vertical-align:middle">calculate</span>
        Processar Juros
      </button>
    </div>

    <div class="section-label">Aparência</div>
    <div class="card">
      <p class="helper">Escolha o tema visual do app.</p>
      <button class="btn-sec" style="width:100%" onclick="abrirTemas()">
        <span class="material-icons-outlined" style="font-size:0.9rem;vertical-align:middle">palette</span>
        Escolher Tema
      </button>
    </div>

    ${isAdmin ? `
      <div class="section-label" style="color:var(--danger)">Administração</div>
      <div class="card" style="border-color:var(--danger)">
        <p class="helper">Área exclusiva do administrador.</p>
        <button class="btn-danger" style="width:100%" onclick="navegar('admin')">
          <span class="material-icons-outlined" style="font-size:0.9rem;vertical-align:middle">admin_panel_settings</span>
          Painel Admin
        </button>
      </div>
    ` : ''}

    <div class="section-label">Sessão</div>
    <div class="card">
      <button class="btn-danger" style="width:100%" onclick="fazerLogout()">
        <span class="material-icons-outlined" style="font-size:0.9rem;vertical-align:middle">logout</span>
        Sair da Conta
      </button>
    </div>
  `;

  // Remove FAB nesta tela
  const fab = document.getElementById('fab');
  if (fab) fab.style.display = 'none';
}

function modalAlterarPin() {
  abrirModal(
    'Alterar PIN',
    `
      <div class="f-group">
        <label>PIN atual</label>
        <input type="password" id="fPinAtual" maxlength="4" inputmode="numeric" placeholder="••••">
      </div>
      <div class="f-group">
        <label>Novo PIN</label>
        <input type="password" id="fPinNovo" maxlength="4" inputmode="numeric" placeholder="••••">
      </div>
      <div class="f-group">
        <label>Confirmar novo PIN</label>
        <input type="password" id="fPinConf" maxlength="4" inputmode="numeric" placeholder="••••">
      </div>
    `,
    `
      <button class="btn-sec" onclick="fecharModal()">Cancelar</button>
      <button class="btn-prim" onclick="salvarNovoPin()">Salvar</button>
    `
  );
}

async function salvarNovoPin() {
  const atual = document.getElementById('fPinAtual').value;
  const novo  = document.getElementById('fPinNovo').value;
  const conf  = document.getElementById('fPinConf').value;
  if (atual.length < 4) { toast('PIN atual inválido', 'erro'); return; }
  if (novo.length < 4)  { toast('Novo PIN inválido', 'erro'); return; }
  if (novo !== conf)    { toast('PINs não conferem', 'erro'); return; }
  loading(true);
  const r = await api('alterarPin', { pinAtual: atual, novoPin: novo });
  loading(false);
  if (r.ok) {
    fecharModal();
    toast('PIN alterado com sucesso!', 'ok');
  } else {
    toast(r.error, 'erro');
  }
}

async function fazerBackup() {
  loading(true);
  const r = await api('backupMeu');
  loading(false);
  if (r.ok) {
    toast('Backup realizado com sucesso!', 'ok');
  } else {
    toast(r.error, 'erro');
  }
}

async function verBackupLog() {
  loading(true);
  const r = await api('getBackupLog');
  loading(false);
  if (!r.ok) { toast(r.error, 'erro'); return; }
  const logs = r.items || [];
  const body = logs.length
    ? logs.slice(0, 20).map(l => `
        <div class="t-row">
          <div class="t-desc">
            <strong>${l.tipo || 'Backup'}</strong>
            <span>${l.data || '-'} · ${l.usuario || '-'}</span>
          </div>
          <span class="status-badge ${l.status === 'ok' ? 'quitado' : 'vencido'}">${l.status || '-'}</span>
        </div>
      `).join('')
    : '<p class="vazio">Nenhum backup realizado ainda.</p>';
  abrirModal('Histórico de Backups', body);
}

async function processarJuros() {
  if (!confirm('Processar juros de todos os acordos ativos agora?')) return;
  loading(true);
  const r = await api('processarJuros');
  loading(false);
  if (r.ok) {
    toast('Juros processados com sucesso!', 'ok');
    await Dados.carregar();
  } else {
    toast(r.error, 'erro');
  }
}

function fazerLogout() {
  if (!confirm('Deseja sair da sua conta?')) return;
  Auth.logout();
  Dados.limpar();
  const fab = document.getElementById('fab');
  if (fab) fab.remove();
  showTela('telaLogin');
}
