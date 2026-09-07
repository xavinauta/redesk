/**
 * Pruebas de la lógica de simple/Codigo.gs.
 *
 *     node test/parser.test.js
 *
 * El código a probar se extrae del propio Codigo.gs, del bloque marcado como
 * LÓGICA PROBADA, y se ejecuta con Node. Así no hay una copia paralela que
 * pueda desincronizarse: lo que se prueba es exactamente lo que corre en la
 * hoja.
 *
 * Los casos son líneas como las que devuelve el OCR de una lista de precios
 * de proveedor: nombres de producto con números dentro, importes en los dos
 * formatos decimales, y las filas de ruido que hay que descartar.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const CODIGO = path.join(__dirname, '..', 'simple', 'Codigo.gs');

/**
 * Extrae el bloque probado de Codigo.gs y lo ejecuta en un contexto aislado.
 * @return {!Object} el contexto, con las funciones del bloque
 */
function cargarLogica() {
  const fuente = fs.readFileSync(CODIGO, 'utf8');
  const inicio = fuente.indexOf('LÓGICA PROBADA — inicio');
  const fin = fuente.indexOf('LÓGICA PROBADA — fin');
  assert.ok(inicio !== -1 && fin > inicio,
    'faltan los marcadores LÓGICA PROBADA en simple/Codigo.gs');

  const bloque = fuente.slice(fuente.indexOf('\n', inicio), fin);
  const contexto = { console };
  vm.createContext(contexto);
  vm.runInContext(bloque, contexto, { filename: 'Codigo.gs' });
  return contexto;
}

const L = cargarLogica();
const { aNumero_, lineaAItem_, pareceProducto_, extraerItems_ } = L;

let pasadas = 0;
const casos = [];
const prueba = (nombre, fn) => casos.push([nombre, fn]);

/**
 * Compara estructuras que salen del contexto `vm`. Sus arrays y objetos
 * llevan el prototipo de ese contexto, así que deepStrictEqual los rechaza
 * aunque el contenido coincida; normalizar por JSON compara lo que importa.
 */
function igual(actual, esperado, mensaje) {
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(actual)), esperado, mensaje);
}

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
  igual(items.map((i) => i.precio), [105.84, 178.5, 92.3]);
  assert.ok(items[0].descripcion.startsWith('GRANDSTREAM GWN7660ELR'));
});

prueba('extraerItems_ tolera un texto vacío', () => {
  igual(extraerItems_(''), []);
  igual(extraerItems_(null), []);
});

// ------------------------------------------- hojas de cálculo (xls, sheets)

prueba('localizarCabecera_ encuentra las columnas por su encabezado', () => {
  const cab = L.localizarCabecera_([
    ['ZC MAYORISTAS', '', ''],
    ['CODIGO', 'DESCRIPCIÓN', 'PRECIO'],
    ['A1', 'SWITCH 24P', '92.30'],
  ]);
  igual(cab, { fila: 1, descripcion: 1, precio: 2 });
});

prueba('localizarCabecera_ prefiere la columna de precio más específica', () => {
  // Con COSTO y PRECIO UNITARIO en la misma tabla, gana el unitario.
  const cab = L.localizarCabecera_([
    ['DETALLE', 'COSTO', 'PRECIO UNITARIO'],
  ]);
  assert.strictEqual(cab.precio, 2);
  assert.strictEqual(cab.descripcion, 0);
});

prueba('localizarCabecera_ devuelve null si no reconoce la tabla', () => {
  assert.strictEqual(L.localizarCabecera_([['a', 'b'], ['c', 'd']]), null);
  assert.strictEqual(L.localizarCabecera_([]), null);
});

prueba('extraerDeTabla_ toma las columnas cuando hay encabezado', () => {
  const items = L.extraerDeTabla_([
    ['LISTA DE PRECIOS', '', ''],
    ['CÓDIGO', 'DESCRIPCION', 'PRECIO UNITARIO'],
    ['GWN7660', 'GRANDSTREAM AP WIFI 6', '105.84'],
    ['U6LR', 'UBIQUITI U6-LR', '$ 178,50'],
    ['', '', ''],
    ['TOT', 'TOTAL', '284.34'],
  ]);
  igual(items.map((i) => [i.descripcion, i.precio, i.seguro]), [
    ['GRANDSTREAM AP WIFI 6', 105.84, true],
    ['UBIQUITI U6-LR', 178.5, true],
  ]);
});

prueba('extraerDeTabla_ ignora las filas sin precio o sin descripción', () => {
  const items = L.extraerDeTabla_([
    ['PRODUCTO', 'PRECIO'],
    ['MONITOR LG 24', '145.00'],
    ['SIN PRECIO', ''],
    ['', '99.00'],
    ['X', '50.00'],
  ]);
  igual(items.map((i) => i.descripcion), ['MONITOR LG 24'],
    'una descripción de una letra no es un producto');
});

prueba('extraerDeTabla_ recurre a la lectura por línea sin encabezado', () => {
  const items = L.extraerDeTabla_([
    ['SWITCH TP-LINK 24P', '', '92.30'],
    ['CAMARA HIKVISION 4MPX', '', '62.40'],
  ]);
  assert.strictEqual(items.length, 2);
  assert.strictEqual(items[0].precio, 92.3);
  assert.strictEqual(items[0].seguro, false,
    'sin encabezado, cuál es el precio es una suposición');
});

prueba('idDeUrl_ saca el identificador de un enlace de hoja', () => {
  const id = '187vb8AR79Ibm2lbKkbSz1zVf0e2s-l-PPChOdENfrMU';
  assert.strictEqual(
    L.idDeUrl_('https://docs.google.com/spreadsheets/d/' + id +
      '/edit?usp=sharing'), id);
  assert.strictEqual(L.idDeUrl_(id), id, 'también vale el identificador solo');
  assert.strictEqual(L.idDeUrl_(''), '');
  assert.strictEqual(L.idDeUrl_('https://redesk.net'), '');
});

prueba('normalizar_ compara encabezados escritos de cualquier manera', () => {
  assert.strictEqual(L.normalizar_('  Descripción '), 'DESCRIPCION');
  assert.strictEqual(L.normalizar_('Precio  Unitario'), 'PRECIO UNITARIO');
  assert.strictEqual(L.normalizar_(null), '');
});

// --------------------------------------------------- líneas repetidas

prueba('claveItem_ iguala las líneas que son la misma', () => {
  const clave = L.claveItem_;
  // Al leer dos fotos de la misma lista, la misma línea no debe colarse dos
  // veces sin avisar.
  assert.strictEqual(
    clave({ descripcion: 'SWITCH  TP-LINK 24P', precio: 92.3 }),
    clave({ descripcion: 'switch tp-link 24p', precio: 92.30 }));
  assert.notStrictEqual(
    clave({ descripcion: 'SWITCH TP-LINK 24P', precio: 92.3 }),
    clave({ descripcion: 'SWITCH TP-LINK 24P', precio: 95 }));
});

// ------------------------------------------- dónde escribir en la hoja

prueba('indiceLibre_ encuentra dónde continuar la lista', () => {
  const libre = L.indiceLibre_;
  assert.strictEqual(libre(['MONITOR', 'TECLADO', '', '']), 2,
    'se añade debajo de lo que ya hay');
  assert.strictEqual(libre(['', 'TECLADO']), 0,
    'si la celda de partida está libre, se empieza ahí');
  assert.strictEqual(libre(['  ', 'X']), 0, 'los espacios no cuentan');
  assert.strictEqual(libre(['A', 'B']), 2, 'si no hay hueco, va al final');
  assert.strictEqual(libre([]), 0);
});

prueba('hayContenido_ detecta si el hueco está ocupado', () => {
  const hay = L.hayContenido_;
  assert.strictEqual(hay([['', ''], ['', '']]), false);
  assert.strictEqual(hay([['', ''], ['', '9.90']]), true,
    'un precio suelto también ocupa');
  assert.strictEqual(hay([[null, undefined]]), false);
  assert.strictEqual(hay([]), false);
});

// -------------------------------------------------- diálogo y servidor

prueba('Codigo.gs y dialogo.html se llaman por los mismos nombres', () => {
  const codigo = fs.readFileSync(CODIGO, 'utf8');
  const dialogo = fs.readFileSync(
    path.join(__dirname, '..', 'simple', 'dialogo.html'), 'utf8');

  // El diálogo llama al servidor por nombre: un cambio en un solo lado se
  // manifestaría como un fallo mudo en pantalla.
  ['reconocerArchivo', 'insertarItems'].forEach((fn) => {
    assert.ok(dialogo.includes('.' + fn + '('), 'el diálogo debe llamar a ' + fn);
    assert.ok(new RegExp('function\\s+' + fn + '\\s*\\(').test(codigo),
      'Codigo.gs debe definir ' + fn);
  });
  assert.ok(codigo.includes("createHtmlOutputFromFile('dialogo')"),
    'el archivo HTML tiene que llamarse "dialogo"');
});

prueba('el diálogo usa los campos que el servidor devuelve', () => {
  const dialogo = fs.readFileSync(
    path.join(__dirname, '..', 'simple', 'dialogo.html'), 'utf8');
  // reconocerArchivo devuelve {archivo, items:[{descripcion, precio, seguro,
  // archivo, clave}]}: el diálogo se apoya en todos ellos.
  ['resultado.items', 'item.clave', 'item.seguro', 'item.descripcion',
    'item.precio', 'item.archivo'].forEach((campo) => {
    assert.ok(dialogo.includes(campo), 'falta el uso de ' + campo);
  });
});

prueba('el diálogo admite varios archivos y los lee en serie', () => {
  const dialogo = fs.readFileSync(
    path.join(__dirname, '..', 'simple', 'dialogo.html'), 'utf8');
  assert.ok(/id="archivo"[^>]*\bmultiple\b/.test(dialogo),
    'el selector debe admitir varios archivos');
  // En serie: cada OCR es una subida a Drive y lanzarlos a la vez agota cuota.
  assert.ok(dialogo.includes('leerUno(archivos, i + 1)'),
    'los archivos se encadenan uno tras otro');
});

prueba('el diálogo acepta también hojas de cálculo y enlaces', () => {
  const codigo = fs.readFileSync(CODIGO, 'utf8');
  const dialogo = fs.readFileSync(
    path.join(__dirname, '..', 'simple', 'dialogo.html'), 'utf8');

  ['.xlsx', '.xls', '.ods', '.csv'].forEach((ext) => {
    assert.ok(dialogo.includes(ext), 'el selector debe aceptar ' + ext);
  });
  assert.ok(dialogo.includes('.reconocerHojaPorUrl('),
    'el diálogo debe poder leer una hoja por su enlace');
  assert.ok(/function\s+reconocerHojaPorUrl\s*\(/.test(codigo),
    'Codigo.gs debe definir reconocerHojaPorUrl');
});

prueba('ya no hace falta el servicio avanzado de Drive', () => {
  // Las llamadas van por la API REST: un paso menos de instalación y un
  // error menos que se pueda dar.
  const codigo = fs.readFileSync(CODIGO, 'utf8');
  const manifiesto = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'simple', 'appsscript.json'), 'utf8'));

  assert.ok(!/\bDrive\.Files\./.test(codigo),
    'no debe quedar ninguna llamada al servicio avanzado');
  assert.strictEqual(manifiesto.dependencies, undefined,
    'el manifiesto no debe declarar servicios avanzados');
  assert.ok(
    manifiesto.oauthScopes.includes(
      'https://www.googleapis.com/auth/script.external_request'),
    'hace falta el permiso de peticiones externas para llamar a la API');
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
