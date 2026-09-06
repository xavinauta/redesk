/**
 * Empaqueta src/ en dist/, para instalar sin herramientas de línea de comandos.
 *
 *     node tools/empaquetar.js
 *
 * Apps Script comparte un único ámbito global entre todos los archivos del
 * proyecto, así que los ocho módulos de src/ se pueden concatenar en un solo
 * Codigo.gs sin cambiar nada. Instalar pasa así de ocho copiar-y-pegar a
 * tres: el código, la plantilla y el manifiesto.
 *
 * Para trabajar con clasp esto no hace falta: `clasp push` sube src/ tal cual.
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const SRC = path.join(RAIZ, 'src');
const DIST = path.join(RAIZ, 'dist');

const CABECERA = `/**
 * REDESK — Automatización de cotizaciones
 * =======================================
 *
 * ARCHIVO GENERADO. No lo edites: los cambios se pierden al regenerarlo.
 * Edita src/ y ejecuta \`node tools/empaquetar.js\`.
 *
 * Contiene todos los módulos de src/ concatenados, para pegarlos de una vez
 * en el editor de Apps Script.
 */

`;

function main() {
  const modulos = fs.readdirSync(SRC)
    .filter((f) => f.endsWith('.js'))
    .sort();

  const partes = modulos.map((f) => {
    const separador =
      '// '.padEnd(76, '=') + '\n' +
      '// ' + f + '\n' +
      '// '.padEnd(76, '=') + '\n\n';
    return separador + fs.readFileSync(path.join(SRC, f), 'utf8').trimEnd();
  });

  fs.mkdirSync(DIST, { recursive: true });
  const codigo = CABECERA + partes.join('\n\n') + '\n';
  fs.writeFileSync(path.join(DIST, 'Codigo.gs'), codigo);
  fs.copyFileSync(path.join(SRC, 'plantilla.html'),
    path.join(DIST, 'plantilla.html'));
  fs.copyFileSync(path.join(SRC, 'appsscript.json'),
    path.join(DIST, 'appsscript.json'));

  console.log(`dist/Codigo.gs        ${modulos.length} módulos, ` +
    `${codigo.split('\n').length} líneas`);
  console.log('dist/plantilla.html   plantilla del PDF');
  console.log('dist/appsscript.json  manifiesto');
}

main();
