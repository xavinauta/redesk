# Dos utilidades para la hoja de proformas

Versión mínima, independiente del resto del repositorio: dos comandos sobre
la hoja de cálculo que ya usas. No crea hojas, no cambia tu diseño y no toca
nada que no le pidas.

| Comando | Qué hace |
|---|---|
| `REDESK ▸ Leer precios de proveedor…` | Eliges **uno o varios** archivos —PDF, fotos, xlsx, xls, ods, csv— o pegas el **enlace de una hoja de Google**. Se proponen los pares **descripción / precio**; revisas todo junto, marcas, y se **añaden** desde la celda seleccionada. |
| `REDESK ▸ Generar PDF para enviar` | Oculta las columnas **COSTO** y **UTILIDAD** y las **líneas sin cantidad**, exporta la hoja a PDF y lo restaura todo. Guarda el PDF y una copia de la hoja **con el nombre del cliente**, y ofrece un botón para dejar el correo listo en Gmail. |
| `REDESK ▸ Enviar proforma…` | Lo mismo, yendo directo al correo. |

## Por qué el PDF se genera así

Se exporta **tu propia hoja**, la misma exportación que hace
`Archivo ▸ Descargar ▸ PDF`. El documento conserva tu diseño, tus logos y tus
formatos porque es tu hoja impresa, no una reconstrucción. Es lo que evita
los problemas de convertir HTML: ningún conversor de HTML de Google incrusta
imágenes por su cuenta.

Las columnas y las filas se ocultan sólo mientras dura la exportación, y se
restauran aunque la exportación falle.

Se guardan dos archivos con el nombre del cliente: el **PDF** que se envía y
una **copia de la hoja** como respaldo de cómo quedó esa proforma. Si ya
existía una del mismo cliente, la anterior va a la papelera para no acumular
`Cliente`, `Cliente (1)`, `Cliente (2)`… Si no se encuentra el cliente en la
hoja, se usa el nombre de la pestaña con la fecha.

### Las líneas de sobra no salen

El formato base trae varias líneas de ítem para irlas llenando. Las que
tengan la **cantidad vacía** no se imprimen, y su espacio se cierra.

La tabla de ítems se da por terminada en la primera fila que contenga
`SUBTOTAL`, `TOTAL`, `IVA` o `DESCUENTO`: esas también tienen la cantidad
vacía, pero son los totales y sí tienen que salir. Un producto que empiece
por una de esas palabras —`TOTALPLAY ROUTER`— no cierra la tabla.

## Qué formatos lee, y cómo

| Origen | Cómo se lee |
|---|---|
| xlsx, xls, ods, csv | Se suben a Drive convertidos a hoja y **se leen las celdas**. Exacto, sin reconocimiento de por medio. |
| Enlace a una hoja de Google | Se abre directamente. Necesitas poder verla con esta misma cuenta. |
| PDF, fotos | **Reconocimiento de texto** de Drive. Si el documento trae tablas se leen como tablas; sólo si no, se interpreta línea a línea. |

De una hoja de cálculo se buscan los encabezados —`DESCRIPCIÓN`, `DETALLE`,
`PRODUCTO`… y `PRECIO`, `PRECIO UNITARIO`, `PVP`, `COSTO`…— sin distinguir
mayúsculas ni acentos. Si la tabla trae varias columnas de precio, gana la
más específica: con `COSTO` y `PRECIO UNITARIO` juntas, se toma el unitario.
Si no se reconoce ningún encabezado, cada fila se junta en una línea y se le
aplica la misma lectura que a un texto reconocido, marcando el resultado como
inseguro para que lo revises.

De un libro con varias pestañas se leen todas, y cada línea indica de cuál
salió.

## De dónde salió cada precio

Cada lectura se anota en la hoja **REGISTROS ARCHIVOS COTIZACION** —se crea
sola la primera vez— con la fecha, el archivo, cuántas líneas dio y un enlace
para volver a revisarlo.

**No se guarda ninguna copia de tus archivos.** Un archivo de tu equipo no
tiene dirección a la que enlazar, así que lo que se conserva es el documento
que Drive genera al leerlo, que se creaba de todas formas y antes se tiraba a
la papelera. Trae la imagen o el PDF originales junto al texto reconocido, que
es justo lo que hace falta para comprobar un precio.

Una hoja de Google leída por su enlace no genera nada: se anota su propio
enlace.

Si prefieres no dejar rastro, pon `CONSERVAR_ORIGEN` en `false`: el registro
sigue anotando el archivo y las líneas, pero sin enlace.

## El correo

El botón **Enviar proforma** deja el correo **como borrador** en Gmail, con el
PDF adjunto y dirigido al cliente. Nunca se envía solo: sale cuando tú le das
a enviar, después de revisarlo.

El destinatario se saca de la etiqueta `E-Mail` de la hoja. Si no está, el
borrador se crea igual y el aviso te dice que le pongas el destinatario.

El permiso que pide es `gmail.compose`, el mínimo para redactar borradores;
no el acceso total al correo.

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
5. Recarga la hoja. Aparece el menú **REDESK**.

**No hay que activar ningún servicio avanzado.** Las llamadas a Drive van por
su API REST con `UrlFetchApp`, igual que la exportación a PDF: un paso menos
de instalación, y la misma petición sirva la cuenta la v2 o la v3.

El manifiesto sí es imprescindible: la exportación a PDF necesita el permiso
`spreadsheets` completo y el de peticiones externas, y un script vinculado a
una hoja no los pide solo.

## Ajustes

Todo lo configurable está en la constante `AJUSTES`, al principio de
`Codigo.gs`:

| Clave | Para qué |
|---|---|
| `COLUMNAS_OCULTAS` | Encabezados que no salen en el PDF. Vienen `COSTO` y `UTILIDAD`. Se buscan por texto, sin distinguir mayúsculas ni acentos, en cualquier columna. |
| `COLUMNA_CANTIDAD` | Encabezado de la columna de cantidad. Las líneas que la tengan vacía no salen en el PDF. |
| `FILAS_A_REVISAR` | Cuántas filas se miran buscando esos encabezados y el nombre del cliente. |
| `CARPETA_PDF` | Carpeta donde se guardan el PDF y la copia de la hoja. Se crea junto a la hoja. |
| `HOJA_REGISTROS` | Hoja donde se anota cada lectura. Viene `REGISTROS ARCHIVOS COTIZACION`. |
| `CONSERVAR_ORIGEN` | `false` para no dejar el documento consultable; el registro queda sin enlace. |
| `ETIQUETA_CLIENTE` | Etiquetas con las que se busca el nombre del cliente, que da nombre a los archivos. |
| `ETIQUETA_EMAIL` | Etiquetas con las que se busca el correo del cliente. |
| `IDIOMA_OCR` | Idioma que se le indica al reconocimiento. |
| `FILAS_MAX_HOJA` | Tope de filas que se leen de una hoja de proveedor. |

## Cómo elige el precio de cada línea

Una línea de una proforma trae varios números. En esta, seis:

```
GRANDSTREAM GWN7660ELR AP 2X2 DOBLE BANDA WIFI 6   1.00   100.80   100.80
```

El criterio, por orden:

1. **El patrón `cantidad precio total`**, cuando cantidad × precio da el
   total. Es como imprimen las proformas de proveedor; sin esta regla se
   tomaría el **total** por precio y la descripción arrastraría la cantidad.
2. El número con símbolo de moneda (`$`, `USD`).
3. El último con dos decimales.
4. El último número suelto — y la línea llega **desmarcada** en el diálogo,
   porque ahí es donde falla el reconocimiento.

Antes de llegar a esto, si el PDF trae una **tabla** de verdad se lee como
tabla y se toma la columna de precio directamente, que es exacto. Adivinar
dentro de una línea es el último recurso, no el primero.

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
precio entre varios números, el descarte del ruido, la localización de las
columnas en una hoja de cálculo, la lectura de un enlace, la detección de
líneas repetidas, qué líneas se omiten al generar el PDF, cómo se sacan el
cliente y su correo de la hoja, y dónde continuar la lista al añadir. Varios
casos están tomados de proformas reales de proveedor.

También comprueban que el correo se deje siempre como borrador y que no se
guarde ninguna copia de los archivos de proveedor. Además revisan que el
diálogo y el servidor se llamen por los mismos nombres y usen los mismos
campos: un cambio en un solo lado se manifestaría como un fallo mudo en
pantalla.

El resto —Drive, el OCR y la exportación— depende de Google y se comprueba
ejecutando los comandos.
