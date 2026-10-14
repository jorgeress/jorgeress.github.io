#!/usr/bin/env python3
"""Genera los wallpapers de prueba de cromatoforo (img/fondos/*.jpg).

Paisajes sencillos (cielo, sol y tres capas de montañas) con paletas muy
distintas entre si, para que al probar se note bien el cambio de colores.
Uso: python3 tools/fondos.py   (necesita Pillow)
"""
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "img" / "fondos"
W, H = 640, 400

# cielo arriba, cielo abajo, sol, montañas de lejos a cerca
PALETAS = {
    "oceano":    ["#0a1f44", "#1b6ca8", "#bfefff", "#1d4e89", "#12355b", "#071e3d"],
    "atardecer": ["#2b1055", "#d53369", "#ffd56b", "#ff7b54", "#9d2f5f", "#3d0f3a"],
    "bosque":    ["#0f2e1d", "#7fb069", "#f1f7c4", "#3f7d46", "#2a5a34", "#10261a"],
    "desierto":  ["#f6d7a7", "#f3a953", "#fff3d6", "#d9783a", "#a24c22", "#5a2a14"],
    "neon":      ["#070012", "#3a0ca3", "#00f5d4", "#f72585", "#7209b7", "#1b0033"],
    "nieve":     ["#c9d6df", "#f0f4f8", "#ffffff", "#9fb3c8", "#6b8299", "#334e68"],
}


def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def mezcla(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def montana(dib, base, amp, color, semilla):
    rnd = random.Random(semilla)
    fases = [rnd.uniform(0, 6.28) for _ in range(3)]
    puntos = [(0, H)]
    for x in range(0, W + 8, 8):
        y = base + sum(amp / (k + 1) * math.sin(x / (90 / (k + 1)) + fases[k]) for k in range(3))
        puntos.append((x, y))
    puntos.append((W, H))
    dib.polygon(puntos, fill=color)


def main():
    SALIDA.mkdir(parents=True, exist_ok=True)
    for nombre, hexes in PALETAS.items():
        c = [rgb(h) for h in hexes]
        img = Image.new("RGB", (W, H))
        dib = ImageDraw.Draw(img)
        for y in range(H):
            dib.line([(0, y), (W, y)], fill=mezcla(c[0], c[1], y / H))
        # sol con halo
        halo = Image.new("RGBA", (W, H), c[2] + (0,))
        ImageDraw.Draw(halo).ellipse((420, 70, 540, 190), fill=c[2] + (150,))
        img = Image.alpha_composite(img.convert("RGBA"), halo.filter(ImageFilter.GaussianBlur(30))).convert("RGB")
        dib = ImageDraw.Draw(img)
        dib.ellipse((450, 100, 510, 160), fill=c[2])
        montana(dib, 250, 40, c[3], nombre + "1")
        montana(dib, 300, 34, c[4], nombre + "2")
        montana(dib, 350, 24, c[5], nombre + "3")
        img.save(SALIDA / f"{nombre}.jpg", quality=86)
        print(f"img/fondos/{nombre}.jpg")


if __name__ == "__main__":
    main()
