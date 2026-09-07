/**
 * Pruebas del reconocimiento de descripción y precio.
 *
 *     node test/parser.test.js
 *
 * Los casos son líneas como las que devuelve el OCR de una lista de precios
 * de proveedor: nombres de producto con números dentro, importes en los dos
 * formatos decimales, y las filas de ruido que hay que descartar.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { aNumero_, lineaAItem_, pareceProducto_, extraerItems_ } =
  require('../simple/parser.js');

let pasadas = 0;
const casos = [];
const prueba = (nombre, fn) => casos.push([nombre, fn]);

// ------------------------------------------------------------- importes

prueba('aNumero_ entiende el formato con coma decimal', () => {
  assert.strictEqual(aNumero_('245,00'), 245);
  assert.strictEqual(aNumero_('1.234,56'), 1234.56);
  assert.strictEqual(aNumero_('12,5'), 12.5);
});

prueba('aNumero_ entiende el formato con punto decimal', () => {
  assert.strictEqual(aNumero_('105.84'), 105.84);
  assert.strictEqual(aNumero_('1,234.56'), 1234.56);
  assert.strictEqual(aNumero_('1376.66'), 1376.66);
});

prueba('aNumero_ trata como miles un separador con tres dígitos detrás', () => {
  // 1.234 en una lista de precios son mil doscientos treinta y cuatro.
  assert.strictEqual(aNumero_('1.234'), 1234);
  assert.strictEqual(aNumero_('1,234'), 1234);
});

prueba('aNumero_ ignora el símbolo de moneda y los espacios', () => {
  assert.strictEqual(aNumero_('$ 105.84'), 105.84);
  assert.strictEqual(aNumero_('USD 1.234,56'), 1234.56);
  assert.strictEqual(aNumero_('sin número'), null);
});

// ---------------------------------------------------------------- líneas

prueba('toma el importe con decimales y no el número del nombre', () => {
  // El error clásico: quedarse con el "6" de WIFI 6.
  const item = lineaAItem_('GWN7660ELR AP 2X2 DOBLE BANDA WIFI 6   105.84');
  assert.strictEqual(item.precio, 105.84);
  assert.strictEqual(item.descripcion, 'GWN7660ELR AP 2X2 DOBLE BANDA WIFI 6');
  assert.strictEqual(item.seguro, true);
});

prueba('el símbolo de moneda manda sobre todo lo demás', () => {
  const item = lineaAItem_('UPS APC 3KVA RACK 120V ....... $ 245,00');
  assert.strictEqual(item.precio, 245);
  assert.strictEqual(item.descripcion, 'UPS APC 3KVA RACK 120V');
  assert.strictEqual(item.seguro, true);
});

prueba('separa por el último importe cuando hay costo y precio', () => {
  const item = lineaAItem_('DISCO SSD 1TB NVME KINGSTON  78.50  95.20');
  assert.strictEqual(item.precio, 95.2);
  assert.strictEqual(item.descripcion, 'DISCO SSD 1TB NVME KINGSTON 78.50');
});

prueba('sin decimales ni moneda, avisa de que no está seguro', () => {
  const item = lineaAItem_('MOUSE INALAMBRICO LOGITECH M170  12');
  assert.strictEqual(item.precio, 12);
  assert.strictEqual(item.seguro, false,
    'para que la revisión en pantalla lo destaque');
});

prueba('limpia los puntos de relleno del final de la descripción', () => {
  assert.strictEqual(
    lineaAItem_('TECLADO USB GENIUS -------- 8,90').descripcion,
    'TECLADO USB GENIUS');
  assert.strictEqual(
    lineaAItem_('MONITOR LG 24 | 145.00').descripcion, 'MONITOR LG 24');
});

prueba('descarta las líneas que no son productos', () => {
  assert.strictEqual(lineaAItem_(''), null);
  assert.strictEqual(lineaAItem_('   '), null);
  assert.strictEqual(lineaAItem_('LISTA DE PRECIOS'), null, 'no tiene importe');
  assert.strictEqual(lineaAItem_('123.45'), null, 'no tiene descripción');
  assert.strictEqual(lineaAItem_('12 34 56'), null, 'sólo números');
  assert.strictEqual(lineaAItem_('AP 0.00'), null, 'un precio de cero no sirve');
});

prueba('acepta descripciones con acentos y eñes', () => {
  const item = lineaAItem_('CÁMARA IP DOMO HIKVISION 4MPX  $62,40');
  assert.strictEqual(item.descripcion, 'CÁMARA IP DOMO HIKVISION 4MPX');
  assert.strictEqual(item.precio, 62.4);
});

prueba('pareceProducto_ descarta encabezados, totales y pies', () => {
  const no = (d, p, seguro) =>
    assert.strictEqual(
      pareceProducto_({ descripcion: d, precio: p, seguro: seguro !== false }),
      false, d);
  no('TOTAL', 376.64);
  no('SUBTOTAL', 100);
  no('IVA 15%', 15.88);
  no('Página 1 de', 2, false);
  no('LISTA DE PRECIOS SEPTIEMBRE', 2026, false);
  // Un año suelto no es un precio.
  no('CATALOGO ACTUALIZADO', 2026, false);
});

prueba('pareceProducto_ no descarta productos que empiezan parecido', () => {
  const si = (d, p) =>
    assert.strictEqual(
      pareceProducto_({ descripcion: d, precio: p, seguro: true }), true, d);
  si('TOTALPLAY ROUTER AC1200', 45.9);
  si('IVACOM SWITCH 24P', 210);
  // 2026 con decimales sí es un importe creíble.
  assert.strictEqual(
    pareceProducto_({ descripcion: 'SERVIDOR DELL R250', precio: 2026.40, seguro: true }),
    true);
});

// ---------------------------------------------------------- lista entera

prueba('extraerItems_ procesa una lista completa y descarta el ruido', () => {
  const ocr = [
    'ZC MAYORISTAS',
    'LISTA DE PRECIOS SEPTIEMBRE 2026',
    '',
    'GRANDSTREAM GWN7660ELR AP WIFI 6      105.84',
    'UBIQUITI U6-LR ACCESS POINT           178,50',
    'TP-LINK EAP245 AP DOBLE BANDA    $ 92.30',
    '',
    'Página 1 de 2',
    'TOTAL                                 376.64',
  ].join('\n');

  const items = extraerItems_(ocr);
  assert.strictEqual(items.length, 3,
    'las cabeceras y el pie no son productos: ' + JSON.stringify(items));
  assert.deepStrictEqual(items.map((i) => i.precio), [105.84, 178.5, 92.3]);
  assert.ok(items[0].descripcion.startsWith('GRANDSTREAM GWN7660ELR'));
});

prueba('extraerItems_ tolera un texto vacío', () => {
  assert.deepStrictEqual(extraerItems_(''), []);
  assert.deepStrictEqual(extraerItems_(null), []);
});

// -------------------------------------------------------------- sincronía

prueba('Codigo.gs lleva dentro el mismo parser que se prueba aquí', () => {
  // parser.js existe aparte sólo para poder probarlo con Node. Si los dos se
  // separan, las pruebas dejarían de decir nada sobre lo que corre en la hoja.
  const parser = fs.readFileSync(
    path.join(__dirname, '..', 'simple', 'parser.js'), 'utf8');
  const codigo = fs.readFileSync(
    path.join(__dirname, '..', 'simple', 'Codigo.gs'), 'utf8');

  const sinExport = parser.slice(0, parser.indexOf('// Sólo para las pruebas'));
  const cuerpo = sinExport.slice(sinExport.indexOf(' */') + 4).trim();

  assert.ok(codigo.includes(cuerpo),
    'simple/Codigo.gs quedó desincronizado de simple/parser.js');
  assert.ok(!codigo.includes('module.exports'),
    'Codigo.gs no debe llevar el export de Node');
});

prueba('Codigo.gs y dialogo.html se llaman por los mismos nombres', () => {
  const codigo = fs.readFileSync(
    path.join(__dirname, '..', 'simple', 'Codigo.gs'), 'utf8');
  const dialogo = fs.readFileSync(
    path.join(__dirname, '..', 'simple', 'dialogo.html'), 'utf8');

  // El diálogo llama al servidor por nombre: un cambio de nombre sólo en un
  // lado se manifestaría como un fallo mudo en pantalla.
  ['reconocerArchivo', 'insertarItems'].forEach((fn) => {
    assert.ok(dialogo.includes('.' + fn + '('), 'el diálogo debe llamar a ' + fn);
    assert.ok(new RegExp('function\\s+' + fn + '\\s*\\(').test(codigo),
      'Codigo.gs debe definir ' + fn);
  });
  assert.ok(codigo.includes("createHtmlOutputFromFile('dialogo')"),
    'el archivo HTML tiene que llamarse "dialogo"');
});

// ------------------------------------------------------------------ fin

let fallos = 0;
casos.forEach(([nombre, fn]) => {
  try {
    fn();
    pasadas++;
    console.log('  ✓ ' + nombre);
  } catch (err) {
    fallos++;
    console.log('  ✗ ' + nombre + '\n      ' + err.message);
  }
});
console.log(`\n${pasadas}/${casos.length} pruebas pasadas`);
process.exit(fallos ? 1 : 0);
