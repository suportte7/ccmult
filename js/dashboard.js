function renderDashboard(el) {
  const mes = mesAtual();
  const totalGastosMes = Dados.gastos
    .filter(g => (g.mesRef || '').substring(0, 7) === mes)
    .reduce((s, g) => s + (parseFloat(g.valor) || 0), 0);
  const acordosAtivos = Dados.acordos
    .filter(a => a.status !== 'quitado' && a.status !== 'cancelado').length;
  const totalAcordos = Dados.acordos
    .filter(a => a.status !== 'quitado' && a.status !== 'cancelado')
    .reduce((s, a) => s + (parseFloat(a.valorAtual) || 0), 0);

  el.innerHTML = `
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <div class="brand-mark" style="width:22px;height:22px;font-size:0.65rem">CC</div>
        <span style="font-size:0.65rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text-light)">
          ControlCard
          <span style="font-size:0.55rem;background:var(--surface);border:1px solid var(--border);padding:2px 6px;border-radius:4px;font-weight:normal;margin-left:4px">v2.0</span>
        </span>
      </div>
      <h2>Olá, ${Auth.user.nome.split(' ')[0]}! 👋</h2>
      <p>${new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' })}</p>
    </div>

    <div class="metric-grid">
      <div class="metric"><small>Cartões</small><strong>${Dados.cartoes.length}</strong></div>
      <div class="metric"><small>Pessoas</small><strong>${Dados.pessoas.length}</strong></div>
      <div class="metric"><small>Gastos/mês</small><strong>${fmt(totalGastosMes)}</strong></div>
    </div>
    <div class="metric-grid">
      <div class="metric" style="border-top-color:var(--primary)">
        <small>Acordos ativos</small><strong>${acordosAtivos}</strong>
      </div>
      <div class="metric" style="border-top-color:var(--danger);grid-column:span 2">
        <small>Total em aberto</small><strong>${fmt(totalAcordos)}</strong>
      </div>
    </div>

    <div class="section-label">Últimos Gastos</div>
    ${dashUltimosGastos()}

    <div class="section-label">Acordos Pendentes</div>
    ${dashAcordosPendentes()}
  `;
}

function dashUltimosGastos() {
  const lista = [...Dados.gastos]
    .sort((a, b) => new Date(b.data) - new Date(a.data))
    .slice(0, 5);
  if (!lista.length) return '<p class="vazio">Nenhum gasto registrado.</p>';
  return lista.map(g => {
    const p = Dados.pessoas.find(x => x.id === g.pessoaId);
    const c = Dados.cartoes.find(x => x.id === g.cartaoId);
    const parc = g.totalParcelas > 1
      ? `<span class="parc-badge">${g.parcelaAtual}/${g.totalParcelas}</span>` : '';
    return `
      <div class="tree-card">
        <div class="tree-header">
          <div class="t-desc">
            <strong>${g.descricao} ${parc}</strong>
            <span>${p ? p.nome : '-'} · ${c ? c.nome : '-'} · ${fmtData(g.data)}</span>
            ${g.categoria ? `<span class="cat-badge">${g.categoria}</span>` : ''}
          </div>
          <span class="t-val desp">${fmt(g.valor)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function dashAcordosPendentes() {
  const lista = Dados.acordos
    .filter(a => a.status !== 'quitado' && a.status !== 'cancelado')
    .slice(0, 5);
  if (!lista.length) return '<p class="vazio">Nenhum acordo pendente.</p>';
  return lista.map(a => {
    const p = Dados.pessoas.find(x => x.id === a.pessoaId);
    const vencido = a.dataVenc && new Date(a.dataVenc) < new Date();
    return `
      <div class="tree-card">
        <div class="tree-header">
          <div class="t-desc">
            <strong>${a.descricao}</strong>
            <span>${p ? p.nome : '-'} · Vence: ${fmtData(a.dataVenc)}</span>
            <span class="status-badge ${vencido ? 'vencido' : 'pendente'}">
              ${vencido ? 'Vencido' : 'Pendente'}
            </span>
          </div>
          <span class="t-val desp">${fmt(a.valorAtual)}</span>
        </div>
      </div>
    `;
  }).join('');
}
