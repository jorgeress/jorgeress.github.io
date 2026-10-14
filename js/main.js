// Datos de los proyectos: los usan las tarjetas y la terminal.
window.PROYECTOS = [
  {
    repo: "crisol", nombre: "Crisol", color: "#ff7a45",
    lema: "Motor de triaje estático de malware y banco de pruebas para reglas YARA. Midió un 12,18 % de falsos positivos sobre software legítimo y guió el rediseño hasta el 0 % sin perder detección.",
    etiquetas: ["Python", "YARA", "detection engineering"],
  },
  {
    repo: "cromatoforo", nombre: "Cromatóforo", color: "#c792ea",
    lema: "Un escritorio de Arch donde todo el color sale del wallpaper. Diecinueve programas repintados en la misma pasada desde un único origen.",
    etiquetas: ["Hyprland", "Lua", "pywal16", "Shell"],
  },
  {
    repo: "cibo", nombre: "CIBO", color: "#3ddc97",
    lema: "Asistente de IA que corre entero en local sobre Ollama. Sabe cuándo usar una herramienta real en vez de inventarse la respuesta.",
    etiquetas: ["Python", "Ollama", "ChromaDB"],
  },
  {
    repo: "pinchadiscos", nombre: "Pinchadiscos", color: "#ff4fa3",
    lema: "Playlists de Spotify a medida por artista, género, década y popularidad. OAuth 2.0 con el secreto siempre en el servidor.",
    etiquetas: ["Next.js", "React", "OAuth 2.0", "Tailwind"],
  },
  {
    repo: "garabato", nombre: "Garabato", color: "#ffd23f",
    lema: "Escribes el guion y sale el vídeo montado: voz, imágenes, subtítulos y ensamblado. Cada paso es idempotente.",
    etiquetas: ["Python", "ffmpeg", "TTS", "Pillow"],
  },
  {
    repo: "vitrina", nombre: "Vitrina", color: "#8b7bff",
    lema: "Mi colección de juegos, películas, libros y discos. Se escribe en Obsidian y se publica como web estática.",
    etiquetas: ["Obsidian", "TypeScript", "web estática"],
    web: "https://jorgeress.github.io/vitrina/",
  },
];

window.OTROS = [
  { repo: "pokegan", nombre: "PokeGAN", lema: "una DCGAN entrenada 10.000 épocas para generar Pokémon que no existen" },
];

const reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;

// --- paletas: el boton hace lo mismo que cambiar de wallpaper en Cromatoforo ---
const PALETAS = [
  { nombre: "proyectos", colores: ["#ff7a45", "#c792ea", "#3ddc97", "#ff4fa3"] },
  { nombre: "akira", colores: ["#db2228", "#c45046", "#a17265", "#63161a"] },
  { nombre: "kyogre", colores: ["#1eb5ee", "#52c3e4", "#449da1", "#075d56"] },
  { nombre: "vitrina", colores: ["#8b7bff", "#ffd23f", "#ff5a5f", "#2ec4d6"] },
];
let paletaActual = 0;

function aplicaPaleta(i) {
  paletaActual = (i + PALETAS.length) % PALETAS.length;
  const p = PALETAS[paletaActual];
  p.colores.forEach((c, n) => document.documentElement.style.setProperty(`--c${n + 1}`, c));
  fondo.objetivo(p.colores);
  return p.nombre;
}
window.aplicaPaleta = aplicaPaleta;
window.siguientePaleta = () => aplicaPaleta(paletaActual + 1);

// --- fondo: manchas de color que derivan y se apartan del raton ---
const fondo = (() => {
  const lienzo = document.getElementById("fondo");
  const ctx = lienzo.getContext("2d");
  const raton = { x: -9999, y: -9999 };
  let w, h, dpr;
  const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const manchas = PALETAS[0].colores.map((c, i) => ({
    col: hex(c), dest: hex(c),
    fx: 0.55 + 0.4 * Math.cos(i * 1.7), fy: 0.2 + 0.5 * Math.sin(i * 2.3) ** 2,
    r: 0.28 + 0.06 * i, fase: i * 1.9, vel: 0.00011 + i * 0.00003,
    ox: 0, oy: 0,
  }));

  function tam() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    // se pinta a media resolucion: las manchas son difusas y asi cuesta poco
    lienzo.width = Math.round(w * dpr * 0.5);
    lienzo.height = Math.round(h * dpr * 0.5);
    ctx.setTransform(dpr * 0.5, 0, 0, dpr * 0.5, 0, 0);
  }

  function pinta(t) {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    const base = Math.max(w, h);
    for (const m of manchas) {
      for (let k = 0; k < 3; k++) m.col[k] += (m.dest[k] - m.col[k]) * 0.03;
      let x = (m.fx + 0.08 * Math.sin(t * m.vel + m.fase)) * w;
      let y = (m.fy + 0.08 * Math.cos(t * m.vel * 1.3 + m.fase)) * h;
      // se apartan un poco del puntero
      const dx = x - raton.x, dy = y - raton.y, d = Math.hypot(dx, dy) || 1;
      const empuje = Math.max(0, 1 - d / (base * 0.35)) * 90;
      m.ox += ((dx / d) * empuje - m.ox) * 0.05;
      m.oy += ((dy / d) * empuje - m.oy) * 0.05;
      x += m.ox; y += m.oy;
      const r = m.r * base;
      const [cr, cg, cb] = m.col.map(Math.round);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${cr},${cg},${cb},.22)`);
      g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.globalCompositeOperation = "source-over";
    if (!reducido) requestAnimationFrame(pinta);
  }

  addEventListener("resize", () => { tam(); if (reducido) pinta(0); });
  addEventListener("pointermove", (e) => { raton.x = e.clientX; raton.y = e.clientY; }, { passive: true });
  tam();
  requestAnimationFrame(pinta);

  return {
    objetivo(colores) {
      manchas.forEach((m, i) => { m.dest = hex(colores[i % colores.length]); });
      if (reducido) { manchas.forEach((m) => { m.col = [...m.dest]; }); pinta(0); }
    },
  };
})();

document.getElementById("cambia-paleta").addEventListener("click", () => window.siguientePaleta());

// --- linea que se escribe sola ---
(() => {
  const el = document.getElementById("tipo");
  const frases = [
    "Ingeniería de Software + Ciberseguridad",
    "reglas YARA medidas, no intuidas",
    "un escritorio que toma el color del wallpaper",
    "IA en local, sin mandar nada a la nube",
    "a veces se me ocurren cosas",
  ];
  if (reducido) { el.textContent = frases[0]; return; }
  let f = 0, n = 0, borrando = false;
  (function paso() {
    const texto = frases[f];
    n += borrando ? -1 : 1;
    el.textContent = texto.slice(0, n);
    let espera = borrando ? 28 : 55 + Math.random() * 50;
    if (!borrando && n === texto.length) { borrando = true; espera = 1800; }
    else if (borrando && n === 0) { borrando = false; f = (f + 1) % frases.length; espera = 350; }
    setTimeout(paso, espera);
  })();
})();

// --- tarjetas de proyecto ---
(() => {
  const rejilla = document.getElementById("rejilla");
  for (const p of window.PROYECTOS) {
    const a = document.createElement("a");
    a.className = "tarjeta aparece";
    a.href = `https://github.com/jorgeress/${p.repo}`;
    a.style.setProperty("--acento", p.color);
    a.innerHTML = `
      <img src="img/proyectos/${p.repo}.webp" alt="" width="1280" height="640" loading="lazy">
      <div class="cuerpo">
        <h3>${p.nombre}</h3>
        <p>${p.lema}</p>
        <div class="meta" data-meta="${p.repo}"></div>
        <div class="etiquetas">${p.etiquetas.map((e) => `<span>${e}</span>`).join("")}</div>
      </div>`;
    rejilla.append(a);

    if (!reducido && matchMedia("(hover: hover)").matches) {
      a.addEventListener("pointermove", (e) => {
        const r = a.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        a.style.setProperty("--mx", `${px * 100}%`);
        a.style.setProperty("--my", `${py * 100}%`);
        a.style.setProperty("--ry", `${(px - 0.5) * 6}deg`);
        a.style.setProperty("--rx", `${(0.5 - py) * 6}deg`);
      });
      a.addEventListener("pointerleave", () => {
        a.style.setProperty("--rx", "0deg");
        a.style.setProperty("--ry", "0deg");
      });
    }
  }

  document.getElementById("tambien").innerHTML = "También " + window.OTROS
    .map((o) => `<a href="https://github.com/jorgeress/${o.repo}">${o.nombre}</a>, ${o.lema}`)
    .join("; y ") + ".";

  // estrellas y ultima actualizacion, en vivo; si la API falla, la tarjeta se queda sin ellas
  const hace = (fecha) => {
    const dias = Math.round((Date.now() - new Date(fecha)) / 864e5);
    if (dias < 1) return "hoy";
    if (dias < 30) return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
    const meses = Math.round(dias / 30);
    return `hace ${meses} ${meses === 1 ? "mes" : "meses"}`;
  };
  fetch("https://api.github.com/users/jorgeress/repos?per_page=100")
    .then((r) => (r.ok ? r.json() : []))
    .then((repos) => {
      for (const r of repos) {
        const el = document.querySelector(`[data-meta="${r.name}"]`);
        if (!el) continue;
        el.innerHTML = (r.stargazers_count ? `<span>★ ${r.stargazers_count}</span>` : "")
          + `<span>actualizado ${hace(r.pushed_at)}</span>`
          + (r.language ? `<span>${r.language}</span>` : "");
      }
    })
    .catch(() => {});
})();

// --- aparicion al hacer scroll y contadores ---
(() => {
  const cuenta = (el) => {
    const fin = parseFloat(el.dataset.cuenta);
    const dec = parseInt(el.dataset.decimales || "0", 10);
    const fmt = (v) => v.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (reducido) { el.textContent = fmt(fin); return; }
    const t0 = performance.now(), dur = 1400;
    (function paso(t) {
      const k = Math.min(1, (t - t0) / dur);
      el.textContent = fmt(fin * (1 - (1 - k) ** 3));
      if (k < 1) requestAnimationFrame(paso);
    })(t0);
  };

  document.querySelectorAll("section h2, .cifra, .grupos > div").forEach((el) => el.classList.add("aparece"));
  const obs = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("visible");
      e.target.querySelectorAll("[data-cuenta]").forEach(cuenta);
      obs.unobserve(e.target);
    }
  }, { threshold: 0.15 });
  document.querySelectorAll(".aparece").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 3) * 80}ms`;
    obs.observe(el);
  });
})();
