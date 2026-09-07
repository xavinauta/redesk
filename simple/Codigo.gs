/**
 * REDESK — dos utilidades para la hoja de proformas
 * =================================================
 *
 * 1. REDESK ▸ Leer precios de proveedor…
 *    Abre un diálogo donde eliges uno o varios archivos del proveedor —PDF,
 *    fotos, xlsx, xls, ods o csv— o pegas el enlace de una hoja de Google.
 *    Se proponen los pares DESCRIPCIÓN / PRECIO encontrados; revisas, marcas
 *    los que quieres y se añaden desde la celda seleccionada.
 *
 * 2. REDESK ▸ Generar PDF para enviar
 *    Oculta las columnas COSTO y UTILIDAD, exporta la hoja a PDF tal como
 *    la ves y vuelve a mostrarlas. El PDF conserva tu diseño, tus logos y
 *    tus formatos, porque es tu propia hoja impresa.
 *
 * INSTALACIÓN
 *   1. Extensiones ▸ Apps Script.
 *   2. Pega este archivo en Código.gs.
 *   3. Crea un archivo HTML llamado exactamente "dialogo" y pega dialogo.html.
 *   4. Configuración del proyecto ▸ mostrar appsscript.json, y pega el
 *      manifiesto de este mismo repositorio.
 *   5. Recarga la hoja: aparece el menú REDESK.
 *
 * No hay que activar ningún servicio avanzado: las llamadas a Drive van por
 * su API REST, que ya cubre el manifiesto.
 *
 * Lo único que hay que revisar está en AJUSTES, aquí debajo.
 */

/** Lo único que puede necesitar cambios. */
const AJUSTES = {
  /**
   * Encabezados de las columnas que NO deben salir en el PDF. Se buscan por
   * texto, sin distinguir mayúsculas ni acentos, así que da igual en qué
   * letra de columna estén.
   */
  COLUMNAS_OCULTAS: ['COSTO', 'UTILIDAD'],

  /** Filas donde buscar esos encabezados. */
  FILAS_A_REVISAR: 40,

  /** Carpeta de Drive donde se guardan los PDF. Se crea sola. */
  CARPETA_PDF: 'Proformas REDESK',

  /** Idioma que se le indica al OCR. */
  IDIOMA_OCR: 'es',

  /** Tope de filas que se leen de una hoja de proveedor. */
  FILAS_MAX_HOJA: 2000,
};

// ===========================================================================
// Menú
// ===========================================================================

/** Disparador simple: construye el menú al abrir la hoja. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('REDESK')
    .addItem('Leer precios de proveedor…', 'abrirDialogoOcr')
    .addItem('Generar PDF para enviar', 'generarPdfParaEnviar')
    .addToUi();
}

/**
 * Ejecuta una acción del menú mostrando los errores como diálogo en vez del
 * error rojo de Apps Script.
 * @param {function()} fn
 */
function ejecutar_(fn) {
  try {
    fn();
  } catch (err) {
    SpreadsheetApp.getUi().alert(
      'REDESK', err && err.message ? err.message : String(err),
      SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

// ===========================================================================
// SCRIPT 1 — Leer cotizaciones de proveedor
// ===========================================================================
//
// Admite dos caminos según lo que llegue:
//   · PDF o imagen  → se pasa por el OCR de Drive.
//   · Hoja de cálculo (xlsx, xls, ods, csv) o enlace a una hoja de Google
//     → se leen las celdas, que es exacto y no necesita reconocimiento.
//
// Las llamadas a Drive van por su API REST con UrlFetchApp, no por el
// servicio avanzado del editor: así no hay que activarlo, y la petición es
// la misma en cualquier cuenta, ofrezca el editor la v2 o la v3.
// ===========================================================================

/** Tipos de archivo que se leen como hoja de cálculo, sin OCR. */
const TIPOS_HOJA = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.oasis.opendocument.spreadsheet',
  'text/csv',
  'text/tab-separated-values',
];

/** Abre el diálogo donde se eligen los archivos del proveedor. */
function abrirDialogoOcr() {
  const html = HtmlService.createHtmlOutputFromFile('dialogo')
    .setWidth(700)
    .setHeight(620);
  SpreadsheetApp.getUi().showModalDialog(html, 'Leer precios de proveedor');
}

/**
 * Recibe un archivo del diálogo y devuelve los productos que encuentre.
 *
 * No falla cuando un archivo no da resultados: con varios archivos en la
 * misma tanda, uno ilegible no debe tumbar a los demás.
 *
 * @param {string} base64 contenido del archivo
 * @param {string} nombre nombre original
 * @param {string} tipo mime del archivo
 * @return {{archivo: string, items: !Array<!Object>}}
 */
function reconocerArchivo(base64, nombre, tipo) {
  if (!base64) throw new Error('No llegó ningún archivo.');
  const etiqueta = nombre || 'archivo';

  const contenido = Utilities.newBlob(
    Utilities.base64Decode(base64),
    tipo || 'application/octet-stream',
    etiqueta);

  const items = esHojaDeCalculo_(tipo, etiqueta)
    ? itemsDeHojaSubida_(contenido, etiqueta)
    : extraerItems_(textoPorOcr_(contenido, etiqueta));

  return { archivo: etiqueta, items: etiquetar_(items, etiqueta) };
}

/**
 * Lee una hoja de Google a partir de su enlace. La llama dialogo.html.
 *
 * @param {string} url enlace o identificador de la hoja
 * @return {{archivo: string, items: !Array<!Object>}}
 */
function reconocerHojaPorUrl(url) {
  const id = idDeUrl_(url);
  if (!id) {
    throw new Error(
      'Eso no parece el enlace de una hoja de Google. Copia la dirección ' +
      'completa desde la barra del navegador.');
  }

  let libro;
  try {
    libro = SpreadsheetApp.openById(id);
  } catch (err) {
    throw new Error(
      'No pude abrir esa hoja. Comprueba que el enlace es correcto y que ' +
      'tienes permiso para verla con esta misma cuenta.');
  }

  const nombre = libro.getName();
  return {
    archivo: nombre,
    items: etiquetar_(itemsDeLibro_(libro, nombre), nombre),
  };
}

/**
 * ¿Este archivo se lee como hoja de cálculo en vez de con OCR?
 * @param {string} tipo
 * @param {string} nombre
 * @return {boolean}
 */
function esHojaDeCalculo_(tipo, nombre) {
  if (tipo && TIPOS_HOJA.indexOf(tipo) !== -1) return true;
  return /\.(xlsx|xlsm|xls|ods|csv|tsv)$/i.test(String(nombre || ''));
}

/**
 * Completa cada producto con su archivo de origen y su clave de repetido.
 *
 * La clave se calcula aquí para que el diálogo pueda marcar las repetidas
 * sin duplicar esa regla en el navegador.
 *
 * @param {!Array<!Object>} items
 * @param {string} etiqueta
 * @return {!Array<!Object>}
 */
function etiquetar_(items, etiqueta) {
  items.forEach(function (item) {
    if (!item.archivo) item.archivo = etiqueta;
    item.clave = claveItem_(item);
  });
  return items;
}

/**
 * Sube una hoja de cálculo, la lee y borra la copia temporal.
 * @param {!GoogleAppsScript.Base.Blob} contenido
 * @param {string} nombre
 * @return {!Array<!Object>}
 */
function itemsDeHojaSubida_(contenido, nombre) {
  const id = subirConvertido_(contenido, nombre, MimeType.GOOGLE_SHEETS, {});
  try {
    return itemsDeLibro_(SpreadsheetApp.openById(id), nombre);
  } finally {
    borrarTemporal_(id);
  }
}

/**
 * Recorre todas las pestañas de un libro buscando productos.
 * @param {!GoogleAppsScript.Spreadsheet.Spreadsheet} libro
 * @param {string} nombreBase
 * @return {!Array<!Object>}
 */
function itemsDeLibro_(libro, nombreBase) {
  const hojas = libro.getSheets();
  const items = [];

  hojas.forEach(function (hoja) {
    const filas = Math.min(hoja.getLastRow(), AJUSTES.FILAS_MAX_HOJA);
    const columnas = hoja.getLastColumn();
    if (filas < 1 || columnas < 1) return;

    const datos = hoja.getRange(1, 1, filas, columnas).getDisplayValues();
    const etiqueta = hojas.length > 1
      ? nombreBase + ' · ' + hoja.getName()
      : nombreBase;

    extraerDeTabla_(datos).forEach(function (item) {
      item.archivo = etiqueta;
      items.push(item);
    });
  });
  return items;
}

/**
 * Pasa un PDF o una imagen por el OCR de Drive y devuelve su texto.
 *
 * Drive reconoce el texto al subir el archivo pidiendo que se convierta en
 * Documento de Google. El documento intermedio se descarta.
 *
 * @param {!GoogleAppsScript.Base.Blob} contenido
 * @param {string} nombre
 * @return {string}
 */
function textoPorOcr_(contenido, nombre) {
  const id = subirConvertido_(
    contenido, 'OCR ' + nombre, MimeType.GOOGLE_DOCS,
    { ocrLanguage: AJUSTES.IDIOMA_OCR });
  try {
    return exportarComoTexto_(id);
  } finally {
    borrarTemporal_(id);
  }
}

/**
 * Sube un contenido a Drive convirtiéndolo al formato de Google indicado.
 *
 * @param {!GoogleAppsScript.Base.Blob} contenido
 * @param {string} nombre
 * @param {string} mimeDestino formato de Google al que convertir
 * @param {!Object} parametros parámetros extra de la API, como ocrLanguage
 * @return {string} ID del archivo creado
 */
function subirConvertido_(contenido, nombre, mimeDestino, parametros) {
  const metadatos = {
    name: nombre,
    mimeType: mimeDestino,
    parents: [carpetaDeTrabajo_().getId()],
  };

  // Subida multiparte: primero los metadatos como JSON y después los bytes
  // del archivo, separados por el delimitador.
  const limite = 'redesk' + Date.now();
  const cabecera =
    '--' + limite + '\r\n' +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadatos) + '\r\n' +
    '--' + limite + '\r\n' +
    'Content-Type: ' +
    (contenido.getContentType() || 'application/octet-stream') + '\r\n\r\n';

  const cuerpo = Utilities.newBlob(cabecera).getBytes()
    .concat(contenido.getBytes())
    .concat(Utilities.newBlob('\r\n--' + limite + '--').getBytes());

  const consulta = Object.keys(parametros || {})
    .map(function (clave) {
      return clave + '=' + encodeURIComponent(parametros[clave]);
    })
    .concat(['uploadType=multipart', 'supportsAllDrives=true'])
    .join('&');

  const respuesta = UrlFetchApp.fetch(
    'https://www.googleapis.com/upload/drive/v3/files?' + consulta,
    {
      method: 'post',
      contentType: 'multipart/related; boundary=' + limite,
      payload: cuerpo,
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true,
    });

  if (respuesta.getResponseCode() >= 300) {
    throw new Error('Drive no aceptó el archivo (código ' +
      respuesta.getResponseCode() + '): ' +
      respuesta.getContentText().slice(0, 200));
  }
  return JSON.parse(respuesta.getContentText()).id;
}

/**
 * Descarga como texto plano un documento de Drive.
 * @param {string} id
 * @return {string}
 */
function exportarComoTexto_(id) {
  const respuesta = UrlFetchApp.fetch(
    'https://www.googleapis.com/drive/v3/files/' + id +
    '/export?mimeType=text%2Fplain',
    {
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true,
    });

  if (respuesta.getResponseCode() >= 300) {
    throw new Error('No pude leer el texto reconocido (código ' +
      respuesta.getResponseCode() + ').');
  }
  return respuesta.getContentText();
}

/**
 * Manda a la papelera un archivo temporal, sin romper el flujo si no puede.
 * @param {?string} id
 */
function borrarTemporal_(id) {
  if (!id) return;
  try {
    DriveApp.getFileById(id).setTrashed(true);
  } catch (err) {
    // Si no se puede borrar, se queda en _ocr_temp y no estorba.
  }
}

/**
 * Añade los productos elegidos a la hoja, a partir de la celda seleccionada.
 *
 * Nunca sobrescribe: si la celda de partida ya tiene algo, baja hasta la
 * primera libre; y si lo que viene debajo está ocupado, inserta las filas que
 * hagan falta. Así una cotización con más ítems que filas disponibles entra
 * entera sin desplazar mal el resto de la hoja.
 *
 * La llama dialogo.html.
 *
 * @param {!Array<{descripcion: string, precio: number}>} items
 * @return {string} mensaje para mostrar en el diálogo
 */
function insertarItems(items) {
  if (!items || !items.length) throw new Error('No marcaste ninguna línea.');

  const hoja = SpreadsheetApp.getActiveSheet();
  const celda = hoja.getActiveCell();
  const columna = celda.getColumn();

  if (columna + 1 > hoja.getMaxColumns()) {
    throw new Error(
      'Sitúate en una celda que tenga al menos una columna libre a la ' +
      'derecha: la descripción va en esa columna y el precio en la siguiente.');
  }

  const inicio = primeraFilaLibreDesde_(hoja, celda.getRow(), columna);
  const cuantas = items.length;
  const insertadas = asegurarEspacio_(hoja, inicio, columna, cuantas);

  hoja.getRange(inicio, columna, cuantas, 2).setValues(
    items.map(function (i) { return [i.descripcion, i.precio]; }));

  const donde = hoja.getRange(inicio, columna).getA1Notation();
  return cuantas + ' línea(s) añadidas desde ' + donde +
    (insertadas ? ' (se insertaron ' + insertadas + ' filas nuevas).' : '.');
}

/**
 * Primera fila libre en una columna, bajando desde una fila dada.
 *
 * @param {!GoogleAppsScript.Spreadsheet.Sheet} hoja
 * @param {number} desde
 * @param {number} columna
 * @return {number}
 */
function primeraFilaLibreDesde_(hoja, desde, columna) {
  const max = hoja.getMaxRows();
  if (desde > max) return desde;
  // Una sola lectura del resto de la columna: recorrerla celda a celda sería
  // lento en una hoja larga.
  const valores = hoja.getRange(desde, columna, max - desde + 1, 1)
    .getDisplayValues()
    .map(function (fila) { return fila[0]; });
  return desde + indiceLibre_(valores);
}

/**
 * Deja libre el bloque donde se va a escribir, agrandando la hoja e
 * insertando filas si hace falta.
 *
 * @param {!GoogleAppsScript.Spreadsheet.Sheet} hoja
 * @param {number} inicio
 * @param {number} columna
 * @param {number} cuantas
 * @return {number} filas insertadas
 */
function asegurarEspacio_(hoja, inicio, columna, cuantas) {
  const max = hoja.getMaxRows();
  if (inicio + cuantas - 1 > max) {
    hoja.insertRowsAfter(max, inicio + cuantas - 1 - max);
  }

  const bloque = hoja.getRange(inicio, columna, cuantas, 2).getDisplayValues();
  if (!hayContenido_(bloque)) return 0;

  // Se insertan tantas filas como líneas: el hueco queda exacto y no deja
  // filas en blanco sueltas.
  hoja.insertRowsBefore(inicio, cuantas);
  return cuantas;
}

/**
 * Carpeta donde se dejan los archivos intermedios, junto a la hoja.
 * @return {!GoogleAppsScript.Drive.Folder}
 */
function carpetaDeTrabajo_() {
  const padres = DriveApp.getFileById(
    SpreadsheetApp.getActiveSpreadsheet().getId()).getParents();
  const raiz = padres.hasNext() ? padres.next() : DriveApp.getRootFolder();
  const existente = raiz.getFoldersByName('_ocr_temp');
  return existente.hasNext() ? existente.next() : raiz.createFolder('_ocr_temp');
}

// ===========================================================================
// LÓGICA PROBADA — inicio
// ---------------------------------------------------------------------------
// Todo lo que hay entre estos dos marcadores es código sin dependencias de
// Google: test/parser.test.js lo extrae de este mismo archivo y lo ejecuta
// con Node, así que las pruebas comprueban exactamente lo que corre aquí.
// ===========================================================================

/**
 * Convierte a número un importe escrito en cualquiera de los dos formatos
 * que llegan de los proveedores: 1.234,56 y 1,234.56.
 *
 * La regla es que el último separador manda, salvo cuando le siguen tres
 * dígitos y es el único: entonces es separador de miles (1.234 son mil
 * doscientos treinta y cuatro, no uno coma doscientos treinta y cuatro).
 *
 * @param {string} texto
 * @return {?number} el importe, o null si no hay número
 */
function aNumero_(texto) {
  const limpio = String(texto).replace(/[^\d.,]/g, '');
  if (!limpio) return null;

  const separador = Math.max(limpio.lastIndexOf(','), limpio.lastIndexOf('.'));
  if (separador === -1) {
    const n = Number(limpio);
    return isNaN(n) ? null : n;
  }

  const decimales = limpio.length - separador - 1;
  const cuantos = (limpio.match(/[.,]/g) || []).length;
  if (decimales === 3 && cuantos === 1) {
    return Number(limpio.replace(/[.,]/g, ''));
  }

  const entero = limpio.slice(0, separador).replace(/[.,]/g, '');
  const fraccion = limpio.slice(separador + 1);
  const n = Number((entero || '0') + '.' + fraccion);
  return isNaN(n) ? null : n;
}

/**
 * Elige cuál de los números de una línea es el precio.
 *
 * Se prefiere, por este orden: el que lleva símbolo de moneda, el último con
 * dos decimales, y sólo si no hay ninguno, el último número suelto. Ese orden
 * evita el error típico de tomar por precio el "6" de "WIFI 6" o el "2" de
 * "2X2" cuando en la línea hay un importe de verdad.
 *
 * @param {string} linea
 * @return {?{indice: number, texto: string, seguro: boolean}}
 */
function elegirPrecio_(linea) {
  const candidatos = [];
  const re = /(USD|\$)?\s*(\d[\d.,]*)/g;
  let m;
  while ((m = re.exec(linea)) !== null) {
    const valor = m[2];
    candidatos.push({
      indice: m.index,
      texto: m[0],
      moneda: !!m[1],
      decimales: /[.,]\d{2}$/.test(valor),
    });
  }
  if (!candidatos.length) return null;

  const conMoneda = candidatos.filter(function (c) { return c.moneda; });
  if (conMoneda.length) {
    const c = conMoneda[conMoneda.length - 1];
    return { indice: c.indice, texto: c.texto, seguro: true };
  }

  const conDecimales = candidatos.filter(function (c) { return c.decimales; });
  if (conDecimales.length) {
    const c = conDecimales[conDecimales.length - 1];
    return { indice: c.indice, texto: c.texto, seguro: true };
  }

  const c = candidatos[candidatos.length - 1];
  return { indice: c.indice, texto: c.texto, seguro: false };
}

/**
 * Extrae de una línea la descripción y el precio.
 *
 * @param {string} linea
 * @return {?{descripcion: string, precio: number, seguro: boolean}}
 */
function lineaAItem_(linea) {
  const texto = String(linea || '').replace(/\s+/g, ' ').trim();
  if (!texto) return null;

  const precio = elegirPrecio_(texto);
  if (!precio) return null;

  const importe = aNumero_(precio.texto);
  if (importe === null || !(importe > 0)) return null;

  const descripcion = texto.slice(0, precio.indice)
    .replace(/[\s.\-–—:|_]+$/, '')
    .trim();

  // Una línea sin letras suficientes es un total, un número de página o
  // ruido del reconocimiento, no un producto.
  if (letras_(descripcion) < 3) return null;

  return { descripcion: descripcion, precio: importe, seguro: precio.seguro };
}

/**
 * Comienzos de línea que en una lista de precios nunca son un producto:
 * encabezados, pies de página y las filas de totales.
 */
const NO_ES_PRODUCTO = [
  'TOTAL', 'SUBTOTAL', 'IVA', 'DESCUENTO', 'ENVIO', 'ENVÍO', 'FLETE',
  'PAGINA', 'PÁGINA', 'PAGE', 'LISTA DE PRECIOS', 'PRECIOS', 'FECHA',
  'CANTIDAD', 'VALIDO', 'VÁLIDO', 'PROFORMA', 'COTIZACION', 'COTIZACIÓN',
];

/**
 * Descarta las líneas que, aun teniendo un número, no son un producto.
 *
 * @param {{descripcion: string, precio: number, seguro: boolean}} item
 * @return {boolean}
 */
function pareceProducto_(item) {
  const desc = item.descripcion.toUpperCase();

  const esEncabezado = NO_ES_PRODUCTO.some(function (palabra) {
    return desc === palabra || desc.indexOf(palabra + ' ') === 0;
  });
  if (esEncabezado) return false;

  // Un año suelto en un título —"LISTA SEPTIEMBRE 2026"— no es un precio.
  if (!item.seguro && Number.isInteger(item.precio) &&
      item.precio >= 1900 && item.precio <= 2100) {
    return false;
  }
  return true;
}

/**
 * Recorre el texto reconocido y devuelve los productos que encuentra.
 *
 * Lo que sale de aquí es una propuesta, no un resultado definitivo: el
 * diálogo la muestra para revisar antes de insertar nada en la hoja.
 *
 * @param {string} texto texto devuelto por el OCR
 * @return {!Array<{descripcion: string, precio: number, seguro: boolean}>}
 */
function extraerItems_(texto) {
  const items = [];
  String(texto || '').split('\n').forEach(function (linea) {
    const item = lineaAItem_(linea);
    if (item && pareceProducto_(item)) items.push(item);
  });
  return items;
}

/**
 * Pasa un texto a mayúsculas sin acentos ni espacios sobrantes, para poder
 * comparar encabezados escritos de cualquier manera.
 * @param {*} texto
 * @return {string}
 */
function normalizar_(texto) {
  return String(texto == null ? '' : texto)
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()
    .replace(/[ÁÀÄÂ]/g, 'A').replace(/[ÉÈËÊ]/g, 'E')
    .replace(/[ÍÌÏÎ]/g, 'I').replace(/[ÓÒÖÔ]/g, 'O')
    .replace(/[ÚÙÜÛ]/g, 'U').replace(/Ñ/g, 'N');
}

/** Encabezados que identifican la columna de la descripción. */
const CABECERAS_DESCRIPCION = [
  'DESCRIPCION', 'DETALLE', 'PRODUCTO', 'ARTICULO', 'CONCEPTO',
  'ITEM', 'EQUIPO', 'MODELO', 'NOMBRE',
];

/**
 * Encabezados que identifican la columna del precio, de más específico a
 * menos: si una tabla trae varias, gana la más concreta.
 */
const CABECERAS_PRECIO = [
  'PRECIO UNITARIO', 'P. UNITARIO', 'P.UNITARIO', 'VALOR UNITARIO',
  'UNITARIO', 'PRECIO VENTA', 'PRECIO LISTA', 'PRECIO', 'PVP',
  'COSTO', 'VALOR',
];

/**
 * Posición de un encabezado dentro de una lista de candidatos.
 * @param {string} valor encabezado ya normalizado
 * @param {!Array<string>} candidatos
 * @return {number} el índice, o -1 si no coincide con ninguno
 */
function rangoCabecera_(valor, candidatos) {
  for (let i = 0; i < candidatos.length; i++) {
    if (valor.indexOf(candidatos[i]) !== -1) return i;
  }
  return -1;
}

/**
 * Busca en las primeras filas la que hace de encabezado, y con ella las
 * columnas de descripción y de precio.
 *
 * @param {!Array<!Array<*>>} filas
 * @return {?{fila: number, descripcion: number, precio: number}}
 */
function localizarCabecera_(filas) {
  const limite = Math.min(filas.length, 15);

  for (let f = 0; f < limite; f++) {
    let descripcion = -1;
    let precio = -1;
    let mejor = Infinity;

    for (let c = 0; c < filas[f].length; c++) {
      const valor = normalizar_(filas[f][c]);
      if (!valor) continue;

      if (descripcion === -1 &&
          rangoCabecera_(valor, CABECERAS_DESCRIPCION) !== -1) {
        descripcion = c;
      }
      const rango = rangoCabecera_(valor, CABECERAS_PRECIO);
      if (rango !== -1 && rango < mejor) {
        mejor = rango;
        precio = c;
      }
    }

    if (descripcion !== -1 && precio !== -1 && descripcion !== precio) {
      return { fila: f, descripcion: descripcion, precio: precio };
    }
  }
  return null;
}

/**
 * Extrae los productos de una tabla ya leída de una hoja de cálculo.
 *
 * Con encabezados reconocibles se toman las columnas directamente, que es
 * exacto. Sin ellos se junta cada fila en una línea y se aplica la misma
 * lectura que a un texto reconocido, marcando el resultado como inseguro
 * para que se revise.
 *
 * @param {!Array<!Array<*>>} filas valores de las celdas
 * @return {!Array<{descripcion: string, precio: number, seguro: boolean}>}
 */
function extraerDeTabla_(filas) {
  const items = [];
  if (!filas || !filas.length) return items;

  const cabecera = localizarCabecera_(filas);

  if (cabecera) {
    for (let f = cabecera.fila + 1; f < filas.length; f++) {
      const descripcion = normalizarTexto_(filas[f][cabecera.descripcion]);
      const precio = aNumero_(filas[f][cabecera.precio]);
      if (!descripcion || precio === null || !(precio > 0)) continue;
      if (letras_(descripcion) < 3) continue;

      const item = { descripcion: descripcion, precio: precio, seguro: true };
      if (pareceProducto_(item)) items.push(item);
    }
    return items;
  }

  filas.forEach(function (fila) {
    const item = lineaAItem_(fila.join(' '));
    if (item && pareceProducto_(item)) {
      // Sin encabezado, cuál es el precio es una suposición.
      item.seguro = false;
      items.push(item);
    }
  });
  return items;
}

/**
 * Limpia el contenido de una celda dejándolo en una sola línea.
 * @param {*} valor
 * @return {string}
 */
function normalizarTexto_(valor) {
  return String(valor == null ? '' : valor).replace(/\s+/g, ' ').trim();
}

/**
 * Cuántas letras tiene un texto, sin contar números ni signos.
 * @param {string} texto
 * @return {number}
 */
function letras_(texto) {
  return String(texto).replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, '').length;
}

/**
 * Extrae el identificador de una hoja a partir de su enlace.
 * @param {string} url
 * @return {string} el identificador, o cadena vacía si no se reconoce
 */
function idDeUrl_(url) {
  const texto = String(url == null ? '' : url).trim();
  if (!texto) return '';
  const enlace = texto.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
  if (enlace) return enlace[1];
  return /^[a-zA-Z0-9_-]{20,}$/.test(texto) ? texto : '';
}

/**
 * Clave con la que se reconocen dos líneas iguales, para poder avisar de las
 * repetidas cuando se leen varios archivos del mismo proveedor.
 *
 * @param {{descripcion: string, precio: number}} item
 * @return {string}
 */
function claveItem_(item) {
  return String(item.descripcion).toUpperCase().replace(/\s+/g, ' ').trim() +
    '|' + Number(item.precio).toFixed(2);
}

/**
 * Índice de la primera entrada vacía de una lista de valores de celda.
 * @param {!Array<*>} valores
 * @return {number} el índice, o la longitud si están todas ocupadas
 */
function indiceLibre_(valores) {
  for (let i = 0; i < valores.length; i++) {
    const v = valores[i] == null ? '' : String(valores[i]).trim();
    if (v === '') return i;
  }
  return valores.length;
}

/**
 * ¿Hay algo escrito en un bloque de celdas?
 * @param {!Array<!Array<*>>} bloque
 * @return {boolean}
 */
function hayContenido_(bloque) {
  return bloque.some(function (fila) {
    return fila.some(function (celda) {
      return String(celda == null ? '' : celda).trim() !== '';
    });
  });
}

// ===========================================================================
// LÓGICA PROBADA — fin
// ===========================================================================

// ===========================================================================
// SCRIPT 2 — Generar el PDF para enviar
// ===========================================================================

/**
 * Exporta la hoja activa a PDF sin las columnas COSTO ni UTILIDAD.
 *
 * Se exporta la propia hoja en vez de recomponer el documento en otro sitio:
 * así el PDF conserva el diseño, los logos y los formatos que ya tienes, sin
 * conversiones de por medio que puedan estropearlos.
 */
function generarPdfParaEnviar() {
  ejecutar_(function () {
    const hoja = SpreadsheetApp.getActiveSheet();
    const ocultadas = ocultarColumnas_(hoja, AJUSTES.COLUMNAS_OCULTAS);

    let archivo;
    try {
      // Sin esto la exportación puede leer la hoja antes de que se apliquen
      // las columnas ocultas.
      SpreadsheetApp.flush();
      archivo = guardarPdf_(hoja);
    } finally {
      mostrarColumnas_(hoja, ocultadas);
      SpreadsheetApp.flush();
    }

    const aviso = ocultadas.length
      ? 'Se ocultaron las columnas ' + ocultadas.map(function (c) {
        return c.titulo;
      }).join(' y ') + '.'
      : 'Aviso: no encontré ninguna columna llamada ' +
        AJUSTES.COLUMNAS_OCULTAS.join(' ni ') +
        ', así que el PDF las incluye si existen con otro nombre.';

    mostrarEnlace_(archivo, aviso, ocultadas.length > 0);
  });
}

/**
 * Oculta las columnas cuyo encabezado coincide con alguno de los nombres
 * dados, y devuelve cuáles ocultó para poder restaurarlas.
 *
 * @param {!GoogleAppsScript.Spreadsheet.Sheet} hoja
 * @param {!Array<string>} nombres
 * @return {!Array<{columna: number, titulo: string}>}
 */
function ocultarColumnas_(hoja, nombres) {
  const encontradas = buscarColumnas_(hoja, nombres);
  encontradas.forEach(function (c) {
    hoja.hideColumns(c.columna);
  });
  return encontradas;
}

/**
 * Vuelve a mostrar las columnas que se ocultaron.
 * @param {!GoogleAppsScript.Spreadsheet.Sheet} hoja
 * @param {!Array<{columna: number}>} columnas
 */
function mostrarColumnas_(hoja, columnas) {
  columnas.forEach(function (c) {
    hoja.showColumns(c.columna);
  });
}

/**
 * Busca en las primeras filas las columnas cuyo encabezado coincide con
 * alguno de los nombres dados.
 *
 * Se compara sin mayúsculas ni acentos para que "Utilidad" y "UTILIDAD"
 * cuenten igual, y sólo si la celda ya estaba visible: si una columna estaba
 * oculta a propósito, no hay que volver a mostrarla al terminar.
 *
 * @param {!GoogleAppsScript.Spreadsheet.Sheet} hoja
 * @param {!Array<string>} nombres
 * @return {!Array<{columna: number, titulo: string}>}
 */
function buscarColumnas_(hoja, nombres) {
  const filas = Math.min(AJUSTES.FILAS_A_REVISAR, hoja.getMaxRows());
  const columnas = hoja.getMaxColumns();
  const datos = hoja.getRange(1, 1, filas, columnas).getDisplayValues();
  const buscados = nombres.map(normalizar_);

  const encontradas = [];
  const yaVistas = {};

  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const valor = normalizar_(datos[f][c]);
      if (!valor || yaVistas[c + 1]) continue;
      if (buscados.indexOf(valor) === -1) continue;
      if (hoja.isColumnHiddenByUser(c + 1)) continue;
      yaVistas[c + 1] = true;
      encontradas.push({ columna: c + 1, titulo: String(datos[f][c]).trim() });
    }
  }
  return encontradas;
}

/**
 * Exporta la hoja a PDF y lo guarda en Drive.
 *
 * Se usa la exportación propia de Google Sheets: es la misma que produce
 * Archivo ▸ Descargar ▸ PDF, así que respeta el diseño de la hoja.
 *
 * @param {!GoogleAppsScript.Spreadsheet.Sheet} hoja
 * @return {!GoogleAppsScript.Drive.File}
 */
function guardarPdf_(hoja) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const parametros = {
    format: 'pdf',
    gid: String(hoja.getSheetId()),
    portrait: 'true',
    size: 'A4',
    fitw: 'true',           // ajustar al ancho de la página
    scale: '4',             // ajustar al ancho
    gridlines: 'false',
    printtitle: 'false',
    sheetnames: 'false',
    pagenum: 'UNDEFINED',
    fzr: 'false',
    top_margin: '0.4',
    bottom_margin: '0.4',
    left_margin: '0.4',
    right_margin: '0.4',
  };
  const consulta = Object.keys(parametros).map(function (clave) {
    return clave + '=' + encodeURIComponent(parametros[clave]);
  }).join('&');

  const url = 'https://docs.google.com/spreadsheets/d/' + libro.getId() +
    '/export?' + consulta;

  const respuesta = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true,
  });
  if (respuesta.getResponseCode() !== 200) {
    throw new Error('Google no devolvió el PDF (código ' +
      respuesta.getResponseCode() + '). Revisa que el manifiesto ' +
      'appsscript.json esté pegado y vuelve a autorizar el script.');
  }

  const nombre = nombrePdf_(hoja);
  const carpeta = carpetaPdf_();

  // Si ya existe un PDF con el mismo nombre, se manda a la papelera para no
  // quedarse con dos versiones de la misma proforma.
  const previos = carpeta.getFilesByName(nombre);
  while (previos.hasNext()) previos.next().setTrashed(true);

  return carpeta.createFile(respuesta.getBlob().setName(nombre));
}

/**
 * Nombre del PDF: el del cliente si se encuentra en la hoja, y si no, el de
 * la hoja con la fecha.
 *
 * @param {!GoogleAppsScript.Spreadsheet.Sheet} hoja
 * @return {string}
 */
function nombrePdf_(hoja) {
  const cliente = buscarValorJuntoA_(hoja, ['NOMBRE', 'CLIENTE', 'RAZON SOCIAL']);
  const fecha = Utilities.formatDate(
    new Date(), SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(),
    'yyyy-MM-dd');

  const base = cliente ? cliente : hoja.getName() + ' ' + fecha;
  return base.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ')
    .trim().slice(0, 150) + '.pdf';
}

/**
 * Busca una etiqueta en las primeras filas y devuelve el primer valor no
 * vacío que haya a su derecha, en la misma fila.
 *
 * @param {!GoogleAppsScript.Spreadsheet.Sheet} hoja
 * @param {!Array<string>} etiquetas
 * @return {string} el valor, o cadena vacía si no se encuentra
 */
function buscarValorJuntoA_(hoja, etiquetas) {
  const filas = Math.min(AJUSTES.FILAS_A_REVISAR, hoja.getMaxRows());
  const columnas = hoja.getMaxColumns();
  const datos = hoja.getRange(1, 1, filas, columnas).getDisplayValues();
  const buscadas = etiquetas.map(normalizar_);

  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const valor = normalizar_(datos[f][c]).replace(/:$/, '');
      if (buscadas.indexOf(valor) === -1) continue;
      for (let d = c + 1; d < columnas; d++) {
        const contenido = String(datos[f][d] || '').trim();
        if (contenido) return contenido;
      }
    }
  }
  return '';
}

/**
 * Carpeta de Drive donde se guardan los PDF, junto a la hoja.
 * @return {!GoogleAppsScript.Drive.Folder}
 */
function carpetaPdf_() {
  const padres = DriveApp.getFileById(
    SpreadsheetApp.getActiveSpreadsheet().getId()).getParents();
  const raiz = padres.hasNext() ? padres.next() : DriveApp.getRootFolder();
  const existente = raiz.getFoldersByName(AJUSTES.CARPETA_PDF);
  return existente.hasNext()
    ? existente.next()
    : raiz.createFolder(AJUSTES.CARPETA_PDF);
}

/**
 * Muestra el enlace al PDF recién creado.
 * @param {!GoogleAppsScript.Drive.File} archivo
 * @param {string} aviso
 * @param {boolean} correcto si se ocultaron las columnas esperadas
 */
function mostrarEnlace_(archivo, aviso, correcto) {
  const color = correcto ? '#1D7A4C' : '#C4161C';
  const html = HtmlService.createHtmlOutput(
    '<div style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6">' +
    '<p><b>PDF listo.</b></p>' +
    '<p><a href="' + archivo.getUrl() + '" target="_blank">' +
    archivo.getName().replace(/[<>&]/g, '') + '</a></p>' +
    '<p style="color:' + color + '">' + aviso.replace(/[<>&]/g, '') + '</p>' +
    '<p style="color:#666">Ábrelo, descárgalo y adjúntalo al correo.</p>' +
    '</div>').setWidth(480).setHeight(230);
  SpreadsheetApp.getUi().showModalDialog(html, 'Generar PDF');
}
