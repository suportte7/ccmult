// ============================================
// admin.js
// ============================================
const ADMIN = {
  async render() {
    if (!APP.user.isAdmin) { UI.toast('Sem permissão', 'danger'); return; }
    const content = document.getElementById('appContent');
    content.innerHTML = `
      <div class="section-header">
        <h2>Usuários</h2>
        <button class="btn-primary btn-small" id="btnCriarUser">
          <i class="fas fa-user-plus"></i> Novo
        </button>
      </div>
      <div id="listaUsuarios"><p style="color:var(--text3)">Carregando...</p></div>
    `;
    document.getElementById('btnCriarUser').onclick = () => this.formCriar();
    await this.carregar();
  },

  async carregar() {
    const res = await API.getUsuarios();
    const lista = document.getElementById('listaUsuarios');
    if (!lista) return;
    if (!res.ok) { lista.innerHTML = `<p style="color:var(--danger)">${res.error}</p>`; return; }
    if (!res.users.length) {
      lista.innerHTML = `<div class="section-empty"><i class="fas fa-users"></i><p>Nenhum usuário</p></div>`;
      return;
    }
    lista.innerHTML = res.users.map(u => `
      <div class="card">
        <div class="card-header">
          <h3>${u.nome} ${u.isAdmin ? '<span class="card-badge badge-info">Admin</span>' : ''}</h3>
          ${UI.badge(u.ativo ? 'ativo' : 'inativo')}
        </div>
        <div class="card-body">
          <p>${u.email}</p>
          <p style="font-size:12px;color:var(--text3)">Criado em ${new Date(u.criadoEm).toLocaleDateString('pt-BR')}</p>
        </div>
        <div class="card-footer">
          <button class="btn-secondary btn-small" onclick="ADMIN.toggle('${u.email}', ${!u.ativo})">
            <i class="fas fa-${u.ativo ? 'ban' : 'check'}"></i> ${u.ativo ? 'Desativar' : 'Ativar'}
          </button>
          ${!u.isAdmin ? `
          <button class="btn-danger btn-small" onclick="ADMIN.deletar('${u.email}', '${u.nome}')">
            <i class="fas fa-trash"></i>
          </button>` : ''}
        </div>
      </div>
    `).join('');
  },

  formCriar() {
    UI.modal('Criar Usuário', `
      <div class="form-group">
        <label>Nome</label>
        <input id="newNome" type="text" placeholder="Nome completo">
      </div>
      <div class="form-group">
        <label>Email</label>
        <input id="newEmail" type="email" placeholder="email@exemplo.com">
      </div>
      <div class="form-group">
        <label>Senha provisória</label>
        <input id="newSenha" type="text" placeholder="Mínimo 6 caracteres">
      </div>
    `, `
      <button class="btn-secondary modal-close">Cancelar</button>
      <button class="btn-primary" id="btnSalvarUser"><i class="fas fa-save"></i> Criar</button>
    `);
    document.getElementById('btnSalvarUser').onclick = () => this.criar();
  },

  async criar() {
    const novo = {
      nome:  document.getElementById('newNome').value.trim(),
      email: document.getElementById('newEmail').value.trim(),
      senha: document.getElementById('newSenha').value,
    };
    if (!novo.nome || !novo.email || novo.senha.length < 6) {
      UI.toast('Preencha todos os campos (senha mín. 6 caracteres)', 'danger'); return;
    }
    UI.loading(true);
    const res = await API.criarUsuario(novo);
    UI.loading(false);
    if (!res.ok) { UI.toast(res.error, 'danger'); return; }
    UI.fecharModal();
    UI.toast('Usuário criado!', 'success');
    await this.carregar();
  },

  async toggle(email, ativo) {
    UI.loading(true);
    const res = await API.toggleUsuario(email, ativo);
    UI.loading(false);
    if (!res.ok) { UI.toast(res.error, 'danger'); return; }
    UI.toast(ativo ? 'Usuário ativado' : 'Usuário desativado', 'success');
    await this.carregar();
  },

  deletar(email, nome) {
    UI.confirmar(`Deletar usuário "${nome}" e TODOS os seus dados?`, async () => {
      UI.loading(true);
      const res = await API.deletarUsuario(email);
      UI.loading(false);
      if (!res.ok) { UI.toast(res.error, 'danger'); return; }
      UI.toast('Usuário deletado', 'success');
      await this.carregar();
    });
  },
};