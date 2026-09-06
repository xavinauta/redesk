/**
 * Pruebas de la lógica pura del proyecto, ejecutables con `node test/logica.test.js`.
 *
 * Apps Script no se puede ejecutar fuera de Google, así que aquí se cargan
 * los archivos de src/ en un contexto con los objetos globales de Google
 * simulados, y se prueban las funciones que sólo manipulan texto y números:
 * el análisis de los correos de compras, el formateo de importes y el
 * armado del cuerpo de la respuesta.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const SRC = path.join(__dirname, '..', 'src');
const ARCHIVOS = [
  '00_Config.js', '01_Instalar.js', '02_Cotizacion.js',
  '03_Pdf.js', '04_Gmail.js', '05_PreciosProveedor.js', '06_Menu.js',
];

/** Objetos de Google simulados: sólo lo que hace falta para cargar el código. */
const sandbox = {
  console,
  MimeType: { PDF: 'application/pdf', GOOGLE_DOCS: 'application/vnd.google-apps.document' },
  SpreadsheetApp: {
    getUi: () => ({ ButtonSet: {}, Button: {}, alert: () => {}, createMenu: () => {} }),
    getActiveSpreadsheet: () => ({ getSpreadsheetTimeZone: () => 'America/Guayaquil' }),
    newDataValidation: () => ({}),
    BorderStyle: { SOLID: 'SOLID' },
  },
  Utilities: {
    formatDate: (d) => {
      const p = (n) => String(n).padStart(2, '0');
      return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
    },
  },
  GmailApp: { getAliases: () => [] },
  Session: { getActiveUser: () => ({ getEmail: () => 'xnauta@redesk.net' }) },
  DriveApp: {}, DocumentApp: {}, HtmlService: {}, LockService: {}, Drive: {},
};
vm.createContext(sandbox);
ARCHIVOS.forEach((f) => {
  vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8'), sandbox, { filename: f });
});

let pasadas = 0;
const casos = [];
function prueba(nombre, fn) { casos.push([nombre, fn]); }

// ---------------------------------------------------------------- correos

prueba('extraerEmail_ soporta ambos formatos de remitente', () => {
  assert.strictEqual(
    sandbox.extraerEmail_('MICHAEL CARREÑO <compras@tecopesca.com>'),
    'compras@tecopesca.com');
  assert.strictEqual(
    sandbox.extraerEmail_('descalante@bilbosa.com'), 'descalante@bilbosa.com');
});

prueba('empresaDeRemitente_ deduce el nombre desde el dominio', () => {
  const f = sandbox.empresaDeRemitente_;
  assert.strictEqual(f('compras@tecopesca.com'), 'Tecopesca');
  assert.strictEqual(f('Denisse <descalante@bilbosa.com>'), 'Bilbosa');
  assert.strictEqual(f('jmsanchez@jep.coop'), 'Jep');
  assert.strictEqual(f('rocio.torres@celec.gob.ec'), 'Celec');
  assert.strictEqual(f('no-es-un-correo'), '');
});

prueba('limpiarCuerpo_ descarta la cita y el aviso legal', () => {
  const crudo = [
    'Buenas tardes',
    '',
    'Estimado proveedor por favor su ayuda cotizando los siguientes discos.',
    '',
    'Este mensaje, incluyendo sus anexos, es privado y CONFIDENCIAL.',
    '',
    'El mar, 11 ago 2026 a la(s) 3:48 p.m., MICHAEL escribió:',
    '> texto citado que no interesa',
  ].join('\n');
  const limpio = sandbox.limpiarCuerpo_(crudo);
  assert.ok(limpio.includes('cotizando los siguientes discos'));
  assert.ok(!limpio.includes('CONFIDENCIAL'), 'debe quitar el aviso legal');
  assert.ok(!limpio.includes('texto citado'), 'debe quitar la cita');
});

prueba('detectarPlazo_ reconoce los plazos que usan los clientes', () => {
  const f = sandbox.detectarPlazo_;
  assert.ok(/24 horas/i.test(f(
    'Enviar la cotización dentro de 24 horas, de no recibir la información…')));
  assert.ok(/24 horas/i.test(f('Enviar proforma en menos 24 horas')));
  assert.ok(/m[aá]xima el jueves/i.test(f(
    'Enviar la cotización máxima el jueves 13AGO2026.')));
  assert.strictEqual(f('Buenos días, adjunto la orden de compra.'), '');
});

// ------------------------------------------------------------- proveedores

prueba('proveedorDeNombre_ separa el proveedor del resto del archivo', () => {
  const f = sandbox.proveedorDeNombre_;
  assert.strictEqual(f('Tecnomega - discos servidor.pdf'), 'Tecnomega');
  assert.strictEqual(f('Intcomex 2026 laptops.png'), 'Intcomex');
  assert.strictEqual(f('Siglo_lista precios.jpg'), 'Siglo');
  // Un dígito corta el nombre: es el precio de reconocer "Intcomex 2026".
  assert.strictEqual(f('Siglo21 lista.jpg'), 'Siglo');
  // Sin separador se usa el nombre completo sin extensión.
  assert.strictEqual(f('Tecnomega.pdf'), 'Tecnomega');
});

// ---------------------------------------------------------------- importes

prueba('money_ agrupa los miles y fija dos decimales', () => {
  assert.strictEqual(sandbox.money_(1234.5), '1,234.50');
  assert.strictEqual(sandbox.money_(0), '0.00');
  assert.strictEqual(sandbox.money_(1234567.891), '1,234,567.89');
  assert.strictEqual(sandbox.money_(''), '0.00');
});

prueba('nombreArchivo_ limpia los caracteres que Drive rechaza', () => {
  const nombre = sandbox.nombreArchivo_({
    numero: 'COT-2026-0007',
    cliente: 'TECOPESCA C.A.',
    referencia: 'Cotización de TV\'s / pantallas',
  });
  assert.strictEqual(
    nombre, "COT-2026-0007 - TECOPESCA C.A. - Cotización de TV's - pantallas.pdf");
  assert.ok(!/[\\/:*?"<>|]/.test(nombre.replace('.pdf', '')));
});

prueba('escaparHtml_ neutraliza el marcado', () => {
  assert.strictEqual(
    sandbox.escaparHtml_('<b>a & "b"</b>'),
    '&lt;b&gt;a &amp; &quot;b&quot;&lt;/b&gt;');
});

// ------------------------------------------------------- cuerpo del correo

const COTIZACION_EJEMPLO = {
  numero: 'COT-2026-0007',
  referencia: 'Cotización de computadores',
  entrega: '8 a 10 días laborables',
  pago: '50% anticipo, 50% contra entrega',
  validez: '8',
  datosCliente: { contacto: 'Michael Carreño', email: 'compras@tecopesca.com' },
  cfg: {
    EMPRESA_REPRESENTANTE: 'Ing. Xavier Ñauta T., MgT.',
    EMPRESA_CARGO: 'Gerente',
    EMPRESA_NOMBRE: 'REDESK Asesores y Servicios',
    EMPRESA_EMAIL: 'ventas@redesk.net',
    EMPRESA_TELEFONOS: '099-5108229 / 099-6746927',
    EMPRESA_WEB: 'www.redesk.net',
  },
};

prueba('cuerpoCorreo_ saluda por el nombre y enfatiza el plazo de entrega', () => {
  const c = sandbox.cuerpoCorreo_(COTIZACION_EJEMPLO);
  assert.ok(c.texto.startsWith('Estimado/a Michael:'));
  assert.ok(c.texto.includes('COT-2026-0007'));
  // Los clientes piden siempre "enfatizar tiempo de entrega".
  assert.ok(c.texto.includes('Tiempo de entrega: 8 a 10 días laborables'));
  assert.ok(c.html.includes('<b>Tiempo de entrega:</b>'));
  assert.ok(c.texto.includes('Ing. Xavier Ñauta T., MgT.'));
});

prueba('cuerpoCorreo_ usa un saludo genérico sin contacto', () => {
  const sinContacto = Object.assign({}, COTIZACION_EJEMPLO,
    { datosCliente: { contacto: '', email: 'x@y.com' } });
  assert.ok(sandbox.cuerpoCorreo_(sinContacto).texto.startsWith('Estimados:'));
});

// ---------------------------------------------------------------- plantilla

prueba('datosPlantilla_ entrega los importes ya formateados', () => {
  const d = sandbox.datosPlantilla_(Object.assign({}, COTIZACION_EJEMPLO, {
    fechaTexto: '13/08/2026',
    cliente: 'TECOPESCA C.A.',
    moneda: 'USD',
    subtotal: 2400, iva: 360, total: 2760, ivaPct: 0.15,
    garantia: '1 año', observaciones: '',
    items: [{
      n: 1, codigo: 'LEN-E14', cantidad: 2, descripcion: 'Laptop ThinkPad E14',
      marca: 'Lenovo', punitario: 1200, descuento: 0, total: 2400,
    }],
  }));
  assert.strictEqual(d.subtotalTexto, '2,400.00');
  assert.strictEqual(d.ivaPctTexto, '15%');
  assert.strictEqual(d.totalTexto, '2,760.00');
  assert.strictEqual(d.items[0].descuentoTexto, '—', 'sin descuento va una raya');
  assert.strictEqual(d.items[0].punitarioTexto, '1,200.00');
});

prueba('multilinea_ conserva los saltos de las especificaciones', () => {
  const especificacion = 'Laptop ThinkPad E14\n• Intel i7 14ª Gen\n• 32 GB RAM';
  const html = sandbox.multilinea_(especificacion);
  assert.strictEqual(
    html, 'Laptop ThinkPad E14<br>• Intel i7 14ª Gen<br>• 32 GB RAM');
  // Y sigue escapando: el <br> es nuestro, no del contenido.
  assert.strictEqual(sandbox.multilinea_('a <b>x</b>'), 'a &lt;b&gt;x&lt;/b&gt;');
});

prueba('los bloques de plantilla.html están balanceados', () => {
  const html = fs.readFileSync(path.join(SRC, 'plantilla.html'), 'utf8');
  const abre = (html.match(/<\?\s*(?:if|for)\b/g) || []).length;
  const cierra = (html.match(/<\?\s*\}\s*\?>/g) || []).length;
  assert.strictEqual(cierra, abre,
    `hay ${abre} bloques abiertos y ${cierra} cerrados`);
  assert.strictEqual(
    (html.match(/<\?/g) || []).length, (html.match(/\?>/g) || []).length,
    'cada <? debe tener su ?>');
});

// ------------------------------------------------------------------ salida

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
