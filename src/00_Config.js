/**
 * REDESK — Automatización de cotizaciones
 * ---------------------------------------
 * 00_Config.js — nombres de hojas, valores por defecto y acceso a la
 * hoja "Config".
 *
 * Toda la configuración editable vive en la hoja "Config" del mismo
 * archivo de Google Sheets, de modo que se pueda cambiar sin tocar código.
 */

/** Nombres de las hojas del libro. */
const HOJAS = {
  CONFIG: 'Config',
  CLIENTES: 'Clientes',
  CATALOGO: 'Catálogo',
  COTIZACION: 'Cotización',
  HISTORIAL: 'Historial',
  SOLICITUDES: 'Solicitudes',
  PRECIOS: 'Precios proveedor',
};

/**
 * Coordenadas fijas de la hoja "Cotización".
 * Reproducen el bloque de datos y la tabla de la proforma que REDESK ya
 * envía: Nombre / Atte / E-Mail arriba, y Notas / Pago / Garantía / Validez
 * como condiciones al pie.
 */
const COT = {
  FILA_NUMERO: 3,
  FILA_FECHA: 4,
  FILA_CLIENTE: 5,
  FILA_ATTE: 6,
  FILA_EMAIL: 7,
  FILA_CC: 8,
  FILA_ASUNTO: 9,
  FILA_ASESOR: 10,
  FILA_NOTAS: 11,
  FILA_PAGO: 12,
  FILA_GARANTIA: 13,
  FILA_VALIDEZ: 14,
  FILA_HILO: 15,
  COL_ETIQUETA: 1, // A
  COL_VALOR: 2, // B
  FILA_ENCABEZADO_ITEMS: 17,
  FILA_PRIMER_ITEM: 18,
  FILA_ULTIMO_ITEM: 67,
  FILA_SUBTOTAL: 69,
  FILA_IVA: 70,
  FILA_TOTAL: 71,
  COL_ITEM: 1, // A
  COL_CODIGO: 2, // B
  COL_CANTIDAD: 3, // C
  COL_TIPO: 4, // D
  COL_DESCRIPCION: 5, // E
  COL_PUNITARIO: 6, // F
  COL_OBSERVACION: 7, // G
  COL_TOTAL: 8, // H
};

/** Columnas de la hoja "Catálogo" (1-indexadas). */
const CAT = {
  CODIGO: 1,
  CATEGORIA: 2,
  MARCA: 3,
  MODELO: 4,
  DESCRIPCION: 5,
  UNIDAD: 6,
  COSTO: 7,
  MARGEN: 8,
  PVP: 9,
  PROVEEDOR: 10,
  ENTREGA: 11,
  GARANTIA: 12,
  ACTUALIZADO: 13,
  FUENTE: 14,
  ULTIMA: 14,
};

/** Columnas de la hoja "Clientes" (1-indexadas). */
const CLI = {
  EMPRESA: 1,
  RUC: 2,
  CONTACTO: 3,
  CARGO: 4,
  EMAIL: 5,
  CC: 6,
  TELEFONO: 7,
  DIRECCION: 8,
  CIUDAD: 9,
  NOTAS: 10,
  ULTIMA: 10,
};

/**
 * Valores por defecto de la hoja "Config".
 * [clave, valor, descripción, formato]
 * El formato "0.00%" hace que 0.15 se muestre como 15%.
 */
const CONFIG_DEFECTO = [
  ['EMPRESA_NOMBRE', 'REDESK Asesores y Servicios', 'Nombre comercial', ''],
  ['EMPRESA_REPRESENTANTE', 'Ing. Xavier Ñauta Tapia', 'Nombre bajo la firma', ''],
  ['EMPRESA_DIRECCION', 'LUIS MALO Y ENRIQUE MALO ESQ., CDLA. MUTUALISTA AZUAY II, J25.', 'Dirección del pie de página', ''],
  ['EMPRESA_TELEFONOS', '0995108229 / 0996746927', 'Teléfonos del pie', '@'],
  ['EMPRESA_EMAIL', 'ventas@redesk.net', 'Correo del pie', ''],
  ['EMPRESA_WEB', 'www.redesk.net', 'Web del pie', ''],
  ['ASESOR', 'XN', 'Iniciales que van en el campo ASESOR', ''],

  ['EMPRESA_CARGO', 'Gerente', 'Cargo en la firma del correo', ''],
  ['CORREO_FIRMANTE', 'Ing. Xavier Ñauta T., MgT.', 'Nombre en la firma del correo. El PDF usa EMPRESA_REPRESENTANTE', ''],
  ['EMPRESA_FACEBOOK', 'www.facebook.com/redesk', 'Facebook en la firma del correo. Vacío = no aparece', ''],
  ['EMPRESA_TWITTER', '@xavinauta', 'Twitter en la firma del correo. Vacío = no aparece', ''],

  ['LOGO_ARCHIVO_ID', '', 'ID en Drive del logo de REDESK (assets/logo-redesk.png)', '@'],
  ['FIRMA_ARCHIVO_ID', '', 'ID en Drive de la imagen de la firma. Vacío = sólo el nombre', '@'],
  ['MARCAS_ARCHIVO_ID', '', 'ID en Drive de la franja de marcas (assets/marcas.png)', '@'],

  ['COLOR_ACENTO', '#8EAADB', 'Relleno del encabezado de la tabla', ''],
  ['COLOR_DESTACADO', '#FF0000', 'Color del número de proforma y del total', ''],
  ['COLOR_ENLACE', '#0563C1', 'Color de los enlaces del pie', ''],

  ['IVA_PCT', 0.15, 'IVA vigente como fracción. Ecuador: 15%', '0.00%'],
  ['MARGEN_DEFECTO', 0.18, 'Margen aplicado a los ítems del catálogo sin margen propio', '0.00%'],
  ['MARGEN_SOBRE', 'COSTO', 'COSTO = pvp costo*(1+margen). VENTA = pvp costo/(1-margen)', ''],
  ['MONEDA', 'USD', 'Moneda de la cotización', ''],

  ['NOTAS', '', 'Texto por defecto del campo Notas', ''],
  ['PAGO', '30 DIAS.', 'Forma de pago por defecto', ''],
  ['GARANTIA', '3 AÑOS.', 'Garantía por defecto', ''],
  ['VALIDEZ', '5 DIAS.', 'Validez por defecto de la oferta', ''],
  ['OBSERVACION_DEFECTO', '24 HORAS', 'Observación por ítem cuando el catálogo no trae tiempo de entrega', ''],

  ['FORMATO_NUMERO', '#{n}', 'Formato del número. {n} correlativo, {n4} con ceros, {aaaa} año. Si incluye {aaaa} el correlativo se reinicia cada año', ''],
  ['SECUENCIAL', 1, 'Próximo número correlativo. Se incrementa solo', '0'],
  ['SECUENCIAL_ANIO', new Date().getFullYear(), 'Año del correlativo', '0'],

  ['CARPETA_COTIZACIONES_ID', '', 'Carpeta de Drive de los PDF. La llena el instalador', '@'],
  ['CARPETA_PRECIOS_ID', '', 'Carpeta de los precios de proveedor. La llena el instalador', '@'],
  ['GMAIL_ALIAS', '', 'Alias desde el que se crea el borrador. Vacío = cuenta principal', ''],
  ['GMAIL_BUSQUEDA', 'newer_than:30d -in:chats -from:me (cotizando OR cotización OR cotizacion OR proforma OR cotizar)', 'Consulta de Gmail para detectar solicitudes', ''],
];


/** Caché en memoria de la configuración, por ejecución. */
let _cacheConfig = null;

/** @return {GoogleAppsScript.Spreadsheet.Spreadsheet} */
function libro_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Devuelve la hoja pedida o lanza un error entendible si falta.
 * @param {string} nombre
 * @return {GoogleAppsScript.Spreadsheet.Sheet}
 */
function hoja_(nombre) {
  const h = libro_().getSheetByName(nombre);
  if (!h) {
    throw new Error(
      'Falta la hoja "' + nombre + '". Ejecuta REDESK ▸ Instalar / reparar hojas.');
  }
  return h;
}

/**
 * Lee toda la hoja Config como objeto {clave: valor}.
 * @return {!Object<string, *>}
 */
function leerConfig() {
  if (_cacheConfig) return _cacheConfig;
  const h = hoja_(HOJAS.CONFIG);
  const filas = h.getRange(2, 1, Math.max(h.getLastRow() - 1, 1), 2).getValues();
  const cfg = {};
  filas.forEach(function (f) {
    if (f[0] !== '' && f[0] !== null) cfg[String(f[0]).trim()] = f[1];
  });
  _cacheConfig = cfg;
  return cfg;
}

/**
 * Escribe un valor en la hoja Config, creando la clave si no existe.
 * @param {string} clave
 * @param {*} valor
 */
function escribirConfig_(clave, valor) {
  const h = hoja_(HOJAS.CONFIG);
  const ultima = Math.max(h.getLastRow(), 1);
  const claves = h.getRange(2, 1, Math.max(ultima - 1, 1), 1).getValues();
  for (let i = 0; i < claves.length; i++) {
    if (String(claves[i][0]).trim() === clave) {
      h.getRange(i + 2, 2).setValue(valor);
      _cacheConfig = null;
      return;
    }
  }
  h.appendRow([clave, valor, '']);
  _cacheConfig = null;
}

/**
 * Reserva el siguiente número de proforma de forma segura ante ejecuciones
 * concurrentes. El correlativo sólo se reinicia si el formato lleva el año.
 * @return {string} Por ejemplo "#7".
 */
function siguienteNumero_() {
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    _cacheConfig = null;
    const cfg = leerConfig();
    const formato = String(cfg.FORMATO_NUMERO || '#{n}');
    const anioActual = new Date().getFullYear();
    let n = Number(cfg.SECUENCIAL) || 1;

    if (formato.indexOf('{aaaa}') !== -1 &&
        Number(cfg.SECUENCIAL_ANIO) !== anioActual) {
      n = 1;
    }
    escribirConfig_('SECUENCIAL', n + 1);
    escribirConfig_('SECUENCIAL_ANIO', anioActual);
    return formatearNumero_(n, anioActual, formato);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Sustituye los marcadores del formato del número de proforma.
 * @param {number} n correlativo
 * @param {number} anio
 * @param {string} formato
 * @return {string}
 */
function formatearNumero_(n, anio, formato) {
  return String(formato || '#{n}')
    .replace(/\{n4\}/g, ('0000' + n).slice(-4))
    .replace(/\{n\}/g, String(n))
    .replace(/\{aaaa\}/g, String(anio));
}

/**
 * Formatea un número como importe en la moneda configurada.
 * @param {number} n
 * @return {string}
 */
function money_(n) {
  const v = Number(n) || 0;
  return v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Formatea una fecha como dd/mm/aaaa en la zona horaria del libro.
 * @param {Date} d
 * @return {string}
 */
function fecha_(d) {
  return Utilities.formatDate(d, libro_().getSpreadsheetTimeZone(), 'dd/MM/yyyy');
}

/**
 * Muestra un mensaje corto en la esquina de la hoja.
 * @param {string} msg
 * @param {string=} titulo
 */
function aviso_(msg, titulo) {
  libro_().toast(msg, titulo || 'REDESK', 6);
}
