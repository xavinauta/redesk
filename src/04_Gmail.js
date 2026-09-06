/**
 * REDESK — Automatización de cotizaciones
 * ---------------------------------------
 * 04_Gmail.js — lee del correo las solicitudes de cotización y devuelve la
 * respuesta como BORRADOR con el PDF adjunto.
 *
 * Este archivo nunca envía correo. Siempre deja un borrador para que la
 * persona revise precios y plazos antes de enviarlo.
 */

/**
 * Busca en Gmail correos que pidan cotización y los vuelca en la hoja
 * Solicitudes. Es idempotente: no repite hilos ya listados.
 */
function leerSolicitudes() {
  const cfg = leerConfig();
  const consulta = String(cfg.GMAIL_BUSQUEDA || '').trim();
  if (!consulta) throw new Error('Config ▸ GMAIL_BUSQUEDA está vacío.');

  const h = hoja_(HOJAS.SOLICITUDES);
  const conocidos = {};
  if (h.getLastRow() >= 2) {
    h.getRange(2, 9, h.getLastRow() - 1, 1).getValues().forEach(function (f) {
      if (f[0]) conocidos[String(f[0]).trim()] = true;
    });
  }

  const hilos = GmailApp.search(consulta, 0, 50);
  const nuevas = [];

  hilos.forEach(function (hilo) {
    const id = hilo.getId();
    if (conocidos[id]) return;

    const mensajes = hilo.getMessages();
    const ultimoAjeno = ultimoMensajeDeTercero_(mensajes);
    if (!ultimoAjeno) return;

    const cuerpo = limpiarCuerpo_(ultimoAjeno.getPlainBody());
    const remitente = ultimoAjeno.getFrom();

    nuevas.push([
      ultimoAjeno.getDate(),
      remitente,
      empresaDeRemitente_(remitente),
      hilo.getFirstMessageSubject(),
      cuerpo.slice(0, 800),
      detectarPlazo_(cuerpo),
      'Pendiente',
      formula_('=HYPERLINK("https://mail.google.com/mail/u/0/#inbox/' + id +
        '","Abrir")'),
      id,
    ]);
  });

  if (!nuevas.length) {
    aviso_('No hay solicitudes nuevas.');
    return;
  }

  h.getRange(h.getLastRow() + 1, 1, nuevas.length, nuevas[0].length)
    .setValues(nuevas);
  h.getRange(2, 1, h.getLastRow() - 1, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  libro_().setActiveSheet(h);
  aviso_(nuevas.length + ' solicitud(es) nueva(s).');
}

/**
 * Último mensaje del hilo que no escribió la propia cuenta.
 * @param {!Array<!GoogleAppsScript.Gmail.GmailMessage>} mensajes
 * @return {?GoogleAppsScript.Gmail.GmailMessage}
 */
function ultimoMensajeDeTercero_(mensajes) {
  const propios = direccionesPropias_();
  for (let i = mensajes.length - 1; i >= 0; i--) {
    const de = extraerEmail_(mensajes[i].getFrom()).toLowerCase();
    if (propios.indexOf(de) === -1) return mensajes[i];
  }
  return null;
}

/**
 * Direcciones que cuentan como "yo": la cuenta activa y sus alias.
 * @return {!Array<string>}
 */
function direccionesPropias_() {
  const propias = [];
  try {
    const yo = Session.getActiveUser().getEmail();
    if (yo) propias.push(yo.toLowerCase());
  } catch (err) { /* sin permiso de identidad: seguimos con los alias */ }
  try {
    GmailApp.getAliases().forEach(function (a) { propias.push(a.toLowerCase()); });
  } catch (err) { /* la cuenta puede no tener alias */ }
  return propias;
}

/**
 * Extrae la dirección de un encabezado tipo `Nombre <a@b.com>`.
 * @param {string} de
 * @return {string}
 */
function extraerEmail_(de) {
  const m = String(de).match(/<([^>]+)>/);
  return (m ? m[1] : String(de)).trim();
}

/**
 * Nombre comercial deducido del dominio del remitente: `compras@tecopesca.com`
 * produce `Tecopesca`. Es sólo una pista para la columna Empresa.
 * @param {string} de
 * @return {string}
 */
function empresaDeRemitente_(de) {
  const email = extraerEmail_(de);
  const partes = email.split('@');
  if (partes.length !== 2) return '';
  const dominio = partes[1].toLowerCase()
    .replace(/\.(com|net|org|ec|gob|edu|coop)(\.[a-z]{2})?$/g, '')
    .split('.')[0];
  if (!dominio) return '';
  return dominio.charAt(0).toUpperCase() + dominio.slice(1);
}

/**
 * Quita del cuerpo las citas del hilo anterior y las firmas legales largas,
 * que en los correos de compras ocupan más que el pedido en sí.
 * @param {string} texto
 * @return {string}
 */
function limpiarCuerpo_(texto) {
  return String(texto || '')
    .split(/^\s*(?:El .+ escribió:|De:\s|-{2,}\s*Mensaje original)/m)[0]
    .replace(/^>.*$/gm, '')
    .replace(/Este mensaje[\s\S]*$/i, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Busca en el cuerpo la frase que fija el plazo de respuesta.
 * @param {string} texto
 * @return {string} el plazo detectado, o cadena vacía
 */
function detectarPlazo_(texto) {
  const patrones = [
    /(?:dentro de|en menos de|máxim[oa]\s+(?:de\s+)?)\s*\d+\s*horas?/i,
    /enviar\s+(?:la\s+)?(?:cotizaci[oó]n|proforma)[^.\n]{0,60}/i,
    /m[aá]xim[oa]\s+(?:el|hasta)\s+[^.\n]{0,40}/i,
    /\d+\s*horas?\b/i,
  ];
  for (let i = 0; i < patrones.length; i++) {
    const m = String(texto).match(patrones[i]);
    if (m) return m[0].replace(/\s+/g, ' ').trim();
  }
  return '';
}

/**
 * Toma la fila seleccionada en Solicitudes y prepara con ella una cotización
 * nueva: número, cliente (si se reconoce), asunto e ID del hilo.
 */
function cotizarSolicitudSeleccionada() {
  const ss = libro_();
  const h = hoja_(HOJAS.SOLICITUDES);
  if (ss.getActiveSheet().getName() !== HOJAS.SOLICITUDES) {
    throw new Error('Abre la hoja "' + HOJAS.SOLICITUDES +
      '" y sitúate en la fila que quieres cotizar.');
  }
  const fila = ss.getActiveRange().getRow();
  if (fila < 2) throw new Error('Selecciona una fila de solicitud.');

  const datos = h.getRange(fila, 1, 1, 9).getValues()[0];
  const remitente = String(datos[1] || '');
  const asunto = String(datos[3] || '');
  const hiloId = String(datos[8] || '');
  if (!hiloId) throw new Error('Esa fila no tiene ID de hilo.');

  const hc = hoja_(HOJAS.COTIZACION);
  limpiarFormulario_(hc);
  const cfg = leerConfig();
  const numero = siguienteNumero_();

  hc.getRange(COT.FILA_NUMERO, COT.COL_VALOR).setValue(numero);
  hc.getRange(COT.FILA_FECHA, COT.COL_VALOR).setValue(new Date());
  hc.getRange(COT.FILA_ASUNTO, COT.COL_VALOR)
    .setValue(asunto.replace(/^(re|rv|fwd):\s*/i, '').trim());
  aplicarCondicionesPorDefecto_(hc, cfg);
  hc.getRange(COT.FILA_HILO, COT.COL_VALOR).setValue(hiloId);

  const cliente = clientePorCorreo_(extraerEmail_(remitente));
  if (cliente) hc.getRange(COT.FILA_CLIENTE, COT.COL_VALOR).setValue(cliente);

  h.getRange(fila, 7).setValue('Cotizada');

  ss.setActiveSheet(hc);
  hc.setActiveSelection(hc.getRange(
    cliente ? COT.FILA_PRIMER_ITEM : COT.FILA_CLIENTE,
    cliente ? COT.COL_CODIGO : COT.COL_VALOR));

  aviso_(cliente
    ? 'Proforma ' + numero + ' para ' + cliente + '. Carga los ítems.'
    : 'Proforma ' + numero + '. No reconocí al cliente: elígelo a mano.');
}

/**
 * Busca en Clientes la empresa cuyo correo (o dominio) coincide con el del
 * remitente.
 * @param {string} email
 * @return {string} razón social, o cadena vacía si no hay coincidencia
 */
function clientePorCorreo_(email) {
  const h = hoja_(HOJAS.CLIENTES);
  if (h.getLastRow() < 2) return '';
  const datos = h.getRange(2, 1, h.getLastRow() - 1, CLI.ULTIMA).getValues();
  const buscado = email.toLowerCase().trim();
  const dominio = buscado.split('@')[1] || '';

  let porDominio = '';
  for (let i = 0; i < datos.length; i++) {
    const empresa = String(datos[i][CLI.EMPRESA - 1] || '').trim();
    if (!empresa) continue;
    const correos = (String(datos[i][CLI.EMAIL - 1] || '') + ',' +
      String(datos[i][CLI.CC - 1] || '')).toLowerCase();
    if (correos.indexOf(buscado) !== -1) return empresa;
    if (dominio && !porDominio && correos.indexOf('@' + dominio) !== -1) {
      porDominio = empresa;
    }
  }
  return porDominio;
}

/**
 * Genera el PDF y deja en Gmail el borrador de respuesta con el adjunto.
 * Si la cotización tiene ID de hilo, responde dentro de ese hilo; si no,
 * crea un correo nuevo al contacto del cliente.
 */
function generarPdfYBorrador() {
  const c = leerCotizacion_();
  const destino = c.datosCliente.email || c.email;
  if (!c.hilo && !destino) {
    throw new Error(
      'No sé a quién responder: la cotización no tiene ID de hilo y el ' +
      'cliente no tiene correo en la hoja Clientes.');
  }

  const archivo = generarPdfDeCotizacion_(c);
  const adjunto = archivo.getBlob();
  const cuerpo = cuerpoCorreo_(c);
  const opciones = {
    htmlBody: cuerpo.html,
    attachments: [adjunto],
  };
  const alias = aliasValido_();
  if (alias) opciones.from = alias;

  let borrador;
  if (c.hilo) {
    const hilo = GmailApp.getThreadById(c.hilo);
    if (!hilo) {
      throw new Error('No encuentro el hilo de Gmail ' + c.hilo +
        '. Borra el ID de la fila "ID hilo Gmail" para enviar un correo nuevo.');
    }
    borrador = hilo.createDraftReplyAll(cuerpo.texto, opciones);
  } else {
    if (c.datosCliente.cc) opciones.cc = c.datosCliente.cc;
    borrador = GmailApp.createDraft(
      destino,
      'Cotización ' + c.numero + (c.asunto ? ' — ' + c.asunto : ''),
      cuerpo.texto,
      opciones);
  }

  registrarEnHistorial_(c, archivo.getUrl(), 'Borrador');

  const url = 'https://mail.google.com/mail/u/0/#drafts/' +
    borrador.getMessage().getId();
  const html = HtmlService.createHtmlOutput(
    '<div style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6">' +
    '<p>Borrador creado con el PDF adjunto. <b>No se envió nada.</b></p>' +
    '<p><a href="' + url + '" target="_blank">Revisar y enviar en Gmail</a><br>' +
    '<a href="' + archivo.getUrl() + '" target="_blank">Ver el PDF</a></p>' +
    '</div>').setWidth(420).setHeight(180);
  SpreadsheetApp.getUi().showModalDialog(html, 'Cotización ' + c.numero);
}

/**
 * Alias de envío configurado, sólo si Gmail lo reconoce.
 * @return {string} el alias, o cadena vacía para usar la cuenta principal
 */
function aliasValido_() {
  const cfg = leerConfig();
  const alias = String(cfg.GMAIL_ALIAS || '').trim();
  if (!alias) return '';
  try {
    return GmailApp.getAliases().indexOf(alias) !== -1 ? alias : '';
  } catch (err) {
    return '';
  }
}

/**
 * Redacta el correo de respuesta en texto plano y en HTML.
 * @param {!Object} c
 * @return {{texto: string, html: string}}
 */
function cuerpoCorreo_(c) {
  const cfg = c.cfg;
  const saludo = c.datosCliente.contacto
    ? 'Estimado/a ' + c.datosCliente.contacto.split(' ')[0] + ':'
    : 'Estimados:';

  // Los clientes piden siempre "enfatizar tiempo de entrega", así que las
  // observaciones por ítem se resumen en el cuerpo del correo.
  const entrega = tiempoDeEntrega_(c);

  const lineas = [
    saludo,
    '',
    'Adjunto la cotización ' + c.numero +
      (c.asunto ? ' por ' + c.asunto : '') + '.',
    '',
    'Tiempo de entrega: ' + entrega,
    'Forma de pago: ' + c.pago,
    'Garantía: ' + c.garantia,
    'Validez de la oferta: ' + c.validez,
    '',
    'Quedo atento a cualquier consulta.',
    '',
    'Atentamente:',
    '',
  ].concat(firmaCorreo_(cfg).map(function (l) { return l.texto; }));
  const texto = lineas.join('\n');

  const html =
    '<div style="font-family:Arial,sans-serif;font-size:13px;line-height:1.5">' +
    '<p>' + escaparHtml_(saludo) + '</p>' +
    '<p>Adjunto la cotización <b>' + escaparHtml_(c.numero) + '</b>' +
    (c.asunto ? ' por ' + escaparHtml_(c.asunto) : '') + '.</p>' +
    '<p><b>Tiempo de entrega:</b> ' + escaparHtml_(entrega) + '<br>' +
    '<b>Forma de pago:</b> ' + escaparHtml_(c.pago) + '<br>' +
    '<b>Garantía:</b> ' + escaparHtml_(c.garantia) + '<br>' +
    '<b>Validez de la oferta:</b> ' + escaparHtml_(String(c.validez)) +
    '</p>' +
    '<p>Quedo atento a cualquier consulta.</p>' +
    '<p>Atentamente:<br><br>' +
    firmaCorreo_(cfg).map(function (l) { return l.html; }).join('<br>') +
    '</p></div>';

  return { texto: texto, html: html };
}

/**
 * Arma la firma del correo con el mismo orden y las mismas etiquetas que la
 * que REDESK ya usa. Devuelve cada línea en texto plano y en HTML para que
 * las dos versiones del correo no se desincronicen.
 *
 * @param {!Object<string, *>} cfg
 * @return {!Array<{texto: string, html: string}>}
 */
function firmaCorreo_(cfg) {
  const firmante = String(cfg.CORREO_FIRMANTE || cfg.EMPRESA_REPRESENTANTE || '');
  const cargo = String(cfg.EMPRESA_CARGO || '');
  const empresa = String(cfg.EMPRESA_NOMBRE || '');

  const lineas = [
    { texto: firmante, html: '<b>' + escaparHtml_(firmante) + '</b>' },
    { texto: [cargo, empresa].filter(Boolean).join(' de ') },
    { texto: 'Mail: ' + String(cfg.EMPRESA_EMAIL || '') },
    { texto: 'Celular: ' + String(cfg.EMPRESA_TELEFONOS || '') },
  ];
  if (cfg.EMPRESA_FACEBOOK) {
    lineas.push({ texto: 'Facebook: ' + String(cfg.EMPRESA_FACEBOOK) });
  }
  if (cfg.EMPRESA_TWITTER) {
    lineas.push({ texto: 'Twitter: ' + String(cfg.EMPRESA_TWITTER) });
  }
  lineas.push({ texto: 'Web: ' + String(cfg.EMPRESA_WEB || '') });

  return lineas.map(function (l) {
    return { texto: l.texto, html: l.html || escaparHtml_(l.texto) };
  });
}

/**
 * Resume el tiempo de entrega de la proforma a partir de la columna
 * Observación: si todos los ítems coinciden se enuncia una sola vez, y si no
 * se listan por ítem para no perder el matiz.
 *
 * @param {!Object} c
 * @return {string}
 */
function tiempoDeEntrega_(c) {
  const valores = c.items
    .map(function (i) { return i.observacion; })
    .filter(Boolean);
  if (!valores.length) return String(c.cfg.OBSERVACION_DEFECTO || '');

  const unicos = valores.filter(function (v, i) {
    return valores.indexOf(v) === i;
  });
  if (unicos.length === 1) return unicos[0];

  return c.items
    .filter(function (i) { return i.observacion; })
    .map(function (i) { return i.descripcion.split('\n')[0] + ': ' + i.observacion; })
    .join('; ');
}
