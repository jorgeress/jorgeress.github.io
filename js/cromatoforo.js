// Cromatoforo en el navegador: saca la paleta de un wallpaper (como hace
// pywal) y repinta la pagina entera con ella. Todo ocurre en tu navegador;
// las imagenes que sueltas aqui no salen de tu equipo.
(() => {
  const raiz = document.documentElement;
  const reducido = window.reducido;
  const FONDOS = [
    { nombre: "akira", src: "img/fondos/akira.jpg" },
    { nombre: "kyogre", src: "img/fondos/kyogre.jpg" },
    { nombre: "arcane", src: "img/fondos/arcane.jpg" },
    { nombre: "abbey-road", src: "img/fondos/abbey-road.jpg" },
  ];
  const ORIGINAL = {
    fondo: "#0b0d12", superficie: "#11151d", borde: "#232a37", texto: "#e8eaf0",
    suave: "#c3c8d4", apagado: "#8b93a7",
    c1: "#ff7a45", c2: "#c792ea", c3: "#3ddc97", c4: "#ff4fa3",
    muestra: ["#0b0d12", "#232a37", "#ff7a45", "#ff4fa3", "#c792ea", "#3ddc97", "#8b93a7", "#e8eaf0"],
  };
  let actual = "original";

  // --- color ---
  const aHsl = ([r, g, b]) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
  };
  const hsl = (h, s, l) => `hsl(${h.toFixed(0)} ${(s * 100).toFixed(0)}% ${(l * 100).toFixed(0)}%)`;
  const hex = ([r, g, b]) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const distHue = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
  const limita = (v, a, b) => Math.min(b, Math.max(a, v));

  // --- extraccion: k-means sobre la imagen reducida ---
  function extrae(img) {
    const lado = 72;
    const c = document.createElement("canvas");
    c.width = c.height = lado;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    const esc = Math.max(lado / img.naturalWidth, lado / img.naturalHeight);
    const w = img.naturalWidth * esc, h = img.naturalHeight * esc;
    ctx.drawImage(img, (lado - w) / 2, (lado - h) / 2, w, h);
    const datos = ctx.getImageData(0, 0, lado, lado).data;
    const px = [];
    for (let i = 0; i < datos.length; i += 4) if (datos[i + 3] > 200) px.push([datos[i], datos[i + 1], datos[i + 2]]);
    if (!px.length) return null;

    const K = 8;
    const orden = [...px].sort((a, b) => lum(a) - lum(b));
    let centros = Array.from({ length: K }, (_, k) => [...orden[Math.floor((k + 0.5) * orden.length / K)]]);
    let cuenta = new Array(K).fill(0);
    for (let it = 0; it < 10; it++) {
      const suma = centros.map(() => [0, 0, 0]);
      cuenta = new Array(K).fill(0);
      for (const p of px) {
        let mejor = 0, md = Infinity;
        for (let k = 0; k < K; k++) {
          const d = (p[0] - centros[k][0]) ** 2 + (p[1] - centros[k][1]) ** 2 + (p[2] - centros[k][2]) ** 2;
          if (d < md) { md = d; mejor = k; }
        }
        cuenta[mejor]++;
        suma[mejor][0] += p[0]; suma[mejor][1] += p[1]; suma[mejor][2] += p[2];
      }
      centros = centros.map((c0, k) => (cuenta[k] ? suma[k].map((v) => v / cuenta[k]) : c0));
    }
    const grupos = centros.map((rgb, k) => ({ rgb, n: cuenta[k] / px.length, hsl: aHsl(rgb) }))
      .filter((g) => g.n > 0);

    // fondo: el tono del grupo oscuro mas abundante, muy oscurecido
    const oscuros = grupos.filter((g) => g.hsl[2] < 0.5);
    const base = (oscuros.length ? oscuros : grupos).sort((a, b) => b.n - a.n)[0];
    const [hb, sb0] = base.hsl;
    const sb = Math.min(sb0, 0.5) * 0.55;

    // acentos: los grupos mas saturados y abundantes, con tonos distintos
    const candidatos = [...grupos].sort((a, b) => b.hsl[1] * (0.35 + Math.sqrt(b.n)) - a.hsl[1] * (0.35 + Math.sqrt(a.n)));
    const elegidos = [];
    for (const umbral of [35, 18, 0]) {
      for (const g of candidatos) {
        if (elegidos.length === 4) break;
        if (elegidos.includes(g)) continue;
        if (elegidos.every((e) => distHue(e.hsl[0], g.hsl[0]) >= umbral)) elegidos.push(g);
      }
    }
    const acentos = elegidos.map((g, i) => {
      let [h, s, l] = g.hsl;
      if (s < 0.12) { h = (hb + 25 * (i + 1)) % 360; s = 0.25; }
      return hsl(h, limita(Math.max(s, 0.5), 0, 0.9), limita(l, 0.62, 0.74));
    });
    while (acentos.length < 4) acentos.push(acentos[0] || hsl(hb, 0.5, 0.68));

    return {
      fondo: hsl(hb, sb, 0.065), superficie: hsl(hb, sb, 0.1), borde: hsl(hb, sb * 1.2, 0.19),
      texto: hsl(hb, 0.2, 0.93), suave: hsl(hb, 0.14, 0.78), apagado: hsl(hb, 0.12, 0.6),
      c1: acentos[0], c2: acentos[1], c3: acentos[2], c4: acentos[3],
      muestra: [...grupos].sort((a, b) => lum(a.rgb) - lum(b.rgb)).map((g) => hex(g.rgb)),
    };
  }

  const carga = (src) => new Promise((ok, mal) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = mal;
    img.src = src;
  });

  // --- aplicar, con barrido circular desde el clic ---
  function pon(pal, nombre) {
    for (const k of ["fondo", "superficie", "borde", "texto", "suave", "apagado", "c1", "c2", "c3", "c4"]) {
      raiz.style.setProperty(`--${k}`, pal[k]);
    }
    if (nombre === "original") delete raiz.dataset.wal; else raiz.dataset.wal = nombre;
    actual = nombre;
    document.querySelector('meta[name="theme-color"]').content = pal.fondo;
    pintaPanel(pal, nombre);
    window.repintaFondo?.();
  }

  function aplica(pal, nombre, origen) {
    guarda(pal, nombre);
    if (reducido || !document.startViewTransition) return pon(pal, nombre);
    const x = origen?.x ?? innerWidth - 46, y = origen?.y ?? innerHeight - 46;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    // durante el barrido las variables cambian de golpe; la transicion lenta
    // de @property solo se usa sin View Transitions
    raiz.style.transition = "none";
    const vt = document.startViewTransition(() => pon(pal, nombre));
    vt.ready.then(() => {
      raiz.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 750, easing: "cubic-bezier(.65,0,.35,1)", pseudoElement: "::view-transition-new(root)" },
      );
    }).catch(() => {});
    vt.finished.finally(() => { raiz.style.transition = ""; });
  }

  async function aplicaFondo(nombre, origen) {
    if (nombre === "original") { aplica(ORIGINAL, "original", origen); return "original"; }
    const f = FONDOS.find((f) => f.nombre === nombre);
    if (!f) return null;
    const pal = extrae(await carga(f.src));
    if (pal) aplica(pal, f.nombre, origen);
    return f.nombre;
  }

  async function aplicaArchivo(archivo, origen) {
    if (!archivo?.type.startsWith("image/")) return;
    const url = URL.createObjectURL(archivo);
    try {
      const pal = extrae(await carga(url));
      if (pal) aplica(pal, archivo.name.replace(/\.[^.]+$/, "").slice(0, 24) || "tu-imagen", origen);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // recordar la eleccion es solo una comodidad: si el almacenamiento falla, da igual
  function guarda(pal, nombre) {
    try {
      if (nombre === "original") localStorage.removeItem("cromatoforo");
      else localStorage.setItem("cromatoforo", JSON.stringify({ pal, nombre }));
    } catch {}
  }

  // --- panel ---
  const panel = document.getElementById("panel-croma");
  const fondos = document.getElementById("fondos");
  const orden = document.getElementById("wal-orden");
  const paleta = document.getElementById("paleta");
  const flotante = document.querySelector(".flotante");

  fondos.innerHTML =
    `<button type="button" data-fondo="original" aria-label="Paleta original"><span class="original"><span>original</span></span></button>`
    + FONDOS.map((f) => `<button type="button" data-fondo="${f.nombre}" aria-label="Wallpaper ${f.nombre}">`
      + `<img src="${f.src}" alt="" loading="lazy"><span class="nombre">${f.nombre}</span></button>`).join("");

  function pintaPanel(pal, nombre) {
    orden.textContent = nombre === "original" ? "$ wal --original" : `$ wal -i ${nombre}`;
    paleta.innerHTML = pal.muestra.map((c, i) => `<i style="background:${c};animation-delay:${i * 40}ms" title="${c}"></i>`).join("");
    fondos.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.fondo === nombre)));
  }

  fondos.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-fondo]");
    if (b) aplicaFondo(b.dataset.fondo, { x: e.clientX, y: e.clientY });
  });

  const abre = () => { panel.hidden = false; };
  const cierra = () => { panel.hidden = true; };
  document.querySelectorAll("[data-abre-cromatoforo]").forEach((b) =>
    b.addEventListener("click", (e) => { e.stopPropagation(); panel.hidden ? abre() : cierra(); }));
  document.querySelector("[data-cierra-cromatoforo]").addEventListener("click", cierra);
  document.addEventListener("click", (e) => {
    if (!panel.hidden && !panel.contains(e.target)) cierra();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") cierra(); });

  // tu propia imagen: con el selector o soltandola en cualquier parte
  const subir = document.getElementById("subir");
  document.getElementById("archivo").addEventListener("change", (e) => {
    aplicaArchivo(e.target.files[0]);
    e.target.value = "";
  });
  addEventListener("dragover", (e) => {
    if (![...e.dataTransfer.items].some((i) => i.type.startsWith("image/"))) return;
    e.preventDefault();
    abre();
    subir.classList.add("encima");
  });
  addEventListener("dragleave", (e) => { if (!e.relatedTarget) subir.classList.remove("encima"); });
  addEventListener("drop", (e) => {
    const f = [...e.dataTransfer.files].find((f) => f.type.startsWith("image/"));
    subir.classList.remove("encima");
    if (!f) return;
    e.preventDefault();
    aplicaArchivo(f, { x: e.clientX, y: e.clientY });
  });

  // el boton flotante aparece cuando el del hero sale de la vista
  const delHero = document.querySelector(".hero [data-abre-cromatoforo]");
  new IntersectionObserver(([e]) => flotante.classList.toggle("visible", !e.isIntersecting))
    .observe(delHero);

  // estado inicial: lo ultimo que eligio este visitante, o la paleta original
  let guardado = null;
  try { guardado = JSON.parse(localStorage.getItem("cromatoforo")); } catch {}
  if (guardado?.pal?.c1) pon(guardado.pal, guardado.nombre);
  else pintaPanel(ORIGINAL, "original");

  window.cromatoforo = {
    fondos: () => ["original", ...FONDOS.map((f) => f.nombre)],
    actual: () => actual,
    aplica: (nombre) => aplicaFondo(nombre),
    siguiente: () => {
      const lista = ["original", ...FONDOS.map((f) => f.nombre)];
      return aplicaFondo(lista[(lista.indexOf(actual) + 1) % lista.length]);
    },
    colores: () => ["c1", "c2", "c3", "c4"].map((k) => getComputedStyle(raiz).getPropertyValue(`--${k}`).trim()),
  };
})();
