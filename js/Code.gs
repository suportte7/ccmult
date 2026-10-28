// ================================================================
// CONFIG
// ================================================================
var SPREADSHEET_ID = '1Ez1m_RueGeBhRnppjdLidWrV8eteiTs3B2XQZtgB7AI';

function getSS() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// ================================================================
// SETUP INICIAL
// ================================================================
function setupInicial() {
  var SS  = getSS();
  var cfg = SS.getSheetByName('_Config');
  if (!cfg) {
    cfg = SS.insertSheet('_Config');
    cfg.appendRow(['email','senhaHash','nome','aba','isAdmin','ativo','criadoEm','token','tokenEm','resetToken','resetTokenEm']);
  }
  var log = SS.getSheetByName('_BackupLog');
  if (!log) {
    log = SS.insertSheet('_BackupLog');
    log.appendRow(['data','usuario','tipo','status','obs']);
  }
  var rows  = cfg.getDataRange().getValues();
  var existe = false;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === 'admin@controlcard.com') { existe = true; break; }
  }
  if (!existe) {
    var aba = 'admin';
    cfg.appendRow(['admin@controlcard.com', hash('1234'), 'Administrador', aba, true, true, new Date().toISOString(), '', '', '', '']);
    criarAba(aba);
  }
  Logger.log('Setup concluído. Login: admin@controlcard.com / PIN: 1234');
}

// ================================================================
// ENTRY POINT
// ================================================================
function doPost(e) {
  try {
    var data   = JSON.parse(e.postData.contents);
    var action = data.action;
    var token  = data.token;

    if (action === 'login')          return resp(login(data.email, data.senha));
    if (action === 'register')       return resp(register(data.email, data.senha, data.nome));
    if (action === 'solicitarReset') return resp(solicitarReset(data.email));
    if (action === 'confirmarReset') return resp(confirmarReset(data.email, data.token, data.novoPin));

    var u = verificarToken(token);
    if (!u.ok) return resp(u);

    if (action === 'getAllMyData')    return resp(getAllMyData(u));
    if (action === 'addCartao')      return resp(addItem(u, 'CARTOES',   data.item));
    if (action === 'editCartao')     return resp(editItem(u, 'CARTOES',  data.item));
    if (action === 'deleteCartao')   return resp(deleteItem(u, 'CARTOES', data.id));
    if (action === 'addPessoa')      return resp(addItem(u, 'PESSOAS',   data.item));
    if (action === 'editPessoa')     return resp(editItem(u, 'PESSOAS',  data.item));
    if (action === 'deletePessoa')   return resp(deleteItem(u, 'PESSOAS', data.id));
    if (action === 'addGasto')       return resp(addItem(u, 'GASTOS',    data.item));
    if (action === 'editGasto')      return resp(editItem(u, 'GASTOS',   data.item));
    if (action === 'deleteGasto')    return resp(deleteItem(u, 'GASTOS',  data.id));
    if (action === 'addAcordo')      return resp(addItem(u, 'ACORDOS',   data.item));
    if (action === 'editAcordo')     return resp(editItem(u, 'ACORDOS',  data.item));
    if (action === 'deleteAcordo')   return resp(deleteItem(u, 'ACORDOS', data.id));
    if (action === 'pagarAcordo')    return resp(pagarAcordo(u, data.pagamento));
    if (action === 'alterarPin')     return resp(alterarPin(u, data.pinAtual, data.novoPin));
    if (action === 'backupMeu')      return resp(backupIndividual(u));
    if (action === 'backupGeral')    return resp(backupGeral(u));
    if (action === 'getBackupLog')   return resp(getBackupLog(u));
    if (action === 'processarJuros') return resp(processarJuros(u));
    if (action === 'getUsuarios')    return resp(getUsuarios(u));
    if (action === 'criarUsuario')   return resp(criarUsuario(u, data.novo));
    if (action === 'toggleUsuario')  return resp(toggleUsuario(u, data.email, data.ativo));
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
// LOGIN / AUTH
// ================================================================
function login(email, senha) {
  var cfg = getSS().getSheetByName('_Config');
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
  var cfg = getSS().getSheetByName('_Config');
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
  var SS  = getSS();
  var cfg = SS.getSheetByName('_Config');
  if (!cfg) return { ok: false, error: 'Sistema não configurado. Rode setupInicial.' };
  var rows = cfg.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === email) return { ok: false, error: 'Email já cadastrado.' };
  }
  var aba = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').substring(0, 20) + '_' + Date.now().toString().slice(-4);
  cfg.appendRow([email, hash(senha), nome, aba, false, true, new Date().toISOString(), '', '', '', '']);
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
  var cfg = getSS().getSheetByName('_Config');
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
          body: 'Seu token é: ' + token + '\n\nVálido por 30 minutos.'
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
      if ((new Date() - criado) > 30 * 60 * 1000) return { ok: false, error: 'Token expirado.' };
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
  var rows    = sh.getDataRange().getValues();
  var inicio  = -1;
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
  return { inicio: inicio, headers: headers, items: items };
}

function salvarBloco(sh, marcador, headers, items) {
  var rows   = sh.getDataRange().getValues();
  var inicio = -1;
  var fim    = rows.length;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][0] === marcador) { inicio = i; continue; }
    if (inicio >= 0 && i > inicio + 1 && rows[i][0] !== '' && rows[i][0].toString().startsWith('[')) {
      fim = i; break;
    }
  }
  var linhas = fim - inicio - 1;
  if (linhas > 0) sh.deleteRows(inicio + 2, linhas);
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
  return {
    ok:         true,
    cartoes:    lerBloco(sh, '[CARTOES]').items,
    pessoas:    lerBloco(sh, '[PESSOAS]').items,
    gastos:     lerBloco(sh, '[GASTOS]').items,
    acordos:    lerBloco(sh, '[ACORDOS]').items,
    pagamentos: lerBloco(sh, '[PAGAMENTOS_ACORDO]').items
  };
}

function addItem(u, bloco, item) {
  var sh    = getAba(u);
  var dados = lerBloco(sh, '[' + bloco + ']');
  item.id   = Utilities.getUuid();
  dados.items.push(item);
  salvarBloco(sh, '[' + bloco + ']', dados.headers, dados.items);
  return { ok: true, id: item.id };
}

function editItem(u, bloco, item) {
  var sh    = getAba(u);
  var dados = lerBloco(sh, '[' + bloco + ']');
  var idx   = dados.items.findIndex(function(x){ return x.id === item.id; });
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
// PAGAR ACORDO
// ================================================================
function pagarAcordo(u, pagamento) {
  var sh      = getAba(u);
  var acordos = lerBloco(sh, '[ACORDOS]');
  var idx     = acordos.items.findIndex(function(x){ return x.id === pagamento.acordoId; });
  if (idx === -1) return { ok: false, error: 'Acordo não encontrado.' };

  var acordo     = acordos.items[idx];
  var saldo      = parseFloat(acordo.valorAtual) || 0;
  var pago       = parseFloat(pagamento.valorPago) || 0;
  var novoSaldo  = saldo - pago;

  acordo.valorAtual = novoSaldo <= 0 ? 0 : novoSaldo;
  if (novoSaldo <= 0) acordo.status = 'quitado';
  acordos.items[idx] = acordo;
  salvarBloco(sh, '[ACORDOS]', acordos.headers, acordos.items);

  var pgtos = lerBloco(sh, '[PAGAMENTOS_ACORDO]');
  pagamento.id = Utilities.getUuid();
  pgtos.items.push(pagamento);
  salvarBloco(sh, '[PAGAMENTOS_ACORDO]', pgtos.headers, pgtos.items);

  return { ok: true };
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
    var juros  = parseFloat(a.jurosPercent) || 0;
    if (juros === 0) return;
    var saldo  = parseFloat(a.valorAtual) || 0;
    var tipo   = a.jurosTipo || 'mensal';
    var inc    = 0;
    if (tipo === 'mensal') inc = saldo * (juros / 100);
    if (tipo === 'anual')  inc = saldo * (juros / 100 / 12);
    if (tipo === 'diario') inc = saldo * (juros / 100) * 30;
    if (tipo === 'fixo')   inc = juros;
    a.valorAtual = (saldo + inc).toFixed(2);
    a.status     = 'vencido';
    atualizados++;
  });

  salvarBloco(sh, '[ACORDOS]', acordos.headers, acordos.items);
  return { ok: true, atualizados: atualizados };
}

// ================================================================
// BACKUP
// ================================================================
function backupIndividual(u) {
  try {
    var SS      = getSS();
    var sh      = SS.getSheetByName(u.aba);
    if (!sh) return { ok: false, error: 'Aba não encontrada.' };
    var nova    = SpreadsheetApp.create('Backup_' + u.aba + '_' + new Date().toISOString().substring(0,10));
    var destino = nova.getActiveSheet();
    var dados   = sh.getDataRange().getValues();
    destino.getRange(1, 1, dados.length, dados[0].length).setValues(dados);
    registrarBackup(u.email, u.aba, 'individual', 'ok', nova.getUrl());
    return { ok: true, url: nova.getUrl() };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

function backupGeral(u) {
  if (!u.isAdmin) return { ok: false, error: 'Acesso negado.' };
  try {
    var SS   = getSS();
    var nova = SpreadsheetApp.create('BackupGeral_' + new Date().toISOString().substring(0,10));
    var abas = SS.getSheets();
    abas.forEach(function(sh) {
      var nome = sh.getName();
      if (nome === '_Config') return;
      var dest = nova.getSheetByName(nome) || nova.insertSheet(nome);
      var dados = sh.getDataRange().getValues();
      if (dados.length > 0) dest.getRange(1, 1, dados.length, dados[0].length).setValues(dados);
    });
    registrarBackup(u.email, 'GERAL', 'geral', 'ok', nova.getUrl());
    return { ok: true, url: nova.getUrl() };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

function registrarBackup(email, aba, tipo, status, obs) {
  var log = getSS().getSheetByName('_BackupLog');
  if (!log) return;
  log.appendRow([new Date().toISOString(), email, tipo, status, obs || '']);
}

function getBackupLog(u) {
  var log = getSS().getSheetByName('_BackupLog');
  if (!log) return { ok: true, items: [] };
  var rows = log.getDataRange().getValues();
  var items = [];
  for (var i = 1; i < rows.length; i++) {
    if (!u.isAdmin && rows[i][1] !== u.email) continue;
    items.push({
      data:    rows[i][0],
      usuario: rows[i][1],
      tipo:    rows[i][2],
      status:  rows[i][3],
      obs:     rows[i][4]
    });
  }
  items.reverse();
  return { ok: true, items: items };
}

// ================================================================
// ADMIN — USUÁRIOS
// ================================================================
function getUsuarios(u) {
  if (!u.isAdmin) return { ok: false, error: 'Acesso negado.' };
  var cfg  = getSS().getSheetByName('_Config');
  var rows = cfg.getDataRange().getValues();
  var items = [];
  for (var i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    items.push({
      email:   rows[i][0],
      nome:    rows[i][2],
      aba:     rows[i][3],
      isAdmin: rows[i][4] === true,
      ativo:   rows[i][5] === true,
      criado:  rows[i][6]
    });
  }
  return { ok: true, items: items };
}

function criarUsuario(u, novo) {
  if (!u.isAdmin) return { ok: false, error: 'Acesso negado.' };
  var SS  = getSS();
  var cfg = SS.getSheetByName('_Config');
  var rows = cfg.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === novo.email) return { ok: false, error: 'Email já cadastrado.' };
  }
  var aba = novo.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').substring(0, 20) + '_' + Date.now().toString().slice(-4);
  cfg.appendRow([novo.email, hash(novo.pin), novo.nome, aba, novo.isAdmin === true, true, new Date().toISOString(), '', '', '', '']);
  criarAba(aba);
  return { ok: true };
}

function toggleUsuario(u, email, ativo) {
  if (!u.isAdmin) return { ok: false, error: 'Acesso negado.' };
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
  if (!u.isAdmin) return { ok: false, error: 'Acesso negado.' };
  if (email === u.email) return { ok: false, error: 'Você não pode excluir sua própria conta.' };
  var SS   = getSS();
  var cfg  = SS.getSheetByName('_Config');
  var rows = cfg.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === email) {
      var abaUsuario = rows[i][3];
      cfg.deleteRow(i + 1);
      var sh = SS.getSheetByName(abaUsuario);
      if (sh) SS.deleteSheet(sh);
      return { ok: true };
    }
  }
  return { ok: false, error: 'Usuário não encontrado.' };
}
