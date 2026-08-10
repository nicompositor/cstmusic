(() => {
  "use strict";

  const data = window.CURRICULUM_DATA;
  const app = document.querySelector("#app");
  const dialog = document.querySelector("#lesson-dialog");
  const dialogContent = document.querySelector("#lesson-dialog-content");
  const dayOrder = ["lunes", "martes", "miércoles", "jueves", "viernes"];
  const launchCalendar = {
    primaria: { welcome: "2026-08-12", regular: "2026-08-13" },
    preescolar: { welcome: "2026-08-13", regular: "2026-08-14" },
    automaticThrough: "2026-08-21",
  };
  const bogotaDateParts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Bogota",
  }).formatToParts(new Date());
  const bogotaTodayIso = ["year", "month", "day"].map((type) => bogotaDateParts.find((part) => part.type === type).value).join("-");

  if (!data || !app) {
    document.body.innerHTML = "<p>No fue posible cargar el currículo.</p>";
    return;
  }

  const readJson = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch (_error) {
      return fallback;
    }
  };

  const state = {
    bimester: Number(localStorage.getItem("st-bimester")) || 1,
    week: Number(localStorage.getItem("st-week")) || 1,
    weekGrade: localStorage.getItem("st-week-grade") || "all",
    date: localStorage.getItem("st-date") || bogotaTodayIso,
    day: "lunes",
    gradeBimesters: readJson("st-grade-bimesters", {}),
    overrides: readJson("st-curriculum-overrides", {}),
    postponed: readJson("st-postponed-lessons", {}),
  };

  function weekdayFromIso(iso) {
    const index = new Date(`${iso}T12:00:00Z`).getUTCDay();
    return ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][index];
  }

  function moveDateToWeekday(iso, targetDay) {
    const date = new Date(`${iso}T12:00:00Z`);
    const targetIndex = dayOrder.indexOf(targetDay);
    const mondayOffset = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - mondayOffset + targetIndex);
    return date.toISOString().slice(0, 10);
  }

  function displayDate(iso) {
    return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));
  }

  function addDaysIso(iso, days) {
    const date = new Date(`${iso}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  state.day = weekdayFromIso(state.date);

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
  const overrideFor = (key) => state.overrides[key] || {};
  const mergeLessonOverride = (lesson, key) => {
    const override = overrideFor(key);
    return { ...lesson, ...override, materials: Array.isArray(override.materials) ? override.materials : lesson.materials };
  };
  const regularStartLesson = (grade, bimester, week, lesson) => {
    if (bimester.number !== 1 || week.week !== 1) return lesson;
    if (grade.stage === "primaria") {
      return {
        ...lesson,
        title: "Inicio del repertorio",
        activity: "Recordaremos los acuerdos de bienvenida en tres minutos, conoceremos la meta del bimestre, elegiremos o confirmaremos el repertorio y comenzaremos a cantarlo con voz cómoda.",
        evidence: "Repertorio y meta comprendidos; primera participación vocal registrada.",
      };
    }
    if (lesson.slot === "A") {
      return {
        ...lesson,
        title: "Primer encuentro musical",
        activity: "Recordaremos brevemente Ready–Rest–Play, cantaremos por eco, jugaremos con sonido y silencio y conoceremos el repertorio del bimestre.",
        evidence: "Participa en el primer juego cantado y responde a la señal de silencio.",
      };
    }
    return lesson;
  };
  const effectiveLesson = (grade, bimester, week, lesson) => {
    const key = lessonKey(grade, bimester, week, lesson.slot);
    return mergeLessonOverride(regularStartLesson(grade, bimester, week, lesson), key);
  };

  function savePostponed() {
    localStorage.setItem("st-postponed-lessons", JSON.stringify(state.postponed));
  }

  function resolveLessonRecord(record) {
    if (!record) return null;
    const grade = gradeById(record.gradeId);
    const bimester = grade && bimesterOf(grade, record.bimester);
    const week = bimester && weekOf(bimester, record.week);
    const original = week?.lessons[Number(record.lessonIndex)];
    if (!grade || !bimester || !week || !original) return null;
    const lesson = effectiveLesson(grade, bimester, week, original);
    return { record, grade, bimester, week, original, lesson, lessonIndex: Number(record.lessonIndex), key: lessonKey(grade, bimester, week, original.slot) };
  }

  function pendingForGroup(group) {
    const record = state.postponed[group];
    if (!record || record.eligibleDate > state.date) return null;
    return resolveLessonRecord(record);
  }

  const isPrepared = (key) => localStorage.getItem(`st-prepared-${key}`) === "true";
  const noteFor = (key) => localStorage.getItem(`st-note-${key}`) || "";
  const normalized = (value = "") =>
    String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const displayDay = (day) => day.charAt(0).toUpperCase() + day.slice(1);

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
              <a class="button" href="#hoy">Ver mis clases de hoy</a>
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

  function groupOccurrenceOnDate(entry, grade) {
    const regularStart = launchCalendar[grade.stage].regular;
    if (state.date < regularStart || state.date > launchCalendar.automaticThrough || state.bimester !== 1) return null;
    const meetingDays = new Set((data.schedule || []).filter((item) => item.group === entry.group).map((item) => item.day));
    let occurrence = 0;
    const cursor = new Date(`${regularStart}T12:00:00Z`);
    const end = new Date(`${state.date}T12:00:00Z`);
    while (cursor <= end) {
      const iso = cursor.toISOString().slice(0, 10);
      if (meetingDays.has(weekdayFromIso(iso))) occurrence += 1;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return occurrence || null;
  }

  function resolveScheduledClass(entry) {
    const grade = gradeById(entry.gradeId);
    if (!grade) return null;
    const launch = launchCalendar[grade.stage];
    if (state.date <= launch.welcome) return null;
    const occurrence = groupOccurrenceOnDate(entry, grade);
    const resolvedWeek = occurrence ? (grade.stage === "preescolar" ? Math.ceil(occurrence / 2) : occurrence) : state.week;
    const resolvedSlot = occurrence && grade.stage === "preescolar" ? (occurrence % 2 ? "A" : "B") : entry.slot;
    const bimester = bimesterOf(grade, state.bimester);
    const week = weekOf(bimester, resolvedWeek);
    const lessonIndex = week.lessons.findIndex((lesson) => lesson.slot === resolvedSlot);
    if (lessonIndex < 0) return null;
    const original = week.lessons[lessonIndex];
    const lesson = effectiveLesson(grade, bimester, week, original);
    const key = lessonKey(grade, bimester, week, original.slot);
    return { entry, grade, bimester, week, lesson, lessonIndex, key, occurrence };
  }

  function renderToday() {
    setActiveNav("hoy");
    const scheduled = (data.schedule || [])
      .filter((entry) => entry.day === state.day)
      .map(resolveScheduledClass)
      .filter(Boolean);
    const materials = [...new Set(scheduled.flatMap((item) => {
      const pending = pendingForGroup(item.entry.group);
      return [...(item.lesson.materials || []), ...(pending?.lesson.materials || [])];
    }))];

    app.innerHTML = `
      <div class="page">
        <header class="page-header today-header">
          <div>
            <span class="eyebrow">Horario 2026–2027 · ${escapeHtml(displayDate(state.date))}</span>
            <h1>${displayDay(state.day)}: clases y preparación</h1>
            <p>Solo aparecen tus clases de música. Los acompañamientos y las bandas fueron excluidos del horario.</p>
          </div>
          <button class="button secondary" data-action="print-page">Imprimir el día</button>
        </header>

        <section class="filters today-filters" aria-label="Seleccionar día y semana">
          <div class="field"><label for="today-date-select">Fecha</label><input id="today-date-select" type="date" value="${state.date}" /></div>
          <div class="field"><label for="today-bimester-select">Bimestre</label><select id="today-bimester-select">${[1, 2, 3, 4].map((n) => `<option value="${n}" ${n === state.bimester ? "selected" : ""}>Bimestre ${n}</option>`).join("")}</select></div>
          <div class="field"><label for="today-week-select">Semana</label><select id="today-week-select">${Array.from({ length: 9 }, (_, i) => i + 1).map((n) => `<option value="${n}" ${n === state.week ? "selected" : ""}>Semana ${n}</option>`).join("")}</select></div>
          <div class="day-tabs" role="group" aria-label="Día de la semana">
            ${dayOrder.map((day) => `<button class="day-tab ${day === state.day ? "active" : ""}" data-action="select-day" data-day="${day}">${displayDay(day)}<span>${(data.schedule || []).filter((item) => item.day === day).length}</span></button>`).join("")}
          </div>
        </section>

        ${state.bimester === 1 ? `<section class="launch-notice panel">
          <div><span class="eyebrow">Inicio especial del año</span><h2>Los días de bienvenida quedan sin planeación musical</h2></div>
          <p>El <strong>miércoles 12</strong> no se programa clase de Primaria y el <strong>jueves 13</strong> no se programa clase de Preescolar. Las clases regulares comienzan el jueves 13 y el viernes 14, respectivamente.</p>
          <p class="muted">Hasta el 21 de agosto, esta agenda calcula automáticamente el primer encuentro real de cada grupo para comenzar siempre por la clase correcta.</p>
        </section>` : ""}

        ${scheduled.length ? `
          <section class="daily-prep panel">
            <div><span class="eyebrow">Antes de salir de casa o entrar al salón</span><h2>Lo que debes tener preparado</h2></div>
            <ul class="prep-checklist">${materials.map((material) => `<li><label><input type="checkbox" /> <span>${escapeHtml(material)}</span></label></li>`).join("")}</ul>
          </section>
          <section class="daily-timeline" aria-label="Clases del ${escapeHtml(state.day)}">
            ${scheduled.map(renderDailyClass).join("")}
          </section>` : `
          <section class="empty-day panel">
            <span class="eyebrow">Día sin clases regulares</span>
            <h2>No tienes clases de música programadas.</h2>
            <p>Puedes usar esta vista para preparar la semana o seleccionar otro día.</p>
            <button class="button" data-action="select-day" data-day="martes">Ver el martes</button>
          </section>`}
      </div>`;

    document.querySelector("#today-date-select").addEventListener("change", (event) => {
      state.date = event.target.value || bogotaTodayIso;
      state.day = weekdayFromIso(state.date);
      localStorage.setItem("st-date", state.date);
      localStorage.setItem("st-day", state.day);
      renderToday();
    });
    document.querySelector("#today-bimester-select").addEventListener("change", (event) => {
      state.bimester = Number(event.target.value);
      localStorage.setItem("st-bimester", state.bimester);
      renderToday();
    });
    document.querySelector("#today-week-select").addEventListener("change", (event) => {
      state.week = Number(event.target.value);
      localStorage.setItem("st-week", state.week);
      renderToday();
    });
  }

  function renderDailyClass(item) {
    const { entry, grade, bimester, week, lesson, lessonIndex, key, occurrence } = item;
    const prepared = isPrepared(key);
    const pending = pendingForGroup(entry.group);
    const queued = state.postponed[entry.group];
    const actionData = `data-entry="${entry.id}" data-group="${escapeHtml(entry.group)}" data-grade="${grade.id}" data-bimester="${bimester.number}" data-week="${week.week}" data-lesson="${lessonIndex}"`;
    return `
      <article class="daily-class-card ${grade.stage === "preescolar" ? "preschool" : ""}">
        <div class="daily-time"><strong>${escapeHtml(entry.start)}</strong><span>${escapeHtml(entry.end)}</span></div>
        <div class="daily-class-main">
          <header>
            <div>${stageBadge(grade)}<h2>${escapeHtml(entry.group)}</h2><p>Bimestre ${bimester.number} · Semana ${week.week}${lesson.slot !== "Única" ? ` · Clase ${lesson.slot}` : ""}${occurrence ? " · secuencia de inicio calculada" : ""}</p></div>
            <span class="status-badge ${prepared ? "ready" : ""}">${prepared ? "Preparada ✓" : "Por preparar"}</span>
          </header>
          ${pending ? renderCarryoverChoices(pending, item, actionData) : ""}
          ${queued && !pending ? `<div class="queued-notice"><strong>Ya existe una clase aplazada.</strong><span>Aparecerá como opción desde el ${escapeHtml(displayDate(queued.eligibleDate))}.</span></div>` : ""}
          <div class="daily-goal"><span class="label">Meta de hoy</span><strong>${escapeHtml(lesson.musicalObjective)}</strong></div>
          <div class="daily-details">
            <section><span class="label">Qué harás</span><h3>${escapeHtml(lesson.title)}</h3><p>${escapeHtml(lesson.activity)}</p></section>
            <section><span class="label">Formación humana</span><p>${escapeHtml(lesson.formativeObjective)}</p></section>
            <section><span class="label">Lenguaje musical + English</span><p>${escapeHtml(lesson.language || "Lenguaje del bimestre")}</p><p class="muted">${escapeHtml(lesson.english || "")}</p></section>
            <section><span class="label">Evidencia</span><p>${escapeHtml(lesson.evidence)}</p></section>
          </div>
          <div class="daily-actions">
            <p><strong>Preparar:</strong> ${escapeHtml((lesson.materials || []).join(" · "))}</p>
            <div class="button-row">
              <button class="small-button" data-action="open-lesson" data-grade="${grade.id}" data-bimester="${bimester.number}" data-week="${week.week}" data-lesson="${lessonIndex}" data-duration="${entry.minutes}" data-context="${escapeHtml(entry.group)} · ${escapeHtml(entry.start)}–${escapeHtml(entry.end)}">Plan de ${entry.minutes} min</button>
              <button class="small-button secondary" data-action="edit-lesson" data-grade="${grade.id}" data-bimester="${bimester.number}" data-week="${week.week}" data-lesson="${lessonIndex}" data-duration="${entry.minutes}" data-context="${escapeHtml(entry.group)} · ${escapeHtml(entry.start)}–${escapeHtml(entry.end)}">Editar</button>
              ${!queued ? `<button class="small-button postpone-button" data-action="postpone-current" ${actionData}>Aplazar 1 semana</button>` : ""}
              <button class="small-button secondary" data-action="toggle-prepared" data-key="${key}">${prepared ? "Quitar marca" : "Marcar preparada"}</button>
            </div>
          </div>
        </div>
      </article>`;
  }

  function renderCarryoverChoices(pending, current, actionData) {
    const { record, grade, bimester, week, lesson, lessonIndex } = pending;
    return `
      <section class="carryover-panel" aria-label="Clase aplazada de ${escapeHtml(record.group)}">
        <div class="carryover-heading">
          <div><span class="eyebrow">Hay una clase aplazada</span><h3>Hoy tienes dos opciones de contenido</h3></div>
          <span class="carryover-date">Aplazada el ${escapeHtml(displayDate(record.postponedFrom))}</span>
        </div>
        <div class="lesson-choice-grid">
          <article class="lesson-choice pending-choice">
            <span class="label">Opción 1 · Pendiente</span>
            <h4>${escapeHtml(lesson.title)}</h4>
            <p>${escapeHtml(lesson.musicalObjective)}</p>
            <button class="text-button" data-action="open-lesson" data-grade="${grade.id}" data-bimester="${bimester.number}" data-week="${week.week}" data-lesson="${lessonIndex}" data-duration="${current.entry.minutes}" data-context="${escapeHtml(record.group)} · clase aplazada">Ver planeación pendiente</button>
          </article>
          <article class="lesson-choice current-choice">
            <span class="label">Opción 2 · Planeada para hoy</span>
            <h4>${escapeHtml(current.lesson.title)}</h4>
            <p>${escapeHtml(current.lesson.musicalObjective)}</p>
          </article>
        </div>
        <div class="carryover-decisions">
          <button class="small-button" data-action="use-pending" ${actionData}>Hacer pendiente y aplazar la actual</button>
          <button class="small-button secondary" data-action="keep-current" data-group="${escapeHtml(record.group)}">Mantener actual y volver a aplazar pendiente</button>
          <button class="small-button combine-button" data-action="combine-lessons" ${actionData}>Juntar ambas</button>
        </div>
      </section>`;
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
    const effectiveLessons = week.lessons.map((lesson) => effectiveLesson(grade, bimester, week, lesson));
    const allReady = week.lessons.every((lesson) => isPrepared(lessonKey(grade, bimester, week, lesson.slot)));
    return `
      <article class="lesson-card">
        <div class="lesson-card-header">
          <div>${stageBadge(grade)}<h3>${escapeHtml(grade.name)} · ${escapeHtml(bimester.title)}</h3></div>
          <span class="status-badge ${allReady ? "ready" : ""}">${allReady ? "Preparada" : `${week.lessons.length} clase${week.lessons.length > 1 ? "s" : ""}`}</span>
        </div>
        ${effectiveLessons
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
                <div class="formation-line">
                  <span class="label">Lenguaje musical + English</span>
                  <p>${escapeHtml(lesson.language || "")} <span class="muted">${escapeHtml(lesson.english || "")}</span></p>
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
        <div class="student-goal"><span class="label">Meta para estudiantes · Semanas 1–8</span><strong>${escapeHtml(bimester.studentGoal || bimester.objective)}</strong></div>
        <div class="info-grid">
          <div class="info-block"><span class="label">Aprendizajes musicales</span>${list(bimester.music)}</div>
          <div class="info-block"><span class="label">Lenguaje musical clave</span><p>${escapeHtml((bimester.languageKeys || []).join(" · "))}</p></div>
          <div class="info-block"><span class="label">Formación humana prioritaria</span><p>${escapeHtml(bimester.formation)}</p></div>
          <div class="info-block"><span class="label">Referentes e historia</span>${list(bimester.references || [])}</div>
          <div class="info-block"><span class="label">STEAM y conexión transdisciplinar</span><p>${escapeHtml(bimester.creation)}</p><div class="connection-tags">${connections.map((area) => `<span class="connection-tag">${escapeHtml(area)}</span>`).join("")}</div></div>
          <div class="info-block"><span class="label">Evidencia o producto</span><p>${escapeHtml(bimester.evidence)}</p></div>
          <div class="info-block"><span class="label">Visualidad y tecnología</span><p>${escapeHtml(bimester.visual)}</p></div>
          <div class="info-block"><span class="label">English classroom language</span><p>${bimester.english.map((word) => `<span class="tag">${escapeHtml(word)}</span>`).join(" ")}</p><p class="muted">${escapeHtml((bimester.englishPhrases || []).join(" / "))}</p></div>
        </div>
        ${bimester.repertoireText ? `<div class="repertoire-box"><span class="label">Repertorio conductor</span><p>${escapeHtml(bimester.repertoireText)}</p></div>` : ""}
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
      ...(bimester.languageKeys || []),
      ...(bimester.references || []),
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
    return `
      <div class="exam-box">
        <span class="label">Examen bimestral · Semana 9</span>
        <h3>${escapeHtml(exam.ability)} + ${escapeHtml(exam.formation)}</h3>
        <p><strong>Formato viable en 50 minutos:</strong> ${escapeHtml(exam.format)}</p>
        <div class="exam-grid">
          <div class="exam-part"><strong>80 pts</strong><span>Habilidad musical · ${escapeHtml(exam.musical)}</span></div>
          <div class="exam-part"><strong>20 pts</strong><span>Formación humana · ${escapeHtml(exam.formative)}</span></div>
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
              (sourceLesson, index) => {
                const lesson = effectiveLesson(grade, bimester, week, sourceLesson);
                return `
                <article class="week-mini-card">
                  <div><span class="label">${lesson.slot === "Única" ? "Clase semanal" : `Clase ${lesson.slot}`}</span><h4>${escapeHtml(lesson.title)}</h4><p>${escapeHtml(lesson.activity)}</p><p class="mini-formation"><strong>Formación:</strong> ${escapeHtml(lesson.formativeObjective)}</p><p class="muted"><strong>Lenguaje:</strong> ${escapeHtml(lesson.language || "")}</p></div>
                  <button class="small-button secondary" data-action="open-lesson" data-grade="${grade.id}" data-bimester="${bimester.number}" data-week="${week.week}" data-lesson="${index}">Planear</button>
                </article>`;
              },
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

        <div class="section-heading"><div><span class="eyebrow">Evaluación de primaria</span><h2>Examen focal: dos criterios</h2></div></div>
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

        <div class="section-heading"><div><span class="eyebrow">Currículo vivo</span><h2>Edición y respaldo</h2></div><p>Los cambios se guardan en este navegador. Exporta un respaldo para moverlos a otro computador o recuperarlos.</p></div>
        <section class="grade-summary">
          <div class="panel"><h3>Editar y reprogramar</h3><p>Abre cualquier planeación para editarla. Si una clase no se realiza, usa <strong>Aplazar 1 semana</strong>; en el siguiente encuentro correspondiente podrás escoger la pendiente, la actual o un plan combinado.</p><p class="muted">El currículo original siempre puede restaurarse clase por clase.</p></div>
          <div class="panel backup-panel"><h3>Respaldo de ajustes</h3><div class="button-row"><button class="button" data-action="export-adjustments">Exportar ajustes</button><button class="button secondary" data-action="choose-import">Importar respaldo</button></div><input id="adjustments-file" type="file" accept="application/json,.json" hidden /><p class="muted">El archivo incluye ediciones, notas, clases aplazadas y marcas de preparación; no contiene información de estudiantes.</p></div>
        </section>

        <div class="section-heading"><div><span class="eyebrow">Enlaces</span><h2>Plataformas musicales</h2></div></div>
        <section class="resource-grid">${data.meta.resources.map((resource) => `<a class="resource-card" href="${escapeHtml(resource.url)}" target="_blank" rel="noreferrer"><strong>${escapeHtml(resource.name)} ↗</strong><span>${escapeHtml(resource.use)}</span></a>`).join("")}</section>

        <div class="section-heading"><div><span class="eyebrow">Archivos maestros</span><h2>Descargar los currículos</h2></div></div>
        <section class="resource-grid">
          <div class="resource-card download-card"><div><strong>Currículo de Preescolar V2</strong><span>Documento actualizado y editable.</span></div><a class="small-button" href="downloads/Curriculo_Musica_Preescolar_San_Tarsicio_V2_REVISION.docx" download>Descargar</a></div>
          <div class="resource-card download-card"><div><strong>Currículo de Primaria V2</strong><span>Documento actualizado y editable.</span></div><a class="small-button" href="downloads/Curriculo_Musica_Primaria_San_Tarsicio_V2_REVISION.docx" download>Descargar</a></div>
        </section>
      </div>`;

    document.querySelector("#adjustments-file")?.addEventListener("change", importAdjustments);
  }

  function renderRoutine(item) {
    return `<article class="routine-card"><span class="routine-time">${escapeHtml(item.time)} min</span><h3>${escapeHtml(item.name)}</h3><span class="muted">${escapeHtml(item.english)}</span><p>${escapeHtml(item.purpose)}</p></article>`;
  }

  function openLesson(gradeId, bimesterNumber, weekNumber, lessonIndex, context = "", duration = "") {
    dialog.dataset.grade = gradeId;
    dialog.dataset.bimester = String(bimesterNumber);
    dialog.dataset.week = String(weekNumber);
    dialog.dataset.lesson = String(lessonIndex);
    dialog.dataset.context = context;
    dialog.dataset.duration = duration;
    renderLessonDialog(false);
    if (!dialog.open) dialog.showModal();
  }

  function currentDialogLesson() {
    const grade = gradeById(dialog.dataset.grade);
    const bimester = bimesterOf(grade, dialog.dataset.bimester);
    const week = weekOf(bimester, dialog.dataset.week);
    const original = week.lessons[Number(dialog.dataset.lesson)];
    const lesson = effectiveLesson(grade, bimester, week, original);
    const key = lessonKey(grade, bimester, week, original.slot);
    return { grade, bimester, week, original, lesson, key };
  }

  function renderLessonDialog(editing = false) {
    const { grade, bimester, week, lesson, key } = currentDialogLesson();
    dialog.dataset.lessonKey = key;
    if (editing) {
      dialogContent.innerHTML = `
        <div class="lesson-title-block edit-heading">
          <span class="eyebrow">Editando · ${escapeHtml(grade.name)} · Bimestre ${bimester.number} · Semana ${week.week}${lesson.slot !== "Única" ? ` · Clase ${lesson.slot}` : ""}</span>
          <h2 id="lesson-dialog-title">Editar contenido de la clase</h2>
          <p>Escribe sobre el texto actual. Los cambios quedarán guardados en este navegador.</p>
        </div>
        <form class="edit-form" id="lesson-edit-form">
          ${editField("title", "Título", lesson.title, false)}
          ${editField("activity", "Qué harás", lesson.activity)}
          ${editField("musicalObjective", "Meta musical", lesson.musicalObjective)}
          ${editField("formativeObjective", "Formación humana", lesson.formativeObjective)}
          ${editField("language", "Lenguaje musical", lesson.language || "")}
          ${editField("english", "English classroom language", lesson.english || "")}
          ${editField("materials", "Preparar · un elemento por línea", (lesson.materials || []).join("\n"))}
          ${editField("visual", "Interacción visual / recurso", lesson.visual)}
          ${editField("evidence", "Evidencia de salida", lesson.evidence)}
          <div class="edit-actions">
            <button class="button" type="button" data-action="save-curriculum-edit">Guardar cambios</button>
            <button class="button secondary" type="button" data-action="cancel-curriculum-edit">Cancelar</button>
            <button class="text-button danger" type="button" data-action="reset-curriculum-edit">Restaurar texto original</button>
          </div>
        </form>`;
      return;
    }

    const defaultRoutine = grade.stage === "primaria" ? data.meta.primaryRoutine : data.meta.preschoolRoutine;
    const routine = adaptRoutine(defaultRoutine, Number(dialog.dataset.duration));
    const todayPlan = routine.map((moment, index) => {
      let instruction = moment.purpose;
      if (index === 1) instruction = grade.stage === "primaria" && bimester.repertoire
        ? `Cantar y montar durante 10–15 minutos: ${bimester.repertoire.focus}`
        : `Cantar el repertorio y aplicar: ${lesson.language || (bimester.languageKeys || []).join(" · ")}`;
      if (index === 2) instruction = `${lesson.activity} Interacción visual: ${lesson.visual} Luego, continuar sin pantalla.`;
      if (index === routine.length - 1) instruction = `Cerrar recogiendo esta evidencia: ${lesson.evidence}`;
      return `<li><strong>${escapeHtml(moment.time)} min · ${escapeHtml(moment.name)}</strong><span>${escapeHtml(instruction)}</span></li>`;
    });
    const context = dialog.dataset.context ? `<span class="schedule-context">${escapeHtml(dialog.dataset.context)}</span>` : "";

    dialogContent.innerHTML = `
      <div class="lesson-title-block">
        <span class="eyebrow">${escapeHtml(grade.name)} · Bimestre ${bimester.number} · Semana ${week.week}${lesson.slot !== "Única" ? ` · Clase ${lesson.slot}` : ""}</span>
        ${context}
        <h2 id="lesson-dialog-title">${escapeHtml(lesson.title)}</h2>
        <p>${escapeHtml(lesson.activity)}</p>
        <button class="small-button edit-button no-print" data-action="edit-curriculum">Editar contenido</button>
      </div>
      <div class="plan-grid">
        <section class="plan-block"><span class="label">Meta musical</span><p>${escapeHtml(lesson.musicalObjective)}</p></section>
        <section class="plan-block"><span class="label">Formación humana</span><p>${escapeHtml(lesson.formativeObjective)}</p></section>
        <section class="plan-block"><span class="label">Lenguaje musical</span><p>${escapeHtml(lesson.language || (bimester.languageKeys || []).join(" · "))}</p></section>
        <section class="plan-block"><span class="label">English classroom language</span><p>${escapeHtml(lesson.english || (bimester.englishPhrases || []).join(" / "))}</p></section>
        <section class="plan-block full"><span class="label">Guion de la clase · cuatro momentos</span><ol class="today-plan">${todayPlan.join("")}</ol></section>
        ${bimester.repertoire ? `<section class="plan-block full"><span class="label">Repertorio del bimestre</span><p><strong>${escapeHtml(bimester.repertoire.focus)}</strong></p>${list(bimester.repertoire.pieces)}</section>` : ""}
        ${bimester.repertoireText ? `<section class="plan-block full"><span class="label">Repertorio del bimestre</span><p>${escapeHtml(bimester.repertoireText)}</p></section>` : ""}
        <section class="plan-block"><span class="label">Preparar</span>${list(lesson.materials || [])}</section>
        <section class="plan-block"><span class="label">Interacción visual / recurso</span><p>${escapeHtml(lesson.visual)}</p></section>
        <section class="plan-block"><span class="label">Evidencia de salida</span><p>${escapeHtml(lesson.evidence)}</p></section>
        <section class="plan-block"><span class="label">English word bank del bimestre</span><p>${bimester.english.map((word) => `<span class="tag">${escapeHtml(word)}</span>`).join(" ")}</p></section>
        <section class="plan-block full no-print">
          <span class="label">Seguimiento local</span>
          <label class="checkbox-row"><input type="checkbox" id="prepared-check" ${isPrepared(key) ? "checked" : ""} /> Clase preparada</label>
          <label for="teacher-notes" class="label" style="margin-top:1rem;display:block">Notas del profesor</label>
          <textarea id="teacher-notes" class="notes-area" placeholder="Ajustes de repertorio, materiales, estudiantes por observar o decisiones para la siguiente clase…">${escapeHtml(noteFor(key))}</textarea>
          <div class="button-row"><button class="button" data-action="save-lesson" data-key="${key}">Guardar notas</button><button class="button secondary" data-action="print-lesson">Imprimir planeación</button></div>
        </section>
      </div>`;
  }

  function editField(name, label, value, multiline = true) {
    const control = multiline
      ? `<textarea id="edit-${name}" name="${name}" rows="${name === "materials" ? 5 : 3}">${escapeHtml(value)}</textarea>`
      : `<input id="edit-${name}" name="${name}" value="${escapeHtml(value)}" />`;
    return `<label class="edit-field" for="edit-${name}"><span>${escapeHtml(label)}</span>${control}</label>`;
  }

  function adaptRoutine(routine, duration) {
    if (!duration || ![40, 45].includes(duration)) return routine;
    const stops = duration === 40 ? [0, 5, 15, 34, 40] : [0, 6, 18, 38, 45];
    return routine.map((moment, index) => ({ ...moment, time: `${stops[index]}–${stops[index + 1]}` }));
  }

  function saveCurriculumEdit() {
    const { key } = currentDialogLesson();
    const form = document.querySelector("#lesson-edit-form");
    if (!form) return;
    const values = Object.fromEntries(new FormData(form).entries());
    values.materials = String(values.materials || "").split(/\n+/).map((item) => item.trim()).filter(Boolean);
    state.overrides[key] = values;
    localStorage.setItem("st-curriculum-overrides", JSON.stringify(state.overrides));
    renderLessonDialog(false);
  }

  function resetCurriculumEdit() {
    const { key } = currentDialogLesson();
    if (!window.confirm("¿Restaurar el texto original de esta clase?")) return;
    delete state.overrides[key];
    localStorage.setItem("st-curriculum-overrides", JSON.stringify(state.overrides));
    renderLessonDialog(false);
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

  function togglePrepared(key) {
    localStorage.setItem(`st-prepared-${key}`, isPrepared(key) ? "false" : "true");
    route();
  }

  function recordFromAction(target) {
    return {
      id: `${target.dataset.group}-${Date.now()}`,
      group: target.dataset.group,
      entryId: target.dataset.entry,
      gradeId: target.dataset.grade,
      bimester: Number(target.dataset.bimester),
      week: Number(target.dataset.week),
      lessonIndex: Number(target.dataset.lesson),
      postponedFrom: state.date,
      eligibleDate: addDaysIso(state.date, 7),
    };
  }

  function currentFromAction(target) {
    const record = recordFromAction(target);
    const resolved = resolveLessonRecord(record);
    const entry = (data.schedule || []).find((item) => item.id === record.entryId);
    return resolved && entry ? { ...resolved, entry } : null;
  }

  function postponeCurrent(target) {
    const record = recordFromAction(target);
    state.postponed[record.group] = record;
    savePostponed();
    showToast(`Clase de ${record.group} aplazada hasta la siguiente semana`);
    renderToday();
  }

  function usePendingAndMoveCurrent(target) {
    const group = target.dataset.group;
    const pending = pendingForGroup(group);
    if (!pending) return;
    state.postponed[group] = recordFromAction(target);
    savePostponed();
    showToast(`Harás la pendiente; la clase actual de ${group} pasó a la próxima semana`);
    renderToday();
    const entry = (data.schedule || []).find((item) => item.id === target.dataset.entry);
    openLesson(pending.grade.id, pending.bimester.number, pending.week.week, pending.lessonIndex, `${group} · clase pendiente elegida`, entry?.minutes || "");
  }

  function keepCurrentAndMovePending(group) {
    const record = state.postponed[group];
    if (!record) return;
    record.eligibleDate = addDaysIso(state.date, 7);
    record.lastDeferredDate = state.date;
    savePostponed();
    showToast(`La clase pendiente de ${group} seguirá disponible la próxima semana`);
    renderToday();
  }

  function combineLessons(target) {
    const group = target.dataset.group;
    const pending = pendingForGroup(group);
    const current = currentFromAction(target);
    if (!pending || !current) return;
    if (!window.confirm(`¿Crear un plan combinado para ${group}? La clase pendiente dejará de aparecer por separado.`)) return;
    delete state.postponed[group];
    savePostponed();
    renderToday();
    openCombinedPlan(pending, current);
  }

  function openCombinedPlan(pending, current) {
    const duration = current.entry.minutes || 45;
    const baseRoutine = current.grade.stage === "primaria" ? data.meta.primaryRoutine : data.meta.preschoolRoutine;
    const routine = adaptRoutine(baseRoutine, duration);
    const instructions = [
      "Entrada, regulación, señal de silencio, postura y pulso común.",
      `Cantar el repertorio y conectar los dos objetivos: ${pending.lesson.musicalObjective} / ${current.lesson.musicalObjective}`,
      `Primer mini-reto: ${pending.lesson.activity} Después, segundo mini-reto: ${current.lesson.activity}`,
      `Compartir una evidencia breve de cada contenido: ${pending.lesson.evidence} / ${current.lesson.evidence}`,
    ];
    const materials = [...new Set([...(pending.lesson.materials || []), ...(current.lesson.materials || [])])];
    dialog.dataset.lessonKey = "";
    dialog.dataset.context = `${current.entry.group} · plan combinado`;
    dialogContent.innerHTML = `
      <div class="lesson-title-block combined-heading">
        <span class="eyebrow">${escapeHtml(current.entry.group)} · ${duration} minutos</span>
        <h2 id="lesson-dialog-title">Plan combinado: pendiente + clase actual</h2>
        <p>Conserva un solo inicio, un bloque vocal común y dos mini-retos. Si el tiempo se reduce, protege el canto y una evidencia breve de cada objetivo.</p>
      </div>
      <div class="plan-grid">
        <section class="plan-block"><span class="label">Contenido pendiente</span><h3>${escapeHtml(pending.lesson.title)}</h3><p>${escapeHtml(pending.lesson.musicalObjective)}</p></section>
        <section class="plan-block"><span class="label">Contenido actual</span><h3>${escapeHtml(current.lesson.title)}</h3><p>${escapeHtml(current.lesson.musicalObjective)}</p></section>
        <section class="plan-block full"><span class="label">Guion combinado · cuatro momentos</span><ol class="today-plan">${routine.map((moment, index) => `<li><strong>${escapeHtml(moment.time)} min · ${escapeHtml(moment.name)}</strong><span>${escapeHtml(instructions[index])}</span></li>`).join("")}</ol></section>
        <section class="plan-block"><span class="label">Formación humana</span><p>${escapeHtml(current.lesson.formativeObjective)}</p></section>
        <section class="plan-block"><span class="label">Preparar</span>${list(materials)}</section>
        <section class="plan-block full no-print"><div class="button-row"><button class="button secondary" data-action="print-lesson">Imprimir plan combinado</button></div></section>
      </div>`;
    if (!dialog.open) dialog.showModal();
  }

  function curriculumStorageItems(prefix) {
    const result = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(prefix)) result[key] = localStorage.getItem(key);
    }
    return result;
  }

  function exportAdjustments() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      curriculumOverrides: state.overrides,
      postponedLessons: state.postponed,
      notes: curriculumStorageItems("st-note-"),
      prepared: curriculumStorageItems("st-prepared-"),
      settings: {
        bimester: state.bimester,
        week: state.week,
        date: state.date,
        day: state.day,
        gradeBimesters: state.gradeBimesters,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ajustes-curriculo-musica-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("Respaldo exportado");
  }

  async function importAdjustments(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      if (payload.version !== 1 || typeof payload.curriculumOverrides !== "object") throw new Error("Formato no reconocido");
      state.overrides = payload.curriculumOverrides || {};
      state.postponed = payload.postponedLessons || {};
      localStorage.setItem("st-curriculum-overrides", JSON.stringify(state.overrides));
      savePostponed();
      Object.entries(payload.notes || {}).forEach(([key, value]) => localStorage.setItem(key, value));
      Object.entries(payload.prepared || {}).forEach(([key, value]) => localStorage.setItem(key, value));
      if (payload.settings) {
        state.bimester = Number(payload.settings.bimester) || state.bimester;
        state.week = Number(payload.settings.week) || state.week;
        state.date = payload.settings.date || state.date;
        state.day = weekdayFromIso(state.date);
        state.gradeBimesters = payload.settings.gradeBimesters || state.gradeBimesters;
        localStorage.setItem("st-bimester", state.bimester);
        localStorage.setItem("st-week", state.week);
        localStorage.setItem("st-date", state.date);
        localStorage.setItem("st-day", state.day);
        localStorage.setItem("st-grade-bimesters", JSON.stringify(state.gradeBimesters));
      }
      showToast("Ajustes importados correctamente");
      route();
    } catch (_error) {
      showToast("No fue posible importar ese archivo", true);
    } finally {
      event.target.value = "";
    }
  }

  function showToast(message, error = false) {
    document.querySelector(".site-toast")?.remove();
    const toast = document.createElement("div");
    toast.className = `site-toast ${error ? "error" : ""}`;
    toast.setAttribute("role", "status");
    toast.textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 2600);
  }

  function route() {
    const hash = window.location.hash.replace(/^#/, "") || "inicio";
    const [view, param] = hash.split("/");
    if (view === "hoy") renderToday();
    else if (view === "semana") renderWeek();
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
    if (action === "select-day") {
      state.date = moveDateToWeekday(state.date, target.dataset.day);
      state.day = target.dataset.day;
      localStorage.setItem("st-date", state.date);
      localStorage.setItem("st-day", state.day);
      if (window.location.hash !== "#hoy") window.location.hash = "hoy";
      else renderToday();
    }
    if (action === "open-lesson") openLesson(target.dataset.grade, target.dataset.bimester, target.dataset.week, target.dataset.lesson, target.dataset.context || "", target.dataset.duration || "");
    if (action === "edit-lesson") {
      openLesson(target.dataset.grade, target.dataset.bimester, target.dataset.week, target.dataset.lesson, target.dataset.context || "", target.dataset.duration || "");
      renderLessonDialog(true);
    }
    if (action === "postpone-current") postponeCurrent(target);
    if (action === "use-pending") usePendingAndMoveCurrent(target);
    if (action === "keep-current") keepCurrentAndMovePending(target.dataset.group);
    if (action === "combine-lessons") combineLessons(target);
    if (action === "toggle-prepared") togglePrepared(target.dataset.key);
    if (action === "save-lesson") saveLesson(target.dataset.key);
    if (action === "edit-curriculum") {
      if (dialog.dataset.lessonKey) saveLesson(dialog.dataset.lessonKey);
      renderLessonDialog(true);
    }
    if (action === "save-curriculum-edit") saveCurriculumEdit();
    if (action === "cancel-curriculum-edit") renderLessonDialog(false);
    if (action === "reset-curriculum-edit") resetCurriculumEdit();
    if (action === "export-adjustments") exportAdjustments();
    if (action === "choose-import") document.querySelector("#adjustments-file")?.click();
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
