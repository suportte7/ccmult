async function api(action, data = {}) {
  try {
    const token = localStorage.getItem('ccm_token');
    const body  = JSON.stringify({ action, token, ...data });
    const res   = await fetch(API_URL, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'text/plain' }
    });
    return await res.json();
  } catch (e) {
    return { ok: false, error: 'Erro de conexão: ' + e.message };
  }
}
