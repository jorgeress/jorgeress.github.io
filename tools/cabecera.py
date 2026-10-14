#!/usr/bin/env python3
"""Genera la cabecera animada del README del perfil (assets/header.svg).

Sin JavaScript (GitHub no lo deja): las manchas se mueven con CSS y la linea
que se escribe sola con SMIL, que GitHub si reproduce dentro de un <img>.
Uso: python3 tools/cabecera.py ~/dev/jorgeress/assets/header.svg
"""
import sys
from xml.sax.saxutils import escape

W, H = 1200, 320
FRASES = [
    'sudo pacman -Syu',
    'yara -r reglas/ ./muestras',
    'nmap -sV 192.168.1.0/24',
    'git commit -m "arreglado, creo"',
    'tail -f /var/log/auth.log',
    'chmod 600 ~/.ssh/id_ed25519',
    'docker compose up -d',
    'ollama run llama3.1',
    'wal -i wallpaper.jpg',
    'make && ./a.out',
    'rm -rf node_modules && npm i',
    ':wq',
]
FS = 26          # tamaño de la linea que se escribe
CHAR = FS * 0.61 # ancho aproximado de un caracter monoespaciado
X0, Y0 = 72 + 2 * 26 * 0.61, 236
TRAMO = 3.6      # segundos por frase
CICLO = TRAMO * len(FRASES)
MANCHAS = [  # color, cx, cy, r, desplazamiento, duracion
    ("#ff7a45", 980, 70, 170, (-120, 60), 18),
    ("#c792ea", 1120, 250, 190, (-90, -70), 22),
    ("#3ddc97", 760, 300, 150, (110, -50), 20),
    ("#ff4fa3", 880, 160, 120, (90, 80), 16),
]


def frase(i, texto):
    ancho = len(texto) * CHAR + 4
    t0 = i / len(FRASES)
    paso = TRAMO / CICLO
    # escribe (35 %), se queda (45 %), se borra (20 %) dentro de su tramo
    k = [0, t0, t0 + paso * 0.35, t0 + paso * 0.8, t0 + paso, 1]
    k = [round(min(v, 1), 4) for v in k]
    vals = f"0;0;{ancho:.0f};{ancho:.0f};0;0"
    cur = f"{X0};{X0};{X0 + ancho:.0f};{X0 + ancho:.0f};{X0};{X0}"
    vis = "hidden;visible;visible;visible;hidden;hidden"
    kt = ";".join(map(str, k))
    return f"""
  <clipPath id="f{i}"><rect x="{X0}" y="{Y0 - FS}" height="{FS + 12}" width="0">
    <animate attributeName="width" values="{vals}" keyTimes="{kt}" dur="{CICLO}s" repeatCount="indefinite" calcMode="linear"/>
  </rect></clipPath>
  <text class="tipo" x="{X0}" y="{Y0}" clip-path="url(#f{i})">{escape(texto)}</text>
  <rect class="cursor" y="{Y0 - FS + 2}" width="3" height="{FS + 4}" visibility="hidden">
    <animate attributeName="x" values="{cur}" keyTimes="{kt}" dur="{CICLO}s" repeatCount="indefinite"/>
    <animate attributeName="visibility" values="{vis}" keyTimes="{kt}" dur="{CICLO}s" repeatCount="indefinite" calcMode="discrete"/>
  </rect>"""


def main(destino):
    manchas, css = [], []
    for i, (c, cx, cy, r, (dx, dy), d) in enumerate(MANCHAS):
        manchas.append(f'<circle class="m m{i}" cx="{cx}" cy="{cy}" r="{r}" fill="{c}"/>')
        css.append(
            f".m{i}{{animation:a{i} {d}s ease-in-out infinite alternate}}"
            f"@keyframes a{i}{{to{{transform:translate({dx}px,{dy}px)}}}}"
        )
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="Jorge García">
<style>
  .nombre{{font:700 76px 'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;fill:#e8eaf0}}
  .prompt{{font:400 22px 'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;fill:#8b93a7}}
  .prompt b{{fill:#3ddc97}}
  .tipo{{font:400 {FS}px 'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;fill:#e8eaf0}}
  .cursor{{fill:#c792ea;animation:parpadeo 1s steps(1) infinite}}
  .m{{opacity:.45;transform-box:fill-box;transform-origin:center}}
  {''.join(css)}
  @keyframes parpadeo{{50%{{opacity:0}}}}
  @media (prefers-reduced-motion:reduce){{.m,.cursor{{animation:none}}}}
</style>
<defs>
  <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60"/></filter>
  <clipPath id="marco"><rect width="{W}" height="{H}" rx="22"/></clipPath>
  <pattern id="puntos" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="#fff" fill-opacity=".07"/></pattern>
  <linearGradient id="linea" x1="0" x2="1"><stop offset="0" stop-color="#ff7a45"/><stop offset=".33" stop-color="#c792ea"/><stop offset=".66" stop-color="#3ddc97"/><stop offset="1" stop-color="#ff4fa3"/></linearGradient>
</defs>
<g clip-path="url(#marco)">
  <rect width="{W}" height="{H}" fill="#0b0d12"/>
  <g filter="url(#blur)">{''.join(manchas)}</g>
  <rect width="{W}" height="{H}" fill="url(#puntos)"/>
  <text class="prompt" x="72" y="82"><tspan fill="#3ddc97">jorge@arch</tspan> ~ $ whoami</text>
  <text class="nombre" x="68" y="168">Jorge García</text>
  <rect x="72" y="186" width="120" height="5" rx="2.5" fill="url(#linea)"/>
  <text class="prompt" x="72" y="{Y0}" style="font-size:{FS}px">$</text>
  {''.join(frase(i, t) for i, t in enumerate(FRASES))}
</g>
</svg>
"""
    open(destino, "w").write(svg)


if __name__ == "__main__":
    main(sys.argv[1])
