/**
 * REDESK — Automatización de cotizaciones
 * ---------------------------------------
 * 03_Pdf.js — arma el PDF a partir de plantilla.html y lo archiva en Drive.
 */

/** Punto de entrada del menú REDESK ▸ Generar PDF. */
function generarPdf() {
  const c = leerCotizacion_();
  const archivo = generarPdfDeCotizacion_(c);
  registrarEnHistorial_(c, archivo.getUrl(), 'Borrador');

  const ui = SpreadsheetApp.getUi();
  const html = HtmlService.createHtmlOutput(
    '<p style="font-family:Arial,sans-serif;font-size:13px">' +
    'PDF generado y guardado en Drive:</p>' +
    '<p style="font-family:Arial,sans-serif;font-size:13px">' +
    '<a href="' + archivo.getUrl() + '" target="_blank">' +
    escaparHtml_(archivo.getName()) + '</a></p>')
    .setWidth(420).setHeight(140);
  ui.showModalDialog(html, 'Cotización ' + c.numero);
}

/**
 * Genera el PDF de una cotización y lo guarda en la carpeta configurada.
 * Si ya existía un PDF con el mismo nombre, lo envía a la papelera para no
 * dejar versiones sueltas conviviendo.
 *
 * @param {!Object} c cotización leída con leerCotizacion_()
 * @return {!GoogleAppsScript.Drive.File}
 */
function generarPdfDeCotizacion_(c) {
  const blob = construirBlobPdf_(c);
  const carpeta = carpetaCotizaciones_();

  const existentes = carpeta.getFilesByName(blob.getName());
  while (existentes.hasNext()) existentes.next().setTrashed(true);

  return carpeta.createFile(blob);
}

/**
 * Renderiza plantilla.html con los datos de la cotización y devuelve el
 * blob del PDF ya nombrado.
 *
 * @param {!Object} c
 * @return {!GoogleAppsScript.Base.Blob}
 */
function construirBlobPdf_(c) {
  const t = HtmlService.createTemplateFromFile('plantilla');
  t.d = datosPlantilla_(c);
  return t.evaluate().getAs(MimeType.PDF).setName(nombreArchivo_(c));
}

/**
 * Aplana la cotización a los campos que espera la plantilla, con los
 * importes ya formateados (la plantilla no debe hacer cálculos).
 *
 * @param {!Object} c
 * @return {!Object}
 */
function datosPlantilla_(c) {
  const cfg = c.cfg;
  const cl = c.datosCliente;

  return {
    color: String(cfg.COLOR_PRIMARIO || '#1F4E79'),
    logo: String(cfg.EMPRESA_LOGO_URL || ''),
    empresa: String(cfg.EMPRESA_NOMBRE || ''),
    ruc: String(cfg.EMPRESA_RUC || ''),
    direccion: String(cfg.EMPRESA_DIRECCION || ''),
    ciudad: String(cfg.EMPRESA_CIUDAD || ''),
    telefonos: String(cfg.EMPRESA_TELEFONOS || ''),
    email: String(cfg.EMPRESA_EMAIL || ''),
    web: String(cfg.EMPRESA_WEB || ''),
    representante: String(cfg.EMPRESA_REPRESENTANTE || ''),
    cargo: String(cfg.EMPRESA_CARGO || ''),

    numero: c.numero,
    fechaTexto: c.fechaTexto,
    referencia: c.referencia,

    clienteNombre: cl.empresa || c.cliente,
    clienteRuc: cl.ruc,
    clienteContacto: cl.contacto || c.contacto,
    clienteCargo: cl.cargo,
    clienteEmail: cl.email || c.email,
    clienteDireccion: cl.direccion,
    clienteTelefono: cl.telefono,

    items: c.items.map(function (it) {
      return {
        n: it.n,
        codigo: it.codigo,
        cantidad: it.cantidad,
        // Las especificaciones suelen venir en varias líneas dentro de una
        // celda; sin esto el PDF las imprimiría como un párrafo corrido.
        descripcionHtml: multilinea_(it.descripcion),
        marca: it.marca,
        punitarioTexto: money_(it.punitario),
        descuentoTexto: it.descuento
          ? (it.descuento * 100).toFixed(0) + '%'
          : '—',
        totalTexto: money_(it.total),
      };
    }),

    moneda: c.moneda,
    subtotalTexto: money_(c.subtotal),
    ivaTexto: money_(c.iva),
    totalTexto: money_(c.total),
    ivaPctTexto: (c.ivaPct * 100).toFixed(0) + '%',

    entrega: c.entrega,
    pago: c.pago,
    validez: c.validez,
    garantia: c.garantia,
    observacionesHtml: multilinea_(c.observaciones),
    tieneObservaciones: !!c.observaciones,
  };
}

/**
 * Escapa un texto y convierte sus saltos de línea en <br>, para insertarlo
 * en la plantilla con <?!= ?>.
 * @param {string} texto
 * @return {string} HTML seguro
 */
function multilinea_(texto) {
  return escaparHtml_(String(texto || '')).replace(/\r?\n/g, '<br>');
}

/**
 * Nombre del archivo PDF: "COT-2026-0007 - TECOPESCA - Equipos Lenovo.pdf".
 * @param {!Object} c
 * @return {string}
 */
function nombreArchivo_(c) {
  const partes = [c.numero, c.cliente];
  if (c.referencia) partes.push(c.referencia);
  const nombre = partes.join(' - ')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
  return nombre + '.pdf';
}

/**
 * Carpeta de Drive donde se archivan los PDF. La crea si hace falta.
 * @return {!GoogleAppsScript.Drive.Folder}
 */
function carpetaCotizaciones_() {
  const cfg = leerConfig();
  if (carpetaValida_(cfg.CARPETA_COTIZACIONES_ID)) {
    return DriveApp.getFolderById(String(cfg.CARPETA_COTIZACIONES_ID));
  }
  const carpeta = subcarpeta_(carpetaDelLibro_(), 'REDESK - Cotizaciones');
  escribirConfig_('CARPETA_COTIZACIONES_ID', carpeta.getId());
  return carpeta;
}

/**
 * Escapa texto para insertarlo en HTML construido a mano.
 * @param {string} s
 * @return {string}
 */
function escaparHtml_(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
