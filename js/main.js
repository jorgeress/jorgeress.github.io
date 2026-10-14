// Datos de los proyectos: los usan las tarjetas y la terminal.
// Los tres primeros tienen demo propia en la pagina; el resto va en tarjetas.
window.PROYECTOS = [
  {
    repo: "crisol", nombre: "Crisol", color: "#ff7a45", demo: true,
    lema: "Motor de triaje estático de malware y banco de pruebas para reglas YARA. Midió un 12,18 % de falsos positivos sobre software legítimo y guió el rediseño hasta el 0 % sin perder detección.",
    etiquetas: ["Python", "YARA", "pefile", "capstone"],
  },
  {
    repo: "cibo", nombre: "CIBO", color: "#3ddc97", demo: true,
    lema: "Asistente de IA que corre entero en local sobre Ollama. Sabe cuándo usar una herramienta real en vez de inventarse la respuesta, y no deja salir datos sensibles a la nube.",
    etiquetas: ["Python", "Ollama", "LangChain", "ChromaDB"],
  },
  {
    repo: "garabato", nombre: "Garabato", color: "#ffd23f", demo: true,
    lema: "Escribes el guion y sale el vídeo montado: voz, imágenes, subtítulos y ensamblado. Cada paso es idempotente.",
    etiquetas: ["Python", "PyTorch", "ffmpeg", "TTS"],
  },
  {
    repo: "cromatoforo", nombre: "Cromatóforo", color: "#c792ea",
    lema: "Un escritorio de Arch donde todo el color sale del wallpaper. Diecinueve programas repintados en la misma pasada desde un único origen.",
    nota: "esta web es el consumidor número veinte: pruébalo con el botón de abajo a la derecha",
    etiquetas: ["Hyprland", "Lua", "pywal16", "Shell"],
  },
  {
    repo: "pinchadiscos", nombre: "Pinchadiscos", color: "#ff4fa3",
    lema: "Playlists de Spotify a medida por artista, género, década y popularidad. OAuth 2.0 con el secreto siempre en el servidor.",
    etiquetas: ["Next.js", "React", "OAuth 2.0", "Tailwind"],
  },
  {
    repo: "vitrina", nombre: "Vitrina", color: "#8b7bff",
    lema: "Mi colección de juegos, películas, series, libros y discos, con lo que pienso de cada uno. Se escribe en Obsidian y se publica como web.",
    etiquetas: ["Obsidian", "TypeScript", "web estática"],
    web: "https://jorgeress.github.io/vitrina/",
  },
  {
    repo: "pokegan", nombre: "PokeGAN", color: "#ff5a5f",
    lema: "Una DCGAN entrenada desde cero durante 10.000 épocas para generar sprites de Pokémon que no existen.",
    etiquetas: ["TensorFlow", "Keras", "DCGAN"],
  },
];

window.INTERESES = [
  "malware", "ciberseguridad", "Linux", "privacidad", "open source",
  "IA en local", "machine learning", "automatización", "optimización",
];

window.STACK = [
  { grupo: "Seguridad", items: ["YARA", "pefile", "capstone", "Wireshark", "Burp Suite", "nmap", "Metasploit"] },
  { grupo: "Sistemas", items: ["Linux", "Arch", "Bash", "C", "C++", "Docker"] },
  { grupo: "Backend", items: ["Python", "Node.js", "Express", "JWT", "Java"] },
  { grupo: "Datos", items: ["PostgreSQL", "SQL", "MongoDB", "Prisma", "Supabase"] },
  { grupo: "Frontend", items: ["JavaScript", "TypeScript", "React", "Next.js"] },
  { grupo: "IA y ML", items: ["PyTorch", "LangChain", "Ollama", "ChromaDB"] },
  { grupo: "Cloud", items: ["AWS", "Vercel"] },
];

window.reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;
const reducido = window.reducido;

// --- fondo: manchas difusas con los colores de la paleta actual ---
// Lee --c1..--c4 en cada fotograma, asi que sigue solo la transicion de color.
(() => {
  const lienzo = document.getElementById("fondo");
  const ctx = lienzo.getContext("2d");
  const raiz = document.documentElement;
  const raton = { x: -9999, y: -9999 };
  let w, h, dpr;
  const manchas = [0, 1, 2, 3].map((i) => ({
    fx: 0.55 + 0.4 * Math.cos(i * 1.7), fy: 0.2 + 0.5 * Math.sin(i * 2.3) ** 2,
    r: 0.28 + 0.06 * i, fase: i * 1.9, vel: 0.00011 + i * 0.00003, ox: 0, oy: 0,
  }));
  const rgb = (txt) => {
    txt = txt.trim();
    if (txt.startsWith("#")) return [1, 3, 5].map((k) => parseInt(txt.slice(k, k + 2), 16));
    return (txt.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
  };

  function tam() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    lienzo.width = Math.round(w * dpr * 0.5);
    lienzo.height = Math.round(h * dpr * 0.5);
    ctx.setTransform(dpr * 0.5, 0, 0, dpr * 0.5, 0, 0);
  }

  function pinta(t) {
    const cs = getComputedStyle(raiz);
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    const base = Math.max(w, h);
    manchas.forEach((m, i) => {
      const [cr, cg, cb] = rgb(cs.getPropertyValue(`--c${i + 1}`));
      let x = (m.fx + 0.08 * Math.sin(t * m.vel + m.fase)) * w;
      let y = (m.fy + 0.08 * Math.cos(t * m.vel * 1.3 + m.fase)) * h;
      const dx = x - raton.x, dy = y - raton.y, d = Math.hypot(dx, dy) || 1;
      const empuje = Math.max(0, 1 - d / (base * 0.35)) * 90;
      m.ox += ((dx / d) * empuje - m.ox) * 0.05;
      m.oy += ((dy / d) * empuje - m.oy) * 0.05;
      x += m.ox; y += m.oy;
      const r = m.r * base;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${cr},${cg},${cb},.2)`);
      g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    });
    ctx.globalCompositeOperation = "source-over";
    if (!reducido) requestAnimationFrame(pinta);
  }

  addEventListener("resize", () => { tam(); if (reducido) pinta(0); });
  addEventListener("pointermove", (e) => { raton.x = e.clientX; raton.y = e.clientY; }, { passive: true });
  tam();
  requestAnimationFrame(pinta);
  // con movimiento reducido no hay bucle: se repinta al cambiar de paleta
  window.repintaFondo = () => { if (reducido) setTimeout(() => pinta(0), 950); };
})();

// --- linea que se escribe sola ---
(() => {
  const el = document.getElementById("tipo");
  const frases = [
    "malware, Linux y ciberseguridad",
    "reglas YARA medidas, no intuidas",
    "IA en local, sin mandar nada a la nube",
    "si se repite, lo automatizo",
    "ahora mismo: hardening, Rust y Go",
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

// --- tarjetas del resto de proyectos ---
(() => {
  const rejilla = document.getElementById("rejilla");
  for (const p of window.PROYECTOS.filter((p) => !p.demo)) {
    const a = document.createElement("a");
    a.className = "tarjeta aparece";
    a.href = `https://github.com/jorgeress/${p.repo}`;
    a.style.setProperty("--acento", p.color);
    a.innerHTML = `
      <img src="img/proyectos/${p.repo}.webp" alt="" width="1280" height="640" loading="lazy">
      <div class="cuerpo">
        <h4>${p.nombre}</h4>
        <p>${p.lema}</p>
        ${p.nota ? `<p class="nota">${p.nota}</p>` : ""}
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

  // ultima actualizacion, en vivo; si la API falla, las tarjetas se quedan sin ella
  const hace = (fecha) => {
    const dias = Math.round((Date.now() - new Date(fecha)) / 864e5);
    if (dias < 1) return "hoy";
    if (dias < 30) return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
    const meses = Math.round(dias / 30);
    return `hace ${meses} ${meses === 1 ? "mes" : "meses"}`;
  };
  window.hace = hace;
  window.REPOS = fetch("https://api.github.com/users/jorgeress/repos?per_page=100")
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => []);
  window.REPOS.then((repos) => {
    for (const r of repos) {
      const el = document.querySelector(`[data-meta="${r.name}"]`);
      if (!el) continue;
      el.innerHTML = (r.stargazers_count ? `<span>★ ${r.stargazers_count}</span>` : "")
        + `<span>actualizado ${hace(r.pushed_at)}</span>`;
    }
  });
})();

// --- sobre mi: intereses y stack ---
(() => {
  const colores = ["--c1", "--c2", "--c3", "--c4"];
  document.getElementById("intereses").innerHTML = window.INTERESES
    .map((t, i) => `<li style="--c:var(${colores[i % 4]})">${t}</li>`).join("");
  document.getElementById("stack").innerHTML = window.STACK
    .map((g, i) => `<div class="grupo" style="--c:var(${colores[i % 4]})"><h4>${g.grupo}</h4>`
      + `<ul>${g.items.map((t) => `<li>${t}</li>`).join("")}</ul></div>`).join("");
})();

// --- aparicion al hacer scroll ---
(() => {
  document.querySelectorAll("section h2, .destacado, .bloque, .grupo").forEach((el) => el.classList.add("aparece"));
  const obs = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("visible");
      obs.unobserve(e.target);
    }
  }, { threshold: 0.12 });
  document.querySelectorAll(".aparece").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 3) * 70}ms`;
    obs.observe(el);
  });
})();
