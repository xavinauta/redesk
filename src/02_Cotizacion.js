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
