# Dos utilidades para la hoja de proformas

Versión mínima, independiente del resto del repositorio: dos comandos sobre
la hoja de cálculo que ya usas. No crea hojas, no cambia tu diseño y no toca
nada que no le pidas.

| Comando | Qué hace |
|---|---|
| `REDESK ▸ Leer precios de proveedor…` | Eliges **uno o varios** PDF o fotos, se les pasa el OCR y se proponen los pares **descripción / precio**. Revisas todo junto, marcas, y se **añaden** desde la celda seleccionada. |
| `REDESK ▸ Generar PDF para enviar` | Oculta las columnas **COSTO** y **UTILIDAD**, exporta la hoja a PDF y las vuelve a mostrar. |

## Por qué el PDF se genera así

Se exporta **tu propia hoja**, la misma exportación que hace
`Archivo ▸ Descargar ▸ PDF`. El documento conserva tu diseño, tus logos y tus
formatos porque es tu hoja impresa, no una reconstrucción. Es lo que evita
los problemas de convertir HTML: ningún conversor de HTML de Google incrusta
imágenes por su cuenta.

Las columnas se ocultan sólo mientras dura la exportación, y se restauran
aunque la exportación falle.

## Varios archivos en la misma tanda

El selector admite varios archivos a la vez, y se pueden añadir más sin
perder lo ya reconocido. Se leen **uno tras otro**, no a la vez: cada
reconocimiento es una subida a Drive, y lanzarlos en paralelo agota la cuota.

Cada línea muestra de qué archivo salió. Si la misma descripción con el mismo
precio aparece dos veces —típico al fotografiar la misma lista dos veces—, la
segunda llega marcada como repetida y desmarcada.

Un archivo ilegible no tumba la tanda: se anota su error y se sigue con el
resto.

## Cómo se añaden a la hoja

**Nunca sobrescribe.** Partiendo de la celda seleccionada:

1. Si esa celda ya tiene algo, baja hasta la primera libre, para añadir a
   continuación de la lista que ya tengas.
2. Si lo que viene debajo está ocupado, inserta exactamente tantas filas como
   líneas vayas a añadir, de modo que el hueco quede justo y no se desplace
   mal nada de la hoja.
3. Si la hoja se queda corta de filas, la agranda.

Así una cotización con más ítems que filas disponibles entra entera. El
mensaje final dice cuántas líneas se añadieron y si hubo que insertar filas.

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

Las pruebas **extraen el código de `Codigo.gs`** —el bloque marcado como
`LÓGICA PROBADA`— y lo ejecutan con Node, así que comprueban exactamente lo
que corre en la hoja, sin una copia paralela que pueda quedarse atrás.

Cubren los dos formatos decimales (`1.234,56` y `1,234.56`), la elección del
precio entre varios números, el descarte del ruido, la detección de líneas
repetidas y dónde continuar la lista al añadir. Además revisan que el diálogo
y el servidor se llamen por los mismos nombres y usen los mismos campos: un
cambio en un solo lado se manifestaría como un fallo mudo en pantalla.

El resto —Drive, el OCR y la exportación— depende de Google y se comprueba
ejecutando los comandos.
