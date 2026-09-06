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
  ui.showModalDialog(html, 'Proforma ' + c.numero);
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
 * importes ya formateados y las imágenes ya incrustadas (la plantilla no
 * debe hacer cálculos ni tocar Drive).
 *
 * @param {!Object} c
 * @return {!Object}
 */
function datosPlantilla_(c) {
  const cfg = c.cfg;
  const cl = c.datosCliente;

  return {
    acento: String(cfg.COLOR_ACENTO || '#8EAADB'),
    destacado: String(cfg.COLOR_DESTACADO || '#FF0000'),
    enlace: String(cfg.COLOR_ENLACE || '#0563C1'),

    logo: imagenIncrustada_(cfg.LOGO_ARCHIVO_ID),
    firma: imagenIncrustada_(cfg.FIRMA_ARCHIVO_ID),
    marcas: imagenIncrustada_(cfg.MARCAS_ARCHIVO_ID),

    empresa: String(cfg.EMPRESA_NOMBRE || ''),
    direccion: String(cfg.EMPRESA_DIRECCION || ''),
    telefonos: String(cfg.EMPRESA_TELEFONOS || ''),
    email: String(cfg.EMPRESA_EMAIL || ''),
    web: String(cfg.EMPRESA_WEB || ''),
    representante: String(cfg.EMPRESA_REPRESENTANTE || ''),

    numero: c.numero,
    fechaTexto: c.fechaTexto,
    asunto: c.asunto,
    asesor: c.asesor,

    clienteNombre: cl.empresa || c.cliente,
    clienteAtte: cl.contacto || c.atte,
    clienteEmail: cl.email || c.email,

    items: c.items.map(function (it) {
      return {
        cantidad: it.cantidad,
        tipo: it.tipo,
        // Las especificaciones vienen en varias líneas dentro de una celda;
        // sin esto el PDF las imprimiría como un párrafo corrido.
        descripcionHtml: multilinea_(it.descripcion),
        punitarioTexto: money_(it.punitario),
        totalTexto: money_(it.total),
        observacion: it.observacion,
      };
    }),

    subtotalTexto: money_(c.subtotal),
    ivaTexto: money_(c.iva),
    totalTexto: money_(c.total),

    notasHtml: multilinea_(c.notas),
    pago: c.pago,
    garantia: c.garantia,
    validez: c.validez,
  };
}

/**
 * Devuelve un archivo de Drive como URI de datos para incrustarlo en el PDF.
 *
 * Se incrusta en vez de enlazar porque el conversor de HtmlService no
 * descarga imágenes de Drive: un enlace saldría como hueco en blanco.
 *
 * @param {*} idArchivo ID del archivo, o vacío
 * @return {string} el URI de datos, o cadena vacía si no hay imagen
 */
function imagenIncrustada_(idArchivo) {
  const id = String(idArchivo || '').trim();
  if (!id) return '';
  try {
    const blob = DriveApp.getFileById(id).getBlob();
    return 'data:' + blob.getContentType() + ';base64,' +
      Utilities.base64Encode(blob.getBytes());
  } catch (err) {
    // Una imagen que falta no debe impedir emitir la proforma.
    console.error('No pude leer la imagen ' + id + ': ' + err);
    return '';
  }
}

/**
 * Nombre del archivo PDF siguiendo la convención que ya se usa en el correo:
 * "IMPORTADORA TOMEBAMBA - EQUIPO PORTABLE DELL.pdf". Si no hay asunto, cae
 * al número de proforma para no dejar archivos sin identificar.
 *
 * @param {!Object} c
 * @return {string}
 */
function nombreArchivo_(c) {
  const partes = c.asunto ? [c.cliente, c.asunto] : [c.cliente, c.numero];
  const nombre = partes.filter(Boolean).join(' - ')
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
 * Escapa un texto y convierte sus saltos de línea en <br>, para insertarlo
 * en la plantilla con <?!= ?>.
 * @param {string} texto
 * @return {string} HTML seguro
 */
function multilinea_(texto) {
  return escaparHtml_(String(texto || '')).replace(/\r?\n/g, '<br>');
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
