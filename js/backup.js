// ============================================
// backup.js
// ============================================
const BACKUP = {
  async render() {
    const content = document.getElementById('appContent');
    content.innerHTML = `
      <div class="section-header"><h2>Backup</h2></div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-user" style="color:var(--primary)"></i> Meus Dados</h3></div>
        <div class="card-body">
          <p>Copia sua aba para uma nova planilha no Google Drive.</p>
        </div>
        <div class="card-footer">
          <button class="btn-primary" id="btnBackupMeu"><i class="fas fa-download"></i> Fazer backup</button>
        </div>
      </div>
      ${APP.user.isAdmin ? `
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-shield-alt" style="color:var(--warning)"></i> Backup Geral</h3></div>
        <div class="card-body">
          <p>Copia TODAS as abas da planilha. Somente admin.</p>
        </div>
        <div class="card-footer">
          <button class="btn-primary" id="btnBackupGeral"><i class="fas fa-cloud-download-alt"></i> Backup Geral</button>
        </div>
      </div>` : ''}
      <div class="section-header" style="margin-top:20px"><h2>Histórico</h2></div>
      <div id="listaBackups"><p style="color:var(--text3)">Carregando...</p></div>
    `;
    document.getElementById('btnBackupMeu').onclick = () => this.fazerBackup('meu');
    if (APP.user.isAdmin) {
      document.getElementById('btnBackupGeral').onclick = () => this.fazerBackup('geral');
    }
    await this.carregarLog();
  },

  async fazerBackup(tipo) {
    UI.loading(true);
    const res = tipo === 'geral' ? await API.backupGeral() : await API.backupMeu();
    UI.loading(false);
    if (!res.ok) { UI.toast(res.error, 'danger'); return; }
    UI.toast('Backup criado!', 'success');
    window.open(res.url, '_blank');
    await this.carregarLog();
  },

  async carregarLog() {
    const res = await API.getBackupLog();
    const lista = document.getElementById('listaBackups');
    if (!lista) return;
    if (!res.ok || !res.items.length) {
      lista.innerHTML = `<p style="color:var(--text3);font-size:14px">Nenhum backup ainda</p>`;
      return;
    }
    lista.innerHTML = [...res.items].reverse().map(b => `
      <div class="card">
        <div class="card-body">
          <p><strong>${b.nome || b.aba}</strong> <span class="card-badge badge-info">${b.tipo}</span></p>
          <p style="font-size:12px;color:var(--text3)">${new Date(b.data).toLocaleString('pt-BR')}</p>
          ${b.url ? `<a href="${b.url}" target="_blank" style="color:var(--primary);font-size:13px">Abrir no Drive</a>` : ''}
        </div>
      </div>
    `).join('');
  },
};