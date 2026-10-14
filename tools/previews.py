#!/usr/bin/env python3
"""Genera las imagenes 1280x640 de cada proyecto.

Sirven a la vez de social preview del repo, de banner en el README del perfil
y de tarjeta en la web. Salen a img/proyectos/<repo>.png (y .webp para la web).

Uso: python3 tools/previews.py   (necesita rsvg-convert y Pillow)
"""
import base64
import io
import subprocess
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
FUENTES = RAIZ / "tools" / "fuentes"
SALIDA = RAIZ / "img" / "proyectos"

W, H = 1280, 640
FONDO = "#0b0d12"
TEXTO = "#e8eaf0"
APAGADO = "#8b93a7"
MONO = "JetBrainsMono Nerd Font"
SANS = "Noto Sans"
SANS_TTF = "/usr/share/fonts/noto/NotoSans-Regular.ttf"


def incrusta(nombre, ancho=None):
    """Devuelve la imagen como data URI PNG (rsvg no lee webp)."""
    img = Image.open(FUENTES / nombre).convert("RGB")
    if ancho and img.width > ancho:
        img = img.resize((ancho, round(img.height * ancho / img.width)), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def paleta(nombre, n=6):
    """Los colores dominantes de una captura, como haria pywal a grandes rasgos."""
    img = Image.open(FUENTES / nombre).convert("RGB").resize((160, 90))
    q = img.quantize(colors=n * 2, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()[: n * 2 * 3]
    cuenta = sorted(q.getcolors(), reverse=True)
    cols = []
    for _, i in cuenta:
        r, g, b = pal[i * 3 : i * 3 + 3]
        cols.append(f"#{r:02x}{g:02x}{b:02x}")
    return cols[:n]


def parte(texto, px, ancho):
    fuente = ImageFont.truetype(SANS_TTF, px)
    lineas, actual = [], ""
    for palabra in texto.split():
        prueba = f"{actual} {palabra}".strip()
        if fuente.getlength(prueba) <= ancho:
            actual = prueba
        else:
            lineas.append(actual)
            actual = palabra
    lineas.append(actual)
    return lineas


def chips(etiquetas, x, y, color):
    out, cx = [], x
    fuente = ImageFont.truetype(SANS_TTF, 20)
    for e in etiquetas:
        w = fuente.getlength(e) + 32
        out.append(
            f'<rect x="{cx}" y="{y}" width="{w:.0f}" height="40" rx="20" '
            f'fill="{color}" fill-opacity=".12" stroke="{color}" stroke-opacity=".45"/>'
            f'<text x="{cx + w / 2:.0f}" y="{y + 27}" text-anchor="middle" '
            f'font-family="{SANS}" font-size="20" fill="{TEXTO}">{escape(e)}</text>'
        )
        cx += w + 12
    return "".join(out)


def ventana(x, y, w, h, titulo=""):
    """Marco de ventana con los tres puntos, para capturas y terminales."""
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14" fill="#11151d" stroke="#232a37"/>'
        f'<circle cx="{x + 22}" cy="{y + 20}" r="6" fill="#ff5f57"/>'
        f'<circle cx="{x + 42}" cy="{y + 20}" r="6" fill="#febc2e"/>'
        f'<circle cx="{x + 62}" cy="{y + 20}" r="6" fill="#28c840"/>'
        f'<text x="{x + w / 2}" y="{y + 25}" text-anchor="middle" font-family="{MONO}" '
        f'font-size="15" fill="{APAGADO}">{escape(titulo)}</text>'
    )


# --- visuales de la columna derecha (x 680..1220, y 60..580) -----------------

def v_crisol(c):
    reglas = [
        ("rule", "#c678dd"), (" packer_signature_strings", TEXTO), (" {", APAGADO),
    ]
    yara = (
        f'<text x="720" y="140" font-family="{MONO}" font-size="19" xml:space="preserve">'
        + "".join(f'<tspan fill="{col}">{escape(t)}</tspan>' for t, col in reglas)
        + "</text>"
        f'<text x="744" y="172" font-family="{MONO}" font-size="19" fill="{APAGADO}">strings: <tspan fill="#98c379">$upx1 = "UPX0"</tspan></text>'
        f'<text x="744" y="204" font-family="{MONO}" font-size="19" fill="{APAGADO}">condition: <tspan fill="{TEXTO}">is_pe and any of them</tspan></text>'
        f'<text x="720" y="236" font-family="{MONO}" font-size="19" fill="{APAGADO}">}}</text>'
    )
    barras = (
        f'<text x="720" y="320" font-family="{SANS}" font-size="20" fill="{APAGADO}">falsos positivos sobre 52 binarios legítimos</text>'
        f'<text x="720" y="364" font-family="{MONO}" font-size="17" fill="{APAGADO}">antes</text>'
        f'<rect x="800" y="346" width="300" height="24" rx="6" fill="#ff5a5f" fill-opacity=".85"/>'
        f'<text x="1112" y="365" font-family="{MONO}" font-weight="bold" font-size="22" fill="#ff8a8d">12,18 %</text>'
        f'<text x="720" y="414" font-family="{MONO}" font-size="17" fill="{APAGADO}">después</text>'
        f'<rect x="800" y="396" width="4" height="24" rx="2" fill="{c}"/>'
        f'<text x="816" y="415" font-family="{MONO}" font-weight="bold" font-size="22" fill="{c}">0 %</text>'
        f'<text x="720" y="470" font-family="{SANS}" font-size="20" fill="{TEXTO}">sin perder detección</text>'
    )
    return ventana(690, 80, 520, 440, "reglas.yar") + yara + barras


def v_cromatoforo(c):
    a = incrusta("akira.jpg", 900)
    k = incrusta("kyogre.jpg", 900)
    pa, pk = paleta("akira.jpg"), paleta("kyogre.jpg")

    def tira(cols, x, y, vertical=False):
        return "".join(
            f'<rect x="{x + (0 if vertical else i * 44)}" y="{y + (i * 40 if vertical else 0)}" '
            f'width="32" height="32" rx="8" fill="{col}" stroke="#ffffff22"/>'
            for i, col in enumerate(cols)
        )

    return (
        '<defs><clipPath id="ca"><rect x="660" y="70" width="440" height="248" rx="12"/></clipPath>'
        '<clipPath id="ck"><rect x="780" y="270" width="440" height="248" rx="12"/></clipPath></defs>'
        f'<image href="{a}" x="660" y="70" width="440" height="248" clip-path="url(#ca)" preserveAspectRatio="xMidYMid slice"/>'
        f'<rect x="780" y="270" width="440" height="248" rx="12" fill="{FONDO}" transform="translate(-8 -8)" opacity=".7"/>'
        f'<image href="{k}" x="780" y="270" width="440" height="248" clip-path="url(#ck)" preserveAspectRatio="xMidYMid slice"/>'
        f'<rect x="780" y="270" width="440" height="248" rx="12" fill="none" stroke="#ffffff30"/>'
        f'<rect x="660" y="70" width="440" height="248" rx="12" fill="none" stroke="#ffffff30"/>'
        + tira(pa[:5], 1116, 74, vertical=True) + tira(pk, 780, 538)
    )


def v_cibo(c):
    l = [
        (f'<tspan fill="{c}">tú ›</tspan> cuánto es 4817 * 2963', 150),
        (f'<tspan fill="{APAGADO}">  ⚙ herramienta: Calculator</tspan>', 192),
        (f'<tspan fill="#c678dd">cibo ›</tspan> 14.272.771', 234),
        (f'<tspan fill="{c}">tú ›</tspan> resume mi informe.pdf', 300),
        (f'<tspan fill="{APAGADO}">  🔒 datos sensibles: se queda en local</tspan>', 342),
        (f'<tspan fill="#c678dd">cibo ›</tspan> el informe trata de…', 384),
    ]
    txt = "".join(
        f'<text x="722" y="{y}" font-family="{MONO}" font-size="20" fill="{TEXTO}">{t}</text>' for t, y in l
    )
    pie = (
        f'<circle cx="730" cy="476" r="6" fill="{c}"/>'
        f'<text x="746" y="482" font-family="{MONO}" font-size="17" fill="{APAGADO}">ollama · llama3.1:8b · sin salir del equipo</text>'
    )
    return ventana(690, 90, 520, 430, "cibo") + txt + f'<line x1="690" y1="440" x2="1210" y2="440" stroke="#232a37"/>' + pie


def v_pinchadiscos(c):
    cx, cy = 900, 320
    surcos = "".join(
        f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#ffffff" stroke-opacity="{0.05 + (r % 3) * 0.02:.2f}"/>'
        for r in range(90, 236, 7)
    )
    disco = (
        f'<circle cx="{cx}" cy="{cy}" r="240" fill="#0f1116" stroke="#262b36"/>' + surcos
        + f'<path d="M{cx} {cy} L{cx + 240} {cy - 60} A 240 240 0 0 1 {cx + 228} {cy + 75} Z" fill="#ffffff" opacity=".04"/>'
        f'<circle cx="{cx}" cy="{cy}" r="80" fill="{c}"/>'
        f'<circle cx="{cx}" cy="{cy}" r="8" fill="{FONDO}"/>'
        f'<text x="{cx}" y="{cy - 22}" text-anchor="middle" font-family="{MONO}" font-weight="bold" font-size="15" fill="{FONDO}">PINCHA</text>'
        f'<text x="{cx}" y="{cy + 36}" text-anchor="middle" font-family="{MONO}" font-weight="bold" font-size="15" fill="{FONDO}">DISCOS</text>'
    )
    fil = ["década: 90s", "género: rock", "popularidad ≥ 60"]
    fichas = ""
    for i, f in enumerate(fil):
        y = 120 + i * 62
        fichas += (
            f'<rect x="1040" y="{y}" width="200" height="44" rx="10" fill="#151a24" stroke="{c}" stroke-opacity=".5"/>'
            f'<text x="1056" y="{y + 29}" font-family="{MONO}" font-size="16" fill="{TEXTO}">{escape(f)}</text>'
        )
    return disco + fichas


def v_garabato(c):
    guion = (
        f'<rect x="690" y="150" width="250" height="200" rx="12" fill="#11151d" stroke="#232a37"/>'
        f'<text x="710" y="186" font-family="{MONO}" font-size="15" fill="{APAGADO}">script.txt</text>'
        + "".join(
            f'<rect x="710" y="{206 + i * 26}" width="{w}" height="10" rx="5" fill="{col}" opacity="{op}"/>'
            for i, (w, col, op) in enumerate(
                [(200, c, 0.9), (170, TEXTO, 0.35), (190, TEXTO, 0.35), (120, c, 0.9), (180, TEXTO, 0.35)]
            )
        )
    )
    flecha = f'<path d="M955 250 h50 m-14 -12 l14 12 l-14 12" stroke="{c}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
    marco = (
        f'<rect x="1020" y="150" width="200" height="200" rx="12" fill="#f4f1e8"/>'
        f'<circle cx="1120" cy="210" r="22" fill="none" stroke="#1b1b1b" stroke-width="4"/>'
        f'<path d="M1120 232 v52 M1120 250 l-26 18 M1120 250 l26 -20 M1120 284 l-20 34 M1120 284 l20 34" stroke="#1b1b1b" stroke-width="4" fill="none" stroke-linecap="round"/>'
        f'<text x="1180" y="190" font-family="{SANS}" font-size="40" font-weight="bold" fill="{c}">?</text>'
    )
    tira = ""
    for i in range(6):
        x = 690 + i * 90
        tira += f'<rect x="{x}" y="410" width="80" height="56" rx="6" fill="#151a24" stroke="#262b36"/>'
    tira += (
        f'<rect x="690" y="396" width="530" height="84" rx="8" fill="none" stroke="{c}" stroke-opacity=".35" stroke-dasharray="6 8"/>'
        f'<text x="690" y="520" font-family="{MONO}" font-size="17" fill="{APAGADO}">voz → imágenes → subtítulos → final_video.mp4</text>'
    )
    return guion + flecha + marco + tira


def v_vitrina(c):
    portadas = [
        ("arcane.webp", 680, 80, 150, 225, -4),
        ("abbey-road.webp", 850, 110, 170, 170, 3),
        ("12-angry-men.webp", 1040, 70, 150, 225, 5),
        ("aku-no-hana.webp", 700, 330, 170, 170, 4),
        ("500-days-of-summer.webp", 890, 300, 150, 225, -3),
        ("am.webp", 1060, 330, 160, 160, -5),
    ]
    out = []
    for i, (f, x, y, w, h, rot) in enumerate(portadas):
        d = incrusta(f, 300)
        cx, cy = x + w / 2, y + h / 2
        out.append(
            f'<g transform="rotate({rot} {cx} {cy})">'
            f'<rect x="{x - 6}" y="{y - 6}" width="{w + 12}" height="{h + 12}" rx="10" fill="#151a24" stroke="#ffffff1a"/>'
            f'<clipPath id="p{i}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6"/></clipPath>'
            f'<image href="{d}" x="{x}" y="{y}" width="{w}" height="{h}" clip-path="url(#p{i})" preserveAspectRatio="xMidYMid slice"/>'
            "</g>"
        )
    return "".join(out) + f'<text x="1220" y="590" text-anchor="end" font-family="{MONO}" font-size="17" fill="{APAGADO}">215 obras · 5 salas</text>'


def v_pokegan(c):
    a, b = incrusta("epoch100.png"), incrusta("epoch5000.png")
    return (
        '<clipPath id="ea"><rect x="700" y="130" width="240" height="240" rx="12"/></clipPath>'
        '<clipPath id="eb"><rect x="970" y="130" width="240" height="240" rx="12"/></clipPath>'
        f'<image href="{a}" x="680" y="110" width="280" height="280" clip-path="url(#ea)"/>'
        f'<image href="{b}" x="950" y="110" width="280" height="280" clip-path="url(#eb)"/>'
        f'<rect x="700" y="130" width="240" height="240" rx="12" fill="none" stroke="#ffffff30"/>'
        f'<rect x="970" y="130" width="240" height="240" rx="12" fill="none" stroke="{c}" stroke-width="3"/>'
        f'<text x="820" y="410" text-anchor="middle" font-family="{MONO}" font-size="19" fill="{APAGADO}">época 100</text>'
        f'<text x="1090" y="410" text-anchor="middle" font-family="{MONO}" font-size="19" fill="{c}">época 5000</text>'
        f'<text x="955" y="480" text-anchor="middle" font-family="{SANS}" font-size="20" fill="{APAGADO}">ruido de 100 dimensiones → sprite de 64×64</text>'
    )



PROYECTOS = {
    "crisol": dict(
        color="#ff7a45",
        lema="Triaje estático de malware y banco de pruebas para reglas YARA. Cuánto vale una regla, medido.",
        chips=["Python", "YARA", "detection engineering"],
        visual=v_crisol,
    ),
    "cromatoforo": dict(
        nombre="cromatóforo",
        color="#c792ea",
        lema="El escritorio toma su color del wallpaper. Hyprland sobre Arch, tematizado entero con pywal16.",
        chips=["Hyprland", "Lua", "pywal16", "Shell"],
        visual=v_cromatoforo,
    ),
    "cibo": dict(
        color="#3ddc97",
        lema="Un asistente que corre entero en tu ordenador y sabe cuándo usar una herramienta en vez de inventarse la respuesta.",
        chips=["Python", "Ollama", "ChromaDB"],
        visual=v_cibo,
    ),
    "pinchadiscos": dict(
        color="#ff4fa3",
        lema="Playlists de Spotify a medida: filtras por artista, género, década y popularidad y la guardas en tu cuenta.",
        chips=["Next.js", "React", "OAuth 2.0", "Tailwind"],
        visual=v_pinchadiscos,
    ),
    "garabato": dict(
        color="#ffd23f",
        lema="Escribes el guion, sale el vídeo montado: voz, imágenes, subtítulos y ensamblado final.",
        chips=["Python", "ffmpeg", "TTS", "Pillow"],
        visual=v_garabato,
    ),
    "vitrina": dict(
        color="#8b7bff",
        lema="Mi colección de juegos, películas, libros y discos. Se escribe en Obsidian y se publica como web.",
        chips=["Obsidian", "TypeScript", "web estática"],
        visual=v_vitrina,
    ),
    "pokegan": dict(
        nombre="PokeGAN",
        color="#ff5a5f",
        lema="Una DCGAN entrenada desde cero durante 10.000 épocas para generar Pokémon que no existen.",
        chips=["TensorFlow", "Keras", "DCGAN"],
        visual=v_pokegan,
    ),
}


def svg(repo, p):
    c = p["color"]
    nombre = p.get("nombre", repo)
    tam = 84 if len(nombre) <= 9 else 64 if len(nombre) <= 12 else 54
    lineas = parte(p["lema"], 30, 520)
    lema = "".join(
        f'<text x="80" y="{318 + i * 44}" font-family="{SANS}" font-size="30" fill="{TEXTO}" fill-opacity=".86">{escape(l)}</text>'
        for i, l in enumerate(lineas)
    )
    puntos = "".join(
        f'<circle cx="{x}" cy="{y}" r="1.4" fill="#ffffff" fill-opacity=".06"/>'
        for x in range(20, W, 32) for y in range(20, H, 32)
    )
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>
  <radialGradient id="glow" cx="78%" cy="20%" r="70%">
    <stop offset="0" stop-color="{c}" stop-opacity=".22"/><stop offset="1" stop-color="{c}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="barra" x1="0" x2="1"><stop offset="0" stop-color="{c}"/><stop offset="1" stop-color="{c}" stop-opacity=".1"/></linearGradient>
</defs>
<rect width="{W}" height="{H}" fill="{FONDO}"/>
<rect width="{W}" height="{H}" fill="url(#glow)"/>
{puntos}
<text x="80" y="128" font-family="{MONO}" font-size="24" fill="{APAGADO}">jorgeress /</text>
<text x="80" y="{150 + tam}" font-family="{MONO}" font-weight="bold" font-size="{tam}" fill="{TEXTO}">{escape(nombre)}</text>
<rect x="82" y="{176 + tam}" width="72" height="6" rx="3" fill="{c}"/>
{lema}
{chips(p["chips"], 80, 536, c)}
{p["visual"](c)}
<rect y="{H - 8}" width="{W}" height="8" fill="url(#barra)"/>
</svg>"""


def main():
    SALIDA.mkdir(parents=True, exist_ok=True)
    for repo, p in PROYECTOS.items():
        s = svg(repo, p)
        png = SALIDA / f"{repo}.png"
        subprocess.run(["rsvg-convert", "-w", str(W), "-h", str(H), "-o", str(png)], input=s.encode(), check=True)
        Image.open(png).convert("RGB").save(SALIDA / f"{repo}.webp", "WEBP", quality=86)
        print(png.relative_to(RAIZ))


if __name__ == "__main__":
    main()
