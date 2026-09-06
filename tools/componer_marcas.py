#!/usr/bin/env python3
"""
Compone la franja de logos de marcas que va al pie de la cotización.

Se ejecuta a mano cuando cambie el juego de marcas representadas:

    python3 tools/componer_marcas.py

Lee los PNG/JPG sueltos de assets/marcas/ en el orden de ORDEN y escribe
assets/marcas.png, que luego se sube a Drive y se referencia desde
Config ▸ MARCAS_ARCHIVO_ID.
"""

import os
import sys

from PIL import Image

DIR = os.path.join(os.path.dirname(__file__), '..', 'assets')
ORDEN = [
    'intel', 'hp', 'synology', 'cisco', 'biometria', 'apc', 'hikvision',
    'xerox', 'epson', 'kaspersky', 'microsoft', 'lenovo', 'zkteco', 'dell',
]
POR_FILA = 7
ALTO_LOGO = 90        # alto uniforme de cada logo, en píxeles
MARGEN = 26           # aire alrededor de cada logo


def main():
    origen = os.path.join(DIR, 'marcas')
    logos = []
    for nombre in ORDEN:
        ruta = next(
            (os.path.join(origen, f) for f in sorted(os.listdir(origen))
             if os.path.splitext(f)[0].lower() == nombre), None)
        if not ruta:
            print(f'falta el logo "{nombre}" en {origen}', file=sys.stderr)
            return 1
        im = Image.open(ruta).convert('RGBA')
        ancho = max(1, round(im.width * ALTO_LOGO / im.height))
        logos.append(im.resize((ancho, ALTO_LOGO), Image.LANCZOS))

    filas = [logos[i:i + POR_FILA] for i in range(0, len(logos), POR_FILA)]
    ancho_fila = max(sum(l.width for l in f) + MARGEN * (len(f) + 1)
                     for f in filas)
    alto = len(filas) * (ALTO_LOGO + MARGEN) + MARGEN

    hoja = Image.new('RGBA', (ancho_fila, alto), (255, 255, 255, 255))
    for nf, fila in enumerate(filas):
        # Reparte el sobrante para que cada fila quede centrada y espaciada.
        sobra = ancho_fila - sum(l.width for l in fila)
        hueco = sobra / (len(fila) + 1)
        x = hueco
        y = MARGEN + nf * (ALTO_LOGO + MARGEN)
        for logo in fila:
            hoja.alpha_composite(logo, (round(x), y))
            x += logo.width + hueco

    salida = os.path.join(DIR, 'marcas.png')
    hoja.convert('RGB').save(salida, optimize=True)
    print(f'{salida}: {hoja.size[0]}x{hoja.size[1]} con {len(logos)} marcas')
    return 0


if __name__ == '__main__':
    sys.exit(main())
