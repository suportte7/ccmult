const Auth = {
  user: null,

  init() {
    const t = localStorage.getItem('ccm_token');
    const u = localStorage.getItem('ccm_user');
    if (t && u) {
      this.user = JSON.parse(u);
      return true;
    }
    return false;
  },

  salvar(token, user) {
    localStorage.setItem('ccm_token', token);
    localStorage.setItem('ccm_user', JSON.stringify(user));
    this.user = user;
  },

  logout() {
    localStorage.removeItem('ccm_token');
    localStorage.removeItem('ccm_user');
    localStorage.removeItem('ccm_dados');
    this.user = null;
  },

  isAdmin() {
    return this.user && this.user.isAdmin === true;
  }
};
