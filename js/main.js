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

// --- ciclo del hero: medir > comparar > automatizar > optimizar ---
(() => {
  const ciclo = document.getElementById("ciclo");
  const nodos = ciclo.querySelectorAll(".nodo");
  const arcos = ciclo.querySelectorAll(".arco");
  let i = 0;
  const marca = () => {
    nodos.forEach((n, k) => n.classList.toggle("activo", k === i));
    arcos.forEach((a, k) => a.classList.toggle("activo", k === i));
  };
  marca();
  if (reducido) return;
  setInterval(() => { i = (i + 1) % nodos.length; marca(); }, 1600);
})();

// --- linea que se escribe sola ---
(() => {
  const el = document.getElementById("tipo");
  const frases = [
    "ciberseguridad, Linux y machine learning",
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
    a.href = p.web || `https://github.com/jorgeress/${p.repo}`;
    a.innerHTML = `
      <h4>${p.nombre}<span aria-hidden="true">→</span></h4>
      <p>${p.lema}</p>
      <div class="etiquetas">${p.etiquetas.map((e) => `<span>${e}</span>`).join("")}</div>
      <div class="meta" data-meta="${p.repo}"></div>`;
    rejilla.append(a);
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
      el.textContent = (r.stargazers_count ? `★ ${r.stargazers_count} · ` : "") + `actualizado ${hace(r.pushed_at)}`;
    }
  });
})();

// --- sobre mi: intereses y stack ---
(() => {
  document.getElementById("intereses").innerHTML = window.INTERESES.map((t) => `<li>${t}</li>`).join("");
  document.getElementById("stack").innerHTML = window.STACK
    .map((g) => `<div class="grupo"><h4>${g.grupo}</h4><p>${g.items.join(" · ")}</p></div>`).join("");
})();

// --- aparicion al hacer scroll ---
(() => {
  document.querySelectorAll("section h2, .destacado, .bloque").forEach((el) => el.classList.add("aparece"));
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
