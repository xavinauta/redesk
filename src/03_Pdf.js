/**
 * REDESK — Automatización de cotizaciones
 * ---------------------------------------
 * 03_Pdf.js — arma el PDF a partir de plantilla.html y lo archiva en Drive.
 */

/** Punto de entrada del menú REDESK ▸ Generar PDF. */
function generarPdf() {
  const c = leerCotizacion_();
  const resultado = generarPdfDeCotizacion_(c);
  registrarEnHistorial_(c, resultado.archivo.getUrl(), 'Borrador');

  const html = HtmlService.createHtmlOutput(
    '<div style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6">' +
    '<p>PDF generado y guardado en Drive:</p>' +
    '<p><a href="' + resultado.archivo.getUrl() + '" target="_blank">' +
    escaparHtml_(resultado.archivo.getName()) + '</a></p>' +
    avisoHtml_(resultado.aviso) +
    '</div>').setWidth(460).setHeight(resultado.aviso ? 260 : 150);
  SpreadsheetApp.getUi().showModalDialog(html, 'Proforma ' + c.numero);
}

/**
 * Recuadro de advertencia para los diálogos, o cadena vacía si no hay nada
 * que advertir.
 *
 * Cuando la conversión vía Documento falla se emite igual el PDF, pero sin
 * imágenes. Sin este aviso el fallo pasa inadvertido: el documento parece
 * correcto y sólo falta el logo.
 *
 * @param {string} aviso
 * @return {string}
 */
function avisoHtml_(aviso) {
  if (!aviso) return '';
  return '<p style="background:#FBECEC;border-left:3px solid #C4161C;' +
    'padding:8px 12px;margin-top:12px">' + escaparHtml_(aviso) + '</p>';
}

/**
 * Genera el PDF de una cotización y lo guarda en la carpeta configurada.
 * Si ya existía un PDF con el mismo nombre, lo envía a la papelera para no
 * dejar versiones sueltas conviviendo.
 *
 * @param {!Object} c cotización leída con leerCotizacion_()
 * @return {{archivo: !GoogleAppsScript.Drive.File, motor: string,
 *           aviso: string}}
 */
function generarPdfDeCotizacion_(c) {
  const salida = construirBlobPdf_(c);
  const carpeta = carpetaCotizaciones_();

  const existentes = carpeta.getFilesByName(salida.blob.getName());
  while (existentes.hasNext()) existentes.next().setTrashed(true);

  return {
    archivo: carpeta.createFile(salida.blob),
    motor: salida.motor,
    aviso: salida.aviso,
  };
}

/** Marcas de posición que la plantilla deja donde va cada imagen. */
const MARCA_IMAGEN = {
  logo: '[[LOGO]]',
  firma: '[[FIRMA]]',
  marcas: '[[MARCAS]]',
};

/**
 * Genera el PDF de la cotización.
 *
 * El camino normal es HTML → Documento de Google → PDF, porque el conversor
 * directo de HtmlService no sabe incrustar imágenes: deja el icono de imagen
 * rota en su lugar. Convirtiendo a Documento se pueden insertar el logo, la
 * firma y las marcas con la API de Documentos, que sí las incrusta.
 *
 * Si esa conversión falla se recurre a HtmlService, que produce el mismo
 * documento sin imágenes antes que no producir nada.
 *
 * @param {!Object} c
 * @return {{blob: !GoogleAppsScript.Base.Blob, motor: string, aviso: string}}
 */
function construirBlobPdf_(c) {
  const nombre = nombreArchivo_(c);
  const pedido = String(c.cfg.MOTOR_PDF || 'DOCS').toUpperCase();
  let aviso = '';

  if (pedido !== 'HTML') {
    const imagenes = imagenesDeCotizacion_(c.cfg);
    const sinConfigurar = imagenesSinConfigurar_(c.cfg);
    try {
      const blob = pdfViaDocumento_(
        renderizarPlantilla_(c, imagenes), imagenes, nombre);
      return {
        blob: blob,
        motor: 'DOCS',
        aviso: sinConfigurar.length
          ? 'El PDF salió sin ' + sinConfigurar.join(', ') +
            ': falta su ID en la hoja Config.'
          : '',
      };
    } catch (err) {
      aviso = 'No se pudo convertir vía Documento de Google, así que el PDF ' +
        'salió SIN logo, firma ni marcas. Detalle: ' +
        (err && err.message ? err.message : err);
      console.error(aviso);
    }
  }

  // Sin marcas de imagen: HtmlService las imprimiría como texto suelto.
  return {
    blob: pdfViaHtmlService_(renderizarPlantilla_(c, {}), nombre),
    motor: 'HTML',
    aviso: aviso,
  };
}

/**
 * Nombres de las imágenes que la plantilla espera y Config no tiene.
 * @param {!Object<string, *>} cfg
 * @return {!Array<string>}
 */
function imagenesSinConfigurar_(cfg) {
  const faltan = [];
  if (!String(cfg.LOGO_ARCHIVO_ID || '').trim()) faltan.push('logo');
  if (!String(cfg.FIRMA_ARCHIVO_ID || '').trim()) faltan.push('firma');
  if (!String(cfg.MARCAS_ARCHIVO_ID || '').trim()) faltan.push('marcas');
  return faltan;
}

/**
 * Evalúa plantilla.html con los datos de la cotización.
 * @param {!Object} c
 * @param {!Object<string, !Object>} imagenes las que se van a insertar
 * @return {string} HTML
 */
function renderizarPlantilla_(c, imagenes) {
  const t = HtmlService.createTemplateFromFile('plantilla');
  t.d = datosPlantilla_(c, imagenes);
  return t.evaluate().getContent();
}

/**
 * Convierte el HTML en Documento de Google, sustituye las marcas por las
 * imágenes y exporta el resultado a PDF.
 *
 * @param {string} html
 * @param {!Object<string, !Object>} imagenes
 * @param {string} nombre
 * @return {!GoogleAppsScript.Base.Blob}
 */
function pdfViaDocumento_(html, imagenes, nombre) {
  const temporal = subcarpeta_(carpetaCotizaciones_(), '_temp');
  const contenido = Utilities.newBlob(html, MimeType.HTML, nombre + '.html');
  const idDoc = crearDocDesdeBlob_(
    contenido, 'tmp ' + nombre, temporal.getId(), { v2: { convert: true } });

  try {
    prepararDocumento_(idDoc, imagenes);
    return DriveApp.getFileById(idDoc).getAs(MimeType.PDF).setName(nombre);
  } finally {
    descartar_(idDoc);
  }
}

/**
 * Ajusta la página del documento intermedio e inserta las imágenes.
 *
 * El importador de HTML deja tamaño carta y espaciado entre párrafos; se
 * fuerza A4 con márgenes estrechos y sin separación, para que la proforma
 * quepa en una hoja como la que ya se envía.
 *
 * @param {string} idDoc
 * @param {!Object<string, !Object>} imagenes
 */
function prepararDocumento_(idDoc, imagenes) {
  const doc = DocumentApp.openById(idDoc);
  const cuerpo = doc.getBody();

  cuerpo.setPageWidth(595).setPageHeight(842); // A4 en puntos
  cuerpo.setMarginTop(28).setMarginBottom(24)
    .setMarginLeft(34).setMarginRight(34);
  cuerpo.setAttributes(atributosSinEspaciado_());

  Object.keys(imagenes).forEach(function (clave) {
    if (!insertarImagen_(cuerpo, imagenes[clave])) {
      console.error('No encontré la marca ' + imagenes[clave].marca +
        ' en el documento convertido: esa imagen no saldrá.');
    }
  });

  doc.saveAndClose();
}

/**
 * Atributos de párrafo sin espacio arriba ni abajo.
 * @return {!Object}
 */
function atributosSinEspaciado_() {
  const atributos = {};
  atributos[DocumentApp.Attribute.SPACING_BEFORE] = 0;
  atributos[DocumentApp.Attribute.SPACING_AFTER] = 0;
  return atributos;
}

/**
 * Sustituye una marca de posición por su imagen, a lo ancho indicado.
 * @param {!GoogleAppsScript.Document.Body} cuerpo
 * @param {{marca: string, blob: !GoogleAppsScript.Base.Blob, ancho: number}} img
 * @return {boolean} si se pudo insertar
 */
function insertarImagen_(cuerpo, img) {
  const hallazgo = cuerpo.findText(escaparBusqueda_(img.marca));
  if (!hallazgo) return false;

  const parrafo = parrafoContenedor_(hallazgo.getElement());
  if (!parrafo) return false;

  parrafo.clear();
  const insertada = parrafo.appendInlineImage(img.blob);
  const ancho = insertada.getWidth();
  const alto = insertada.getHeight();
  if (ancho > img.ancho) {
    insertada.setWidth(img.ancho);
    insertada.setHeight(Math.round(alto * img.ancho / ancho));
  }
  return true;
}

/**
 * Sube por el árbol del documento hasta el párrafo que contiene un elemento.
 * @param {!GoogleAppsScript.Document.Element} elemento
 * @return {?GoogleAppsScript.Document.Paragraph}
 */
function parrafoContenedor_(elemento) {
  let actual = elemento;
  while (actual && actual.getType() !== DocumentApp.ElementType.PARAGRAPH) {
    actual = actual.getParent();
  }
  return actual ? actual.asParagraph() : null;
}

/**
 * findText recibe una expresión regular, así que los corchetes de las marcas
 * hay que escaparlos.
 * @param {string} texto
 * @return {string}
 */
function escaparBusqueda_(texto) {
  return String(texto).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Lee de Drive las imágenes configuradas, con el ancho máximo que les toca
 * en la proforma.
 *
 * @param {!Object<string, *>} cfg
 * @return {!Object<string, {marca: string, blob: !Object, ancho: number}>}
 */
function imagenesDeCotizacion_(cfg) {
  const fuentes = [
    ['logo', cfg.LOGO_ARCHIVO_ID, 150],
    ['firma', cfg.FIRMA_ARCHIVO_ID, 160],
    ['marcas', cfg.MARCAS_ARCHIVO_ID, 470],
  ];
  const mapa = {};
  fuentes.forEach(function (f) {
    const blob = blobDeDrive_(f[1]);
    if (blob) mapa[f[0]] = { marca: MARCA_IMAGEN[f[0]], blob: blob, ancho: f[2] };
  });
  return mapa;
}

/**
 * Devuelve el contenido de un archivo de Drive, o null si no se puede leer.
 * @param {*} idArchivo
 * @return {?GoogleAppsScript.Base.Blob}
 */
function blobDeDrive_(idArchivo) {
  const id = String(idArchivo || '').trim();
  if (!id) return null;
  try {
    return DriveApp.getFileById(id).getBlob();
  } catch (err) {
    // Una imagen que falta no debe impedir emitir la proforma.
    console.error('No pude leer la imagen ' + id + ': ' + err);
    return null;
  }
}

/**
 * Conversión directa de HtmlService. Respeta la maquetación pero no incrusta
 * imágenes, así que se usa sólo como respaldo.
 *
 * @param {string} html
 * @param {string} nombre
 * @return {!GoogleAppsScript.Base.Blob}
 */
function pdfViaHtmlService_(html, nombre) {
  return HtmlService.createHtmlOutput(html).getAs(MimeType.PDF).setName(nombre);
}

/**
 * Aplana la cotización a los campos que espera la plantilla, con los
 * importes ya formateados (la plantilla no debe hacer cálculos ni tocar
 * Drive). Donde va una imagen deja su marca de posición, que se sustituye
 * después sobre el Documento de Google.
 *
 * @param {!Object} c
 * @param {!Object<string, !Object>=} imagenes las que se podrán insertar
 * @return {!Object}
 */
function datosPlantilla_(c, imagenes) {
  const cfg = c.cfg;
  const cl = c.datosCliente;
  const disponibles = imagenes || {};
  const marca = function (clave) {
    return disponibles[clave] ? MARCA_IMAGEN[clave] : '';
  };

  return {
    acento: String(cfg.COLOR_ACENTO || '#8EAADB'),
    destacado: String(cfg.COLOR_DESTACADO || '#FF0000'),
    enlace: String(cfg.COLOR_ENLACE || '#0563C1'),

    logo: marca('logo'),
    firma: marca('firma'),
    marcas: marca('marcas'),

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
