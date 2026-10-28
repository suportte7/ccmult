// ================================================================
// CONFIG
// ================================================================
var SPREADSHEET_ID = '1Ez1m_RueGeBhRnppjdLidWrV8eteiTs3B2XQZtgB7AI';

function getSS() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// ================================================================
// ENTRY POINT
// ================================================================
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var token  = data.token;

    // Ações públicas (sem token)
    if (action === 'login')          return resp(login(data.email, data.senha));
    if (action === 'register')       return resp(register(data.email, data.senha, data.nome));
    if (action === 'solicitarReset') return resp(solicitarReset(data.email));
    if (action === 'confirmarReset') return resp(confirmarReset(data.email, data.token, data.novoPin));

    // Ações autenticadas
    var u = verificarToken(token);
    if (!u.ok) return resp(u);

    if (action === 'getAllMyData')   return resp(getAllMyData(u));
    if (action === 'addCartao')     return resp(addItem(u, 'CARTOES',   data.item));
    if (action === 'editCartao')    return resp(editItem(u, 'CARTOES',  data.item));
    if (action === 'deleteCartao')  return resp(deleteItem(u, 'CARTOES', data.id));
    if (action === 'addPessoa')     return resp(addItem(u, 'PESSOAS',   data.item));
    if (action === 'editPessoa')    return resp(editItem(u, 'PESSOAS',  data.item));
    if (action === 'deletePessoa')  return resp(deleteItem(u, 'PESSOAS', data.id));
    if (action === 'addGasto')      return resp(addItem(u, 'GASTOS',    data.item));
    if (action === 'editGasto')     return resp(editItem(u, 'GASTOS',   data.item));
    if (action === 'deleteGasto')   return resp(deleteItem(u, 'GASTOS',  data.id));
    if (action === 'addAcordo')     return resp(addItem(u, 'ACORDOS',   data.item));
    if (action === 'editAcordo')    return resp(editItem(u, 'ACORDOS',  data.item));
    if (action === 'deleteAcordo')  return resp(deleteItem(u, 'ACORDOS', data.id));
    if (action === 'pagarAcordo')   return resp(pagarAcordo(u, data.pagamento));
    if (action === 'alterarPin')    return resp(alterarPin(u, data.pinAtual, data.novoPin));
    if (action === 'backupMeu')     return resp(backupIndividual(u));
    if (action === 'backupGeral')   return resp(backupGeral(u));
    if (action === 'getBackupLog')  return resp(getBackupLog(u));
    if (action === 'processarJuros') return resp(processarJuros(u));
    if (action === 'getUsuarios')   return resp(getUsuarios(u));
    if (action === 'criarUsuario')  return resp(criarUsuario(u, data.novo));
    if (action === 'toggleUsuario') return resp(toggleUsuario(u, data.email, data.ativo));
    if (action === 'deletarUsuario') return resp(deletarUsuario(u, data.email));

    return resp({ ok: false, error: 'Ação desconhecida: ' + action });
  } catch(err) {
    return resp({ ok: false, error: err.message });
  }
}

function doGet(e) {
  return HtmlService.createHtmlOutput('<h2>ControlCardMult API ok</h2>');
}

function resp(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ================================================================
// HASH
// ================================================================
function hash(str) {
  var h = 0;
  for (var i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return h.toString(16);
}

// ================================================================
// AUTH
// ================================================================
function login(email, senha) {
  var cfg  = getSS().getSheetByName('_Config');
  if (!cfg) return { ok: false, error: 'Sistema não configurado. Rode setupInicial.' };
  var rows = cfg.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === email) {
      if (!rows[i][5]) return { ok: false, error: 'Usuário inativo.' };
      if (rows[i][1] !== hash(senha)) return { ok: false, error: 'PIN incorreto.' };
      var token = Utilities.getUuid();
      cfg.getRange(i + 1, 8).setValue(token);
      cfg.getRange(i + 1, 9).setValue(new Date().toISOString());
      return {
        ok: true,
        token: token,
        user: {
          email:   rows[i][0],
          nome:    rows[i][2],
          aba:     rows[i][3],
          isAdmin: rows[i][4] === true
        }
      };
    }
  }
  return { ok: false, error: 'Email não encontrado.' };
}

function verificarToken(token) {
  if (!token) return { ok: false, error: 'Não autenticado.' };
  var cfg  = getSS().getSheetByName('_Config');
  if (!cfg) return { ok: false, error: 'Sistema não configurado.' };
  var rows = cfg.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][7] === token) {
      if (!rows[i][5]) return { ok: false, error: 'Usuário inativo.' };
      return {
        ok:      true,
        email:   rows[i][0],
        nome:    rows[i][2],
        aba:     rows[i][3],
        isAdmin: rows[i][4] === true
      };
    }
  }
  return { ok: false, error: 'Sessão inválida. Faça login novamente.' };
}

function register(email, senha, nome) {
  var SS   = getSS();
  var cfg  = SS.getSheetByName('_Config');
  if (!cfg) return { ok: false, error: 'Sistema não configurado. Rode setupInicial.' };
  var rows = cfg.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === email) return { ok: false, error: 'Email já cadastrado.' };
  }
  var aba = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').substring(0, 20) + '_' + Date.now().toString().slice(-4);
  cfg.appendRow([email, hash(senha), nome, aba, false, true, new Date().toISOString(), '', '']);
  criarAba(aba);
  return { ok: true };
}

function alterarPin(u, pinAtual, novoPin) {
  var cfg  = getSS().getSheetByName('_Config');
  var rows = cfg.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === u.email) {
      if (rows[i][1] !== hash(pinAtual)) return { ok: false, error: 'PIN atual incorreto.' };
      cfg.getRange(i + 1, 2).setValue(hash(novoPin));
      return { ok: true };
    }
  }
  return { ok: false, error: 'Usuário não encontrado.' };
}

// ================================================================
// RESET PIN
// ================================================================
function solicitarReset(email) {
  var cfg  = getSS().getSheetByName('_Config');
  if (!cfg) return { ok: false, error: 'Sistema não configurado.' };
  var rows = cfg.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === email) {
      var token = Utilities.getUuid().substring(0, 8).toUpperCase();
      cfg.getRange(i + 1, 10).setValue(token);
      cfg.getRange(i + 1, 11).setValue(new Date().toISOString());
      try {
        MailApp.sendEmail({
          to: email,
          subject: 'ControlCard — Redefinição de PIN',
          body: 'Seu token de redefinição é: ' + token + '\n\nVálido por 30 minutos.\n\nSe não foi você, ignore este email.'
        });
      } catch(e) {
        return { ok: false, error: 'Erro ao enviar email: ' + e.message };
      }
      return { ok: true };
    }
  }
  return { ok: false, error: 'Email não encontrado.' };
}

function confirmarReset(email, token, novoPin) {
  var cfg  = getSS().getSheetByName('_Config');
  var rows = cfg.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === email) {
      if (rows[i][9] !== token) return { ok: false, error: 'Token inválido.' };
      var criado = new Date(rows[i][10]);
      var agora  = new Date();
      if ((agora - criado) > 30 * 60 * 1000) return { ok: false, error: 'Token expirado.' };
      cfg.getRange(i + 1, 2).setValue(hash(novoPin));
      cfg.getRange(i + 1, 10).setValue('');
      cfg.getRange(i + 1, 11).setValue('');
      return { ok: true };
    }
  }
  return { ok: false, error: 'Email não encontrado.' };
}

// ================================================================
// ABA DO USUÁRIO
// ================================================================
function criarAba(nomeAba) {
  var SS = getSS();
  var sh = SS.getSheetByName(nomeAba);
  if (sh) return sh;
  sh = SS.insertSheet(nomeAba);
  sh.appendRow(['[CARTOES]']);
  sh.appendRow(['id','nome','numero','limite','vencimento','diaCorte','cor']);
  sh.appendRow(['[PESSOAS]']);
  sh.appendRow(['id','nome','cartaoId','telefone','observacao']);
  sh.appendRow(['[GASTOS]']);
  sh.appendRow(['id','pessoaId','cartaoId','descricao','valor','data','parcelaAtual','totalParcelas','categoria','mesRef']);
  sh.appendRow(['[ACORDOS]']);
  sh.appendRow(['id','pessoaId','descricao','valorOriginal','valorAtual','jurosPercent','jurosTipo','dataInicio','dataVenc','status','mesRef','obs']);
  sh.appendRow(['[PAGAMENTOS_ACORDO]']);
  sh.appendRow(['id','acordoId','valorPago','dataPgto','mesRef','obs']);
  return sh;
}

function getAba(u) {
  var sh = getSS().getSheetByName(u.aba);
  if (!sh) sh = criarAba(u.aba);
  return sh;
}

// ================================================================
// LEITURA / ESCRITA POR BLOCO
// ================================================================
function lerBloco(sh, marcador) {
  var rows  = sh.getDataRange().getValues();
  var inicio = -1;
  var headers = [];
  var items   = [];
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][0] === marcador) { inicio = i; continue; }
    if (inicio >= 0 && headers.length === 0 && rows[i][0] !== '') {
      headers = rows[i].filter(function(c){ return c !== ''; });
      continue;
    }
    if (inicio >= 0 && headers.length > 0) {
      if (rows[i][0] !== '' && rows[i][0].toString().startsWith('[')) break;
      if (rows[i][0] === '') continue;
      var obj = {};
      headers.forEach(function(h, idx){ obj[h] = rows[i][idx]; });
      items.push(obj);
    }
  }
  return { rows: rows, inicio: inicio, headers: headers, items: items };
}

function salvarBloco(sh, marcador, headers, items) {
  var rows   = sh.getDataRange().getValues();
  var inicio = -1;
  var fim    = -1;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][0] === marcador) { inicio = i; continue; }
    if (inicio >= 0 && fim === -1) {
      if (i > inicio + 1 && rows[i][0] !== '' && rows[i][0].toString().startsWith('[')) {
        fim = i; break;
      }
    }
  }
  if (fim === -1) fim = rows.length;

  // Apaga linhas antigas do bloco (mantém o marcador)
  var linhasParaApagar = fim - inicio - 1;
  if (linhasParaApagar > 0) {
    sh.deleteRows(inicio + 2, linhasParaApagar);
  }

  // Reinsere headers + items
  var novas = [headers];
  items.forEach(function(item){
    novas.push(headers.map(function(h){ return item[h] !== undefined ? item[h] : ''; }));
  });
  sh.insertRowsAfter(inicio + 1, novas.length);
  sh.getRange(inicio + 2, 1, novas.length, headers.length).setValues(novas);
}

// ================================================================
// CRUD GENÉRICO
// ================================================================
function getAllMyData(u) {
  var sh = getAba(u);
  var cartoes    = lerBloco(sh, '[CARTOES]').items;
  var pessoas    = lerBloco(sh, '[PESSOAS]').items;
  var gastos     = lerBloco(sh, '[GASTOS]').items;
  var acordos    = lerBloco(sh, '[ACORDOS]').items;
  var pagamentos = lerBloco(sh, '[PAGAMENTOS_ACORDO]').items;
  return { ok: true, cartoes: cartoes, pessoas: pessoas, gastos: gastos, acordos: acordos, pagamentos: pagamentos };
}

function addItem(u, bloco, item) {
  var sh     = getAba(u);
  var dados  = lerBloco(sh, '[' + bloco + ']');
  item.id    = Utilities.getUuid();
  dados.items.push(item);
  salvarBloco(sh, '[' + bloco + ']', dados.headers, dados.items);
  return { ok: true, id: item.id };
}

function editItem(u, bloco, item) {
  var sh    = getAba(u);
  var dados = lerBloco(sh, '[' + bloco + ']');
  var idx   = -1;
  for (var i = 0; i < dados.items.length; i++) {
    if (dados.items[i].id === item.id) { idx = i; break; }
  }
  if (idx === -1) return { ok: false, error: 'Item não encontrado.' };
  dados.items[idx] = item;
  salvarBloco(sh, '[' + bloco + ']', dados.headers, dados.items);
  return { ok: true };
}

function deleteItem(u, bloco, id) {
  var sh    = getAba(u);
  var dados = lerBloco(sh, '[' + bloco + ']');
  var antes = dados.items.length;
  dados.items = dados.items.filter(function(x){ return x.id !== id; });
  if (dados.items.length === antes) return { ok: false, error: 'Item não encontrado.' };
  salvarBloco(sh, '[' + bloco + ']', dados.headers, dados.items);
  return { ok: true };
}

// ================================================================
// PAGAMENTO DE ACORDO
// ================================================================
function pagarAcordo(u, pagamento) {
  var sh      = getAba(u);
  var acordos = lerBloco(sh, '[ACORDOS]');
  var idx     = -1;
  for (var i = 0; i < acordos.items.length; i++) {
    if (acordos.items[i].id === pagamento.acordoId) { idx = i; break; }
  }
  if (idx === -1) return { ok: false, error: 'Acordo não encontrado.' };

  var acordo    = acordos.items[idx];
  var valorPago = parseFloat(pagamento.valorPago) || 0;
  var saldo     = parseFloat(acordo.valorAtual)   || 0;
  var novoSaldo = saldo - valorPago;

  if (novoSaldo <= 0) {
    acordo.valorAtual = 0;
    acordo.status     = 'quitado';
  } else {
    acordo.valorAtual = novoSaldo.toFixed(2);
  }
  acordos.items[idx] = acordo;
  salvarBloco(sh, '[ACORDOS]', acordos.headers, acordos.items);

  // Registra pagamento
  pagamento.id = Utilities.getUuid();
  var pags = lerBloco(sh, '[PAGAMENTOS_ACORDO]');
  pags.items.push(pagamento);
  salvarBloco(sh, '[PAGAMENTOS_ACORDO]', pags.headers, pags.items);

  return { ok: true, quitado: acordo.status === 'quitado' };
}

// ================================================================
// PROCESSAR JUROS
// ================================================================
function processarJuros(u) {
  var sh      = getAba(u);
  var acordos = lerBloco(sh, '[ACORDOS]');
  var hoje    = new Date();
  var atualizados = 0;

  acordos.items.forEach(function(a) {
    if (a.status === 'quitado' || a.status === 'cancelado') return;
    var saldo  = parseFloat(a.valorAtual)   || 0;
    var juros  = parseFloat(a.jurosPercent) || 0;
    var tipo   = a.jurosTipo || 'mensal';
    var inicio = a.dataInicio ? new Date(a.dataInicio) : hoje;
    var fator  = 0;

    if (tipo === 'mensal') {
      fator = juros / 100;
    } else if (tipo === 'anual') {
      fator = juros / 100 / 12;
    } else if (tipo === 'diario') {
      var dias = Math.floor((hoje - inicio) / (1000 * 60 * 60 * 24));
      fator = (juros / 100) * dias;
    } else if (tipo === 'fixo') {
      fator = juros / 100;
    }

    var novoSaldo = saldo + (saldo * fator);
    a.valorAtual  = novoSaldo.toFixed(2);

    // Verifica vencimento
    if (a.dataVenc && new Date(a.dataVenc) < hoje && a.status !== 'quitado') {
      a.status = 'vencido';
    }

    atualizados++;
  });

  salvarBloco(sh, '[ACORDOS]', acordos.headers, acordos.items);
  return { ok: true, atualizados: atualizados };
}

// ================================================================
// BACKUP
// ================================================================
function backupIndividual(u) {
  var SS   = getSS();
  var sh   = SS.getSheetByName(u.aba);
  if (!sh) return { ok: false, error: 'Aba não encontrada.' };
  var nome = 'Backup_' + u.aba + '_' + new Date().toISOString().replace(/[:.]/g, '-');
  var nova = SpreadsheetApp.create(nome);
  var dest = nova.getActiveSheet();
  dest.setName(u.aba);
  var dados = sh.getDataRange().getValues();
  if (dados.length > 0) {
    dest.getRange(1, 1, dados.length, dados[0].length).setValues(dados);
  }
  var log = SS.getSheetByName('_BackupLog');
  if (log) log.appendRow([new Date().toISOString(), u.email, u.aba, nova.getUrl(), 'individual', 'ok']);
  return { ok: true, url: nova.getUrl(), nome: nome };
}

function backupGeral(u) {
  if (!u.isAdmin) return { ok: false, error: 'Sem permissão.' };
  var SS     = getSS();
  var nome   = 'Backup_GERAL_' + new Date().toISOString().replace(/[:.]/g, '-');
  var nova   = SpreadsheetApp.create(nome);
  var sheets = SS.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var src   = sheets[i];
    var dados = src.getDataRange().getValues();
    var dest;
    if (i === 0) {
      dest = nova.getActiveSheet();
      dest.setName(src.getName());
    } else {
      dest = nova.insertSheet(src.getName());
    }
    if (dados.length > 0 && dados[0].length > 0) {
      dest.getRange(1, 1, dados.length, dados[0].length).setValues(dados);
    }
  }
  var log = SS.getSheetByName('_BackupLog');
  if (log) log.appendRow([new Date().toISOString(), u.email, 'TODAS', nova.getUrl(), 'geral', 'ok']);
  return { ok: true, url: nova.getUrl(), nome: nome };
}

function getBackupLog(u) {
  var log = getSS().getSheetByName('_BackupLog');
  if (!log) return { ok: true, items: [] };
  var rows  = log.getDataRange().getValues();
  var items = [];
  for (var i = 1; i < rows.length; i++) {
    if (u.isAdmin || rows[i][1] === u.email) {
      items.push({
        data:    rows[i][0],
        usuario: rows[i][1],
        aba:     rows[i][2],
        url:     rows[i][3],
        tipo:    rows[i][4],
        status:  rows[i][5]
      });
    }
  }
  return { ok: true, items: items };
}

// ================================================================
// ADMIN — USUÁRIOS
// ================================================================
function getUsuarios(u) {
  if (!u.isAdmin) return { ok: false, error: 'Sem permissão.' };
  var cfg  = getSS().getSheetByName('_Config');
  var rows = cfg.getDataRange().getValues();
  var items = [];
  for (var i = 1; i < rows.length; i++) {
    items.push({
      email:    rows[i][0],
      nome:     rows[i][2],
      aba:      rows[i][3],
      isAdmin:  rows[i][4] === true,
      ativo:    rows[i][5] === true,
      criadoEm: rows[i][6]
    });
  }
  return { ok: true, items: items };
}

function criarUsuario(u, novo) {
  if (!u.isAdmin) return { ok: false, error: 'Sem permissão.' };
  return register(novo.email, novo.pin, novo.nome);
}

function toggleUsuario(u, email, ativo) {
  if (!u.isAdmin) return { ok: false, error: 'Sem permissão.' };
  var cfg  = getSS().getSheetByName('_Config');
  var rows = cfg.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === email) {
      cfg.getRange(i + 1, 6).setValue(ativo);
      return { ok: true };
    }
  }
  return { ok: false, error: 'Usuário não encontrado.' };
}

function deletarUsuario(u, email) {
  if (!u.isAdmin) return { ok: false, error: 'Sem permissão.' };
  if (email === u.email) return { ok: false, error: 'Não pode deletar a si mesmo.' };
  var SS   = getSS();
  var cfg  = SS.getSheetByName('_Config');
  var rows = cfg.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === email) {
      var aba = rows[i][3];
      cfg.deleteRow(i + 1);
      var sh = SS.getSheetByName(aba);
      if (sh) SS.deleteSheet(sh);
      return { ok: true };
    }
  }
  return { ok: false, error: 'Usuário não encontrado.' };
}

// ================================================================
// SETUP INICIAL (rodar 1 vez)
// ================================================================
function setupInicial() {
  var SS = getSS();
  if (!SS.getSheetByName('_Config')) {
    var cfg = SS.insertSheet('_Config');
    cfg.appendRow(['email','senhaHash','nome','aba','isAdmin','ativo','criadoEm','token','tokenData','resetToken','resetData']);
    cfg.appendRow(['admin@controlcard.com', hash('admin123'), 'Administrador', 'admin', true, true, new Date().toISOString(),'','','','']);
  }
  if (!SS.getSheetByName('_BackupLog')) {
    var log = SS.insertSheet('_BackupLog');
    log.appendRow(['data','email','aba','url','tipo','status']);
  }
  if (!SS.getSheetByName('admin')) {
    criarAba('admin');
  }
  return 'Setup concluído!';
}
