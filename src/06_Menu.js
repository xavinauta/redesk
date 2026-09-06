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
