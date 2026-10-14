// Terminal de juguete: se abre con ` o con el boton >_ de arriba.
(() => {
  const caja = document.getElementById("terminal");
  const salida = document.getElementById("salida");
  const form = document.getElementById("linea");
  const input = document.getElementById("orden");
  const historial = [];
  let pos = 0;
  let anterior = null;

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const escribe = (html, clase = "") => {
    const p = document.createElement("div");
    if (clase) p.className = clase;
    p.innerHTML = html;
    salida.append(p);
    salida.scrollTop = salida.scrollHeight;
  };
  const busca = (nombre) => window.PROYECTOS.concat(window.OTROS)
    .find((p) => p.repo === nombre?.toLowerCase() || p.nombre.toLowerCase() === nombre?.toLowerCase());

  const ORDENES = {
    help: () => [
      "órdenes disponibles:",
      "  whoami            quién soy",
      "  ls                lista los proyectos",
      "  cat <proyecto>    de qué va un proyecto",
      "  open <proyecto>   abre el repo en GitHub",
      "  wal               cambia la paleta de la página",
      "  contacto          cómo escribirme",
      "  neofetch          lo de siempre",
      "  clear             limpia la pantalla",
      "  exit              cierra la terminal",
    ].join("\n"),
    whoami: () => "Jorge García. Ingeniería de Software + Ciberseguridad en U-tad.\nA veces se me ocurren cosas.",
    ls: () => window.PROYECTOS.concat(window.OTROS)
      .map((p) => `<span style="color:${p.color || "var(--texto)"}">${p.repo}/</span>`).join("  "),
    cat: (arg) => {
      if (!arg) return { err: "cat: falta el proyecto. Prueba: cat crisol" };
      const p = busca(arg.replace(/\/$/, ""));
      if (!p) return { err: `cat: ${esc(arg)}: no existe ese proyecto` };
      return `<b style="color:${p.color || "var(--texto)"}">${p.nombre}</b>\n${p.lema}`
        + (p.etiquetas ? `\n<span class="orden">${p.etiquetas.join(" · ")}</span>` : "");
    },
    open: (arg) => {
      const p = busca(arg?.replace(/\/$/, ""));
      if (!p) return { err: `open: ${esc(arg || "")}: no existe ese proyecto` };
      const url = `https://github.com/jorgeress/${p.repo}`;
      window.open(url, "_blank", "noopener");
      return `abriendo <a href="${url}" target="_blank" rel="noopener">${url}</a>`;
    },
    wal: () => ({ ok: `paleta: ${window.siguientePaleta()}` }),
    contacto: () => '<a href="mailto:jgarciamartinezdev@proton.me">jgarciamartinezdev@proton.me</a>\n'
      + '<a href="https://www.linkedin.com/in/jorge-garc%C3%ADa-mart%C3%ADnez-1a2574292" target="_blank" rel="noopener">linkedin</a>  '
      + '<a href="https://github.com/jorgeress" target="_blank" rel="noopener">github</a>',
    neofetch: () => {
      const logo = [
        "      /\\      ",
        "     /  \\     ",
        "    /\\   \\    ",
        "   /      \\   ",
        "  /   ,,   \\  ",
        " /   |  |  -\\ ",
        "/_-''    ''-_\\",
      ];
      const datos = [
        '<span class="ok">jorge</span>@<span class="ok">arch</span>',
        "----------",
        "<b>OS</b>: Arch Linux",
        "<b>WM</b>: Hyprland",
        "<b>Shell</b>: zsh",
        "<b>Tema</b>: el del wallpaper",
        "<b>Proyectos</b>: " + (window.PROYECTOS.length + window.OTROS.length),
      ];
      return logo.map((l, i) => `<span style="color:#1793d1">${esc(l)}</span>  ${datos[i] || ""}`).join("\n");
    },
    sudo: () => ({ err: "jorge no está en el fichero sudoers. Este incidente será reportado." }),
    clear: () => { salida.innerHTML = ""; return null; },
    exit: () => { cierra(); return null; },
  };
  ORDENES.ayuda = ORDENES.help;
  ORDENES.dir = ORDENES.ls;

  function ejecuta(linea) {
    escribe(`<span class="verde">jorge@arch</span> ~ $ ${esc(linea)}`, "orden");
    const [orden, ...args] = linea.trim().split(/\s+/);
    if (!orden) return;
    const f = ORDENES[orden.toLowerCase()];
    if (!f) return escribe(`${esc(orden)}: orden no encontrada. Escribe <b>help</b>.`, "err");
    const r = f(args.join(" "));
    if (r == null) return;
    if (typeof r === "string") escribe(r);
    else if (r.err) escribe(r.err, "err");
    else if (r.ok) escribe(r.ok, "ok");
  }

  function abre() {
    if (!caja.hidden) return;
    anterior = document.activeElement;
    caja.hidden = false;
    if (!salida.childElementCount) escribe('Bienvenido. Escribe <b>help</b> para ver qué puedes hacer.', "ok");
    input.focus();
  }
  function cierra() {
    caja.hidden = true;
    anterior?.focus?.();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = input.value;
    if (v.trim()) historial.push(v);
    pos = historial.length;
    input.value = "";
    ejecuta(v);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && pos > 0) { input.value = historial[--pos]; e.preventDefault(); }
    else if (e.key === "ArrowDown") { pos = Math.min(historial.length, pos + 1); input.value = historial[pos] || ""; e.preventDefault(); }
    else if (e.key === "Tab") {
      e.preventDefault();
      const [o, a] = input.value.split(/\s+/);
      if (a !== undefined) {
        const m = window.PROYECTOS.concat(window.OTROS).find((p) => p.repo.startsWith(a.toLowerCase()));
        if (m) input.value = `${o} ${m.repo}`;
      } else {
        const m = Object.keys(ORDENES).find((k) => k.startsWith(o.toLowerCase()));
        if (m) input.value = m + " ";
      }
    } else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); salida.innerHTML = ""; }
  });

  document.addEventListener("keydown", (e) => {
    const escribiendo = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName) && document.activeElement !== input;
    if ((e.key === "`" || e.key === "º") && !escribiendo) {
      e.preventDefault();
      caja.hidden ? abre() : cierra();
    } else if (e.key === "Escape" && !caja.hidden) cierra();
  });
  document.querySelectorAll("[data-abre-terminal]").forEach((b) => b.addEventListener("click", abre));
  document.querySelectorAll("[data-cierra-terminal]").forEach((b) => b.addEventListener("click", cierra));
  caja.addEventListener("click", (e) => { if (e.target === caja) cierra(); });
})();
