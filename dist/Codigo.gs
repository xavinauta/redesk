/**
 * REDESK — Automatización de cotizaciones
 * =======================================
 *
 * ARCHIVO GENERADO. No lo edites: los cambios se pierden al regenerarlo.
 * Edita src/ y ejecuta `node tools/empaquetar.js`.
 *
 * Contiene todos los módulos de src/ concatenados, para pegarlos de una vez
 * en el editor de Apps Script.
 */

// =========================================================================
// 00_Config.js
// =========================================================================

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
  ['SEPARADOR_FORMULAS', '', 'Separador de argumentos de las fórmulas: "," o ";". Vacío = detectar solo', ''],
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

/** Separador detectado, cacheado durante la ejecución. */
let _separador = null;

/**
 * Separador de argumentos que entienden las fórmulas de esta hoja.
 *
 * Google Sheets analiza las fórmulas según el idioma del archivo: donde el
 * separador decimal es la coma —español, portugués, alemán…— los argumentos
 * se separan con punto y coma, y una fórmula escrita con comas da #ERROR!.
 * Apps Script no traduce, así que hay que averiguarlo y escribir en consecuencia.
 *
 * Se comprueba con una fórmula de prueba en vez de deducirlo del idioma:
 * la lista de idiomas afectados es larga y cambia.
 *
 * @return {string} "," o ";"
 */
function separadorFormulas_() {
  if (_separador) return _separador;

  const guardado = String(leerConfig().SEPARADOR_FORMULAS || '').trim();
  if (guardado === ',' || guardado === ';') {
    _separador = guardado;
    return _separador;
  }

  const ss = libro_();
  const activa = ss.getActiveSheet();
  let sonda = null;
  try {
    sonda = ss.insertSheet('_sonda_' + Date.now());
    sonda.getRange(1, 1).setFormula('=SUM(1,1)');
    SpreadsheetApp.flush();
    _separador = sonda.getRange(1, 1).getValue() === 2 ? ',' : ';';
  } catch (err) {
    _separador = ';';
  } finally {
    if (sonda) ss.deleteSheet(sonda);
    if (activa) ss.setActiveSheet(activa);
  }

  escribirConfig_('SEPARADOR_FORMULAS', _separador);
  return _separador;
}

/**
 * Adapta una fórmula escrita con comas al separador de esta hoja.
 *
 * Las comas dentro de literales entre comillas se dejan intactas: forman
 * parte del texto, no separan argumentos.
 *
 * No escribas decimales dentro de las fórmulas —0.15 y similares—: en un
 * idioma de coma decimal se leerían mal. Ponlos en Config y refiérete a
 * ellos con un rango con nombre.
 *
 * @param {string} formula fórmula en notación estándar, con comas
 * @param {string} separador "," o ";"
 * @return {string}
 */
function cambiarSeparador_(formula, separador) {
  if (separador === ',') return formula;

  let salida = '';
  let enTexto = false;
  for (let i = 0; i < formula.length; i++) {
    const c = formula.charAt(i);
    if (c === '"') enTexto = !enTexto;
    salida += (c === ',' && !enTexto) ? separador : c;
  }
  return salida;
}

/**
 * Atajo: adapta la fórmula al separador de esta hoja.
 * @param {string} formula
 * @return {string}
 */
function formula_(formula) {
  return cambiarSeparador_(formula, separadorFormulas_());
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

// =========================================================================
// 01_Instalar.js
// =========================================================================

/**
 * REDESK — Automatización de cotizaciones
 * ---------------------------------------
 * 01_Instalar.js — crea o repara las hojas del libro, los rangos con
 * nombre, las validaciones y las carpetas de Drive.
 *
 * Es idempotente: se puede ejecutar cuantas veces se quiera. Nunca borra
 * datos que ya existan; sólo crea lo que falta y reescribe encabezados,
 * formatos y fórmulas.
 */

/** Punto de entrada del menú REDESK ▸ Instalar / reparar hojas. */
function instalar() {
  const ss = libro_();
  crearHojaConfig_(ss);
  crearHojaClientes_(ss);
  crearHojaCatalogo_(ss);
  crearHojaCotizacion_(ss);
  crearHojaHistorial_(ss);
  crearHojaSolicitudes_(ss);
  crearHojaPrecios_(ss);
  crearCarpetas_();
  ordenarHojas_(ss);
  _cacheConfig = null;

  SpreadsheetApp.getUi().alert(
    'REDESK',
    'Instalación completa.\n\n' +
      'Siguientes pasos:\n' +
      '1. Revisa la hoja "Config" (RUC, dirección, IVA, márgenes).\n' +
      '2. Carga tus clientes en la hoja "Clientes".\n' +
      '3. Carga productos en "Catálogo" (basta código, descripción y costo).\n' +
      '4. Usa REDESK ▸ Nueva cotización para empezar.\n\n' +
      'En Drive se crearon las carpetas "REDESK - Cotizaciones" y ' +
      '"REDESK - Precios proveedor".',
    SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Devuelve la hoja con ese nombre, creándola si no existe.
 * @param {!GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @param {string} nombre
 * @return {!GoogleAppsScript.Spreadsheet.Sheet}
 */
function obtenerOCrear_(ss, nombre) {
  return ss.getSheetByName(nombre) || ss.insertSheet(nombre);
}

/**
 * Pinta una fila de encabezados con el estilo de la plantilla.
 * @param {!GoogleAppsScript.Spreadsheet.Sheet} h
 * @param {!Array<string>} titulos
 * @param {number=} fila
 */
function encabezados_(h, titulos, fila) {
  const f = fila || 1;
  const r = h.getRange(f, 1, 1, titulos.length);
  r.setValues([titulos])
    .setFontWeight('bold')
    .setFontColor('#FFFFFF')
    .setBackground('#1F4E79')
    .setVerticalAlignment('middle')
    .setWrap(true);
  h.setRowHeight(f, 32);
  h.setFrozenRows(f);
}

/** Crea la hoja Config con los valores por defecto que falten. */
function crearHojaConfig_(ss) {
  const h = obtenerOCrear_(ss, HOJAS.CONFIG);
  encabezados_(h, ['Clave', 'Valor', 'Qué hace']);

  const existentes = {};
  if (h.getLastRow() > 1) {
    h.getRange(2, 1, h.getLastRow() - 1, 1).getValues().forEach(function (f, i) {
      if (f[0]) existentes[String(f[0]).trim()] = i + 2;
    });
  }

  CONFIG_DEFECTO.forEach(function (def) {
    const clave = def[0];
    if (existentes[clave]) {
      // Ya existe: sólo refrescamos la descripción y el formato.
      h.getRange(existentes[clave], 3).setValue(def[2]);
      if (def[3]) h.getRange(existentes[clave], 2).setNumberFormat(def[3]);
      return;
    }
    const fila = h.getLastRow() + 1;
    h.getRange(fila, 1, 1, 3).setValues([[clave, def[1], def[2]]]);
    if (def[3]) h.getRange(fila, 2).setNumberFormat(def[3]);
    existentes[clave] = fila;
  });

  h.setColumnWidth(1, 210);
  h.setColumnWidth(2, 300);
  h.setColumnWidth(3, 460);
  h.getRange(2, 3, Math.max(h.getLastRow() - 1, 1), 1)
    .setFontColor('#666666')
    .setFontSize(9)
    .setWrap(true);

  // Rangos con nombre para poder usarlos en fórmulas de otras hojas.
  crearRangoNombrado_(ss, 'IVA_PCT', h, existentes['IVA_PCT']);
  crearRangoNombrado_(ss, 'MARGEN_DEFECTO', h, existentes['MARGEN_DEFECTO']);

  _cacheConfig = null; // se acaba de reescribir la hoja
}

/**
 * Apunta un rango con nombre a la celda de valor de una clave de Config.
 * @param {!GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @param {string} nombre
 * @param {!GoogleAppsScript.Spreadsheet.Sheet} h
 * @param {number} fila
 */
function crearRangoNombrado_(ss, nombre, h, fila) {
  if (!fila) return;
  ss.getNamedRanges().forEach(function (nr) {
    if (nr.getName() === nombre) nr.remove();
  });
  ss.setNamedRange(nombre, h.getRange(fila, 2));
}

/** Crea la hoja Clientes. */
function crearHojaClientes_(ss) {
  const h = obtenerOCrear_(ss, HOJAS.CLIENTES);
  encabezados_(h, [
    'Empresa', 'RUC', 'Contacto', 'Cargo', 'Correo',
    'Copia a (CC, separados por coma)', 'Teléfono', 'Dirección', 'Ciudad', 'Notas',
  ]);
  [220, 120, 180, 150, 220, 260, 130, 240, 130, 240].forEach(function (w, i) {
    h.setColumnWidth(i + 1, w);
  });
  h.getRange(2, CLI.RUC, h.getMaxRows() - 1, 1).setNumberFormat('@');
  h.getRange(2, CLI.TELEFONO, h.getMaxRows() - 1, 1).setNumberFormat('@');
}

/** Crea la hoja Catálogo con la fórmula de PVP según el modo de margen. */
function crearHojaCatalogo_(ss) {
  const h = obtenerOCrear_(ss, HOJAS.CATALOGO);
  encabezados_(h, [
    'Código', 'Categoría', 'Marca', 'Modelo / Part Number', 'Descripción',
    'Unidad', 'Costo USD', 'Margen', 'PVP USD', 'Proveedor',
    'Tiempo entrega', 'Garantía', 'Actualizado', 'Fuente',
  ]);
  [110, 140, 110, 190, 420, 80, 100, 90, 100, 160, 150, 180, 110, 260]
    .forEach(function (w, i) { h.setColumnWidth(i + 1, w); });

  const filas = h.getMaxRows() - 1;
  h.getRange(2, CAT.COSTO, filas, 1).setNumberFormat('#,##0.00');
  h.getRange(2, CAT.PVP, filas, 1).setNumberFormat('#,##0.00');
  h.getRange(2, CAT.MARGEN, filas, 1).setNumberFormat('0.00%');
  h.getRange(2, CAT.ACTUALIZADO, filas, 1).setNumberFormat('dd/MM/yyyy');
  h.getRange(2, CAT.DESCRIPCION, filas, 1).setWrap(true);

  // PVP calculado con una sola ARRAYFORMULA en I2, no con una fórmula por
  // fila: así getLastRow() sigue reflejando los productos reales y las
  // búsquedas del catálogo no recorren mil filas vacías. formula_() adapta
  // el separador de argumentos al idioma de la hoja.
  const cfg = leerConfig();
  const sobreVenta = String(cfg.MARGEN_SOBRE || 'COSTO').toUpperCase() === 'VENTA';
  const margen = 'IF($H$2:$H="",MARGEN_DEFECTO,$H$2:$H)';
  const cuerpo = sobreVenta
    ? '$G$2:$G/(1-' + margen + ')'
    : '$G$2:$G*(1+' + margen + ')';
  h.getRange(2, CAT.PVP, filas, 1).clearContent();
  h.getRange(2, CAT.PVP).setFormula(
    formula_('=ARRAYFORMULA(IF($G$2:$G="","",ROUND(' + cuerpo + ',2)))'));

  h.getRange(2, CAT.PVP, filas, 1).setBackground('#F2F7FB');
  h.getRange(1, CAT.PVP).setNote('Columna calculada por una ARRAYFORMULA que ' +
    'vive en I2: no escribas nada en esta columna. Cambia el Costo o el ' +
    'Margen, o el modo en Config ▸ MARGEN_SOBRE.');
}

/**
 * Crea y formatea la hoja de trabajo Cotización, con los mismos campos y
 * columnas que la proforma que REDESK ya envía a sus clientes.
 */
function crearHojaCotizacion_(ss) {
  const h = obtenerOCrear_(ss, HOJAS.COTIZACION);
  const cfg = leerConfig();

  h.getRange('A1').setValue('PROFORMA')
    .setFontSize(18).setFontWeight('bold');
  h.getRange('A1:H1').merge();

  const etiquetas = [
    [COT.FILA_NUMERO, 'N° Proforma'],
    [COT.FILA_FECHA, 'Fecha'],
    [COT.FILA_CLIENTE, 'Nombre (cliente)'],
    [COT.FILA_ATTE, 'Atte'],
    [COT.FILA_EMAIL, 'E-Mail'],
    [COT.FILA_CC, 'Copia a (CC)'],
    [COT.FILA_ASUNTO, 'Asunto'],
    [COT.FILA_ASESOR, 'Asesor'],
    [COT.FILA_NOTAS, 'Notas'],
    [COT.FILA_PAGO, 'Pago'],
    [COT.FILA_GARANTIA, 'Garantía'],
    [COT.FILA_VALIDEZ, 'Validez'],
    [COT.FILA_HILO, 'ID hilo Gmail'],
  ];
  etiquetas.forEach(function (e) {
    h.getRange(e[0], COT.COL_ETIQUETA).setValue(e[1]).setFontWeight('bold');
    h.getRange(e[0], COT.COL_VALOR, 1, 4).merge();
  });

  h.getRange(COT.FILA_NUMERO, COT.COL_VALOR).setNumberFormat('@')
    .setFontWeight('bold').setFontColor(String(cfg.COLOR_DESTACADO || '#FF0000'));
  h.getRange(COT.FILA_FECHA, COT.COL_VALOR).setNumberFormat('dd/MM/yyyy');
  h.getRange(COT.FILA_HILO, COT.COL_VALOR).setNumberFormat('@')
    .setFontColor('#999999').setFontSize(9);
  h.getRange(COT.FILA_HILO, COT.COL_ETIQUETA).setFontColor('#999999')
    .setFontSize(9)
    .setNote('Lo llena "Cotizar solicitud seleccionada". Si tiene un ID, el ' +
      'borrador se crea como respuesta dentro de ese hilo de Gmail.');
  h.getRange(COT.FILA_ASUNTO, COT.COL_ETIQUETA)
    .setNote('Encabeza el PDF y da nombre al archivo, igual que en ' +
      '"IMPORTADORA TOMEBAMBA - EQUIPO PORTABLE DELL".');

  // Desplegable de clientes.
  const hClientes = ss.getSheetByName(HOJAS.CLIENTES);
  if (hClientes) {
    const regla = SpreadsheetApp.newDataValidation()
      .requireValueInRange(hClientes.getRange('A2:A1000'), true)
      .setAllowInvalid(true)
      .build();
    h.getRange(COT.FILA_CLIENTE, COT.COL_VALOR).setDataValidation(regla);
  }

  // Datos del cliente auto-completados por fórmula.
  const buscar = function (col) {
    return '=IF($B$' + COT.FILA_CLIENTE + '="","",IFERROR(VLOOKUP($B$' +
      COT.FILA_CLIENTE + ",'" + HOJAS.CLIENTES + "'!$A:$J," + col + ',FALSE),""))';
  };
  h.getRange(COT.FILA_ATTE, COT.COL_VALOR).setFormula(formula_(buscar(CLI.CONTACTO)));
  h.getRange(COT.FILA_EMAIL, COT.COL_VALOR).setFormula(formula_(buscar(CLI.EMAIL)));
  h.getRange(COT.FILA_CC, COT.COL_VALOR).setFormula(formula_(buscar(CLI.CC)));
  h.getRange(COT.FILA_ATTE, COT.COL_VALOR, 3, 1).setBackground('#F2F7FB');

  // Tabla de ítems, con las mismas columnas que la proforma en papel.
  const acento = String(cfg.COLOR_ACENTO || '#8EAADB');
  const cab = h.getRange(COT.FILA_ENCABEZADO_ITEMS, 1, 1, 8);
  cab.setValues([[
    '#', 'Código', 'CANTIDAD', 'TIPO', 'DESCRIPCION',
    'PRECIO UNITARIO', 'OBSERVACION', 'PRECIO TOTAL',
  ]])
    .setFontWeight('bold')
    .setBackground(acento)
    .setVerticalAlignment('middle')
    .setWrap(true)
    .setBorder(true, true, true, true, true, true, '#000000',
      SpreadsheetApp.BorderStyle.SOLID);
  h.setRowHeight(COT.FILA_ENCABEZADO_ITEMS, 34);

  [40, 110, 70, 110, 430, 100, 120, 100].forEach(function (w, i) {
    h.setColumnWidth(i + 1, w);
  });

  const nItems = COT.FILA_ULTIMO_ITEM - COT.FILA_PRIMER_ITEM + 1;
  const p = COT.FILA_PRIMER_ITEM;

  // R1C1 para que cada fila apunte a su propia descripción y precio.
  // RC5 = Descripción, RC3 = Cantidad, RC6 = Precio unitario.
  h.getRange(p, COT.COL_ITEM, nItems, 1)
    .setFormulaR1C1(formula_('=IF(RC5="","",COUNTA(R' + p + 'C5:RC5))'))
    .setHorizontalAlignment('center');
  h.getRange(p, COT.COL_TOTAL, nItems, 1)
    .setFormulaR1C1(formula_('=IF(RC5="","",ROUND(RC3*RC6,2))'));

  h.getRange(p, COT.COL_CANTIDAD, nItems, 1).setNumberFormat('#,##0.##')
    .setHorizontalAlignment('center');
  h.getRange(p, COT.COL_PUNITARIO, nItems, 1).setNumberFormat('#,##0.00');
  h.getRange(p, COT.COL_TOTAL, nItems, 1).setNumberFormat('#,##0.00');
  h.getRange(p, COT.COL_DESCRIPCION, nItems, 1).setWrap(true)
    .setVerticalAlignment('top');
  h.getRange(p, COT.COL_OBSERVACION, nItems, 1).setWrap(true)
    .setVerticalAlignment('top');
  h.getRange(p, COT.COL_ITEM, nItems, 8)
    .setBorder(true, true, true, true, true, true, '#B0B7BE',
      SpreadsheetApp.BorderStyle.SOLID);
  h.getRange(p, COT.COL_CODIGO, nItems, 1).setNumberFormat('@')
    .setBackground('#FFF8E1');
  h.getRange(COT.FILA_ENCABEZADO_ITEMS, COT.COL_CODIGO)
    .setNote('Escribe un código del Catálogo y se completan solos el tipo, ' +
      'la descripción, el precio y la observación. También puedes dejarlo ' +
      'vacío y escribirlo todo a mano.');
  h.getRange(COT.FILA_ENCABEZADO_ITEMS, COT.COL_DESCRIPCION)
    .setNote('Admite varias líneas (Alt+Enter). La primera suele ser ' +
      '"MARCA    NÚMERO DE PARTE" y las siguientes, las especificaciones.');

  // Totales.
  const totales = [
    [COT.FILA_SUBTOTAL, 'SUBTOTAL:',
      '=ROUND(SUM($H$' + p + ':$H$' + COT.FILA_ULTIMO_ITEM + '),2)'],
    [COT.FILA_IVA, 'IVA:', '=ROUND($H$' + COT.FILA_SUBTOTAL + '*IVA_PCT,2)'],
    [COT.FILA_TOTAL, 'TOTAL:',
      '=$H$' + COT.FILA_SUBTOTAL + '+$H$' + COT.FILA_IVA],
  ];
  totales.forEach(function (t) {
    h.getRange(t[0], COT.COL_OBSERVACION).setValue(t[1])
      .setFontWeight('bold').setHorizontalAlignment('right');
    h.getRange(t[0], COT.COL_TOTAL).setFormula(formula_(t[2]))
      .setNumberFormat('#,##0.00').setFontWeight('bold');
  });
  h.getRange(COT.FILA_TOTAL, COT.COL_OBSERVACION, 1, 2)
    .setFontColor(String(cfg.COLOR_DESTACADO || '#FF0000')).setFontSize(12);

  // Condiciones por defecto en un formulario todavía vacío.
  if (!h.getRange(COT.FILA_PAGO, COT.COL_VALOR).getValue()) {
    h.getRange(COT.FILA_ASESOR, COT.COL_VALOR).setValue(cfg.ASESOR || '');
    h.getRange(COT.FILA_NOTAS, COT.COL_VALOR).setValue(cfg.NOTAS || '');
    h.getRange(COT.FILA_PAGO, COT.COL_VALOR).setValue(cfg.PAGO || '');
    h.getRange(COT.FILA_GARANTIA, COT.COL_VALOR).setValue(cfg.GARANTIA || '');
    h.getRange(COT.FILA_VALIDEZ, COT.COL_VALOR).setValue(cfg.VALIDEZ || '');
  }
  h.setHiddenGridlines(true);
}

/** Crea la hoja Historial de cotizaciones emitidas. */
function crearHojaHistorial_(ss) {
  const h = obtenerOCrear_(ss, HOJAS.HISTORIAL);
  encabezados_(h, [
    'N° Cotización', 'Fecha', 'Cliente', 'Referencia', 'Ítems',
    'Subtotal', 'IVA', 'Total', 'Estado', 'PDF', 'ID hilo Gmail', 'Emitida por',
  ]);
  [130, 100, 220, 320, 60, 100, 100, 110, 120, 260, 200, 200]
    .forEach(function (w, i) { h.setColumnWidth(i + 1, w); });
  const filas = h.getMaxRows() - 1;
  h.getRange(2, 2, filas, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  h.getRange(2, 6, filas, 3).setNumberFormat('#,##0.00');
  h.getRange(2, 1, filas, 1).setNumberFormat('@');
  h.getRange(2, 11, filas, 1).setNumberFormat('@');

  const regla = SpreadsheetApp.newDataValidation()
    .requireValueInList(
      ['Borrador', 'Enviada', 'Ganada', 'Perdida', 'Anulada'], true)
    .setAllowInvalid(true)
    .build();
  h.getRange(2, 9, filas, 1).setDataValidation(regla);
}

/** Crea la hoja Solicitudes (correos entrantes de clientes). */
function crearHojaSolicitudes_(ss) {
  const h = obtenerOCrear_(ss, HOJAS.SOLICITUDES);
  encabezados_(h, [
    'Fecha', 'De', 'Empresa', 'Asunto', 'Qué piden (resumen)',
    'Plazo indicado', 'Estado', 'Abrir en Gmail', 'ID hilo',
  ]);
  [120, 240, 200, 300, 520, 160, 120, 130, 200]
    .forEach(function (w, i) { h.setColumnWidth(i + 1, w); });
  const filas = h.getMaxRows() - 1;
  h.getRange(2, 1, filas, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  h.getRange(2, 5, filas, 1).setWrap(true);
  h.getRange(2, 9, filas, 1).setNumberFormat('@');

  const regla = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pendiente', 'Cotizada', 'Descartada'], true)
    .setAllowInvalid(true)
    .build();
  h.getRange(2, 7, filas, 1).setDataValidation(regla);
}

/** Crea la hoja donde aterriza el OCR de los precios de proveedores. */
function crearHojaPrecios_(ss) {
  const h = obtenerOCrear_(ss, HOJAS.PRECIOS);
  encabezados_(h, [
    'Fecha archivo', 'Proveedor', 'Archivo', 'Abrir', 'Texto reconocido (OCR)',
    'ID archivo',
  ]);
  [120, 180, 300, 90, 700, 240]
    .forEach(function (w, i) { h.setColumnWidth(i + 1, w); });
  const filas = h.getMaxRows() - 1;
  h.getRange(2, 1, filas, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  h.getRange(2, 5, filas, 1).setWrap(false).setVerticalAlignment('top');
  h.getRange(2, 6, filas, 1).setNumberFormat('@');
}

/** Crea en Drive las carpetas de PDF y de precios, y guarda sus IDs. */
function crearCarpetas_() {
  const cfg = leerConfig();
  const raiz = carpetaDelLibro_();

  if (!carpetaValida_(cfg.CARPETA_COTIZACIONES_ID)) {
    escribirConfig_('CARPETA_COTIZACIONES_ID',
      subcarpeta_(raiz, 'REDESK - Cotizaciones').getId());
  }
  if (!carpetaValida_(cfg.CARPETA_PRECIOS_ID)) {
    escribirConfig_('CARPETA_PRECIOS_ID',
      subcarpeta_(raiz, 'REDESK - Precios proveedor').getId());
  }
}

/**
 * @param {*} id
 * @return {boolean} true si el ID corresponde a una carpeta accesible.
 */
function carpetaValida_(id) {
  if (!id) return false;
  try {
    DriveApp.getFolderById(String(id));
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Carpeta que contiene al propio archivo de Sheets, o "Mi unidad".
 * @return {!GoogleAppsScript.Drive.Folder}
 */
function carpetaDelLibro_() {
  const padres = DriveApp.getFileById(libro_().getId()).getParents();
  return padres.hasNext() ? padres.next() : DriveApp.getRootFolder();
}

/**
 * Devuelve la subcarpeta con ese nombre, creándola si no existe.
 * @param {!GoogleAppsScript.Drive.Folder} padre
 * @param {string} nombre
 * @return {!GoogleAppsScript.Drive.Folder}
 */
function subcarpeta_(padre, nombre) {
  const it = padre.getFoldersByName(nombre);
  return it.hasNext() ? it.next() : padre.createFolder(nombre);
}

/** Deja las hojas en un orden de uso lógico. */
function ordenarHojas_(ss) {
  const orden = [
    HOJAS.COTIZACION, HOJAS.SOLICITUDES, HOJAS.CATALOGO, HOJAS.CLIENTES,
    HOJAS.HISTORIAL, HOJAS.PRECIOS, HOJAS.CONFIG,
  ];
  orden.forEach(function (nombre, i) {
    const h = ss.getSheetByName(nombre);
    if (h) {
      ss.setActiveSheet(h);
      ss.moveActiveSheet(i + 1);
    }
  });
  const primera = ss.getSheetByName(HOJAS.COTIZACION);
  if (primera) ss.setActiveSheet(primera);
}

// =========================================================================
// 02_Cotizacion.js
// =========================================================================

/**
 * REDESK — Automatización de cotizaciones
 * ---------------------------------------
 * 02_Cotizacion.js — ciclo de vida de la cotización en la hoja de trabajo:
 * limpiar el formulario, autocompletar ítems desde el catálogo y leer los
 * datos ya armados para el PDF y el correo.
 */

/**
 * Limpia la hoja Cotización y reserva un número nuevo.
 * Pide confirmación porque descarta lo que haya en pantalla.
 */
function nuevaCotizacion() {
  const ui = SpreadsheetApp.getUi();
  const h = hoja_(HOJAS.COTIZACION);
  const numeroActual = h.getRange(COT.FILA_NUMERO, COT.COL_VALOR).getValue();

  if (numeroActual) {
    const r = ui.alert(
      'Nueva cotización',
      'Se va a limpiar la hoja. La cotización ' + numeroActual +
        ' ya quedó registrada en el Historial si la emitiste.\n\n¿Continuar?',
      ui.ButtonSet.YES_NO);
    if (r !== ui.Button.YES) return;
  }

  limpiarFormulario_(h);
  const numero = siguienteNumero_();
  const cfg = leerConfig();

  h.getRange(COT.FILA_NUMERO, COT.COL_VALOR).setValue(numero);
  h.getRange(COT.FILA_FECHA, COT.COL_VALOR).setValue(new Date());
  aplicarCondicionesPorDefecto_(h, cfg);

  libro_().setActiveSheet(h);
  h.setActiveSelection(h.getRange(COT.FILA_CLIENTE, COT.COL_VALOR));
  aviso_('Proforma ' + numero + ' lista. Elige el cliente.');
}

/**
 * Rellena asesor y condiciones comerciales con los valores de Config.
 * @param {!GoogleAppsScript.Spreadsheet.Sheet} h
 * @param {!Object<string, *>} cfg
 */
function aplicarCondicionesPorDefecto_(h, cfg) {
  h.getRange(COT.FILA_ASESOR, COT.COL_VALOR).setValue(cfg.ASESOR || '');
  h.getRange(COT.FILA_NOTAS, COT.COL_VALOR).setValue(cfg.NOTAS || '');
  h.getRange(COT.FILA_PAGO, COT.COL_VALOR).setValue(cfg.PAGO || '');
  h.getRange(COT.FILA_GARANTIA, COT.COL_VALOR).setValue(cfg.GARANTIA || '');
  h.getRange(COT.FILA_VALIDEZ, COT.COL_VALOR).setValue(cfg.VALIDEZ || '');
}

/**
 * Borra los datos editables del formulario dejando fórmulas y formato.
 * @param {!GoogleAppsScript.Spreadsheet.Sheet} h
 */
function limpiarFormulario_(h) {
  [
    COT.FILA_NUMERO, COT.FILA_FECHA, COT.FILA_CLIENTE, COT.FILA_ASUNTO,
    COT.FILA_ASESOR, COT.FILA_NOTAS, COT.FILA_PAGO, COT.FILA_GARANTIA,
    COT.FILA_VALIDEZ, COT.FILA_HILO,
  ].forEach(function (fila) {
    h.getRange(fila, COT.COL_VALOR).clearContent();
  });

  const n = COT.FILA_ULTIMO_ITEM - COT.FILA_PRIMER_ITEM + 1;
  // Columnas B a G: las que escribe la persona. # y Total son fórmulas y se
  // conservan. La observación entra aquí: si no, arrastraría el tiempo de
  // entrega de la proforma anterior.
  const anchoEditable = COT.COL_OBSERVACION - COT.COL_CODIGO + 1;
  h.getRange(COT.FILA_PRIMER_ITEM, COT.COL_CODIGO, n, anchoEditable)
    .clearContent();
}

/**
 * Disparador simple: al escribir un código en la hoja Cotización, trae del
 * catálogo la descripción, la marca y el precio de venta.
 *
 * Escribe valores (no fórmulas) para que sigan siendo editables a mano.
 *
 * @param {!GoogleAppsScript.Events.SheetsOnEdit} e
 */
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    const h = e.range.getSheet();
    if (h.getName() !== HOJAS.COTIZACION) return;
    if (e.range.getColumn() !== COT.COL_CODIGO) return;

    const fila = e.range.getRow();
    if (fila < COT.FILA_PRIMER_ITEM || fila > COT.FILA_ULTIMO_ITEM) return;

    const codigo = String(e.range.getValue()).trim();
    if (!codigo) return;

    const item = buscarEnCatalogo_(codigo);
    if (!item) {
      h.getRange(fila, COT.COL_CODIGO)
        .setNote('No encontré "' + codigo + '" en el Catálogo. ' +
          'Puedes escribir la descripción y el precio a mano.');
      return;
    }

    h.getRange(fila, COT.COL_CODIGO).clearNote();
    h.getRange(fila, COT.COL_TIPO).setValue(item.tipo);
    h.getRange(fila, COT.COL_DESCRIPCION).setValue(item.descripcion);
    h.getRange(fila, COT.COL_PUNITARIO).setValue(item.pvp);
    h.getRange(fila, COT.COL_OBSERVACION).setValue(
      item.entrega || String(leerConfig().OBSERVACION_DEFECTO || ''));
    if (!h.getRange(fila, COT.COL_CANTIDAD).getValue()) {
      h.getRange(fila, COT.COL_CANTIDAD).setValue(1);
    }
  } catch (err) {
    // Un disparador simple no debe romper la edición de la hoja.
    console.error('onEdit: ' + err);
  }
}

/**
 * Busca un código en el Catálogo (sin distinguir mayúsculas ni espacios).
 * @param {string} codigo
 * @return {?{descripcion: string, marca: string, pvp: number, entrega: string,
 *            garantia: string}}
 */
function buscarEnCatalogo_(codigo) {
  const h = hoja_(HOJAS.CATALOGO);
  if (h.getLastRow() < 2) return null;
  const buscado = codigo.trim().toLowerCase();

  // Se lee sólo la columna de códigos y después la fila que coincide. Leer
  // el catálogo entero aquí penalizaría cada tecleo, porque esto corre
  // dentro de onEdit.
  const codigos = h.getRange(2, CAT.CODIGO, h.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < codigos.length; i++) {
    if (String(codigos[i][0]).trim().toLowerCase() !== buscado) continue;
    const f = h.getRange(i + 2, 1, 1, CAT.ULTIMA).getValues()[0];
    return {
      tipo: String(f[CAT.CATEGORIA - 1] || '').trim(),
      descripcion: descripcionDeItem_(
        String(f[CAT.MARCA - 1] || ''),
        String(f[CAT.MODELO - 1] || ''),
        String(f[CAT.DESCRIPCION - 1] || '')),
      pvp: Number(f[CAT.PVP - 1]) || 0,
      entrega: String(f[CAT.ENTREGA - 1] || '').trim(),
      garantia: String(f[CAT.GARANTIA - 1] || '').trim(),
    };
  }
  return null;
}

/**
 * Arma la descripción tal como aparece en la proforma: una primera línea con
 * la marca y el número de parte, y debajo las especificaciones.
 *
 *   DELL        DELCOMPORY5C5C
 *   COMPUTADOR PORTATIL DELL PRO 14 SILVER Y5C5C 14PULG FHD ULTRA 5 235U…
 *
 * @param {string} marca
 * @param {string} modelo
 * @param {string} descripcion
 * @return {string}
 */
function descripcionDeItem_(marca, modelo, descripcion) {
  const cabecera = [marca.trim(), modelo.trim()].filter(Boolean).join('        ');
  return [cabecera, descripcion.trim()].filter(Boolean).join('\n');
}

/**
 * Lee la hoja Cotización y devuelve el objeto que consumen el PDF y el
 * correo. Valida lo mínimo imprescindible antes de emitir.
 *
 * @return {!Object} datos de la cotización
 */
function leerCotizacion_() {
  const h = hoja_(HOJAS.COTIZACION);
  const cfg = leerConfig();
  const v = function (fila) {
    return h.getRange(fila, COT.COL_VALOR).getDisplayValue().trim();
  };

  const numero = v(COT.FILA_NUMERO);
  if (!numero) {
    throw new Error(
      'La proforma no tiene número. Usa REDESK ▸ Nueva cotización.');
  }
  const cliente = v(COT.FILA_CLIENTE);
  if (!cliente) throw new Error('Falta elegir el cliente.');

  const n = COT.FILA_ULTIMO_ITEM - COT.FILA_PRIMER_ITEM + 1;
  const filas = h.getRange(COT.FILA_PRIMER_ITEM, COT.COL_ITEM, n, 8).getValues();
  const items = [];
  filas.forEach(function (f) {
    const descripcion = String(f[COT.COL_DESCRIPCION - 1] || '').trim();
    if (!descripcion) return;
    items.push({
      n: items.length + 1,
      codigo: String(f[COT.COL_CODIGO - 1] || '').trim(),
      cantidad: Number(f[COT.COL_CANTIDAD - 1]) || 0,
      tipo: String(f[COT.COL_TIPO - 1] || '').trim(),
      descripcion: descripcion,
      punitario: Number(f[COT.COL_PUNITARIO - 1]) || 0,
      observacion: String(f[COT.COL_OBSERVACION - 1] || '').trim(),
      total: Number(f[COT.COL_TOTAL - 1]) || 0,
    });
  });

  if (!items.length) throw new Error('La proforma no tiene ítems.');

  const sinPrecio = items.filter(function (i) { return i.punitario <= 0; });
  if (sinPrecio.length) {
    throw new Error(
      'Hay ' + sinPrecio.length + ' ítem(s) sin precio unitario: "' +
      sinPrecio[0].descripcion.slice(0, 60) + '…". Complétalos antes de emitir.');
  }
  const sinCantidad = items.filter(function (i) { return i.cantidad <= 0; });
  if (sinCantidad.length) {
    throw new Error(
      'Hay ' + sinCantidad.length + ' ítem(s) sin cantidad: "' +
      sinCantidad[0].descripcion.slice(0, 60) + '…".');
  }

  const subtotal = h.getRange(COT.FILA_SUBTOTAL, COT.COL_TOTAL).getValue();
  const iva = h.getRange(COT.FILA_IVA, COT.COL_TOTAL).getValue();
  const total = h.getRange(COT.FILA_TOTAL, COT.COL_TOTAL).getValue();

  const fechaCelda = h.getRange(COT.FILA_FECHA, COT.COL_VALOR).getValue();
  const fecha = fechaCelda instanceof Date ? fechaCelda : new Date();

  return {
    numero: numero,
    fecha: fecha,
    fechaTexto: fecha_(fecha),
    cliente: cliente,
    datosCliente: buscarCliente_(cliente),
    atte: v(COT.FILA_ATTE),
    email: v(COT.FILA_EMAIL),
    cc: v(COT.FILA_CC),
    asunto: v(COT.FILA_ASUNTO),
    asesor: v(COT.FILA_ASESOR) || String(cfg.ASESOR || ''),
    notas: v(COT.FILA_NOTAS),
    pago: v(COT.FILA_PAGO) || String(cfg.PAGO || ''),
    garantia: v(COT.FILA_GARANTIA) || String(cfg.GARANTIA || ''),
    validez: v(COT.FILA_VALIDEZ) || String(cfg.VALIDEZ || ''),
    hilo: v(COT.FILA_HILO),
    items: items,
    subtotal: Number(subtotal) || 0,
    iva: Number(iva) || 0,
    total: Number(total) || 0,
    ivaPct: Number(cfg.IVA_PCT) || 0,
    moneda: String(cfg.MONEDA || 'USD'),
    cfg: cfg,
  };
}

/**
 * Busca la ficha completa de un cliente por razón social.
 * @param {string} empresa
 * @return {!Object}
 */
function buscarCliente_(empresa) {
  const vacio = {
    empresa: empresa, ruc: '', contacto: '', cargo: '', email: '',
    cc: '', telefono: '', direccion: '', ciudad: '',
  };
  const h = hoja_(HOJAS.CLIENTES);
  if (h.getLastRow() < 2) return vacio;

  const datos = h.getRange(2, 1, h.getLastRow() - 1, CLI.ULTIMA).getValues();
  const buscado = empresa.trim().toLowerCase();
  for (let i = 0; i < datos.length; i++) {
    if (String(datos[i][CLI.EMPRESA - 1]).trim().toLowerCase() !== buscado) continue;
    const f = datos[i];
    return {
      empresa: String(f[CLI.EMPRESA - 1] || '').trim(),
      ruc: String(f[CLI.RUC - 1] || '').trim(),
      contacto: String(f[CLI.CONTACTO - 1] || '').trim(),
      cargo: String(f[CLI.CARGO - 1] || '').trim(),
      email: String(f[CLI.EMAIL - 1] || '').trim(),
      cc: String(f[CLI.CC - 1] || '').trim(),
      telefono: String(f[CLI.TELEFONO - 1] || '').trim(),
      direccion: String(f[CLI.DIRECCION - 1] || '').trim(),
      ciudad: String(f[CLI.CIUDAD - 1] || '').trim(),
    };
  }
  return vacio;
}

/**
 * Registra la cotización emitida en el Historial. Si el número ya estaba
 * registrado, actualiza esa fila en lugar de duplicarla.
 *
 * @param {!Object} c cotización leída con leerCotizacion_()
 * @param {string} urlPdf
 * @param {string} estado
 */
function registrarEnHistorial_(c, urlPdf, estado) {
  const h = hoja_(HOJAS.HISTORIAL);
  const fila = [
    c.numero, new Date(), c.cliente, c.asunto, c.items.length,
    c.subtotal, c.iva, c.total, estado, urlPdf, c.hilo,
    Session.getActiveUser().getEmail(),
  ];

  if (h.getLastRow() >= 2) {
    const numeros = h.getRange(2, 1, h.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < numeros.length; i++) {
      if (String(numeros[i][0]).trim() === c.numero) {
        h.getRange(i + 2, 1, 1, fila.length).setValues([fila]);
        return;
      }
    }
  }
  h.appendRow(fila);
}

// =========================================================================
// 03_Pdf.js
// =========================================================================

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

// =========================================================================
// 04_Gmail.js
// =========================================================================

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

// =========================================================================
// 05_PreciosProveedor.js
// =========================================================================

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

// =========================================================================
// 06_Menu.js
// =========================================================================

/**
 * REDESK — Automatización de cotizaciones
 * ---------------------------------------
 * 06_Menu.js — menú de la hoja y envoltorio de errores.
 *
 * Todas las acciones del menú pasan por ejecutar_(), que convierte
 * cualquier excepción en un diálogo legible en lugar del error rojo de
 * Apps Script.
 */

/**
 * Disparador simple: construye el menú al abrir el libro.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('REDESK')
    .addItem('Nueva cotización', 'miNuevaCotizacion')
    .addItem('Generar PDF', 'miGenerarPdf')
    .addItem('Generar PDF y crear borrador en Gmail', 'miGenerarPdfYBorrador')
    .addSeparator()
    .addItem('Leer solicitudes de Gmail', 'miLeerSolicitudes')
    .addItem('Cotizar solicitud seleccionada', 'miCotizarSolicitud')
    .addSeparator()
    .addItem('Importar precios de proveedor (OCR)', 'miImportarPrecios')
    .addItem('Buscar precio…', 'miBuscarPrecio')
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu('Carpetas')
      .addItem('Cotizaciones emitidas', 'miAbrirCarpetaCotizaciones')
      .addItem('Precios de proveedor', 'miAbrirCarpetaPrecios'))
    .addItem('Instalar / reparar hojas', 'miInstalar')
    .addToUi();
}

/**
 * Ejecuta una acción del menú mostrando los errores como diálogo.
 * @param {function()} fn
 */
function ejecutar_(fn) {
  try {
    fn();
  } catch (err) {
    console.error(err);
    SpreadsheetApp.getUi().alert(
      'REDESK', err && err.message ? err.message : String(err),
      SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function miInstalar() { ejecutar_(instalar); }
function miNuevaCotizacion() { ejecutar_(nuevaCotizacion); }
function miGenerarPdf() { ejecutar_(generarPdf); }
function miGenerarPdfYBorrador() { ejecutar_(generarPdfYBorrador); }
function miLeerSolicitudes() { ejecutar_(leerSolicitudes); }
function miCotizarSolicitud() { ejecutar_(cotizarSolicitudSeleccionada); }
function miImportarPrecios() { ejecutar_(importarPreciosProveedor); }
function miBuscarPrecio() { ejecutar_(buscarPrecio); }
function miAbrirCarpetaCotizaciones() { ejecutar_(abrirCarpetaCotizaciones); }
function miAbrirCarpetaPrecios() { ejecutar_(abrirCarpetaPrecios); }
