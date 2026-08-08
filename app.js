(() => {
  "use strict";

  const data = window.CURRICULUM_DATA;
  const app = document.querySelector("#app");
  const dialog = document.querySelector("#lesson-dialog");
  const dialogContent = document.querySelector("#lesson-dialog-content");

  if (!data || !app) {
    document.body.innerHTML = "<p>No fue posible cargar el currículo.</p>";
    return;
  }

  const state = {
    bimester: Number(localStorage.getItem("st-bimester")) || 1,
    week: Number(localStorage.getItem("st-week")) || 1,
    weekGrade: localStorage.getItem("st-week-grade") || "all",
    gradeBimesters: JSON.parse(localStorage.getItem("st-grade-bimesters") || "{}"),
  };

  const escapeHtml = (value = "") =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const gradeById = (id) => data.grades.find((grade) => grade.id === id);
  const bimesterOf = (grade, number) => grade.bimesters.find((b) => b.number === Number(number));
  const weekOf = (bimester, number) => bimester.weeks.find((w) => w.week === Number(number));
  const stageLabel = (stage) => (stage === "preescolar" ? "Preescolar" : "Primaria");
  const lessonKey = (grade, bimester, week, slot) => `${grade.id}-b${bimester.number}-w${week.week}-${slot}`;
  const isPrepared = (key) => localStorage.getItem(`st-prepared-${key}`) === "true";
  const noteFor = (key) => localStorage.getItem(`st-note-${key}`) || "";
  const normalized = (value = "") =>
    String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const list = (items, className = "compact-list") =>
    `<ul class="${className}">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;

  const stageBadge = (grade) =>
    `<span class="stage-badge ${grade.stage === "preescolar" ? "preschool" : ""}">${stageLabel(grade.stage)}</span>`;

  function setActiveNav(view) {
    document.querySelectorAll("[data-nav]").forEach((link) => {
      const active = link.dataset.nav === view || (view === "grado" && link.dataset.nav === "curriculo");
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function gradeRail(activeId = "", includeAll = false) {
    const allButton = includeAll
      ? `<button class="grade-button ${activeId === "all" ? "active" : ""}" data-action="week-grade" data-grade="all">Todos los grados <span>8</span></button>`
      : "";
    return `
      <aside class="grade-rail" aria-label="Grados">
        <p class="grade-rail-title">Ir a un grado</p>
        ${allButton}
        ${data.grades
          .map(
            (grade) => `
              <button class="grade-button ${grade.stage === "preescolar" ? "preschool" : ""} ${activeId === grade.id ? "active" : ""}"
                data-action="${includeAll ? "week-grade" : "open-grade"}" data-grade="${grade.id}">
                ${escapeHtml(grade.name)} ${grade.short && grade.short !== grade.name ? `<span>${escapeHtml(grade.short)}</span>` : ""}
              </button>`,
          )
          .join("")}
      </aside>`;
  }

  function renderHome() {
    setActiveNav("inicio");
    app.innerHTML = `
      <div class="page">
        <section class="hero">
          <div class="hero-copy">
            <h1 class="hero-school">Colegio San Tarsicio<span>Programa de Música</span></h1>
            <h2 class="hero-curriculum">Un currículo para cantar, crear y crecer.</h2>
            <p>${escapeHtml(data.meta.description)}</p>
            <div class="button-row">
              <a class="button" href="#semana">Ver clases de la semana</a>
              <a class="button secondary" href="#curriculo">Explorar por grado</a>
            </div>
          </div>
          <div class="hero-note">
            <strong>“${escapeHtml(data.meta.philosophy)}”</strong>
            <span>La teoría, la tecnología y los instrumentos aparecen al servicio de la voz, la escucha, la creación y la convivencia.</span>
          </div>
        </section>

        <div class="section-heading">
          <div><span class="eyebrow">Acceso rápido</span><h2>Elige un grado</h2></div>
          <p>Cada grado incluye su ruta anual, cuatro bimestres, clases semanales, repertorio, evaluación y apoyos de preparación.</p>
        </div>
        <section class="grade-grid">
          ${data.grades.map(renderGradeCard).join("")}
        </section>

        <div class="section-heading">
          <div><span class="eyebrow">Núcleo formativo</span><h2>Hacer música también es aprender a convivir</h2></div>
        </div>
        <section class="card-grid formation-grid">
          ${data.meta.formationAreas
            .map((area, index) => `<div class="tool-card panel"><span class="tag">0${index + 1}</span><h3>${escapeHtml(area)}</h3></div>`)
            .join("")}
        </section>
      </div>`;
  }

  function renderGradeCard(grade) {
    return `
      <article class="grade-card ${grade.stage === "preescolar" ? "preschool" : ""}">
        ${stageBadge(grade)}
        <h3>${escapeHtml(grade.name)}</h3>
        <p>${escapeHtml(grade.frequency)}</p>
        <button class="small-button secondary" data-action="open-grade" data-grade="${grade.id}">Abrir currículo →</button>
      </article>`;
  }

  function renderCurriculumIndex() {
    setActiveNav("curriculo");
    app.innerHTML = `
      <div class="page">
        <header class="page-header">
          <div><span class="eyebrow">Currículo completo</span><h1>Preescolar y primaria</h1><p>Selecciona un grado para ver su progresión anual, los cuatro bimestres y cada encuentro.</p></div>
        </header>
        <section class="grade-grid">${data.grades.map(renderGradeCard).join("")}</section>
      </div>`;
  }

  function renderWeek() {
    setActiveNav("semana");
    const visibleGrades = state.weekGrade === "all" ? data.grades : data.grades.filter((grade) => grade.id === state.weekGrade);
    app.innerHTML = `
      <div class="page">
        <header class="page-header">
          <div>
            <span class="eyebrow">Planeador transversal</span>
            <h1>Clases de la semana</h1>
            <p>Selecciona el bimestre y la semana. Preescolar muestra sus clases A y B; primaria muestra su encuentro semanal.</p>
          </div>
          <button class="button secondary" data-action="print-page">Imprimir vista</button>
        </header>
        <section class="filters" aria-label="Filtros de semana">
          <div class="field"><label for="bimester-select">Bimestre</label><select id="bimester-select">${[1, 2, 3, 4].map((n) => `<option value="${n}" ${n === state.bimester ? "selected" : ""}>Bimestre ${n}</option>`).join("")}</select></div>
          <div class="field"><label for="week-select">Semana</label><select id="week-select">${Array.from({ length: 9 }, (_, i) => i + 1).map((n) => `<option value="${n}" ${n === state.week ? "selected" : ""}>Semana ${n}</option>`).join("")}</select></div>
        </section>
        <div class="week-layout">
          ${gradeRail(state.weekGrade, true)}
          <section class="week-stack">
            ${visibleGrades.map((grade) => renderWeekGrade(grade)).join("") || `<div class="empty-state">No hay clases para mostrar.</div>`}
          </section>
        </div>
      </div>`;

    document.querySelector("#bimester-select").addEventListener("change", (event) => {
      state.bimester = Number(event.target.value);
      localStorage.setItem("st-bimester", state.bimester);
      renderWeek();
    });
    document.querySelector("#week-select").addEventListener("change", (event) => {
      state.week = Number(event.target.value);
      localStorage.setItem("st-week", state.week);
      renderWeek();
    });
  }

  function renderWeekGrade(grade) {
    const bimester = bimesterOf(grade, state.bimester);
    const week = weekOf(bimester, state.week);
    const allReady = week.lessons.every((lesson) => isPrepared(lessonKey(grade, bimester, week, lesson.slot)));
    return `
      <article class="lesson-card">
        <div class="lesson-card-header">
          <div>${stageBadge(grade)}<h3>${escapeHtml(grade.name)} · ${escapeHtml(bimester.title)}</h3></div>
          <span class="status-badge ${allReady ? "ready" : ""}">${allReady ? "Preparada" : `${week.lessons.length} clase${week.lessons.length > 1 ? "s" : ""}`}</span>
        </div>
        ${week.lessons
          .map(
            (lesson, index) => `
              <div class="lesson-card-body">
                <div>
                  <span class="label">${lesson.slot === "Única" ? `Semana ${week.week}` : `Clase ${lesson.slot}`}</span>
                  <p class="activity-line"><strong>${escapeHtml(lesson.title)}</strong> — ${escapeHtml(lesson.activity)}</p>
                </div>
                <div class="formation-line">
                  <span class="label">Objetivo formativo</span>
                  <p>${escapeHtml(lesson.formativeObjective)}</p>
                </div>
              </div>
              <div class="lesson-card-actions">
                <span class="muted">${escapeHtml(lesson.materials.slice(0, 2).join(" · "))}</span>
                <button class="small-button" data-action="open-lesson" data-grade="${grade.id}" data-bimester="${bimester.number}" data-week="${week.week}" data-lesson="${index}">Ver planeación completa</button>
              </div>`,
          )
          .join("")}
      </article>`;
  }

  function renderGrade(gradeId) {
    const grade = gradeById(gradeId) || data.grades[0];
    const selected = Number(state.gradeBimesters[grade.id]) || 1;
    const bimester = bimesterOf(grade, selected);
    setActiveNav("grado");

    app.innerHTML = `
      <div class="page">
        <header class="page-header">
          <div>${stageBadge(grade)}<h1>${escapeHtml(grade.name)}</h1><p>${escapeHtml(grade.frequency)}</p></div>
          <a class="button secondary" href="#semana">Ver en la semana</a>
        </header>
        <div class="curriculum-layout">
          ${gradeRail(grade.id)}
          <div>
            <section class="grade-summary">
              <div class="summary-main"><span class="eyebrow">Objetivo anual</span><h2>Ruta de ${escapeHtml(grade.name)}</h2><p>${escapeHtml(grade.annual)}</p></div>
              <div class="summary-side"><span class="eyebrow">${grade.stage === "preescolar" ? "Papel en la banda" : "Formación anual"}</span><p>${escapeHtml(grade.stage === "preescolar" ? grade.bandRole : grade.formation)}</p></div>
            </section>

            <nav class="bimester-tabs" aria-label="Bimestres de ${escapeHtml(grade.name)}">
              ${grade.bimesters.map((b) => `<button class="tab-button ${b.number === selected ? "active" : ""}" data-action="grade-bimester" data-grade="${grade.id}" data-bimester="${b.number}">Bimestre ${b.number}</button>`).join("")}
            </nav>

            ${renderBimester(grade, bimester)}
          </div>
        </div>
      </div>`;
  }

  function renderBimester(grade, bimester) {
    const connections = connectionTags(bimester);
    return `
      <section class="bimester-hero">
        <span class="eyebrow">Bimestre ${bimester.number}</span>
        <h2>${escapeHtml(bimester.title)}</h2>
        <p>${escapeHtml(bimester.objective)}</p>
        <div class="info-grid">
          <div class="info-block"><span class="label">Aprendizajes musicales</span>${list(bimester.music)}</div>
          <div class="info-block"><span class="label">Formación integral</span><p>${escapeHtml(bimester.formation)}</p></div>
          <div class="info-block"><span class="label">STEAM y conexión transdisciplinar</span><p>${escapeHtml(bimester.creation)}</p><div class="connection-tags">${connections.map((area) => `<span class="connection-tag">${escapeHtml(area)}</span>`).join("")}</div></div>
          <div class="info-block"><span class="label">Evidencia o producto</span><p>${escapeHtml(bimester.evidence)}</p></div>
          <div class="info-block"><span class="label">Visualidad y tecnología</span><p>${escapeHtml(bimester.visual)}</p></div>
          <div class="info-block"><span class="label">English word bank</span><p>${bimester.english.map((word) => `<span class="tag">${escapeHtml(word)}</span>`).join(" ")}</p></div>
        </div>
        ${bimester.repertoire ? renderRepertoire(bimester.repertoire) : ""}
        ${bimester.exam ? renderExam(bimester.exam) : ""}
      </section>

      <div class="section-heading"><div><span class="eyebrow">Secuencia</span><h2>Clase por clase</h2></div><p>Abre cualquier encuentro para ver materiales, estructura, evidencia y notas del profesor.</p></div>
      <section class="panel lesson-stack">
        ${bimester.weeks.map((week) => renderWeekRow(grade, bimester, week)).join("")}
      </section>`;
  }

  function connectionTags(bimester) {
    const text = normalized([
      bimester.title,
      bimester.objective,
      bimester.formation,
      bimester.creation,
      bimester.visual,
      bimester.evidence,
      ...(bimester.music || []),
    ].join(" "));
    const areas = [
      ["Ciencias", /sonido|timbre|acust|vibr|frecuen|material|natur|espectro|onda|paisaje sonoro/],
      ["Tecnología", /digital|prodigies|chrome|groove pizza|musicca|scrolling|video|pantalla|grab|produccion|media/],
      ["Ingeniería y diseño", /disen|arreglo|prototipo|constru|instrument|restric|estructura|proyecto|planear|revis|solucion/],
      ["Matemáticas", /patron|fraccion|compas|metrica|numero|ciclo|simetr|pulso|ritmo|subdivision|duracion|6\/8|3\/4|4\/4|2\/4/],
      ["Lenguaje e Inglés", /narr|texto|cuento|historia|letra|palabra|ingles|english|oral|escrit|cancion/],
      ["Sociales y Colombia", /colombia|territorio|comunidad|memoria|migracion|region|cultural|fuente|contexto|histor/],
      ["Educación física", /movimiento|motric|marcha|lateral|cuerpo|espacio|coordin|trayecto|postura/],
      ["Artes visuales y escénicas", /visual|grafica|dibujo|color|escena|coreograf|dram|imagen|presentacion/],
      ["Ética y socioemocional", /respeto|equipo|frustr|regul|confianza|escucha|silencio|conviv|privacidad|autoria|cuidado/],
    ];
    const matches = areas.filter(([, pattern]) => pattern.test(text)).map(([area]) => area);
    return matches.length ? matches.slice(0, 6) : ["Artes"];
  }

  function renderSteam() {
    setActiveNav("steam");
    app.innerHTML = `
      <div class="page">
        <header class="page-header steam-header">
          <div>
            <span class="eyebrow">Colaboración transdisciplinar</span>
            <h1>Mapa STEAM del programa</h1>
            <p>La música es el eje integrador: se investiga, se diseña, se representa, se interpreta y se revisa. Este cuadro permite encontrar aliados curriculares sin perder el enfoque colombiano ni la experiencia musical.</p>
          </div>
          <a class="button secondary" href="#curriculo">Ver conexiones por bimestre</a>
        </header>

        <section class="panel steam-reading">
          <span class="eyebrow">Lo que ya está presente</span>
          <div class="steam-findings">
            ${data.meta.steamFindings.map((finding, index) => `<article><strong>0${index + 1}</strong><p>${escapeHtml(finding)}</p></article>`).join("")}
          </div>
        </section>

        <div class="section-heading">
          <div><span class="eyebrow">Cuadro permanente</span><h2>Música y otras áreas</h2></div>
          <p>Los campos S, T, E, A y M muestran el modelo STEAM; el signo + identifica colaboraciones igualmente valiosas que amplían el proyecto.</p>
        </div>
        <div class="table-scroll panel" tabindex="0" aria-label="Tabla de conexiones STEAM y transdisciplinares">
          <table class="steam-table">
            <thead><tr><th>Área</th><th>Presencia en el currículo</th><th>Dónde se ve</th><th>Posible producto colaborativo</th><th>Pregunta puente</th></tr></thead>
            <tbody>
              ${data.meta.steamConnections.map((row) => `
                <tr>
                  <th scope="row"><span class="steam-letter">${escapeHtml(row.steam)}</span>${escapeHtml(row.area)}</th>
                  <td>${escapeHtml(row.already)}</td>
                  <td>${escapeHtml(row.examples)}</td>
                  <td>${escapeHtml(row.collaboration)}</td>
                  <td><strong>${escapeHtml(row.guidingQuestion)}</strong></td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>

        <section class="steam-use panel">
          <div><span class="eyebrow">Para planear con otro docente</span><h2>Una colaboración pequeña y viable</h2></div>
          <ol>
            <li><strong>Elegir una pregunta común</strong><span>No agregar un tema: acordar qué comprenderán o resolverán juntos.</span></li>
            <li><strong>Conservar una evidencia musical</strong><span>La canción, el arreglo, el paisaje sonoro, el dictado o la interpretación deben mostrar el aprendizaje.</span></li>
            <li><strong>Definir aportes y criterios</strong><span>Cada área aporta saberes explícitos y evalúa una parte del mismo producto.</span></li>
          </ol>
        </section>
      </div>`;
  }

  function renderRepertoire(repertoire) {
    return `
      <div class="repertoire-box">
        <span class="label">Repertorio vocal conductor</span>
        <h3>${escapeHtml(repertoire.focus)}</h3>
        ${list(repertoire.pieces.map((piece, index) => `Pieza ${index + 1}: ${piece}`))}
        <p class="muted">Dedicar aproximadamente 10–15 minutos de cada clase al canto y montaje. Las demás actividades toman material del repertorio cuando sea pertinente.</p>
      </div>`;
  }

  function renderExam(exam) {
    const names = ["Canto y repertorio", "Comprensión musical", "Aplicación y creación", "Formación"];
    return `
      <div class="exam-box">
        <span class="label">Examen bimestral · Semana 9</span>
        <h3>Prueba formal sobre 100 puntos</h3>
        <p><strong>Comprensión:</strong> ${escapeHtml(exam.knowledge)} <strong>Modalidad:</strong> ${escapeHtml(exam.format)}.</p>
        <div class="exam-grid">
          ${exam.weights.map((weight, index) => `<div class="exam-part"><strong>${weight} pts</strong><span>${names[index]} · ${escapeHtml(exam.criteria[index])}</span></div>`).join("")}
        </div>
      </div>`;
  }

  function renderWeekRow(grade, bimester, week) {
    return `
      <div class="week-row">
        <span class="week-badge">${week.week}</span>
        <div class="week-lessons">
          ${week.lessons
            .map(
              (lesson, index) => `
                <article class="week-mini-card">
                  <div><span class="label">${lesson.slot === "Única" ? "Clase semanal" : `Clase ${lesson.slot}`}</span><h4>${escapeHtml(lesson.title)}</h4><p>${escapeHtml(lesson.activity)}</p></div>
                  <button class="small-button secondary" data-action="open-lesson" data-grade="${grade.id}" data-bimester="${bimester.number}" data-week="${week.week}" data-lesson="${index}">Planear</button>
                </article>`,
            )
            .join("")}
        </div>
      </div>`;
  }

  function renderTools() {
    setActiveNav("herramientas");
    app.innerHTML = `
      <div class="page">
        <header class="page-header"><div><span class="eyebrow">Apoyos permanentes</span><h1>Herramientas del profesor</h1><p>Rutinas, evaluación, organización física, plataformas y documentos descargables.</p></div></header>

        <div class="section-heading"><div><span class="eyebrow">Primaria</span><h2>La clase de 50 minutos en cuatro momentos</h2></div></div>
        <section class="routine-grid">${data.meta.primaryRoutine.map(renderRoutine).join("")}</section>

        <div class="section-heading"><div><span class="eyebrow">Preescolar</span><h2>La clase en cuatro momentos</h2></div><p>Dos experiencias semanales; si son continuas, se realiza una pausa y un cambio claro de energía.</p></div>
        <section class="routine-grid">${data.meta.preschoolRoutine.map(renderRoutine).join("")}</section>

        <div class="section-heading"><div><span class="eyebrow">Evaluación de primaria</span><h2>Examen bimestral</h2></div></div>
        <section class="exam-grid">
          ${data.meta.examModel.map((part) => `<div class="tool-card panel"><strong style="font-size:1.55rem;color:var(--navy)">${part.weight} pts</strong><h3>${escapeHtml(part.name)}</h3><p class="muted">${escapeHtml(part.description)}</p></div>`).join("")}
        </section>

        <div class="section-heading"><div><span class="eyebrow">Preescolar</span><h2>Evidencias y banda final</h2></div></div>
        <section class="grade-summary">
          <div class="panel"><h3>Evaluación cualitativa</h3>${list(data.meta.preschoolAssessment)}</div>
          <div class="panel"><h3>Banda de preescolar · ${escapeHtml(data.meta.bandPlan.duration)}</h3><p>${escapeHtml(data.meta.bandPlan.principle)}</p>${list(data.meta.bandPlan.form)}</div>
        </section>

        <div class="section-heading"><div><span class="eyebrow">Aula</span><h2>Orden y materiales</h2></div></div>
        <section class="grade-summary">
          <div class="panel"><h3>Organización física</h3>${list(data.meta.classroom)}</div>
          <div class="panel"><h3>Sistema común de notas</h3><p>C–D–E–F–G–A–B–C′ · Do–Re–Mi–Fa–Sol–La–Ti–Do · números 1–8 · color · signo Curwen. El apoyo visual se retira gradualmente.</p><p class="muted">Secuencia: ver → cantar → signar → tocar → apagar pantalla → cambiar o crear.</p></div>
        </section>

        <div class="section-heading"><div><span class="eyebrow">Enlaces</span><h2>Plataformas musicales</h2></div></div>
        <section class="resource-grid">${data.meta.resources.map((resource) => `<a class="resource-card" href="${escapeHtml(resource.url)}" target="_blank" rel="noreferrer"><strong>${escapeHtml(resource.name)} ↗</strong><span>${escapeHtml(resource.use)}</span></a>`).join("")}</section>

        <div class="section-heading"><div><span class="eyebrow">Archivos maestros</span><h2>Descargar los currículos</h2></div></div>
        <section class="resource-grid">
          <div class="resource-card download-card"><div><strong>Currículo de Preescolar</strong><span>Documento editable completo.</span></div><a class="small-button" href="downloads/Curriculo_Musica_Preescolar_San_Tarsicio.docx" download>Descargar</a></div>
          <div class="resource-card download-card"><div><strong>Currículo de Primaria</strong><span>Documento editable completo.</span></div><a class="small-button" href="downloads/Curriculo_Musica_Primaria_San_Tarsicio.docx" download>Descargar</a></div>
        </section>
      </div>`;
  }

  function renderRoutine(item) {
    return `<article class="routine-card"><span class="routine-time">${escapeHtml(item.time)} min</span><h3>${escapeHtml(item.name)}</h3><span class="muted">${escapeHtml(item.english)}</span><p>${escapeHtml(item.purpose)}</p></article>`;
  }

  function openLesson(gradeId, bimesterNumber, weekNumber, lessonIndex) {
    const grade = gradeById(gradeId);
    const bimester = bimesterOf(grade, bimesterNumber);
    const week = weekOf(bimester, weekNumber);
    const lesson = week.lessons[Number(lessonIndex)];
    const key = lessonKey(grade, bimester, week, lesson.slot);
    const routine = grade.stage === "primaria" ? data.meta.primaryRoutine : data.meta.preschoolRoutine;
    const todayPlan = routine.map((moment, index) => {
      let instruction = moment.purpose;
      if (grade.stage === "primaria" && index === 1 && bimester.repertoire) {
        instruction = `Montar 10–15 minutos de una pieza del repertorio: ${bimester.repertoire.focus}`;
      }
      if (grade.stage === "primaria" && index === 2) {
        instruction = lesson.activity;
      }
      if (grade.stage === "preescolar" && index === 2) {
        instruction = `Comenzar con una interacción visual breve y activa: ${lesson.visual} Después, apagar la pantalla y transferir al juego o creación: ${lesson.activity}`;
      }
      if (index === routine.length - 1) instruction = `Cerrar recogiendo esta evidencia: ${lesson.evidence}`;
      return `<li><strong>${escapeHtml(moment.time)} min · ${escapeHtml(moment.name)}</strong><span>${escapeHtml(instruction)}</span></li>`;
    });

    dialogContent.innerHTML = `
      <div class="lesson-title-block">
        <span class="eyebrow">${escapeHtml(grade.name)} · Bimestre ${bimester.number} · Semana ${week.week}${lesson.slot !== "Única" ? ` · Clase ${lesson.slot}` : ""}</span>
        <h2 id="lesson-dialog-title">${escapeHtml(lesson.title)}</h2>
        <p>${escapeHtml(lesson.activity)}</p>
      </div>
      <div class="plan-grid">
        <section class="plan-block"><span class="label">Objetivo musical</span><p>${escapeHtml(lesson.musicalObjective)}</p></section>
        <section class="plan-block"><span class="label">Objetivo formativo</span><p>${escapeHtml(lesson.formativeObjective)}</p></section>
        <section class="plan-block full"><span class="label">Guion de la clase</span><ol class="today-plan">${todayPlan.join("")}</ol></section>
        ${bimester.repertoire ? `<section class="plan-block full"><span class="label">Repertorio del bimestre</span><p><strong>${escapeHtml(bimester.repertoire.focus)}</strong></p>${list(bimester.repertoire.pieces)}</section>` : ""}
        <section class="plan-block"><span class="label">Preparar</span>${list(lesson.materials)}</section>
        <section class="plan-block"><span class="label">Interacción visual / recurso</span><p>${escapeHtml(lesson.visual)}</p></section>
        <section class="plan-block"><span class="label">Evidencia de salida</span><p>${escapeHtml(lesson.evidence)}</p></section>
        <section class="plan-block"><span class="label">English word bank</span><p>${bimester.english.map((word) => `<span class="tag">${escapeHtml(word)}</span>`).join(" ")}</p></section>
        <section class="plan-block full no-print">
          <span class="label">Seguimiento local</span>
          <label class="checkbox-row"><input type="checkbox" id="prepared-check" ${isPrepared(key) ? "checked" : ""} /> Clase preparada</label>
          <label for="teacher-notes" class="label" style="margin-top:1rem;display:block">Notas del profesor</label>
          <textarea id="teacher-notes" class="notes-area" placeholder="Ajustes de repertorio, materiales, estudiantes por observar o decisiones para la siguiente clase…">${escapeHtml(noteFor(key))}</textarea>
          <div class="button-row"><button class="button" data-action="save-lesson" data-key="${key}">Guardar notas</button><button class="button secondary" data-action="print-lesson">Imprimir planeación</button></div>
        </section>
      </div>`;

    dialog.dataset.lessonKey = key;
    dialog.showModal();
  }

  function saveLesson(key) {
    const notes = document.querySelector("#teacher-notes");
    const prepared = document.querySelector("#prepared-check");
    if (notes) localStorage.setItem(`st-note-${key}`, notes.value);
    if (prepared) localStorage.setItem(`st-prepared-${key}`, prepared.checked ? "true" : "false");
    const button = dialog.querySelector('[data-action="save-lesson"]');
    if (button) {
      const original = button.textContent;
      button.textContent = "Guardado ✓";
      window.setTimeout(() => (button.textContent = original), 1200);
    }
  }

  function route() {
    const hash = window.location.hash.replace(/^#/, "") || "inicio";
    const [view, param] = hash.split("/");
    if (view === "semana") renderWeek();
    else if (view === "curriculo") renderCurriculumIndex();
    else if (view === "grado") renderGrade(param);
    else if (view === "steam") renderSteam();
    else if (view === "herramientas") renderTools();
    else renderHome();
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    if (action === "open-grade") window.location.hash = `grado/${target.dataset.grade}`;
    if (action === "week-grade") {
      state.weekGrade = target.dataset.grade;
      localStorage.setItem("st-week-grade", state.weekGrade);
      renderWeek();
    }
    if (action === "grade-bimester") {
      state.gradeBimesters[target.dataset.grade] = Number(target.dataset.bimester);
      localStorage.setItem("st-grade-bimesters", JSON.stringify(state.gradeBimesters));
      renderGrade(target.dataset.grade);
    }
    if (action === "open-lesson") openLesson(target.dataset.grade, target.dataset.bimester, target.dataset.week, target.dataset.lesson);
    if (action === "save-lesson") saveLesson(target.dataset.key);
    if (action === "print-lesson") {
      document.body.classList.add("printing-lesson");
      window.print();
    }
    if (action === "print-page") window.print();
  });

  document.querySelector("[data-close-dialog]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  window.addEventListener("afterprint", () => document.body.classList.remove("printing-lesson"));
  window.addEventListener("hashchange", route);
  route();
})();
