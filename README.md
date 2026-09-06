# REDESK — Automatización de cotizaciones

Genera las cotizaciones a clientes desde una hoja de Google: eliges el
cliente, cargas los ítems, y el sistema produce el PDF con el formato de
REDESK y deja la respuesta lista **como borrador** en Gmail, dentro del
mismo hilo en que el cliente pidió la cotización.

Nada se envía solo. Siempre revisas precios y plazos antes de dar a Enviar.

## Qué resuelve

El flujo de hoy es: llega un correo *"Estimado proveedor, por favor su ayuda
cotizando…"* con plazo de 24 horas, se arma la cotización copiando una
anterior, se exporta a PDF y se responde a mano. Esto automatiza las tres
partes mecánicas:

| Paso | Antes | Ahora |
|---|---|---|
| Detectar la solicitud | Revisar la bandeja | `REDESK ▸ Leer solicitudes de Gmail` la lista con su plazo |
| Precios del proveedor | Buscar el PDF o la captura en WhatsApp | `REDESK ▸ Buscar precio` busca en todo lo importado por OCR |
| Armar el documento | Copiar y editar una cotización vieja | Códigos del catálogo → descripción, marca y PVP automáticos |
| Numeración | A mano | Correlativo `COT-2026-0001`, reiniciado cada año |
| Responder | Redactar y adjuntar | Borrador en el hilo original, con el PDF adjunto y tu firma |

## Instalación

### 1. Crear el libro

Crea una hoja de cálculo nueva en Google Sheets. Ponle, por ejemplo,
`REDESK — Cotizaciones`. Los PDF y los precios de proveedor se guardarán en
subcarpetas junto a este archivo.

### 2. Subir el código

**Opción A — con `clasp` (recomendada, mantiene el repo sincronizado)**

```bash
npm install -g @google/clasp
clasp login

# El ID del script está en Extensiones ▸ Apps Script ▸ Configuración
cp .clasp.json.example .clasp.json
# edita .clasp.json y pon tu scriptId

clasp push
```

**Opción B — copiando y pegando**

En la hoja, `Extensiones ▸ Apps Script`. Crea un archivo por cada uno de
`src/*.js` (en el editor se llamarán `.gs`) y uno de tipo HTML llamado
`plantilla`. **Los nombres deben coincidir**: el generador de PDF busca el
archivo `plantilla`.

También pega el contenido de `src/appsscript.json` en el manifiesto
(`Configuración del proyecto ▸ Mostrar "appsscript.json"`).

### 3. Activar la API de Drive

Hace falta para el OCR de los precios de proveedor. En el editor de Apps
Script: `Servicios ▸ +` → **Drive API**, versión **v3**, identificador
`Drive`.

Si subiste con `clasp` puede que ya esté activada por el manifiesto;
compruébalo igual.

### 4. Instalar las hojas

Recarga la hoja de cálculo. Aparece el menú **REDESK**. Ejecuta
`REDESK ▸ Instalar / reparar hojas` y autoriza los permisos que pida.

Esto crea las hojas `Cotización`, `Solicitudes`, `Catálogo`, `Clientes`,
`Historial`, `Precios proveedor` y `Config`, más dos carpetas en Drive.

Es idempotente: puedes volver a ejecutarlo cuando quieras. No borra datos,
sólo repone lo que falte y refresca formatos y fórmulas.

### 5. Configurar

En la hoja **Config**, revisa al menos:

| Clave | Nota |
|---|---|
| `EMPRESA_RUC` | Viene precargado con `102864808001`. **Verifícalo.** |
| `EMPRESA_DIRECCION` | Está vacío; complétalo. |
| `EMPRESA_LOGO_URL` | URL pública de tu logo. Vacío = el PDF sale sin logo. |
| `IVA_PCT` | `15%`. Cámbialo si cambia la tarifa. |
| `MARGEN_DEFECTO` | Margen aplicado a los ítems del catálogo que no traen uno propio. |
| `MARGEN_SOBRE` | `COSTO` → `pvp = costo × (1 + margen)`. `VENTA` → `pvp = costo ÷ (1 − margen)`. Si lo cambias, vuelve a ejecutar el instalador para rehacer la fórmula. |
| `GMAIL_ALIAS` | Pon `ventas@redesk.net` si lo tienes como alias en Gmail. Si no lo es, se ignora y se usa la cuenta principal. |

Después carga tus clientes en **Clientes** (basta empresa, RUC, contacto y
correo) y tus productos habituales en **Catálogo**.

## Uso diario

### Cotizar a partir de un correo

1. `REDESK ▸ Leer solicitudes de Gmail`. Aparecen en la hoja **Solicitudes**
   con el remitente, lo que piden y el plazo detectado.
2. Sitúate en la fila y usa `REDESK ▸ Cotizar solicitud seleccionada`. Se
   abre la hoja **Cotización** con número nuevo, cliente reconocido por el
   dominio del correo, asunto y el ID del hilo ya cargados.
3. Carga los ítems. Al escribir un **Código** del catálogo se completan solas
   la descripción, la marca y el precio; también puedes escribirlo todo a mano
   dejando el código vacío.
4. `REDESK ▸ Generar PDF y crear borrador en Gmail`. Se guarda el PDF en Drive,
   se registra en **Historial** y se deja el borrador respondiendo en el hilo
   original, con el adjunto y tu firma.
5. Abre Gmail, revisa y envía.

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

El OCR no rellena el catálogo solo: reconocer números de una foto de
WhatsApp no es fiable para cotizar. Te deja el dato a la vista con su fuente
para que lo copies con criterio.

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
test/
  logica.test.js           pruebas de la lógica de texto e importes
```

## Pruebas

```bash
node test/logica.test.js
```

Apps Script no se puede ejecutar fuera de Google, así que las pruebas cargan
`src/` con los objetos de Google simulados y verifican lo que sí es lógica
pura: el análisis de los correos de compras (remitente, plazo, limpieza de
citas y avisos legales), el formateo de importes, el nombre del archivo y el
cuerpo del correo.

Lo que depende de Sheets, Drive y Gmail se prueba ejecutando el menú.

## Detalles que conviene saber

- **La columna PVP del Catálogo es calculada.** No la edites: cambia el Costo
  o el Margen.
- **La numeración se reinicia cada año.** El próximo número vive en
  `Config ▸ SECUENCIAL`; puedes ajustarlo si arrancas desde un correlativo
  que ya venías usando.
- **El PDF se regenera con el mismo nombre.** Si vuelves a emitir la misma
  cotización, el PDF anterior va a la papelera para no dejar dos versiones.
- **`Generar PDF` valida antes de emitir**: bloquea si falta el cliente, si no
  hay ítems, o si algún ítem quedó sin precio o sin cantidad.
- **El PDF se arma con `HtmlService`**, cuyo motor sólo entiende CSS sencillo.
  En `plantilla.html` usa tablas, bordes y colores; flexbox y grid no se
  renderizan.
