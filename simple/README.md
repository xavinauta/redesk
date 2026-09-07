# Dos utilidades para la hoja de proformas

Versión mínima, independiente del resto del repositorio: dos comandos sobre
la hoja de cálculo que ya usas. No crea hojas, no cambia tu diseño y no toca
nada que no le pidas.

| Comando | Qué hace |
|---|---|
| `REDESK ▸ Leer precios de proveedor…` | Eliges un PDF o una foto del proveedor, se le pasa el OCR y se proponen los pares **descripción / precio**. Revisas, marcas y se escriben desde la celda seleccionada. |
| `REDESK ▸ Generar PDF para enviar` | Oculta las columnas **COSTO** y **UTILIDAD**, exporta la hoja a PDF y las vuelve a mostrar. |

## Por qué el PDF se genera así

Se exporta **tu propia hoja**, la misma exportación que hace
`Archivo ▸ Descargar ▸ PDF`. El documento conserva tu diseño, tus logos y tus
formatos porque es tu hoja impresa, no una reconstrucción. Es lo que evita
los problemas de convertir HTML: ningún conversor de HTML de Google incrusta
imágenes por su cuenta.

Las columnas se ocultan sólo mientras dura la exportación, y se restauran
aunque la exportación falle.

## Instalación

1. En la hoja: `Extensiones ▸ Apps Script`.
2. Pega `Codigo.gs` sobre el `Código.gs` que ya existe. Guarda.
3. `+ ▸ HTML`, nómbralo exactamente **`dialogo`**, y pega `dialogo.html`.
4. `Configuración del proyecto` ▸ marca *Mostrar el archivo de manifiesto
   appsscript.json*; vuelve al editor y pega `appsscript.json`. Guarda.
5. `Servicios ▸ +` → **Drive API**, con la versión que te ofrezca (v2 o v3).
6. Recarga la hoja. Aparece el menú **REDESK**.

El manifiesto no es opcional: la exportación a PDF necesita el permiso
`spreadsheets` completo, y un script vinculado a una hoja no lo pide solo.

## Ajustes

Todo lo configurable está en la constante `AJUSTES`, al principio de
`Codigo.gs`:

| Clave | Para qué |
|---|---|
| `COLUMNAS_OCULTAS` | Encabezados que no salen en el PDF. Vienen `COSTO` y `UTILIDAD`. Se buscan por texto, sin distinguir mayúsculas ni acentos, en cualquier columna. |
| `FILAS_A_REVISAR` | Cuántas filas se miran buscando esos encabezados y el nombre del cliente. |
| `CARPETA_PDF` | Carpeta de Drive donde se guardan los PDF. Se crea junto a la hoja. |
| `IDIOMA_OCR` | Idioma que se le indica al reconocimiento. |

## Cómo elige el precio de cada línea

Una línea de una lista de precios suele traer varios números: `AP 2X2 DOBLE
BANDA WIFI 6   105.84` tiene tres. El criterio, por orden:

1. El número con símbolo de moneda (`$`, `USD`).
2. Si no hay, el último con dos decimales.
3. Si tampoco, el último número suelto — y la línea llega **desmarcada** en
   el diálogo, porque ahí es donde falla el reconocimiento.

Se descartan las líneas que empiezan por `TOTAL`, `SUBTOTAL`, `IVA`,
`PÁGINA`, `LISTA DE PRECIOS` y similares, y los años sueltos de un título.

Nada se escribe en la hoja hasta que lo marcas en el diálogo.

## Pruebas

```bash
node test/parser.test.js
```

Cubren lo único que tiene lógica de verdad: los dos formatos decimales
(`1.234,56` y `1,234.56`), la elección del precio entre varios números y el
descarte del ruido. El resto —diálogos, Drive, exportación— depende de
Google y se comprueba ejecutando los comandos.

`simple/parser.js` es ese mismo código, aparte, para poder probarlo con Node;
está incluido tal cual dentro de `Codigo.gs`.
