# REDESK — Automatización de cotizaciones

Genera las proformas a clientes desde una hoja de Google: eliges el cliente,
cargas los ítems, y el sistema produce el PDF **con el mismo formato que
REDESK ya envía** y deja la respuesta lista **como borrador** en Gmail,
dentro del mismo hilo en que el cliente pidió la cotización.

Nada se envía solo. Siempre revisas precios y plazos antes de dar a Enviar.

El diseño del PDF está calcado de la proforma real
`IMPORTADORA TOMEBAMBA - EQUIPO PORTABLE DELL`: logo arriba a la izquierda,
asunto como título, `PROFORMA: #n` en rojo, bloque Nombre / Atte / E-Mail
frente a FECHA / ASESOR, tabla
`CANTIDAD · TIPO · DESCRIPCION · PRECIO UNITARIO · PRECIO TOTAL · OBSERVACION`,
totales a la derecha, condiciones Notas / Pago / Garantía / Validez con la
firma al costado, franja de marcas y pie con los datos de contacto.

## Qué resuelve

El flujo de hoy es: llega un correo *"Estimado proveedor, por favor su ayuda
cotizando…"* con plazo de 24 horas, se arma la proforma copiando una anterior
en Excel, se exporta a PDF y se responde a mano. Esto automatiza las partes
mecánicas:

| Paso | Antes | Ahora |
|---|---|---|
| Detectar la solicitud | Revisar la bandeja | `REDESK ▸ Leer solicitudes de Gmail` la lista con su plazo |
| Precios del proveedor | Buscar el PDF o la captura en WhatsApp | `REDESK ▸ Buscar precio` busca en todo lo importado por OCR |
| Armar el documento | Copiar y editar una proforma vieja | Códigos del catálogo → tipo, descripción, precio y observación automáticos |
| Numeración | A mano | Correlativo `#1`, `#2`… con formato configurable |
| Responder | Redactar y adjuntar | Borrador en el hilo original, con el PDF adjunto y tu firma |

## Instalación

### 1. Crear el libro

Crea una hoja de cálculo nueva en Google Sheets. Ponle, por ejemplo,
`REDESK — Cotizaciones`. Los PDF y los precios de proveedor se guardarán en
subcarpetas junto a este archivo.

### 2. Subir el código

**Opción A — copiar y pegar (sin instalar nada)**

`dist/` trae todo el proyecto en tres archivos, para no tener que copiar los
ocho módulos de `src/` uno por uno:

| Pegar | En |
|---|---|
| `dist/Codigo.gs` | El archivo `Código.gs` que ya existe en el editor |
| `dist/plantilla.html` | Un archivo HTML nuevo llamado exactamente `plantilla` |
| `dist/appsscript.json` | El manifiesto (hay que mostrarlo primero en Configuración del proyecto) |

El nombre `plantilla` importa: el generador de PDF busca el archivo por ese
nombre.

**Opción B — con `clasp` (mantiene el repo sincronizado)**

```bash
npm install -g @google/clasp
clasp login

# El ID del script está en Extensiones ▸ Apps Script ▸ Configuración
cp .clasp.json.example .clasp.json
# edita .clasp.json y pon tu scriptId

clasp push
```

`clasp` sube `src/` directamente; `dist/` no interviene.

> `dist/` se regenera con `node tools/empaquetar.js`, y `npm test` lo
> regenera y comprueba que no haya quedado atrás respecto de `src/`.

### 3. Activar la API de Drive

Hace falta para el OCR de los precios de proveedor. En el editor de Apps
Script: `Servicios ▸ +` → **Drive API**, dejando el identificador en `Drive`.

**Sirve la v2 o la v3**, la que ofrezca tu cuenta: el editor no muestra las
dos a todo el mundo. Las dos versiones nombran distinto los campos de la
petición de copia (`title` y `parents: [{id}]` en v2, `name` y
`parents: [id]` en v3), así que el código prueba ambas formas y recuerda la
que responda. El manifiesto declara `v2` por ser la más extendida.

### 4. Instalar las hojas

Recarga la hoja de cálculo. Aparece el menú **REDESK**. Ejecuta
`REDESK ▸ Instalar / reparar hojas` y autoriza los permisos que pida.

Esto crea las hojas `Cotización`, `Solicitudes`, `Catálogo`, `Clientes`,
`Historial`, `Precios proveedor` y `Config`, más dos carpetas en Drive.

Es idempotente: puedes volver a ejecutarlo cuando quieras. No borra datos,
sólo repone lo que falte y refresca formatos y fórmulas.

### 5. Subir el logo, la firma y la franja de marcas

El conversor de Apps Script no descarga imágenes remotas, así que el logo, la
firma y la franja de marcas se incrustan leyéndolas de Drive.

En `assets/` de este repositorio ya están extraídos de tu proforma:

| Archivo | Qué es |
|---|---|
| `assets/logo-redesk.png` | El logo de REDESK |
| `assets/marcas.png` | La franja con las 14 marcas representadas |
| `assets/marcas/` | Cada logo suelto, por si hay que recomponer la franja |

1. Sube `logo-redesk.png` y `marcas.png` a Drive (donde prefieras).
2. Sube también **tu imagen de firma**. No viene en el repositorio: sácala de
   tu plantilla de Excel actual o escanéala.
3. De cada archivo copia el ID —el tramo entre `/d/` y `/view` de su URL— y
   pégalo en `Config` en `LOGO_ARCHIVO_ID`, `MARCAS_ARCHIVO_ID` y
   `FIRMA_ARCHIVO_ID`.

Si dejas un ID vacío el PDF sale igual, sólo sin esa imagen.

Para cambiar las marcas: reemplaza los archivos de `assets/marcas/`, ajusta
la lista `ORDEN` en `tools/componer_marcas.py`, ejecuta
`python3 tools/componer_marcas.py` y vuelve a subir `assets/marcas.png`.

### 6. Configurar

En la hoja **Config**, revisa al menos:

| Clave | Nota |
|---|---|
| `ASESOR` | Iniciales del campo ASESOR. Viene con `XN`. |
| `FORMATO_NUMERO` | `#{n}` reproduce tu numeración actual. Admite `{n4}` (con ceros) y `{aaaa}` (año); si incluye `{aaaa}` el correlativo se reinicia cada enero. |
| `SECUENCIAL` | Próximo número. Ponlo en el correlativo que ya llevas para no repetir. |
| `IVA_PCT` | `15%`. Cámbialo si cambia la tarifa. |
| `MARGEN_DEFECTO` | Margen aplicado a los ítems del catálogo que no traen uno propio. |
| `MARGEN_SOBRE` | `COSTO` → `pvp = costo × (1 + margen)`. `VENTA` → `pvp = costo ÷ (1 − margen)`. Si lo cambias, vuelve a ejecutar el instalador para rehacer la fórmula. |
| `PAGO`, `GARANTIA`, `VALIDEZ` | Condiciones por defecto: `30 DIAS.`, `3 AÑOS.`, `5 DIAS.` |
| `OBSERVACION_DEFECTO` | Lo que se pone en la columna OBSERVACION cuando el catálogo no trae tiempo de entrega. Viene con `24 HORAS`. |
| `GMAIL_ALIAS` | Pon `ventas@redesk.net` si lo tienes como alias en Gmail. Si no lo es, se ignora y se usa la cuenta principal. |

Los datos de la empresa (dirección, teléfonos, web, correo, representante)
vienen ya cargados desde tu proforma; verifícalos.

Después carga tus clientes en **Clientes** (basta empresa, contacto y correo)
y tus productos habituales en **Catálogo**.

## Uso diario

### Cotizar a partir de un correo

1. `REDESK ▸ Leer solicitudes de Gmail`. Aparecen en la hoja **Solicitudes**
   con el remitente, lo que piden y el plazo detectado.
2. Sitúate en la fila y usa `REDESK ▸ Cotizar solicitud seleccionada`. Se abre
   la hoja **Cotización** con número nuevo, cliente reconocido por el dominio
   del correo, asunto, condiciones por defecto y el ID del hilo ya cargados.
3. Carga los ítems. Al escribir un **Código** del catálogo se completan solos
   el tipo, la descripción, el precio y la observación; también puedes
   escribirlo todo a mano dejando el código vacío.
4. `REDESK ▸ Generar PDF y crear borrador en Gmail`. Se guarda el PDF en
   Drive como `CLIENTE - ASUNTO.pdf`, se registra en **Historial** y se deja
   el borrador respondiendo en el hilo original.
5. Abre Gmail, revisa y envía.

La **Descripción** admite varias líneas con `Alt+Enter` y las respeta en el
PDF. Al traerla del catálogo se arma sola en tu formato: una primera línea
`MARCA` + número de parte y debajo las especificaciones.

    DELL        DELCOMPORY5C5C
    COMPUTADOR PORTATIL DELL PRO 14 SILVER Y5C5C 14PULG FHD ULTRA 5 235U…

La **Observación** es por ítem, como en tu proforma, y ahí va el tiempo de
entrega. El correo lo resume: si todos los ítems coinciden lo enuncia una vez,
y si difieren los detalla, porque los clientes siempre piden "enfatizar tiempo
de entrega".

### Cotizar sin un correo previo

`REDESK ▸ Nueva cotización`, elige el cliente, carga los ítems y usa
`Generar PDF` (sólo el archivo) o `Generar PDF y crear borrador en Gmail`
(correo nuevo al contacto del cliente).

### Precios que llegan por WhatsApp

1. Guarda el PDF o la captura en la carpeta de Drive
   **REDESK - Precios proveedor** (`REDESK ▸ Carpetas ▸ Precios de proveedor`).
   Nómbralos empezando por el proveedor: `Tecnomega - discos servidor.pdf`.
2. `REDESK ▸ Importar precios de proveedor (OCR)` los convierte en texto
   buscable.
3. `REDESK ▸ Buscar precio…` busca en todo lo importado y muestra la línea,
   el proveedor, la fecha y el enlace al archivo original.

El OCR no rellena el catálogo solo: reconocer números de una foto de WhatsApp
no es fiable para cotizar. Te deja el dato a la vista con su fuente para que
lo copies con criterio.

## Estructura del repositorio

```
src/
  appsscript.json          manifiesto: zona horaria, permisos, Drive API
  00_Config.js             hojas, valores por defecto, numeración correlativa
  01_Instalar.js           crea y repara hojas, rangos con nombre y carpetas
  02_Cotizacion.js         formulario, autocompletado por código, historial
  03_Pdf.js                render de plantilla.html y archivado en Drive
  04_Gmail.js              lectura de solicitudes y borrador de respuesta
  05_PreciosProveedor.js   OCR de precios y buscador
  06_Menu.js               menú REDESK y manejo de errores
  plantilla.html           diseño del PDF — edita aquí para cambiar el formato
assets/
  logo-redesk.png          logo, para subir a Drive
  marcas.png               franja de marcas compuesta
  marcas/                  cada logo suelto
dist/                      generado; lo que se pega en Apps Script
  Codigo.gs                los ocho módulos de src/ concatenados
  plantilla.html
  appsscript.json
tools/
  empaquetar.js            regenera dist/ desde src/
  previsualizar.js         renderiza la plantilla sin desplegar
  componer_marcas.py       recompone assets/marcas.png
test/
  logica.test.js           pruebas de la lógica de texto e importes
```

## Pruebas y previsualización

```bash
npm test                    # regenera dist/ y corre 25 pruebas
node tools/previsualizar.js # escribe previsualizacion.png
```

Apps Script no se puede ejecutar fuera de Google, así que las pruebas cargan
`src/` con los objetos de Google simulados y verifican lo que sí es lógica
pura: el análisis de los correos de compras (remitente, plazo, limpieza de
citas y avisos legales), el formato del número, el armado de la descripción,
el resumen del tiempo de entrega, los importes y el nombre del archivo.

`tools/previsualizar.js` compila los scriptlets de la plantilla igual que
HtmlService y la renderiza con Chromium, para revisar cambios de diseño de un
vistazo. **Chromium es más permisivo que el conversor de HtmlService**: sirve
para detectar errores de maquetación, no para dar por buena la salida final.
Eso sólo lo confirma generar el PDF desde la hoja.

Lo que depende de Sheets, Drive y Gmail se prueba ejecutando el menú.

## Detalles que conviene saber

- **La columna PVP del Catálogo es calculada** por una ARRAYFORMULA que vive
  en `I2`. No escribas nada en esa columna: cambia el Costo o el Margen.
- **El PDF se regenera con el mismo nombre.** Si vuelves a emitir la misma
  proforma, el PDF anterior va a la papelera para no dejar dos versiones.
- **`Generar PDF` valida antes de emitir**: bloquea si falta el cliente, si no
  hay ítems, o si algún ítem quedó sin precio o sin cantidad.
- **El PDF se arma con `HtmlService`**, cuyo motor sólo entiende CSS sencillo.
  En `plantilla.html` usa tablas, bordes y colores; flexbox y grid no se
  renderizan.
- **La proforma no lleva RUC**, ni el tuyo ni el del cliente, porque la que
  envías hoy tampoco lo lleva. Si lo necesitas, es añadir una fila en
  `plantilla.html` y una clave en `Config`.
