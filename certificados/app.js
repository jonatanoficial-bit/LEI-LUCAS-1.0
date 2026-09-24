(() => {
  const state = { data: null, search: "", course: "", year: "" };
  const $ = (id) => document.getElementById(id);

  if (window.IMV_LOGO) {
    $("brandLogo").src = window.IMV_LOGO;
    $("footerLogo").src = window.IMV_LOGO;
  }

  const normalize = (v="") => v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const formatDate = (iso) => {
    if (!iso) return "—";
    const parts = iso.split("-");
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  };

  function courseById(id){ return state.data.courses.find((c) => c.id === id); }

  function buildFilters(){
    const courseSelect = $("courseFilter");
    state.data.courses.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.shortName || c.name;
      courseSelect.appendChild(opt);
    });

    Array.from(new Set(state.data.students.map((s) => s.date.slice(0,4))))
      .sort().reverse().forEach((y) => {
        const opt = document.createElement("option");
        opt.value = y;
        opt.textContent = y;
        $("yearFilter").appendChild(opt);
      });
  }

  function renderStats(){
    $("stats").innerHTML =
      '<div class="stat"><strong>' + state.data.students.length + '</strong><span>alunos</span></div>' +
      '<div class="stat"><strong>' + state.data.courses.length + '</strong><span>curso(s)</span></div>';
  }

  function filteredStudents(){
    return state.data.students.filter((s) => {
      const c = courseById(s.courseId);
      const bag = normalize([s.name,s.certificateCode,c?.name,c?.shortName].join(" "));
      return (!state.search || bag.includes(normalize(state.search)))
        && (!state.course || s.courseId === state.course)
        && (!state.year || s.date.startsWith(state.year));
    });
  }

  function renderStudents(){
    const rows = filteredStudents();
    $("resultSummary").textContent = rows.length + " registro(s) encontrado(s)";
    $("emptyState").hidden = rows.length !== 0;

    $("studentGrid").innerHTML = rows.map((s) => {
      const c = courseById(s.courseId);
      return '<article class="student-card">' +
        '<span class="status">● ' + s.status + '</span>' +
        '<h3>' + s.name + '</h3>' +
        '<div class="course-name">' + (c?.shortName || c?.name || "Curso") + '</div>' +
        '<div class="card-meta">' +
          '<div><span>Data</span><strong>' + formatDate(s.date) + '</strong></div>' +
          '<div><span>Carga horária</span><strong>' + s.hours + '</strong></div>' +
        '</div>' +
        '<div class="card-actions">' +
          '<span class="certificate-code">' + s.certificateCode + '</span>' +
          '<button class="details-btn" data-id="' + s.id + '">Ver detalhes →</button>' +
        '</div>' +
      '</article>';
    }).join("");

    document.querySelectorAll(".details-btn").forEach((btn) => {
      btn.addEventListener("click", () => openRecord(btn.dataset.id));
    });
  }

  function renderCourses(){
    $("courseGrid").innerHTML = state.data.courses.map((c) => {
      const count = state.data.students.filter((s) => s.courseId === c.id).length;
      return '<article class="course-card">' +
        '<div class="course-icon">' + (c.icon || "✓") + '</div>' +
        '<div>' +
          '<h3>' + c.name + '</h3>' +
          '<p>' + (c.description || "") + '</p>' +
          '<div class="course-foot">' +
            '<span>📅 ' + formatDate(c.date) + '</span>' +
            '<span>🕑 ' + c.time + '</span>' +
            '<span>⏱ ' + c.hours + '</span>' +
            '<span>👥 ' + count + ' aluno(s)</span>' +
          '</div>' +
        '</div>' +
      '</article>';
    }).join("");
  }

  function openRecord(id){
    const s = state.data.students.find((x) => x.id === id);
    const c = courseById(s.courseId);
    $("dialogContent").innerHTML =
      '<div class="dialog-card">' +
        '<span class="badge">REGISTRO CONFIRMADO</span>' +
        '<h3>' + s.name + '</h3>' +
        '<p>' + c.name + '</p>' +
        '<div class="dialog-list">' +
          '<div><span>Código</span><strong>' + s.certificateCode + '</strong></div>' +
          '<div><span>Status</span><strong>' + s.status + '</strong></div>' +
          '<div><span>Data</span><strong>' + formatDate(s.date) + ' às ' + s.time + '</strong></div>' +
          '<div><span>Carga horária</span><strong>' + s.hours + '</strong></div>' +
          '<div><span>Local</span><strong>' + s.location + '</strong></div>' +
          '<div><span>Instrutor</span><strong>' + c.instructor + '</strong></div>' +
        '</div>' +
      '</div>';
    $("recordDialog").showModal();
  }

  async function init(){
    try{
      const res = await fetch("./data.json", {cache:"no-store"});
      state.data = await res.json();
      buildFilters();
      renderStats();
      renderCourses();
      renderStudents();
    }catch(err){
      $("studentGrid").innerHTML = '<p>Não foi possível carregar os registros agora.</p>';
    }
  }

  $("searchInput").addEventListener("input", (e) => { state.search=e.target.value; renderStudents(); });
  $("courseFilter").addEventListener("change", (e) => { state.course=e.target.value; renderStudents(); });
  $("yearFilter").addEventListener("change", (e) => { state.year=e.target.value; renderStudents(); });
  $("clearFilters").addEventListener("click", () => {
    state.search = "";
    state.course = "";
    state.year = "";
    $("searchInput").value = "";
    $("courseFilter").value = "";
    $("yearFilter").value = "";
    renderStudents();
  });
  $("dialogClose").addEventListener("click", () => $("recordDialog").close());
  $("recordDialog").addEventListener("click", (e) => { if (e.target === $("recordDialog")) $("recordDialog").close(); });

  init();
})();