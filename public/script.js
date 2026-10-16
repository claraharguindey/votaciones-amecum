const state = {
  voters: [],
  alreadyVoted: new Set(),
  selectedVoter: null,
  fechas: new Set(),
};

// --- Password ---
function checkPassword() {
  const val = document.getElementById("password-input").value;
  const err = document.getElementById("password-error");
  if (val === "4MECUM") {
    err.classList.remove("show");
    setPage("page-loading");
    init();
  } else {
    err.classList.add("show");
  }
}

document.addEventListener("keydown", (e) => {
  if (
    e.key === "Enter" &&
    document.getElementById("page-password").classList.contains("active")
  ) {
    checkPassword();
  }
});

// --- Init ---
async function init() {
  try {
    const res = await fetch("/api/voters");
    const data = await res.json();
    state.voters = data.voters;
    state.alreadyVoted = new Set(data.alreadyVoted);
    setPage("page-form");
    setupSearch();
  } catch (e) {
    document.getElementById("page-loading").innerHTML =
      '<p style="text-align:center;padding:3rem 0;color:#c0392b;font-size:14px;">Error al cargar. Recarga la página.</p>';
  }
}

// --- Search ---
function setupSearch() {
  const input = document.getElementById("voter-search");
  const dropdown = document.getElementById("dropdown");

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      dropdown.classList.remove("open");
      return;
    }
    const matches = state.voters.filter((v) => v.toLowerCase().includes(q));
    renderDropdown(matches, dropdown);
  });

  input.addEventListener("focus", () => {
    if (input.value.trim())
      renderDropdown(
        state.voters.filter((v) =>
          v.toLowerCase().includes(input.value.trim().toLowerCase()),
        ),
        dropdown,
      );
  });

  document.addEventListener("click", (e) => {
    if (!document.getElementById("search-wrap").contains(e.target)) {
      dropdown.classList.remove("open");
    }
  });
}

function renderDropdown(matches, dropdown) {
  if (!matches.length) {
    dropdown.innerHTML = '<div class="dropdown-empty">Sin resultados</div>';
  } else {
    dropdown.innerHTML = matches
      .map((v) => {
        const voted = state.alreadyVoted.has(v);
        return `<div class="dropdown-item ${voted ? "voted" : ""}" onclick="${voted ? "" : `selectVoter('${v.replace(/'/g, "\\'")}')`}">${v}</div>`;
      })
      .join("");
  }
  dropdown.classList.add("open");
}

function selectVoter(name) {
  state.selectedVoter = name;
  document.getElementById("voter-search").value = name;
  document.getElementById("dropdown").classList.remove("open");
  const label = document.getElementById("selected-label");
  label.textContent = "✓ " + name;
  label.classList.add("show");
  document.getElementById("form-error").classList.remove("show");
}

// --- Fecha selection ---
function toggleFecha(fecha) {
  if (state.fechas.has(fecha)) {
    state.fechas.delete(fecha);
  } else {
    state.fechas.add(fecha);
  }

  const opts = document.querySelectorAll("#voto-fechas .check-opt");
  const labels = [
    "Martes 3 de noviembre 19:00-20:00",
    "Lunes 16 de noviembre 18:30-19:30",
  ];
  opts.forEach((opt, i) => {
    opt.classList.toggle("selected", state.fechas.has(labels[i]));
  });

  document.getElementById("form-error").classList.remove("show");
}

// --- Navigation ---
function goToConfirm() {
  const err = document.getElementById("form-error");
  if (!state.selectedVoter || state.fechas.size === 0) {
    err.classList.add("show");
    return;
  }

  const fechasList = [...state.fechas]
    .map(
      (f) =>
        `<div class="confirm-row"><span class="confirm-key">${f}</span><span class="confirm-val" style="color:var(--accent-text);">Disponible</span></div>`,
    )
    .join("");

  document.getElementById("confirm-content").innerHTML = `
    <div class="confirm-row"><span class="confirm-key">Nombre</span><span class="confirm-val">${state.selectedVoter}</span></div>
    ${fechasList}
  `;
  setPage("page-confirm");
}

function goBack() {
  setPage("page-form");
}

async function submitVote() {
  const btn = document.getElementById("submit-btn");
  const err = document.getElementById("confirm-error");
  btn.textContent = "Enviando...";
  btn.disabled = true;
  err.classList.remove("show");

  try {
    const res = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: state.selectedVoter,
        fechas: [...state.fechas],
      }),
    });

    if (res.status === 409) {
      err.textContent = "Esta persona ya ha respondido.";
      err.classList.add("show");
      btn.textContent = "Enviar";
      btn.disabled = false;
      return;
    }
    if (!res.ok) throw new Error();

    const updated = await fetch("/api/voters");
    const data = await updated.json();
    const total = data.alreadyVoted.length;

    const resultsRes = await fetch("/api/results");
    const results = await resultsRes.json();

    const maxVotos = Math.max(...results.map((r) => r.votos));
    const ganadoras = results.filter((r) => r.votos === maxVotos);

    const mensajeGanadora =
      maxVotos === 0
        ? ""
        : ganadoras.length === 1
          ? `<div style="margin-top:0.75rem; padding:10px 12px; background:var(--accent-light); border-radius:8px; font-size:13px; color:var(--accent-text);">
        Día más votado: <strong>${ganadoras[0].fecha}</strong> con ${maxVotos} ${maxVotos === 1 ? "voto" : "votos"}
      </div>`
          : `<div style="margin-top:0.75rem; padding:10px 12px; background:var(--accent-light); border-radius:8px; font-size:13px; color:var(--accent-text);">
        Empate entre: <strong>${ganadoras.map((g) => g.fecha).join(", ")}</strong> con ${maxVotos} ${maxVotos === 1 ? "voto" : "votos"}
      </div>`;

    const filas = results
      .map(
        (f) =>
          `<div class="confirm-row">
    <span class="confirm-key">${f.fecha}</span>
    <span class="confirm-val">${f.votos} ${f.votos === 1 ? "persona" : "personas"}</span>
  </div>`,
      )
      .join("");

    document.getElementById("success-name").textContent = state.selectedVoter;
    document.getElementById("results-content").innerHTML = `
  <div class="confirm-row"><span class="confirm-key">Respuestas recibidas</span><span class="confirm-val">${total} de ${state.voters.length}</span></div>
  ${filas}
  ${mensajeGanadora}
`;
    setPage("page-success");
  } catch {
    err.textContent = "Error al enviar. Inténtalo de nuevo.";
    err.classList.add("show");
    btn.textContent = "Enviar";
    btn.disabled = false;
  }
}

function setPage(id) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo(0, 0);
}

setPage("page-password");
setupSearch();
