const Dados = {
  cartoes: [],
  pessoas: [],
  gastos: [],
  acordos: [],
  pagamentos: [],

  async carregar() {
    loading(true);
    const r = await api('getAllMyData');
    loading(false);
    if (r.ok) {
      this.cartoes    = r.cartoes    || [];
      this.pessoas    = r.pessoas    || [];
      this.gastos     = r.gastos     || [];
      this.acordos    = r.acordos    || [];
      this.pagamentos = r.pagamentos || [];
      localStorage.setItem('ccm_dados', JSON.stringify({
        cartoes:    this.cartoes,
        pessoas:    this.pessoas,
        gastos:     this.gastos,
        acordos:    this.acordos,
        pagamentos: this.pagamentos
      }));
    } else {
      toast(r.error, 'erro');
    }
    return r.ok;
  },

  carregarLocal() {
    const d = localStorage.getItem('ccm_dados');
    if (d) {
      const p = JSON.parse(d);
      this.cartoes    = p.cartoes    || [];
      this.pessoas    = p.pessoas    || [];
      this.gastos     = p.gastos     || [];
      this.acordos    = p.acordos    || [];
      this.pagamentos = p.pagamentos || [];
      return true;
    }
    return false;
  },

  limpar() {
    this.cartoes    = [];
    this.pessoas    = [];
    this.gastos     = [];
    this.acordos    = [];
    this.pagamentos = [];
    localStorage.removeItem('ccm_dados');
  }
};