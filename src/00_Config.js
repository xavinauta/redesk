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

/** Coordenadas fijas de la hoja "Cotización". */
const COT = {
  FILA_NUMERO: 3,
  FILA_FECHA: 4,
  FILA_CLIENTE: 5,
  FILA_CONTACTO: 6,
  FILA_EMAIL: 7,
  FILA_CC: 8,
  FILA_REFERENCIA: 9,
  FILA_ENTREGA: 10,
  FILA_PAGO: 11,
  FILA_VALIDEZ: 12,
  FILA_OBSERVACIONES: 13,
  FILA_HILO: 14,
  COL_ETIQUETA: 1, // A
  COL_VALOR: 2, // B
  FILA_ENCABEZADO_ITEMS: 16,
  FILA_PRIMER_ITEM: 17,
  FILA_ULTIMO_ITEM: 66,
  FILA_SUBTOTAL: 68,
  FILA_IVA: 69,
  FILA_TOTAL: 70,
  COL_ITEM: 1, // A
  COL_CODIGO: 2, // B
  COL_CANTIDAD: 3, // C
  COL_DESCRIPCION: 4, // D
  COL_MARCA: 5, // E
  COL_PUNITARIO: 6, // F
  COL_DESCUENTO: 7, // G
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
  ['EMPRESA_NOMBRE', 'REDESK Asesores y Servicios', 'Razón social o nombre comercial que va en el encabezado del PDF', ''],
  ['EMPRESA_RUC', '102864808001', 'RUC. VERIFICAR antes de usar en producción', '@'],
  ['EMPRESA_REPRESENTANTE', 'Ing. Xavier Ñauta T., MgT.', 'Nombre de quien firma la cotización', ''],
  ['EMPRESA_CARGO', 'Gerente', 'Cargo de quien firma', ''],
  ['EMPRESA_DIRECCION', '', 'Dirección que aparece en el pie del PDF', ''],
  ['EMPRESA_CIUDAD', 'Cuenca - Ecuador', 'Ciudad y país', ''],
  ['EMPRESA_TELEFONOS', '099-5108229 / 099-6746927', 'Teléfonos de contacto', '@'],
  ['EMPRESA_EMAIL', 'ventas@redesk.net', 'Correo comercial', ''],
  ['EMPRESA_WEB', 'www.redesk.net', 'Sitio web', ''],
  ['EMPRESA_LOGO_URL', '', 'URL pública del logo (PNG/JPG). Vacío = sin logo', ''],
  ['COLOR_PRIMARIO', '#1F4E79', 'Color del encabezado del PDF en hexadecimal', ''],
  ['IVA_PCT', 0.15, 'IVA vigente como fracción. Ecuador: 15%', '0.00%'],
  ['MARGEN_DEFECTO', 0.18, 'Margen aplicado cuando el ítem del catálogo no tiene uno propio', '0.00%'],
  ['MARGEN_SOBRE', 'COSTO', 'COSTO = pvp costo*(1+margen). VENTA = pvp costo/(1-margen)', ''],
  ['VALIDEZ_DIAS', 8, 'Días de validez de la oferta', '0'],
  ['MONEDA', 'USD', 'Moneda de la cotización', ''],
  ['FORMA_PAGO', '50% anticipo, 50% contra entrega', 'Forma de pago por defecto', ''],
  ['TIEMPO_ENTREGA', '8 a 10 días laborables', 'Tiempo de entrega por defecto', ''],
  ['GARANTIA', '1 año de garantía con el fabricante', 'Garantía por defecto', ''],
  ['PREFIJO_COTIZACION', 'COT', 'Prefijo del número de cotización', ''],
  ['SECUENCIAL', 1, 'Próximo número correlativo. Se incrementa solo', '0'],
  ['SECUENCIAL_ANIO', new Date().getFullYear(), 'Año del correlativo. Al cambiar de año se reinicia en 1', '0'],
  ['CARPETA_COTIZACIONES_ID', '', 'ID de la carpeta de Drive donde se guardan los PDF. Lo llena el instalador', '@'],
  ['CARPETA_PRECIOS_ID', '', 'ID de la carpeta donde sueltas los precios de proveedores. Lo llena el instalador', '@'],
  ['GMAIL_ALIAS', '', 'Alias desde el que se crea el borrador (ej. ventas@redesk.net). Vacío = cuenta principal', ''],
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
 * Reserva el siguiente número de cotización de forma segura ante
 * ejecuciones concurrentes. Reinicia el correlativo al cambiar de año.
 * @return {string} Por ejemplo "COT-2026-0007".
 */
function siguienteNumero_() {
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    _cacheConfig = null;
    const cfg = leerConfig();
    const anioActual = new Date().getFullYear();
    let n = Number(cfg.SECUENCIAL) || 1;
    if (Number(cfg.SECUENCIAL_ANIO) !== anioActual) {
      n = 1;
      escribirConfig_('SECUENCIAL_ANIO', anioActual);
    }
    escribirConfig_('SECUENCIAL', n + 1);
    const prefijo = String(cfg.PREFIJO_COTIZACION || 'COT');
    return prefijo + '-' + anioActual + '-' + ('0000' + n).slice(-4);
  } finally {
    lock.releaseLock();
  }
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
