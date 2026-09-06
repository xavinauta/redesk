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
  // búsquedas del catálogo no recorren mil filas vacías.
  const cfg = leerConfig();
  const sobreVenta = String(cfg.MARGEN_SOBRE || 'COSTO').toUpperCase() === 'VENTA';
  const margen = 'IF($H$2:$H="",MARGEN_DEFECTO,$H$2:$H)';
  const cuerpo = sobreVenta
    ? '$G$2:$G/(1-' + margen + ')'
    : '$G$2:$G*(1+' + margen + ')';
  h.getRange(2, CAT.PVP, filas, 1).clearContent();
  h.getRange(2, CAT.PVP).setFormula(
    '=ARRAYFORMULA(IF($G$2:$G="","",ROUND(' + cuerpo + ',2)))');

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
  h.getRange(COT.FILA_ATTE, COT.COL_VALOR).setFormula(buscar(CLI.CONTACTO));
  h.getRange(COT.FILA_EMAIL, COT.COL_VALOR).setFormula(buscar(CLI.EMAIL));
  h.getRange(COT.FILA_CC, COT.COL_VALOR).setFormula(buscar(CLI.CC));
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
    .setFormulaR1C1('=IF(RC5="","",COUNTA(R' + p + 'C5:RC5))')
    .setHorizontalAlignment('center');
  h.getRange(p, COT.COL_TOTAL, nItems, 1)
    .setFormulaR1C1('=IF(RC5="","",ROUND(RC3*RC6,2))');

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
    h.getRange(t[0], COT.COL_TOTAL).setFormula(t[2])
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
