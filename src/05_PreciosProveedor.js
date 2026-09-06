/**
 * REDESK — Automatización de cotizaciones
 * ---------------------------------------
 * 05_PreciosProveedor.js — convierte en texto buscable los PDF y las
 * capturas de pantalla de precios que llegan por WhatsApp.
 *
 * Flujo pensado para el día a día:
 *   1. Sueltas el archivo en la carpeta de Drive "REDESK - Precios proveedor".
 *   2. REDESK ▸ Importar precios de proveedor lo pasa por OCR.
 *   3. REDESK ▸ Buscar precio encuentra el ítem en todo lo importado.
 *
 * El OCR usa la API de Drive convirtiendo el archivo a Documento de Google.
 * Requiere el servicio avanzado "Drive" activado (ya viene en el manifiesto).
 */

/** Tipos que Drive sabe pasar por OCR. */
const MIMES_OCR = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/webp',
];

/**
 * Recorre la carpeta de precios y pasa por OCR lo que aún no esté en la
 * hoja "Precios proveedor". Es idempotente: reconoce los archivos por su ID.
 */
function importarPreciosProveedor() {
  const carpeta = carpetaPrecios_();
  const h = hoja_(HOJAS.PRECIOS);

  const conocidos = {};
  if (h.getLastRow() >= 2) {
    h.getRange(2, 6, h.getLastRow() - 1, 1).getValues().forEach(function (f) {
      if (f[0]) conocidos[String(f[0]).trim()] = true;
    });
  }

  const temporal = subcarpeta_(carpeta, '_ocr_temp');
  const nuevas = [];
  const fallidos = [];
  const it = carpeta.getFiles();

  while (it.hasNext()) {
    const archivo = it.next();
    const id = archivo.getId();
    if (conocidos[id]) continue;
    if (MIMES_OCR.indexOf(archivo.getMimeType()) === -1) continue;

    let texto;
    try {
      texto = ocrDeArchivo_(id, archivo.getName(), temporal.getId());
    } catch (err) {
      fallidos.push(archivo.getName() + ': ' + err.message);
      continue;
    }

    nuevas.push([
      archivo.getDateCreated(),
      proveedorDeNombre_(archivo.getName()),
      archivo.getName(),
      formula_('=HYPERLINK("' + archivo.getUrl() + '","Abrir")'),
      // Las celdas de Sheets admiten 50 000 caracteres; dejamos margen.
      texto.slice(0, 45000),
      id,
    ]);
  }

  if (nuevas.length) {
    h.getRange(h.getLastRow() + 1, 1, nuevas.length, nuevas[0].length)
      .setValues(nuevas);
    h.getRange(2, 1, h.getLastRow() - 1, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  }

  let msg = nuevas.length
    ? nuevas.length + ' archivo(s) importado(s).'
    : 'No hay archivos nuevos que importar.';
  if (fallidos.length) msg += '\n\nNo se pudieron leer:\n- ' + fallidos.join('\n- ');

  SpreadsheetApp.getUi().alert('Precios de proveedor', msg,
    SpreadsheetApp.getUi().ButtonSet.OK);
  if (nuevas.length) libro_().setActiveSheet(h);
}

/** Versión del servicio de Drive que respondió, una vez detectada. */
let _versionDrive = null;

/**
 * Arma la petición de copia con OCR para una versión concreta de la API de
 * Drive. Las dos versiones nombran distinto los mismos campos, y ésa es la
 * única diferencia entre ellas para lo que aquí se necesita.
 *
 * @param {string} nombre nombre del archivo original
 * @param {string} idCarpeta carpeta donde dejar el documento intermedio
 * @param {string} version 'v2' o 'v3'
 * @return {{recurso: !Object, opciones: !Object}}
 */
function peticionOcr_(nombre, idCarpeta, version) {
  const titulo = 'OCR ' + nombre;
  if (version === 'v3') {
    return {
      recurso: {
        name: titulo,
        mimeType: MimeType.GOOGLE_DOCS,
        parents: [idCarpeta],
      },
      opciones: { ocrLanguage: 'es' },
    };
  }
  return {
    recurso: {
      title: titulo,
      mimeType: MimeType.GOOGLE_DOCS,
      parents: [{ id: idCarpeta }],
    },
    opciones: { convert: true, ocr: true, ocrLanguage: 'es' },
  };
}

/**
 * Extrae el texto de un PDF o imagen copiándolo a Documento de Google, que
 * es lo que dispara el OCR de Drive. El documento intermedio se descarta.
 *
 * El editor de Apps Script ofrece v2 o v3 del servicio de Drive según la
 * cuenta, así que se prueban las dos y se recuerda la que responda.
 *
 * @param {string} idArchivo
 * @param {string} nombre
 * @param {string} idCarpetaTemp
 * @return {string} texto reconocido
 */
function ocrDeArchivo_(idArchivo, nombre, idCarpetaTemp) {
  if (typeof Drive === 'undefined') {
    throw new Error(
      'Falta activar el servicio avanzado de Drive. En el editor de Apps ' +
      'Script: Servicios ▸ + ▸ Drive API, dejando el identificador en ' +
      '"Drive". Sirve tanto la v2 como la v3.');
  }

  const versiones = _versionDrive ? [_versionDrive] : ['v2', 'v3'];
  let ultimoError = null;

  for (let i = 0; i < versiones.length; i++) {
    let idDoc = null;
    try {
      const p = peticionOcr_(nombre, idCarpetaTemp, versiones[i]);
      idDoc = Drive.Files.copy(p.recurso, idArchivo, p.opciones).id;
      const texto = DocumentApp.openById(idDoc).getBody().getText();
      _versionDrive = versiones[i];
      return texto;
    } catch (err) {
      ultimoError = err;
    } finally {
      if (idDoc) {
        try {
          DriveApp.getFileById(idDoc).setTrashed(true);
        } catch (err2) { /* si no se puede borrar, queda en _ocr_temp */ }
      }
    }
  }
  throw ultimoError;
}

/**
 * Adivina el proveedor por el nombre del archivo: todo lo anterior al primer
 * guion, guion bajo o número. "Tecnomega - discos 2026.pdf" da "Tecnomega".
 * @param {string} nombre
 * @return {string}
 */
function proveedorDeNombre_(nombre) {
  const base = String(nombre).replace(/\.[a-z0-9]+$/i, '');
  const m = base.match(/^([A-Za-zÁÉÍÓÚÑáéíóúñ\s.&]{3,30}?)\s*[-_0-9]/);
  return (m ? m[1] : base).trim().slice(0, 40);
}

/**
 * Busca un término en todo el texto importado de proveedores y muestra las
 * líneas que coinciden, con el archivo y la fecha de cada una.
 */
function buscarPrecio() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt(
    'Buscar precio',
    'Escribe lo que buscas (ej. "SSD 1TB", "ThinkPad E14", "UPS rack"):',
    ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;

  const termino = r.getResponseText().trim();
  if (!termino) return;

  const resultados = buscarEnPrecios_(termino);
  if (!resultados.length) {
    ui.alert('Buscar precio',
      'No encontré "' + termino + '" en los precios importados.\n\n' +
      'Recuerda soltar los archivos en la carpeta de Drive y ejecutar ' +
      'REDESK ▸ Importar precios de proveedor.',
      ui.ButtonSet.OK);
    return;
  }

  let html = '<div style="font-family:Arial,sans-serif;font-size:12px">' +
    '<p>' + resultados.length + ' coincidencia(s) para <b>' +
    escaparHtml_(termino) + '</b>:</p>';
  resultados.slice(0, 40).forEach(function (res) {
    html += '<div style="margin-bottom:10px;padding:6px;' +
      'border-left:3px solid #1F4E79;background:#F7F9FB">' +
      '<div style="color:#666;font-size:11px">' +
      escaparHtml_(res.proveedor) + ' · ' + escaparHtml_(res.fecha) + ' · ' +
      '<a href="' + res.url + '" target="_blank">' +
      escaparHtml_(res.archivo) + '</a></div>' +
      '<div style="margin-top:3px">' + escaparHtml_(res.linea) + '</div>' +
      '</div>';
  });
  if (resultados.length > 40) {
    html += '<p style="color:#666">…y ' + (resultados.length - 40) +
      ' más. Afina la búsqueda.</p>';
  }
  html += '</div>';

  ui.showModalDialog(
    HtmlService.createHtmlOutput(html).setWidth(620).setHeight(520),
    'Precios de proveedor');
}

/**
 * Busca un término en el texto OCR y devuelve las líneas que lo contienen.
 * @param {string} termino
 * @return {!Array<{proveedor: string, archivo: string, fecha: string,
 *                  url: string, linea: string}>}
 */
function buscarEnPrecios_(termino) {
  const h = hoja_(HOJAS.PRECIOS);
  if (h.getLastRow() < 2) return [];

  // Cada palabra debe aparecer en la línea, en cualquier orden.
  const palabras = termino.toLowerCase().split(/\s+/).filter(Boolean);
  const datos = h.getRange(2, 1, h.getLastRow() - 1, 6).getValues();
  const resultados = [];

  datos.forEach(function (fila) {
    const texto = String(fila[4] || '');
    if (!texto) return;
    // La columna "Abrir" guarda una fórmula HYPERLINK, así que el enlace se
    // reconstruye desde el ID del archivo, que sí es un valor.
    const idArchivo = String(fila[5] || '').trim();
    const enlace = idArchivo
      ? 'https://drive.google.com/file/d/' + idArchivo + '/view'
      : '';
    const fecha = fila[0] instanceof Date ? fecha_(fila[0]) : '';

    texto.split('\n').forEach(function (linea) {
      const l = linea.toLowerCase();
      const coincide = palabras.every(function (p) { return l.indexOf(p) !== -1; });
      if (coincide && linea.trim()) {
        resultados.push({
          proveedor: String(fila[1] || ''),
          archivo: String(fila[2] || ''),
          fecha: fecha,
          url: enlace,
          linea: linea.trim().slice(0, 300),
        });
      }
    });
  });
  return resultados;
}

/**
 * Carpeta de Drive donde se sueltan los precios. La crea si hace falta.
 * @return {!GoogleAppsScript.Drive.Folder}
 */
function carpetaPrecios_() {
  const cfg = leerConfig();
  if (carpetaValida_(cfg.CARPETA_PRECIOS_ID)) {
    return DriveApp.getFolderById(String(cfg.CARPETA_PRECIOS_ID));
  }
  const carpeta = subcarpeta_(carpetaDelLibro_(), 'REDESK - Precios proveedor');
  escribirConfig_('CARPETA_PRECIOS_ID', carpeta.getId());
  return carpeta;
}

/** Abre en el navegador la carpeta donde se sueltan los precios. */
function abrirCarpetaPrecios() {
  abrirUrl_(carpetaPrecios_().getUrl(), 'Carpeta de precios de proveedor');
}

/** Abre en el navegador la carpeta donde se archivan los PDF emitidos. */
function abrirCarpetaCotizaciones() {
  abrirUrl_(carpetaCotizaciones_().getUrl(), 'Carpeta de cotizaciones');
}

/**
 * Muestra un diálogo con un enlace, ya que Apps Script no puede abrir
 * pestañas directamente.
 * @param {string} url
 * @param {string} titulo
 */
function abrirUrl_(url, titulo) {
  const html = HtmlService.createHtmlOutput(
    '<p style="font-family:Arial,sans-serif;font-size:13px">' +
    '<a href="' + url + '" target="_blank">Abrir en Drive</a></p>')
    .setWidth(320).setHeight(90);
  SpreadsheetApp.getUi().showModalDialog(html, titulo);
}
