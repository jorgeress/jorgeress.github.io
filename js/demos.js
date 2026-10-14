// Demos de Crisol, CIBO y Garabato. No ejecutan los proyectos de verdad:
// reproducen lo que hacen con sus datos reales (reglas, cifras, sintaxis).
(() => {
  const reducido = window.reducido;
  const dormir = (ms) => new Promise((ok) => setTimeout(ok, reducido ? 0 : ms));
  const alVer = (el, fn, umbral = 0.4) => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { obs.disconnect(); fn(); } }, { threshold: umbral });
    obs.observe(el);
  };

  // ======================= CRISOL =======================
  (() => {
    const el = document.getElementById("demo-crisol");
    const M = {
      antes: {
        debug: "anti_debug_checks", api: "dynamic_api_resolution_and_alloc",
        legit: [["fp", "MATCH · falso positivo"], ["fp", "MATCH · falso positivo"]],
        mal: [["tp", "MATCH · detectado"], ["tp", "MATCH · detectado"]],
        cond: '<span class="c">// antes: anti_debug_checks</span>\n<span class="c">// bastaba UNA api anti-depuración, aunque fuera</span>\n<span class="c">// ubicua como IsDebuggerPresent, que ya trae</span>\n<span class="c">// el runtime de C (CRT) en software normal.</span>',
      },
      despues: {
        debug: "anti_debug_stacked", api: "dynamic_api_resolution_small_iat",
        legit: [["limpio", "limpio · 0 fuertes"], ["limpio", "limpio · 214 ≥ 30"]],
        mal: [["tp", "MATCH · 2 fuertes"], ["tp", "MATCH · 12 < 30"]],
        cond: '<span class="k">rule</span> anti_debug_stacked {\n  <span class="k">condition:</span>\n    uint16(0) == 0x5A4D <span class="k">and</span>\n    (2 of ($s*) <span class="k">or</span> (1 of ($s*) <span class="k">and</span> 2 of ($w*)))\n}',
      },
    };
    const BARRAS = [
      ["anti_debug_*", 12.2], ["dynamic_api_resolution_*", 4.5], ["vba_powershell_invocation", 0.6], ["global", 12.18],
    ];
    const bin = (nombre, tipo, imports, n, clave) => `
      <div class="bin" data-bin="${clave}">
        <h4>${nombre}</h4><p class="tipo-bin">${tipo}</p>
        <div class="imports">${imports.map(([t, c]) => `<span data-c="${c || ""}">${t}</span>`).join("")}</div>
        <p class="n-imports">${n} funciones importadas</p>
        <div class="veredicto"><span class="regla-n" data-r="debug"></span><span class="res"></span></div>
        <div class="veredicto"><span class="regla-n" data-r="api"></span><span class="res"></span></div>
      </div>`;

    el.innerHTML = `
      <div class="cabeza-demo">
        <div class="conmutador" role="group" aria-label="Versión de las reglas">
          <button type="button" data-m="antes">antes</button>
          <button type="button" data-m="despues">después</button>
        </div>
        <span>reglas y cifras reales · binarios de ejemplo</span>
      </div>
      <div class="muestras-bin">
        ${bin("instalador.exe", "legítimo, firmado", [["IsDebuggerPresent", "w"], ["OutputDebugString", "w"], ["GetProcAddress"], ["LoadLibraryW"], ["VirtualAlloc"]], 214, "legit")}
        ${bin("loader.exe", "malware", [["NtQueryInformationProcess", "s"], ["CheckRemoteDebuggerPresent", "s"], ["IsDebuggerPresent", "w"], ["GetProcAddress"], ["LoadLibraryA"], ["VirtualAlloc"]], 12, "mal")}
      </div>
      <pre class="condicion" aria-live="polite"></pre>
      <div class="barras">
        <p class="leyenda">falsos positivos sobre 52 binarios legítimos</p>
        ${BARRAS.map(([n, v]) => `<div class="barra-fila${n === "global" ? " global" : ""}"><span class="n">${n}</span><span class="pista-b"><span class="relleno" style="width:0"></span></span><span class="v">0 %</span></div>`).join("")}
      </div>`;

    const fmt = (v) => v.toLocaleString("es-ES", { minimumFractionDigits: v % 1 ? (String(v).split(".")[1].length) : 1 }) + " %";
    let modo = null, tocado = false;
    function pon(m) {
      if (m === modo) return;
      modo = m;
      const d = M[m];
      el.querySelectorAll(".conmutador button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.m === m)));
      el.querySelectorAll("[data-r]").forEach((s) => { s.textContent = d[s.dataset.r]; });
      for (const clave of ["legit", "mal"]) {
        el.querySelectorAll(`[data-bin="${clave}"] .res`).forEach((r, i) => {
          r.className = `res ${d[clave][i][0]}`;
          r.textContent = d[clave][i][1];
        });
      }
      el.querySelectorAll(".imports span").forEach((s) => {
        s.className = m === "despues" && s.dataset.c ? (s.dataset.c === "s" ? "fuerte" : "ubicua") : "";
        s.title = m === "despues" && s.dataset.c ? (s.dataset.c === "s" ? "$s: fuerte, rara en software legítimo" : "$w: ubicua, aparece también en goodware") : "";
      });
      el.querySelector(".condicion").innerHTML = d.cond;
      el.querySelectorAll(".barra-fila").forEach((f, i) => {
        const v = m === "antes" ? BARRAS[i][1] : 0;
        f.querySelector(".relleno").style.width = `${(v / 12.5) * 100}%`;
        const t = f.querySelector(".v");
        t.textContent = m === "antes" ? fmt(v) : (BARRAS[i][0] === "global" ? "0,0 %" : "0 %");
        t.style.color = m === "antes" ? "var(--mal)" : "var(--bien)";
      });
    }
    el.querySelector(".conmutador").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b) { tocado = true; pon(b.dataset.m); }
    });
    pon("antes");
    // al verla por primera vez, se afina sola
    alVer(el, async () => { await dormir(1800); if (!tocado) pon("despues"); });
  })();

  // ======================= CIBO =======================
  (() => {
    const el = document.getElementById("demo-cibo");
    const ESCENAS = [
      {
        boton: "¿cuánto es 4817 × 2963?",
        pasos: [
          ["yo", "¿Cuánto es 4817 × 2963?"],
          ["paso", "router › intención: <b>cálculo</b> → herramienta"],
          ["paso ok", "Calculator(<code>4817 * 2963</code>) = <b>14272771</b>"],
          ["cibo", "4817 × 2963 = 14.272.771. Lo ha hecho la calculadora: un modelo de 8B se lo habría inventado."],
        ],
      },
      {
        boton: "suma del 1 al 100 en Python",
        pasos: [
          ["yo", "Ejecuta en Python la suma de los números del 1 al 100"],
          ["paso", "router › intención: <b>ejecutar código</b>"],
          ["paso", "CodeExecutor › <code>print(sum(range(1, 101)))</code>"],
          ["paso ok", "subproceso aislado con timeout › stdout: <b>5050</b>"],
          ["cibo", "Da 5050. Lo he ejecutado en un subproceso aparte, no lo he calculado de cabeza."],
        ],
      },
      {
        boton: "mándale mi tarjeta a la nube",
        pasos: [
          ["yo", "Pregúntale a Claude si mi tarjeta 4111 1111 1111 1111 sigue activa"],
          ["paso alerta", "sanitizer › dato sensible: <span class=\"tachado\">tarjeta 4111 •••• •••• 1111</span>"],
          ["paso alerta", "router › datos sensibles → <b>no sale a la nube</b>"],
          ["paso ok", "agente › <b>Ollama, en local</b> (en vez de Claude)"],
          ["cibo", "Eso lleva un número de tarjeta, así que no lo mando fuera del equipo. Te contesto yo desde aquí."],
        ],
      },
    ];
    el.innerHTML = `
      <div class="cabeza-demo"><span><span class="led"></span>ollama · llama3.1:8b</span><span>demo guionizada</span></div>
      <div class="chat" aria-live="polite"></div>
      <div class="sugerencias">${ESCENAS.map((s, i) => `<button type="button" data-i="${i}">${s.boton}</button>`).join("")}</div>`;
    const chat = el.querySelector(".chat");
    const botones = el.querySelectorAll(".sugerencias button");
    const baja = () => { chat.scrollTop = chat.scrollHeight; };
    let ocupado = false;

    async function escribe(nodo, texto) {
      const palabras = texto.split(" ");
      for (let i = 0; i < palabras.length; i++) {
        nodo.lastChild.textContent = palabras.slice(0, i + 1).join(" ");
        baja();
        await dormir(45 + Math.random() * 40);
      }
    }

    async function corre(i) {
      if (ocupado) return;
      ocupado = true;
      botones.forEach((b) => { b.disabled = true; });
      for (const [tipo, html] of ESCENAS[i].pasos) {
        const n = document.createElement("div");
        if (tipo === "yo" || tipo === "cibo") {
          n.className = `msg ${tipo}`;
          n.append(document.createTextNode(""));
          chat.append(n);
          if (tipo === "cibo") { await dormir(300); await escribe(n, html); }
          else { n.lastChild.textContent = html; baja(); await dormir(600); }
        } else {
          n.className = tipo;
          n.innerHTML = html;
          chat.append(n);
          baja();
          await dormir(700);
        }
      }
      ocupado = false;
      botones.forEach((b) => { b.disabled = false; });
    }
    el.querySelector(".sugerencias").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b) corre(+b.dataset.i);
    });
    alVer(el, () => corre(0));
  })();

  // ======================= GARABATO =======================
  (() => {
    const el = document.getElementById("demo-garabato");
    const LINEAS = [
      {
        campos: "(shot: text-frame | text: 'STATUS QUO BIAS')",
        voz: "A esto se le llama sesgo del statu quo.",
        svg: () => `<text x="160" y="100" text-anchor="middle" class="aparece-svg" style="font:800 27px Inter,system-ui,sans-serif;fill:#111;--retraso:.1s">STATUS QUO BIAS</text>`,
      },
      {
        campos: "(shot: diagram | left: question-mark | right: lightbulb | arrow: right yellow)",
        voz: "Y todo empieza con una pregunta.",
        svg: () => `
          <path class="trazo" style="--l:150" d="M76 66 q0 -22 22 -22 q22 0 22 20 q0 14 -16 20 q-6 3 -6 15" fill="none" stroke="#1b1b1b" stroke-width="5" stroke-linecap="round"/>
          <circle class="aparece-svg" style="--retraso:.7s" cx="98" cy="114" r="4" fill="#1b1b1b"/>
          <path class="trazo" style="--l:90;--retraso:.6s" d="M134 86 H214" stroke="#e8b400" stroke-width="5" stroke-linecap="round"/>
          <path class="trazo" style="--l:40;--retraso:1.1s;--d:.3s" d="M204 76 l12 10 l-12 10" fill="none" stroke="#e8b400" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle class="aparece-svg" style="--retraso:1.4s" cx="252" cy="80" r="34" fill="#ffe066" opacity=".35"/>
          <circle class="aparece-svg" style="--retraso:1.2s" cx="252" cy="80" r="18" fill="#ffe066" stroke="#1b1b1b" stroke-width="3"/>
          <rect class="aparece-svg" style="--retraso:1.2s" x="244" y="98" width="16" height="10" rx="2" fill="#777"/>
          <text x="98" y="148" text-anchor="middle" class="aparece-svg" style="font:700 11px Inter,sans-serif;fill:#111;--retraso:.4s">QUESTION</text>
          <text x="252" y="148" text-anchor="middle" class="aparece-svg" style="font:700 11px Inter,sans-serif;fill:#111;--retraso:1.4s">DISCOVERY</text>`,
      },
      {
        campos: "(shot: medium | char: 1, curious | pose: thinking | bg: plain-white)",
        voz: "¿Y si lo de siempre no es lo mejor?",
        svg: () => `
          <path class="trazo" style="--l:200;--d:.6s" d="M40 160 H280" stroke="#8a6a4a" stroke-width="2" stroke-linecap="round"/>
          <circle class="trazo" style="--l:120" cx="160" cy="50" r="19" fill="none" stroke="#1b1b1b" stroke-width="4"/>
          <path class="trazo" style="--l:14;--retraso:.4s;--d:.25s" d="M150 42 l6 -2" stroke="#1b1b1b" stroke-width="3" stroke-linecap="round"/>
          <path class="trazo" style="--l:14;--retraso:.45s;--d:.25s" d="M164 44 l6 0" stroke="#1b1b1b" stroke-width="3" stroke-linecap="round"/>
          <circle class="aparece-svg" style="--retraso:.5s" cx="153" cy="50" r="2.4" fill="#1b1b1b"/>
          <circle class="aparece-svg" style="--retraso:.5s" cx="167" cy="50" r="2.4" fill="#1b1b1b"/>
          <path class="trazo" style="--l:14;--retraso:.55s;--d:.25s" d="M155 60 h9" stroke="#1b1b1b" stroke-width="3" stroke-linecap="round"/>
          <path class="trazo" style="--l:60;--retraso:.5s" d="M160 69 V118" stroke="#1b1b1b" stroke-width="4" stroke-linecap="round"/>
          <path class="trazo" style="--l:70;--retraso:.8s" d="M160 84 L182 100 L168 66" fill="none" stroke="#1b1b1b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          <path class="trazo" style="--l:50;--retraso:.9s" d="M160 84 L140 112" stroke="#1b1b1b" stroke-width="4" stroke-linecap="round"/>
          <path class="trazo" style="--l:90;--retraso:1s" d="M160 118 l-15 40 M160 118 l15 40" fill="none" stroke="#1b1b1b" stroke-width="4" stroke-linecap="round"/>
          <text x="196" y="40" class="aparece-svg" style="font:700 26px Inter,sans-serif;fill:#1b1b1b;--retraso:1.3s">?</text>`,
      },
    ];
    const ETAPAS = ["voz", "imagen", "subtítulos", "montaje"];
    const pintaCampos = (t) => t.replace(/(\w[\w-]*):/g, '<span class="campo">$1:</span>');

    el.innerHTML = `
      <div class="guion">${LINEAS.map((l, i) => `<button type="button" data-i="${i}">${pintaCampos(l.campos)}</button>`).join("")}</div>
      <div class="cabeza-demo"><div class="pipeline">${ETAPAS.map((e) => `<span>${e}</span>`).join("")}</div><span>sintaxis real del guion</span></div>
      <div class="lienzo"><svg viewBox="0 0 320 180" role="img" aria-label="Fotograma generado"></svg><div class="subtitulo-video"></div></div>
      <div class="onda">${"<i></i>".repeat(48)}</div>
      <div class="linea-tiempo"><span class="tiempo">00:00</span><span class="progreso"><i></i></span><span class="salida-v">final_video.mp4</span></div>`;

    const svg = el.querySelector("svg");
    const sub = el.querySelector(".subtitulo-video");
    const etapas = el.querySelectorAll(".pipeline span");
    const barras = el.querySelectorAll(".onda i");
    const prog = el.querySelector(".progreso i");
    const tiempo = el.querySelector(".tiempo");
    const salida = el.querySelector(".salida-v");
    const botones = el.querySelectorAll(".guion button");
    let turno = 0, auto = true;

    const marca = (i) => etapas.forEach((e, k) => { e.className = k < i ? "hecho" : k === i ? "activo" : ""; });

    async function corre(i) {
      const mio = ++turno;
      const l = LINEAS[i];
      const sigue = () => mio === turno;
      botones.forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
      svg.innerHTML = ""; sub.classList.remove("visible"); sub.textContent = "";
      prog.style.transition = "none"; prog.style.width = "0"; salida.textContent = "final_video.mp4";
      tiempo.textContent = "00:00";
      barras.forEach((b) => { b.style.height = "2px"; b.style.opacity = ".5"; });

      marca(0);
      for (let t = 0; t < 14 && sigue(); t++) {
        barras.forEach((b, k) => {
          const on = k <= (t + 1) * 3.5;
          b.style.height = on ? `${5 + Math.abs(Math.sin(k * 0.7 + t)) * 22 * (0.4 + Math.random() * 0.6)}px` : "2px";
          b.style.opacity = on ? "1" : ".5";
        });
        await dormir(90);
      }
      if (!sigue()) return;
      marca(1);
      svg.innerHTML = l.svg();
      await dormir(1700);
      if (!sigue()) return;
      marca(2);
      sub.textContent = l.voz;
      sub.classList.add("visible");
      await dormir(900);
      if (!sigue()) return;
      marca(3);
      prog.style.transition = reducido ? "none" : "width 1.1s linear";
      prog.style.width = "100%";
      const dur = 2 + l.voz.split(" ").length * 0.4;
      tiempo.textContent = `00:${String(Math.round(dur)).padStart(2, "0")}`;
      await dormir(1150);
      if (!sigue()) return;
      marca(4);
      salida.textContent = "final_video.mp4 ✓";
      if (auto) { await dormir(2600); if (sigue() && auto) corre((i + 1) % LINEAS.length); }
    }

    el.querySelector(".guion").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b) { auto = false; corre(+b.dataset.i); }
    });
    alVer(el, () => { if (turno === 0) corre(0); });
  })();
})();
