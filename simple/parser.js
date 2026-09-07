/**
 * REDESK — lectura de listas de precios de proveedor
 * --------------------------------------------------
 * Convierte el texto que devuelve el OCR en pares descripción / precio.
 *
 * Este archivo forma parte de simple/Codigo.gs. Se mantiene aparte para
 * poder probarlo con Node, porque es la única parte con lógica de verdad:
 * decidir cuál de los números de una línea es el precio.
 */

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
  const letras = descripcion.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, '').length;
  if (letras < 3) return null;

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

// Sólo para las pruebas con Node; Apps Script ignora esta línea.
if (typeof module !== 'undefined') {
  module.exports = {
    aNumero_, elegirPrecio_, lineaAItem_, pareceProducto_, extraerItems_,
  };
}
