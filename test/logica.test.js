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

prueba('nombreArchivo_ sigue la convención cliente - asunto', () => {
  assert.strictEqual(
    sandbox.nombreArchivo_({
      numero: '#7',
      cliente: 'IMPORTADORA TOMEBAMBA',
      asunto: 'EQUIPO PORTABLE DELL',
    }),
    'IMPORTADORA TOMEBAMBA - EQUIPO PORTABLE DELL.pdf');
});

prueba('nombreArchivo_ cae al número cuando no hay asunto', () => {
  assert.strictEqual(
    sandbox.nombreArchivo_({ numero: '#7', cliente: 'TECOPESCA', asunto: '' }),
    'TECOPESCA - #7.pdf');
});

prueba('nombreArchivo_ limpia los caracteres que Drive rechaza', () => {
  const nombre = sandbox.nombreArchivo_({
    numero: '#8', cliente: 'TECOPESCA C.A.', asunto: "Cotización de TV's / LED",
  });
  assert.ok(!/[\\/:*?"<>|]/.test(nombre.replace('.pdf', '')), nombre);
  assert.ok(nombre.includes("TV's - LED"));
});

prueba('escaparHtml_ neutraliza el marcado', () => {
  assert.strictEqual(
    sandbox.escaparHtml_('<b>a & "b"</b>'),
    '&lt;b&gt;a &amp; &quot;b&quot;&lt;/b&gt;');
});

// ------------------------------------------------------------- numeración

prueba('formatearNumero_ resuelve los marcadores del formato', () => {
  const f = sandbox.formatearNumero_;
  assert.strictEqual(f(7, 2026, '#{n}'), '#7', 'el formato que usa REDESK hoy');
  assert.strictEqual(f(7, 2026, 'COT-{aaaa}-{n4}'), 'COT-2026-0007');
  assert.strictEqual(f(123, 2026, 'P{n4}'), 'P0123');
  assert.strictEqual(f(7, 2026, ''), '#7', 'sin formato usa el de por defecto');
});

// -------------------------------------------------------------- catálogo

prueba('descripcionDeItem_ arma marca, parte y especificaciones', () => {
  assert.strictEqual(
    sandbox.descripcionDeItem_('DELL', 'DELCOMPORY5C5C',
      'COMPUTADOR PORTATIL DELL PRO 14 SILVER'),
    'DELL        DELCOMPORY5C5C\nCOMPUTADOR PORTATIL DELL PRO 14 SILVER');
  // Sin número de parte no debe quedar el relleno de espacios.
  assert.strictEqual(
    sandbox.descripcionDeItem_('APC', '', 'UPS 3KVA RACK'),
    'APC\nUPS 3KVA RACK');
  assert.strictEqual(sandbox.descripcionDeItem_('', '', 'Servicio'), 'Servicio');
});

// ------------------------------------------------------- cuerpo del correo

const COTIZACION_EJEMPLO = {
  numero: '#7',
  asunto: 'Cotización de computadores',
  pago: '30 DIAS.',
  garantia: '3 AÑOS.',
  validez: '5 DIAS.',
  datosCliente: { contacto: 'Michael Carreño', email: 'compras@tecopesca.com' },
  items: [
    { descripcion: 'LENOVO        21M3', observacion: '24 HORAS' },
    { descripcion: 'DELL        Y5C5C', observacion: '24 HORAS' },
  ],
  cfg: {
    EMPRESA_REPRESENTANTE: 'Ing. Xavier Ñauta Tapia',
    CORREO_FIRMANTE: 'Ing. Xavier Ñauta T., MgT.',
    EMPRESA_CARGO: 'Gerente',
    EMPRESA_NOMBRE: 'REDESK Asesores y Servicios',
    EMPRESA_EMAIL: 'ventas@redesk.net',
    EMPRESA_TELEFONOS: '099-5108229 / 099-6746927',
    EMPRESA_FACEBOOK: 'www.facebook.com/redesk',
    EMPRESA_TWITTER: '@xavinauta',
    EMPRESA_WEB: 'www.redesk.net',
    OBSERVACION_DEFECTO: '24 HORAS',
  },
};

prueba('tiempoDeEntrega_ resume cuando todos los ítems coinciden', () => {
  assert.strictEqual(sandbox.tiempoDeEntrega_(COTIZACION_EJEMPLO), '24 HORAS');
});

prueba('tiempoDeEntrega_ detalla por ítem cuando difieren', () => {
  const mixto = Object.assign({}, COTIZACION_EJEMPLO, {
    items: [
      { descripcion: 'LENOVO        21M3\nThinkPad E14', observacion: '24 HORAS' },
      { descripcion: 'DELL        Y5C5C\nPro 14', observacion: '15 DIAS' },
    ],
  });
  assert.strictEqual(
    sandbox.tiempoDeEntrega_(mixto),
    'LENOVO        21M3: 24 HORAS; DELL        Y5C5C: 15 DIAS');
});

prueba('tiempoDeEntrega_ cae al valor por defecto sin observaciones', () => {
  const sinObs = Object.assign({}, COTIZACION_EJEMPLO, {
    items: [{ descripcion: 'Servicio', observacion: '' }],
  });
  assert.strictEqual(sandbox.tiempoDeEntrega_(sinObs), '24 HORAS');
});

prueba('cuerpoCorreo_ saluda por el nombre y enfatiza el plazo de entrega', () => {
  const c = sandbox.cuerpoCorreo_(COTIZACION_EJEMPLO);
  assert.ok(c.texto.startsWith('Estimado/a Michael:'));
  assert.ok(c.texto.includes('#7'));
  // Los clientes piden siempre "enfatizar tiempo de entrega".
  assert.ok(c.texto.includes('Tiempo de entrega: 24 HORAS'));
  assert.ok(c.texto.includes('Garantía: 3 AÑOS.'));
  assert.ok(c.html.includes('<b>Tiempo de entrega:</b>'));
});

prueba('la firma del correo reproduce la que REDESK ya usa', () => {
  const c = sandbox.cuerpoCorreo_(COTIZACION_EJEMPLO);
  [
    'Ing. Xavier Ñauta T., MgT.',
    'Gerente de REDESK Asesores y Servicios',
    'Mail: ventas@redesk.net',
    'Celular: 099-5108229 / 099-6746927',
    'Facebook: www.facebook.com/redesk',
    'Twitter: @xavinauta',
    'Web: www.redesk.net',
  ].forEach((linea) => assert.ok(c.texto.includes(linea), 'falta: ' + linea));
  // El PDF firma con el nombre largo; el correo, con el de la firma habitual.
  assert.ok(!c.texto.includes('Ñauta Tapia'));
});

prueba('la firma omite las redes que se dejen vacías en Config', () => {
  const cfg = Object.assign({}, COTIZACION_EJEMPLO.cfg,
    { EMPRESA_FACEBOOK: '', EMPRESA_TWITTER: '' });
  const c = sandbox.cuerpoCorreo_(Object.assign({}, COTIZACION_EJEMPLO, { cfg }));
  assert.ok(!c.texto.includes('Facebook:'));
  assert.ok(!c.texto.includes('Twitter:'));
  assert.ok(c.texto.includes('Web: www.redesk.net'));
});

prueba('las versiones en texto y HTML del correo no se desincronizan', () => {
  const lineas = sandbox.firmaCorreo_(COTIZACION_EJEMPLO.cfg);
  lineas.forEach((l) => {
    const plano = l.html.replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    assert.strictEqual(plano, l.texto);
  });
});

prueba('cuerpoCorreo_ usa un saludo genérico sin contacto', () => {
  const sinContacto = Object.assign({}, COTIZACION_EJEMPLO,
    { datosCliente: { contacto: '', email: 'x@y.com' } });
  assert.ok(sandbox.cuerpoCorreo_(sinContacto).texto.startsWith('Estimados:'));
});

// ---------------------------------------------------------------- plantilla

prueba('datosPlantilla_ entrega los importes ya formateados', () => {
  const d = sandbox.datosPlantilla_(Object.assign({}, COTIZACION_EJEMPLO, {
    fechaTexto: '09/02/2026',
    cliente: 'IMPORTADORA TOMEBAMBA',
    atte: 'ING. JHONATAN QUITUISACA',
    email: '', asesor: 'XN', notas: '',
    datosCliente: {
      empresa: 'IMPORTADORA TOMEBAMBA', contacto: 'ING. JHONATAN QUITUISACA',
      email: '',
    },
    subtotal: 1376.66, iva: 206.5, total: 1583.16,
    items: [{
      cantidad: 1, tipo: 'PORTABLE',
      descripcion: 'DELL        DELCOMPORY5C5C\nCOMPUTADOR PORTATIL DELL PRO 14',
      punitario: 1376.66, observacion: '24 HORAS', total: 1376.66,
    }],
  }));
  // Los mismos importes de la proforma real que sirvió de referencia.
  assert.strictEqual(d.subtotalTexto, '1,376.66');
  assert.strictEqual(d.ivaTexto, '206.50');
  assert.strictEqual(d.totalTexto, '1,583.16');
  assert.strictEqual(d.items[0].tipo, 'PORTABLE');
  assert.strictEqual(d.items[0].observacion, '24 HORAS');
  assert.strictEqual(
    d.items[0].descripcionHtml,
    'DELL        DELCOMPORY5C5C<br>COMPUTADOR PORTATIL DELL PRO 14');
  assert.strictEqual(d.logo, '', 'sin ID configurado no se toca Drive');
});

prueba('el IVA de la proforma de referencia es el 15% vigente', () => {
  assert.strictEqual(Math.round(1376.66 * 0.15 * 100) / 100, 206.5);
  assert.strictEqual(1376.66 + 206.5, 1583.16);
});

prueba('multilinea_ conserva los saltos de las especificaciones', () => {
  const especificacion = 'Laptop ThinkPad E14\n• Intel i7 14ª Gen\n• 32 GB RAM';
  assert.strictEqual(
    sandbox.multilinea_(especificacion),
    'Laptop ThinkPad E14<br>• Intel i7 14ª Gen<br>• 32 GB RAM');
  // Y sigue escapando: el <br> es nuestro, no del contenido.
  assert.strictEqual(sandbox.multilinea_('a <b>x</b>'), 'a &lt;b&gt;x&lt;/b&gt;');
});

prueba('dist/ está al día respecto de src/', () => {
  // dist/ es lo que se pega en Apps Script; si queda atrás, se instala una
  // versión vieja sin que nadie lo note.
  const dist = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(dist)) {
    throw new Error('falta dist/. Ejecuta: node tools/empaquetar.js');
  }
  const paquete = fs.readFileSync(path.join(dist, 'Codigo.gs'), 'utf8');
  ARCHIVOS.forEach((f) => {
    const modulo = fs.readFileSync(path.join(SRC, f), 'utf8').trimEnd();
    assert.ok(paquete.includes(modulo),
      `${f} cambió sin regenerar dist/. Ejecuta: node tools/empaquetar.js`);
  });
  assert.strictEqual(
    fs.readFileSync(path.join(dist, 'plantilla.html'), 'utf8'),
    fs.readFileSync(path.join(SRC, 'plantilla.html'), 'utf8'),
    'plantilla.html cambió sin regenerar dist/');
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
