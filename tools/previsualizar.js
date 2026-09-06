/**
 * Previsualiza src/plantilla.html sin desplegar en Apps Script.
 *
 *     node tools/previsualizar.js            # escribe previsualizacion.png
 *     node tools/previsualizar.js --pdf      # además, previsualizacion.pdf
 *
 * Compila los scriptlets <? ?> igual que HtmlService y rellena la plantilla
 * con los datos de la proforma real que sirvió de referencia, de modo que
 * los cambios de diseño se puedan revisar de un vistazo.
 *
 * AVISO: renderiza con Chromium, que es más permisivo que el conversor de
 * HtmlService. Sirve para detectar errores de maquetación, no para dar por
 * buena la salida final: eso sólo lo confirma generar el PDF desde la hoja.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');

/**
 * Traduce la plantilla de HtmlService a una función de JavaScript.
 * `<?= x ?>` escapa, `<?!= x ?>` no, `<? ... ?>` es código.
 * @param {string} plantilla
 * @return {function(!Object): string}
 */
function compilar(plantilla) {
  let cuerpo = 'let _s = "";\n';
  let resto = plantilla;
  const escapar = (t) => JSON.stringify(t);

  while (resto.length) {
    const i = resto.indexOf('<?');
    if (i === -1) {
      cuerpo += `_s += ${escapar(resto)};\n`;
      break;
    }
    cuerpo += `_s += ${escapar(resto.slice(0, i))};\n`;
    const fin = resto.indexOf('?>', i);
    if (fin === -1) throw new Error('scriptlet sin cerrar en la plantilla');
    const etiqueta = resto.slice(i + 2, fin);
    if (etiqueta.startsWith('!=')) {
      cuerpo += `_s += String(${etiqueta.slice(2)});\n`;
    } else if (etiqueta.startsWith('=')) {
      cuerpo += `_s += _esc(${etiqueta.slice(1)});\n`;
    } else {
      cuerpo += etiqueta + '\n';
    }
    resto = resto.slice(fin + 2);
  }
  cuerpo += 'return _s;';

  const _esc = (v) => String(v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  // Las marcas de imagen llegan ya como <img>: se dejan pasar sin escapar
  // para poder verlas; todo lo demás se escapa como en HtmlService.
  const escSalvoImagen = (v) =>
    String(v).indexOf('<img ') === 0 ? String(v) : _esc(v);
  const render = new Function('d', '_esc', cuerpo);
  return (d) => render(d, escSalvoImagen);
}

/** Datos tomados de la proforma IMPORTADORA TOMEBAMBA - EQUIPO PORTABLE DELL. */
function datosDeMuestra() {
  const imagen = (rel, ancho) => {
    const abs = path.join(RAIZ, rel);
    if (!fs.existsSync(abs)) return '';
    const uri = 'data:image/png;base64,' + fs.readFileSync(abs).toString('base64');
    return `<img src="${uri}" style="width:${ancho}pt">`;
  };
  return {
    acento: '#8EAADB', destacado: '#FF0000', enlace: '#0563C1',
    // La plantilla deja marcas de posición; aquí se pintan como imágenes
    // para poder ver el resultado. En el PDF real las inserta 03_Pdf.js
    // sobre el Documento de Google ya convertido.
    logo: imagen('assets/logo-redesk.png', 150),
    firma: '',
    marcas: imagen('assets/marcas.png', 470),
    empresa: 'REDESK Asesores y Servicios',
    direccion: 'LUIS MALO Y ENRIQUE MALO ESQ., CDLA. MUTUALISTA AZUAY II, J25.',
    telefonos: '0995108229 / 0996746927',
    email: 'ventas@redesk.net',
    web: 'www.redesk.net',
    representante: 'Ing. Xavier Ñauta Tapia',
    numero: '#1',
    fechaTexto: '09/02/2026',
    asunto: 'IMPORTADORA TOMEBAMBA - EQUIPO PORTABLE DELL',
    asesor: 'XN',
    clienteNombre: 'IMPORTADORA TOMEBAMBA',
    clienteAtte: 'ING. JHONATAN QUITUISACA',
    clienteEmail: 'jquituisaca@tomebamba.com',
    items: [{
      cantidad: 1,
      tipo: 'PORTABLE',
      descripcionHtml:
        'DELL&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;DELCOMPORY5C5C<br>' +
        'COMPUTADOR PORTATIL DELL PRO 14 SILVER Y5C5C 14PULG FHD ULTRA 5 235U ' +
        '16GB DDR5 5600 512GB W11PRO 3Y',
      punitarioTexto: '1,376.66',
      totalTexto: '1,376.66',
      observacion: '24 HORAS',
    }],
    subtotalTexto: '1,376.66',
    ivaTexto: '206.50',
    totalTexto: '1,583.16',
    notasHtml: '',
    pago: '30 DIAS.',
    garantia: '3 AÑOS.',
    validez: '5 DIAS.',
  };
}

/**
 * Busca el Chromium preinstalado del entorno.
 * @return {string|undefined} la ruta al binario, o undefined para que
 *     Playwright use el suyo.
 */
function rutaChromium() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (!fs.existsSync(base)) return undefined;
  for (const dir of fs.readdirSync(base).sort().reverse()) {
    const candidato = path.join(base, dir, 'chrome-linux', 'chrome');
    if (fs.existsSync(candidato)) return candidato;
  }
  return undefined;
}

async function main() {
  const plantilla = fs.readFileSync(
    path.join(RAIZ, 'src', 'plantilla.html'), 'utf8');
  const html = compilar(plantilla)(datosDeMuestra());

  const salidaHtml = path.join(RAIZ, 'previsualizacion.html');
  // El PDF de Apps Script se genera sobre A4 con márgenes; se imitan aquí
  // para que la previsualización tenga el mismo ancho útil.
  fs.writeFileSync(salidaHtml,
    '<!doctype html><meta charset="utf-8">' +
    '<style>@page{size:A4;margin:14mm}' +
    'body{width:182mm;margin:0 auto;padding:14mm 0}</style>' + html);

  const { chromium } = require('playwright-core');
  // El Chromium del entorno puede no coincidir con la build que espera
  // playwright-core, así que se apunta al binario instalado si existe.
  const navegador = await chromium.launch({ executablePath: rutaChromium() });
  const pagina = await navegador.newPage({ viewport: { width: 900, height: 1400 } });
  await pagina.goto('file://' + salidaHtml, { waitUntil: 'load' });
  await pagina.screenshot({
    path: path.join(RAIZ, 'previsualizacion.png'), fullPage: true,
  });
  if (process.argv.includes('--pdf')) {
    await pagina.pdf({
      path: path.join(RAIZ, 'previsualizacion.pdf'),
      format: 'A4', margin: { top: '14mm', bottom: '14mm', left: '14mm', right: '14mm' },
    });
  }
  await navegador.close();
  console.log('previsualizacion.png escrita');
}

main().catch((err) => { console.error(err); process.exit(1); });
