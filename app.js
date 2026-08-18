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
    calendarAuto: localStorage.getItem("st-calendar-auto") !== "false",
    gradeBimesters: readJson("st-grade-bimesters", {}),
    overrides: readJson("st-curriculum-overrides", {}),
    wordOverrides: readJson("st-word-curriculum-overrides", {}),
    wordImportPreview: null,
    postponed: readJson("st-postponed-lessons", {}),
    repertoireBoard: readJson("st-repertoire-board", data.meta.repertoireLibrary || { general: [], mass: [], christmas: [] }),
    calendarPlan: readJson("st-calendar-plan", data.meta.schoolCalendar || []),
  };

  ["general", "mass", "christmas"].forEach((category) => {
    if (!Array.isArray(state.repertoireBoard[category])) state.repertoireBoard[category] = [];
  });
  if (!Array.isArray(state.calendarPlan)) state.calendarPlan = data.meta.schoolCalendar || [];
  const calendarVersion = String(data.meta.calendarVersion || 1);
  if (localStorage.getItem("st-calendar-version") !== calendarVersion) {
    const savedById = new Map(state.calendarPlan.map((item) => [item.id, item]));
    const defaults = (data.meta.schoolCalendar || []).map((item) => ({ ...item, ...(savedById.get(item.id) || {}) }));
    const defaultIds = new Set(defaults.map((item) => item.id));
    state.calendarPlan = [...defaults, ...state.calendarPlan.filter((item) => !defaultIds.has(item.id))];
    localStorage.setItem("st-calendar-plan", JSON.stringify(state.calendarPlan));
    localStorage.setItem("st-calendar-version", calendarVersion);
  }

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
        title: "Acuerdos, reglas y juego",
        activity: "En esta primera clase estableceremos los acuerdos y reglas de la clase, conoceremos a los niños y realizaremos un juego musical.",
        musicalObjective: "Participar en un juego musical y responder a las señales básicas de inicio, silencio y cierre.",
        formativeObjective: "Confianza, respeto y escucha: conocernos, acordar cómo participar y cuidar el aula.",
        evidence: "Participa en el juego y demuestra que comprende los acuerdos y las señales básicas.",
      };
    }
    if (lesson.slot === "A") {
      return {
        ...lesson,
        title: "Acuerdos, reglas y juego",
        activity: "En esta primera clase estableceremos los acuerdos y reglas de la clase, conoceremos a los niños y realizaremos un juego musical.",
        musicalObjective: "Participar en un juego musical y responder a las señales básicas de inicio, silencio y cierre.",
        formativeObjective: "Confianza, respeto y escucha: conocernos, acordar cómo participar y cuidar el aula.",
        evidence: "Participa en el juego y demuestra que comprende los acuerdos y las señales básicas.",
      };
    }
    return lesson;
  };
  const effectiveLesson = (grade, bimester, week, lesson) => {
    const key = lessonKey(grade, bimester, week, lesson.slot);
    return mergeLessonOverride(regularStartLesson(grade, bimester, week, lesson), key);
  };

  const wordArrayFields = new Set(["music", "languageKeys", "references", "english", "englishPhrases", "repertoirePieces", "materials"]);
  const lessonRecords = new Map();
  data.grades.forEach((grade) => grade.bimesters.forEach((bimester) => bimester.weeks.forEach((week) => week.lessons.forEach((lesson) => {
    lessonRecords.set(lessonKey(grade, bimester, week, lesson.slot), { grade, bimester, week, lesson });
  }))));

  function parseCurriculumTag(tag) {
    const parts = String(tag || "").split("|");
    if (parts[0] !== "cst" || parts.length < 3) return null;
    if (parts[1] === "meta") return { kind: "meta", field: parts[2] };
    if (parts[1] === "grade" && parts.length === 4) return { kind: "grade", gradeId: parts[2], field: parts[3] };
    if (["bimester", "exam"].includes(parts[1]) && parts.length === 5) return { kind: parts[1], gradeId: parts[2], bimester: Number(parts[3]), field: parts[4] };
    if (parts[1] === "lesson" && parts.length === 4) return { kind: "lesson", key: parts[2], field: parts[3] };
    return null;
  }

  const wordValue = (value) => Array.isArray(value) ? value.join("\n") : String(value ?? "");
  const normalizeWordValue = (value) => String(value ?? "")
    .replaceAll("\u00a0", " ")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
  const splitWordList = (value) => normalizeWordValue(value).split(/\n+/).map((item) => item.trim()).filter(Boolean);

  function curriculumFieldValue(tag) {
    const parsed = parseCurriculumTag(tag);
    if (!parsed || parsed.kind === "meta") return null;
    const grade = parsed.gradeId ? gradeById(parsed.gradeId) : null;
    const bimester = grade && parsed.bimester ? bimesterOf(grade, parsed.bimester) : null;
    if (parsed.kind === "grade") return wordValue(grade?.[parsed.field]);
    if (parsed.kind === "bimester") {
      if (!bimester) return null;
      if (parsed.field === "repertoireFocus") return wordValue(bimester.repertoire?.focus);
      if (parsed.field === "repertoirePieces") return wordValue(bimester.repertoire?.pieces);
      return wordValue(bimester[parsed.field]);
    }
    if (parsed.kind === "exam") return wordValue(bimester?.exam?.[parsed.field]);
    if (parsed.kind === "lesson") {
      const record = lessonRecords.get(parsed.key);
      if (!record) return null;
      const lesson = effectiveLesson(record.grade, record.bimester, record.week, record.lesson);
      if (parsed.field === "printedActivity") return wordValue(lesson.printedActivity || "no");
      if (parsed.field === "observerFocus") return wordValue(lesson.observerFocus || lesson.title);
      return wordValue(lesson[parsed.field]);
    }
    return null;
  }

  function describeCurriculumTag(tag) {
    const parsed = parseCurriculumTag(tag);
    if (!parsed) return tag;
    const labels = {
      annual: "Objetivo anual", bandRole: "Banda de guerra", formation: "Formación humana", title: "Título",
      objective: "Objetivo", studentGoal: "Meta para estudiantes", music: "Aprendizajes", languageKeys: "Lenguaje musical",
      references: "Referentes e historia", visual: "Visualidad y tecnología", english: "English word bank", englishPhrases: "English phrases",
      creation: "STEAM y conexión", evidence: "Evidencia", repertoireText: "Repertorio conductor", repertoireFocus: "Foco vocal",
      repertoirePieces: "Piezas", ability: "Habilidad evaluada", format: "Formato", musical: "Criterio musical", formative: "Criterio formativo",
      activity: "Qué harás", musicalObjective: "Meta musical", formativeObjective: "Formación humana", language: "Lenguaje musical",
      materials: "Preparar", printedActivity: "Actividad impresa", printedActivityName: "Cuál actividad", observerFocus: "Foco del observador",
    };
    if (parsed.kind === "lesson") {
      const record = lessonRecords.get(parsed.key);
      return `${record?.grade.name || parsed.key} · B${record?.bimester.number || ""} · Semana ${record?.week.week || ""} · ${labels[parsed.field] || parsed.field}`;
    }
    const grade = parsed.gradeId ? gradeById(parsed.gradeId) : null;
    const prefix = parsed.bimester ? `${grade?.name || parsed.gradeId} · Bimestre ${parsed.bimester}` : (grade?.name || parsed.gradeId || "Currículo");
    return `${prefix} · ${labels[parsed.field] || parsed.field}`;
  }

  function applyCurriculumField(tag, rawValue, persist = true) {
    const parsed = parseCurriculumTag(tag);
    if (!parsed || parsed.kind === "meta") return false;
    const value = normalizeWordValue(rawValue);
    const grade = parsed.gradeId ? gradeById(parsed.gradeId) : null;
    const bimester = grade && parsed.bimester ? bimesterOf(grade, parsed.bimester) : null;
    if (parsed.kind === "grade" && grade) grade[parsed.field] = value;
    else if (parsed.kind === "bimester" && bimester) {
      if (parsed.field === "repertoireFocus") {
        if (!bimester.repertoire) bimester.repertoire = { focus: "", pieces: [] };
        bimester.repertoire.focus = value;
      } else if (parsed.field === "repertoirePieces") {
        if (!bimester.repertoire) bimester.repertoire = { focus: "", pieces: [] };
        bimester.repertoire.pieces = splitWordList(value);
      } else bimester[parsed.field] = wordArrayFields.has(parsed.field) ? splitWordList(value) : value;
    } else if (parsed.kind === "exam" && bimester?.exam) bimester.exam[parsed.field] = value;
    else if (parsed.kind === "lesson") {
      if (!lessonRecords.has(parsed.key)) return false;
      const nextValue = parsed.field === "materials" ? splitWordList(value) : value;
      state.overrides[parsed.key] = { ...(state.overrides[parsed.key] || {}), [parsed.field]: nextValue };
      if (persist) localStorage.setItem("st-curriculum-overrides", JSON.stringify(state.overrides));
      return true;
    } else return false;
    state.wordOverrides[tag] = value;
    if (persist) localStorage.setItem("st-word-curriculum-overrides", JSON.stringify(state.wordOverrides));
    return true;
  }

  function applyStoredWordOverrides() {
    Object.entries(state.wordOverrides || {}).forEach(([tag, value]) => applyCurriculumField(tag, value, false));
  }

  function textFromWordControl(control, namespace) {
    const content = control.getElementsByTagNameNS(namespace, "sdtContent")[0];
    if (!content) return "";
    let result = "";
    const visit = (node) => {
      Array.from(node.childNodes || []).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) return;
        if (child.namespaceURI === namespace && child.localName === "t") result += child.textContent || "";
        else if (child.namespaceURI === namespace && ["br", "cr"].includes(child.localName)) result += "\n";
        else if (child.namespaceURI === namespace && child.localName === "tab") result += "\t";
        else if (child.namespaceURI === namespace && child.localName === "p") {
          if (result && !result.endsWith("\n")) result += "\n";
          visit(child);
          if (result && !result.endsWith("\n")) result += "\n";
        }
        else visit(child);
      });
    };
    visit(content);
    return normalizeWordValue(result);
  }

  async function readCurriculumWord(file) {
    if (!window.JSZip) throw new Error("No se cargó el lector de Word");
    const zip = await window.JSZip.loadAsync(file);
    const documentPart = zip.file("word/document.xml");
    if (!documentPart) throw new Error("El archivo no contiene un documento Word");
    const xml = new DOMParser().parseFromString(await documentPart.async("string"), "application/xml");
    if (xml.querySelector("parsererror")) throw new Error("No se pudo leer el contenido");
    const namespace = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    const fields = new Map();
    Array.from(xml.getElementsByTagNameNS(namespace, "sdt")).forEach((control) => {
      const tagElement = control.getElementsByTagNameNS(namespace, "tag")[0];
      const tag = tagElement?.getAttributeNS(namespace, "val") || tagElement?.getAttribute("w:val") || tagElement?.getAttribute("val");
      if (tag?.startsWith("cst|")) fields.set(tag, textFromWordControl(control, namespace));
    });
    if (fields.get("cst|meta|format") !== "CST_CURRICULUM_WORD_V1") throw new Error("Este Word no fue generado por el currículo CST");
    const changes = [];
    fields.forEach((after, tag) => {
      const before = curriculumFieldValue(tag);
      if (before === null) return;
      if (normalizeWordValue(before) !== normalizeWordValue(after)) changes.push({ tag, before: normalizeWordValue(before), after: normalizeWordValue(after), label: describeCurriculumTag(tag) });
    });
    return { stage: fields.get("cst|meta|stage") || "currículo", changes, totalFields: fields.size };
  }

  async function importCurriculumWord(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = await readCurriculumWord(file);
      state.wordImportPreview = { ...result, fileName: file.name };
      renderTools();
      document.querySelector("#word-import-preview")?.scrollIntoView({ behavior: "smooth", block: "center" });
      showToast(result.changes.length ? `${result.changes.length} cambios encontrados` : "El Word no contiene cambios nuevos");
    } catch (error) {
      showToast(error.message || "No fue posible leer ese Word", true);
    } finally {
      event.target.value = "";
    }
  }

  function renderWordImportPreview() {
    const preview = state.wordImportPreview;
    if (!preview) return `<div class="word-import-empty"><strong>Aún no has adjuntado un Word.</strong><span>La página comparará únicamente los campos reconocidos y no aplicará nada sin tu confirmación.</span></div>`;
    if (!preview.changes.length) return `<div class="word-import-empty success"><strong>Documento leído correctamente.</strong><span>${escapeHtml(preview.fileName)} contiene ${preview.totalFields} campos reconocidos, pero ninguno cambia el contenido actual.</span><button class="small-button secondary" data-action="cancel-word-import">Cerrar revisión</button></div>`;
    return `
      <div class="word-import-summary"><div><span class="eyebrow">Revisión pendiente</span><h3>${preview.changes.length} cambios encontrados · ${escapeHtml(preview.stage)}</h3><p>${escapeHtml(preview.fileName)} · Marca solamente lo que quieras llevar a la página.</p></div><div class="button-row"><button class="button" data-action="apply-word-import">Aplicar seleccionados</button><button class="button secondary" data-action="cancel-word-import">Cancelar</button></div></div>
      <div class="word-change-list">
        ${preview.changes.map((change, index) => `<label class="word-change"><input type="checkbox" data-word-change="${index}" checked /><span><strong>${escapeHtml(change.label)}</strong><span class="word-diff"><del>${escapeHtml(change.before || "(vacío)")}</del><ins>${escapeHtml(change.after || "(vacío)")}</ins></span></span></label>`).join("")}
      </div>`;
  }

  function applyWordImport() {
    const preview = state.wordImportPreview;
    if (!preview) return;
    const selected = Array.from(document.querySelectorAll("[data-word-change]:checked")).map((input) => preview.changes[Number(input.dataset.wordChange)]).filter(Boolean);
    if (!selected.length) {
      showToast("Selecciona al menos un cambio", true);
      return;
    }
    selected.forEach((change) => applyCurriculumField(change.tag, change.after));
    localStorage.setItem("st-curriculum-overrides", JSON.stringify(state.overrides));
    localStorage.setItem("st-word-curriculum-overrides", JSON.stringify(state.wordOverrides));
    state.wordImportPreview = null;
    showToast(`${selected.length} cambios aplicados al currículo`);
    renderTools();
  }

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

  function observerPhrases(lesson) {
    const focus = String(lesson.observerFocus || lesson.title || "el objetivo musical de la clase")
      .trim()
      .replace(/[.!?]+$/, "")
      .toLowerCase();
    return [
      { level: "Excelente", text: `Trabajó excelentemente en ${focus}.` },
      { level: "Parcial", text: `Trabajó parcialmente en ${focus}.` },
      { level: "No trabajó", text: `No trabajó en ${focus}.` },
    ];
  }

  function renderObserverPhrases(lesson, compact = false) {
    return `
      <div class="observer-grid ${compact ? "compact" : ""}">
        ${observerPhrases(lesson).map((item) => `
          <div class="observer-item">
            <span>${escapeHtml(item.level)}</span>
            <p>${escapeHtml(item.text)}</p>
            <button class="text-button no-print" data-action="copy-observer" data-copy="${escapeHtml(item.text)}">Copiar</button>
          </div>`).join("")}
      </div>`;
  }

  function printedActivityText(lesson) {
    if (lesson.printedActivity !== "yes") return "No";
    return lesson.printedActivityName?.trim() ? `Sí · ${lesson.printedActivityName.trim()}` : "Sí · por definir";
  }

  function assignedRepertoire(category, grade) {
    return (state.repertoireBoard[category] || []).filter((item) => {
      const assignment = normalized(item.grades || "");
      if (!assignment) return false;
      return assignment.includes(normalized(grade.name)) || assignment.includes("todos") || assignment.includes("varios");
    });
  }

  function calendarItem(id) {
    return state.calendarPlan.find((item) => item.id === id);
  }

  function eventsOnDate(iso) {
    return state.calendarPlan.filter((item) => iso >= item.date && iso <= (item.endDate || item.date));
  }

  function upcomingCalendarEvents(iso, days = 21) {
    const limit = addDaysIso(iso, days);
    return state.calendarPlan
      .filter((item) => item.date > iso && item.date <= limit)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4);
  }

  function lessonCalendarConnections(lesson) {
    return (lesson.calendarConnections || [])
      .map((connection) => ({ ...connection, calendar: calendarItem(connection.eventId) }))
      .filter((connection) => connection.calendar);
  }

  function lessonCalendarAction(lesson) {
    if (lesson.calendarAdjustment?.trim()) return lesson.calendarAdjustment.trim();
    return lessonCalendarConnections(lesson).map((item) => item.action).filter(Boolean).join(" ");
  }

  function calendarScopeMatches(event, grade) {
    return !event.gradeIds?.length || event.gradeIds.includes(grade.id);
  }

  function academicPeriodForDate(iso) {
    return (data.meta.academicPeriods || []).find((period) => iso >= period.start && iso <= period.end) || null;
  }

  function isNoClassDate(iso) {
    return eventsOnDate(iso).some((event) => event.noClass);
  }

  function groupSessionDates(group, grade, bimesterNumber) {
    const period = (data.meta.academicPeriods || []).find((item) => item.number === Number(bimesterNumber));
    if (!period) return [];
    const meetingDays = new Set((data.schedule || []).filter((item) => item.group === group).map((item) => item.day));
    const start = period.start < launchCalendar[grade.stage].regular ? launchCalendar[grade.stage].regular : period.start;
    const result = [];
    const cursor = new Date(`${start}T12:00:00Z`);
    const end = new Date(`${period.end}T12:00:00Z`);
    while (cursor <= end) {
      const iso = cursor.toISOString().slice(0, 10);
      if (meetingDays.has(weekdayFromIso(iso)) && !isNoClassDate(iso)) result.push(iso);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return result;
  }

  function flattenedBimesterLessons(bimester) {
    return bimester.weeks.flatMap((week) => week.lessons.map((lesson, lessonIndex) => ({ week, lesson, lessonIndex })));
  }

  function mappedPlanIndex(occurrence, actualCount, planCount) {
    if (planCount <= 1 || actualCount <= 1) return 0;
    return Math.round(((occurrence - 1) * (planCount - 1)) / (actualCount - 1));
  }

  function calendarCountsForGrade(grade, bimesterNumber) {
    const groups = [...new Set((data.schedule || []).filter((item) => item.gradeId === grade.id).map((item) => item.group))];
    return groups.map((group) => ({ group, count: groupSessionDates(group, grade, bimesterNumber).length }));
  }

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
              <a class="button secondary" href="#calendario">Ver calendario escolar</a>
              <a class="button secondary" href="#repertorio">Organizar repertorio</a>
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

  function resolveScheduledClass(entry) {
    const grade = gradeById(entry.gradeId);
    if (!grade) return null;
    const launch = launchCalendar[grade.stage];
    if (state.date <= launch.welcome) return null;
    const period = state.calendarAuto ? academicPeriodForDate(state.date) : null;
    const bimester = bimesterOf(grade, period?.number || state.bimester);
    if (!bimester) return null;
    let week;
    let lessonIndex;
    let occurrence = null;
    let sessionCount = null;
    let planIndex = null;
    let planCount = null;

    if (period) {
      const sessions = groupSessionDates(entry.group, grade, period.number);
      occurrence = sessions.indexOf(state.date) + 1;
      if (!occurrence) return null;
      const plan = flattenedBimesterLessons(bimester);
      sessionCount = sessions.length;
      planCount = plan.length;
      planIndex = mappedPlanIndex(occurrence, sessionCount, planCount);
      const resolved = plan[planIndex];
      if (!resolved) return null;
      week = resolved.week;
      lessonIndex = resolved.lessonIndex;
    } else {
      week = weekOf(bimester, state.week);
      if (!week) return null;
      const resolvedSlot = grade.stage === "preescolar" ? entry.slot : "Única";
      lessonIndex = week.lessons.findIndex((lesson) => lesson.slot === resolvedSlot);
      if (lessonIndex < 0) lessonIndex = 0;
    }
    const original = week.lessons[lessonIndex];
    const lesson = effectiveLesson(grade, bimester, week, original);
    const key = lessonKey(grade, bimester, week, original.slot);
    return { entry, grade, bimester, week, lesson, lessonIndex, key, occurrence, sessionCount, planIndex, planCount, automatic: Boolean(period) };
  }

  function renderToday() {
    setActiveNav("hoy");
    const currentPeriod = state.calendarAuto ? academicPeriodForDate(state.date) : null;
    const autoActive = Boolean(currentPeriod);
    if (currentPeriod) state.bimester = currentPeriod.number;
    const dayEvents = eventsOnDate(state.date);
    const upcomingEvents = upcomingCalendarEvents(state.date);
    const noRegularClass = dayEvents.some((item) => item.noClass);
    const scheduled = noRegularClass ? [] : (data.schedule || [])
      .filter((entry) => entry.day === state.day)
      .map(resolveScheduledClass)
      .filter(Boolean);
    const materials = [...new Set(scheduled.flatMap((item) => {
      const pending = pendingForGroup(item.entry.group);
      const currentPrinted = item.lesson.printedActivity === "yes" ? [`Actividad impresa: ${item.lesson.printedActivityName || "por definir"}`] : [];
      const pendingPrinted = pending?.lesson.printedActivity === "yes" ? [`Actividad impresa pendiente: ${pending.lesson.printedActivityName || "por definir"}`] : [];
      return [...(item.lesson.materials || []), ...currentPrinted, ...(pending?.lesson.materials || []), ...pendingPrinted];
    }))];
    const manualMaxWeeks = Math.max(...data.grades.map((grade) => bimesterOf(grade, state.bimester)?.weeks.length || 1));

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

        <section class="filters today-filters" aria-label="Seleccionar fecha y modo de seguimiento">
          <div class="field"><label for="today-date-select">Fecha</label><input id="today-date-select" type="date" value="${state.date}" /></div>
          <label class="calendar-auto-toggle"><input id="calendar-auto-check" type="checkbox" ${state.calendarAuto ? "checked" : ""} /><span><strong>Seguir calendario automáticamente</strong><small>${currentPeriod ? `Bimestre ${currentPeriod.number} · ${escapeHtml(currentPeriod.label)}` : "Activa el cálculo de encuentros reales"}</small></span></label>
          <div class="field"><label for="today-bimester-select">Bimestre ${autoActive ? "automático" : "manual"}</label><select id="today-bimester-select" ${autoActive ? "disabled" : ""}>${[1, 2, 3, 4].map((n) => `<option value="${n}" ${n === state.bimester ? "selected" : ""}>Bimestre ${n}</option>`).join("")}</select></div>
          <div class="field"><label for="today-week-select">Semana ${autoActive ? "calculada por grupo" : "manual"}</label><select id="today-week-select" ${autoActive ? "disabled" : ""}>${Array.from({ length: manualMaxWeeks }, (_, i) => i + 1).map((n) => `<option value="${n}" ${n === state.week ? "selected" : ""}>Semana ${n}</option>`).join("")}</select></div>
          <div class="day-tabs" role="group" aria-label="Día de la semana">
            ${dayOrder.map((day) => `<button class="day-tab ${day === state.day ? "active" : ""}" data-action="select-day" data-day="${day}">${displayDay(day)}<span>${(data.schedule || []).filter((item) => item.day === day).length}</span></button>`).join("")}
          </div>
        </section>

        ${dayEvents.length ? `<section class="calendar-day-banner panel ${noRegularClass ? "no-class" : ""}">
          <div><span class="eyebrow">Calendario institucional · hoy</span><h2>${noRegularClass ? "Agenda especial: no contar clase regular" : "Hito que orienta la música de hoy"}</h2></div>
          <div class="calendar-day-list">${dayEvents.map((event) => `<article><span class="tag">${escapeHtml(event.type)}</span><h3>${escapeHtml(event.title)}</h3><p>${escapeHtml(event.musicPlan)}</p><p class="muted"><strong>Preparar:</strong> ${escapeHtml(event.preparation)}</p></article>`).join("")}</div>
          <a class="text-button" href="#calendario">Abrir calendario musical completo →</a>
        </section>` : upcomingEvents.length ? `<section class="calendar-upcoming panel">
          <div><span class="eyebrow">Próximos 21 días</span><h2>Hitos institucionales que conviene anticipar</h2></div>
          <div class="calendar-upcoming-list">${upcomingEvents.map((event) => `<span><strong>${escapeHtml(displayDate(event.date))}</strong>${escapeHtml(event.title)}</span>`).join("")}</div>
          <a class="text-button" href="#calendario">Ver preparación curricular →</a>
        </section>` : ""}

        ${state.bimester === 1 ? `<section class="launch-notice panel">
          <div><span class="eyebrow">Inicio especial del año</span><h2>Los días de bienvenida quedan sin planeación musical</h2></div>
          <p>El <strong>miércoles 12</strong> no se programa clase de Primaria y el <strong>jueves 13</strong> no se programa clase de Preescolar. Las clases regulares comienzan el jueves 13 y el viernes 14, respectivamente.</p>
          <p class="muted">La agenda automática continúa durante todo el año: descuenta recesos y jornadas sin clase, y calcula la secuencia propia de cada grupo.</p>
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
            <span class="eyebrow">${noRegularClass ? "Calendario escolar" : "Día sin clases regulares"}</span>
            <h2>${noRegularClass ? "La agenda institucional reemplaza las clases regulares." : "No tienes clases de música programadas."}</h2>
            <p>${noRegularClass ? "La secuencia no avanza automáticamente. Usa Aplazar en la última clase disponible si necesitas conservar el contenido pendiente." : "Puedes usar esta vista para preparar la semana o seleccionar otro día."}</p>
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
    document.querySelector("#calendar-auto-check").addEventListener("change", (event) => {
      state.calendarAuto = event.target.checked;
      localStorage.setItem("st-calendar-auto", state.calendarAuto ? "true" : "false");
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
    const { entry, grade, bimester, week, lesson, lessonIndex, key, occurrence, sessionCount, planIndex, planCount, automatic } = item;
    const prepared = isPrepared(key);
    const calendarConnections = lessonCalendarConnections(lesson);
    const calendarAction = lessonCalendarAction(lesson);
    const pending = pendingForGroup(entry.group);
    const queued = state.postponed[entry.group];
    const actionData = `data-entry="${entry.id}" data-group="${escapeHtml(entry.group)}" data-grade="${grade.id}" data-bimester="${bimester.number}" data-week="${week.week}" data-lesson="${lessonIndex}"`;
    return `
      <details class="daily-class-card ${grade.stage === "preescolar" ? "preschool" : ""}">
        <summary class="daily-class-summary">
          <div class="daily-time"><strong>${escapeHtml(entry.start)}</strong><span>${escapeHtml(entry.end)}</span></div>
          <div class="daily-summary-main">
            <div class="daily-summary-heading">
              <div>${stageBadge(grade)}<h2>${escapeHtml(entry.group)}</h2><p>Bimestre ${bimester.number} · Semana ${week.week}${lesson.slot !== "Única" ? ` · Clase ${lesson.slot}` : ""}${automatic ? ` · encuentro ${occurrence} de ${sessionCount}` : " · selección manual"}</p></div>
              <div class="daily-summary-status">
                ${pending ? `<span class="summary-alert pending">Clase pendiente</span>` : queued ? `<span class="summary-alert pending">Aplazada en cola</span>` : ""}
                ${calendarConnections.length ? `<span class="summary-alert calendar">Calendario</span>` : ""}
                <span class="status-badge ${prepared ? "ready" : ""}">${prepared ? "Preparada ✓" : "Por preparar"}</span>
                <span class="expand-hint"><span class="closed-label">Abrir</span><span class="open-label">Cerrar</span><i aria-hidden="true"></i></span>
              </div>
            </div>
            <p class="daily-summary-preview"><strong>${escapeHtml(lesson.title)}</strong><span>${escapeHtml(lesson.musicalObjective)}</span></p>
          </div>
        </summary>
        <div class="daily-class-main daily-class-expanded">
          ${pending ? renderCarryoverChoices(pending, item, actionData) : ""}
          ${queued && !pending ? `<div class="queued-notice"><strong>Ya existe una clase aplazada.</strong><span>Aparecerá como opción desde el ${escapeHtml(displayDate(queued.eligibleDate))}.</span></div>` : ""}
          ${calendarConnections.length ? `<div class="lesson-calendar-link"><span class="label">Ajuste por calendario escolar</span><strong>${calendarConnections.map((item) => `${item.calendar?.title || item.event} · ${displayDate(item.calendar?.date || item.date)}`).map(escapeHtml).join(" · ")}</strong><p>${escapeHtml(calendarAction)}</p></div>` : ""}
          <div class="daily-goal"><span class="label">Meta de hoy</span><strong>${escapeHtml(lesson.musicalObjective)}</strong></div>
          <div class="daily-details">
            <section><span class="label">Qué harás</span><h3>${escapeHtml(lesson.title)}</h3><p>${escapeHtml(lesson.activity)}</p></section>
            <section><span class="label">Formación humana</span><p>${escapeHtml(lesson.formativeObjective)}</p></section>
            <section><span class="label">Lenguaje musical + English</span><p>${escapeHtml(lesson.language || "Lenguaje del bimestre")}</p><p class="muted">${escapeHtml(lesson.english || "")}</p></section>
            <section><span class="label">Evidencia + actividad impresa</span><p>${escapeHtml(lesson.evidence)}</p><p class="muted"><strong>Actividad impresa:</strong> ${escapeHtml(printedActivityText(lesson))}</p></section>
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
          <details class="observer-panel">
            <summary>Frases para el observador</summary>
            ${renderObserverPhrases(lesson, true)}
          </details>
        </div>
      </details>`;
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
    const maxWeeks = Math.max(...visibleGrades.map((grade) => bimesterOf(grade, state.bimester)?.weeks.length || 1));
    if (state.week > maxWeeks) state.week = maxWeeks;
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
          <div class="field"><label for="week-select">Semana disponible</label><select id="week-select">${Array.from({ length: maxWeeks }, (_, i) => i + 1).map((n) => `<option value="${n}" ${n === state.week ? "selected" : ""}>Semana ${n}</option>`).join("")}</select></div>
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
    if (!week) return `<article class="lesson-card unavailable-week"><div class="lesson-card-header"><div>${stageBadge(grade)}<h3>${escapeHtml(grade.name)}</h3></div><span class="status-badge">Secuencia terminada</span></div><div class="lesson-card-body"><p>Este grado tiene ${bimester.plannedWeeks} semanas y ${bimester.plannedEncounters} encuentros planeados en el bimestre ${bimester.number}.</p></div></article>`;
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
                ${lessonCalendarConnections(lesson).length ? `<div class="formation-line calendar-line"><span class="label">Calendario escolar</span><p><strong>${lessonCalendarConnections(lesson).map((item) => item.calendar?.title || item.event).map(escapeHtml).join(" · ")}</strong><br>${escapeHtml(lessonCalendarAction(lesson))}</p></div>` : ""}
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
              <div class="summary-side"><span class="eyebrow">${grade.stage === "preescolar" ? "Papel en la banda de guerra" : "Formación anual"}</span><p>${escapeHtml(grade.stage === "preescolar" ? grade.bandRole : grade.formation)}</p></div>
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
    const calendarEvents = state.calendarPlan.filter((event) => Number(event.bimester) === bimester.number && calendarScopeMatches(event, grade));
    const groupCounts = calendarCountsForGrade(grade, bimester.number);
    const period = (data.meta.academicPeriods || []).find((item) => item.number === bimester.number);
    return `
      <section class="bimester-hero">
        <span class="eyebrow">Bimestre ${bimester.number}</span>
        <h2>${escapeHtml(bimester.title)}</h2>
        <div class="student-goal"><span class="label">Meta para estudiantes · ${bimester.plannedEncounters} encuentros planeados</span><strong>${escapeHtml(bimester.studentGoal || bimester.objective)}</strong></div>
        <div class="real-calendar-counts">
          <div><span class="label">Ventana real</span><strong>${escapeHtml(period?.label || "Calendario institucional")}</strong></div>
          <div><span class="label">Planeación de ${escapeHtml(grade.name)}</span><strong>${bimester.plannedEncounters} encuentros · ${bimester.plannedWeeks} semanas de secuencia</strong></div>
          <div class="group-count-list"><span class="label">Clases reales por grupo</span>${groupCounts.map((item) => `<span><strong>${escapeHtml(item.group)}</strong>${item.count} encuentros</span>`).join("")}</div>
        </div>
        ${groupCounts.some((item) => item.count !== bimester.plannedEncounters) ? `<p class="calendar-count-note">Cuando un grupo tiene un encuentro menos, la agenda automática distribuye la secuencia para conservar la primera clase, los hitos esenciales y el cierre del bimestre.</p>` : ""}
        ${bimester.number === 2 ? `<div class="christmas-focus"><div><span class="label">Enfoque transversal</span><strong>Navidad</strong></div><p>Todo el repertorio del bimestre será navideño. Los títulos y cursos se decidirán en la sección <a href="#repertorio">Repertorio</a>.</p></div>` : ""}
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
        ${calendarEvents.length ? `<div class="bimester-calendar"><div><span class="label">Calendario escolar que orienta este bimestre</span><p>Estos hitos ya aparecen vinculados en las clases correspondientes.</p></div><div>${calendarEvents.map((event) => `<span><strong>${escapeHtml(displayDate(event.date))}</strong>${escapeHtml(event.title)}</span>`).join("")}</div><a class="text-button" href="#calendario">Ver y editar la respuesta musical →</a></div>` : ""}
        ${bimester.exam ? renderExam(bimester.exam) : ""}
      </section>

      <div class="section-heading"><div><span class="eyebrow">Secuencia real</span><h2>${bimester.plannedEncounters} encuentros planeados</h2></div><p>La cantidad cambia según el calendario de cada bimestre. Abre cualquier encuentro para ver la planeación completa.</p></div>
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
        <span class="label">Examen bimestral · dentro de la ventana institucional</span>
        <h3>${escapeHtml(exam.ability)} + ${escapeHtml(exam.formation)}</h3>
        <p><strong>Formato viable en 45 minutos:</strong> ${escapeHtml(exam.format)}</p>
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
                  <div><span class="label">${lesson.slot === "Única" ? "Clase semanal" : `Clase ${lesson.slot}`}</span><h4>${escapeHtml(lesson.title)}</h4><p>${escapeHtml(lesson.activity)}</p><p class="mini-formation"><strong>Formación:</strong> ${escapeHtml(lesson.formativeObjective)}</p><p class="muted"><strong>Lenguaje:</strong> ${escapeHtml(lesson.language || "")}</p>${lessonCalendarConnections(lesson).length ? `<p class="mini-calendar"><strong>Calendario:</strong> ${lessonCalendarConnections(lesson).map((item) => item.calendar?.title || item.event).map(escapeHtml).join(" · ")}</p>` : ""}</div>
                  <button class="small-button secondary" data-action="open-lesson" data-grade="${grade.id}" data-bimester="${bimester.number}" data-week="${week.week}" data-lesson="${index}">Planear</button>
                </article>`;
              },
            )
            .join("")}
        </div>
      </div>`;
  }

  function saveCalendarPlan() {
    localStorage.setItem("st-calendar-plan", JSON.stringify(state.calendarPlan));
  }

  function renderCalendar() {
    setActiveNav("calendario");
    const grouped = [1, 2, 3, 4].map((bimester) => ({
      bimester,
      events: state.calendarPlan.filter((item) => Number(item.bimester) === bimester).sort((a, b) => a.date.localeCompare(b.date)),
    }));
    app.innerHTML = `
      <div class="page">
        <header class="page-header calendar-header">
          <div><span class="eyebrow">Año escolar 2026–2027</span><h1>Calendario musical institucional</h1><p>Cada evento tiene una respuesta curricular concreta. Puedes editar el propósito, la preparación, el alcance y las fechas; los cambios se guardan en este navegador.</p></div>
          <div class="button-row"><button class="button" data-action="add-calendar-event">Agregar evento</button><button class="button secondary" data-action="reset-calendar">Restaurar calendario</button><button class="button secondary" data-action="export-adjustments">Exportar respaldo</button></div>
        </header>

        <section class="calendar-principles panel">
          <div><strong>Preparar antes</strong><span>Los montajes aparecen vinculados en las semanas previas, no solamente el día del acto.</span></div>
          <div><strong>Reutilizar evidencia</strong><span>Una presentación puede reemplazar el examen cuando demuestra la habilidad focal.</span></div>
          <div><strong>No sobrecargar</strong><span>Los cursos no seleccionados conservan su secuencia y usan el evento como referente.</span></div>
        </section>

        <nav class="calendar-jumps" aria-label="Ir a un bimestre">${grouped.map((group) => `<button data-action="scroll-calendar" data-target="calendar-b${group.bimester}">Bimestre ${group.bimester}<span>${group.events.length}</span></button>`).join("")}</nav>
        ${grouped.map((group) => `
          <section class="calendar-period" id="calendar-b${group.bimester}">
            <div class="section-heading"><div><span class="eyebrow">Secuencia institucional</span><h2>Bimestre ${group.bimester}</h2></div><p>${group.events.length} hitos incluidos en la planeación.</p></div>
            <div class="calendar-event-list">${group.events.map(renderCalendarEvent).join("")}</div>
          </section>`).join("")}
      </div>`;
  }

  function renderCalendarEvent(event) {
    const range = event.endDate && event.endDate !== event.date ? `${displayDate(event.date)} – ${displayDate(event.endDate)}` : displayDate(event.date);
    return `
      <article class="calendar-event-card ${event.noClass ? "no-class" : ""}">
        <div class="calendar-event-date"><span>${escapeHtml(event.type)}</span><strong>${escapeHtml(range)}</strong></div>
        <div class="calendar-event-edit">
          <label><span>Evento</span><input value="${escapeHtml(event.title)}" data-calendar-field="title" data-id="${escapeHtml(event.id)}" /></label>
          <div class="calendar-small-fields">
            <label><span>Inicio</span><input type="date" value="${escapeHtml(event.date)}" data-calendar-field="date" data-id="${escapeHtml(event.id)}" /></label>
            <label><span>Final</span><input type="date" value="${escapeHtml(event.endDate || "")}" data-calendar-field="endDate" data-id="${escapeHtml(event.id)}" /></label>
            <label><span>Bimestre</span><select data-calendar-field="bimester" data-id="${escapeHtml(event.id)}">${[1, 2, 3, 4].map((number) => `<option value="${number}" ${Number(event.bimester) === number ? "selected" : ""}>${number}</option>`).join("")}</select></label>
            <label><span>Tipo</span><input value="${escapeHtml(event.type)}" data-calendar-field="type" data-id="${escapeHtml(event.id)}" /></label>
            <label><span>Alcance</span><input value="${escapeHtml(event.scope)}" data-calendar-field="scope" data-id="${escapeHtml(event.id)}" /></label>
          </div>
          <label><span>Respuesta musical / ajuste curricular</span><textarea rows="3" data-calendar-field="musicPlan" data-id="${escapeHtml(event.id)}">${escapeHtml(event.musicPlan)}</textarea></label>
          <label><span>Qué debo preparar o confirmar</span><textarea rows="2" data-calendar-field="preparation" data-id="${escapeHtml(event.id)}">${escapeHtml(event.preparation)}</textarea></label>
          <div class="calendar-event-footer"><label class="checkbox-row"><input type="checkbox" ${event.noClass ? "checked" : ""} data-calendar-field="noClass" data-id="${escapeHtml(event.id)}" /> Reemplaza las clases regulares</label><button class="text-button danger" data-action="delete-calendar-event" data-id="${escapeHtml(event.id)}">Eliminar</button></div>
        </div>
      </article>`;
  }

  function updateCalendarItem(target) {
    const event = state.calendarPlan.find((item) => item.id === target.dataset.id);
    if (!event) return;
    const field = target.dataset.calendarField;
    event[field] = field === "noClass" ? target.checked : field === "bimester" ? Number(target.value) : target.value;
    saveCalendarPlan();
  }

  function addCalendarEvent() {
    const id = `calendar-${Date.now()}`;
    state.calendarPlan.push({
      id,
      date: state.date,
      title: "Nuevo evento institucional",
      bimester: state.bimester,
      type: "Evento",
      scope: "Por definir",
      gradeIds: [],
      musicPlan: "Definir cómo este evento modifica o enriquece la clase de música.",
      preparation: "Confirmar participantes, repertorio, producto y fechas de ensayo.",
    });
    saveCalendarPlan();
    renderCalendar();
    document.querySelector(`[data-calendar-field="title"][data-id="${id}"]`)?.focus();
  }

  function deleteCalendarEvent(id) {
    const event = state.calendarPlan.find((item) => item.id === id);
    if (!event || !window.confirm(`¿Eliminar “${event.title}” del calendario musical?`)) return;
    state.calendarPlan = state.calendarPlan.filter((item) => item.id !== id);
    saveCalendarPlan();
    renderCalendar();
  }

  function resetCalendarPlan() {
    if (!window.confirm("¿Restaurar el calendario musical institucional y descartar sus cambios locales?")) return;
    state.calendarPlan = JSON.parse(JSON.stringify(data.meta.schoolCalendar || []));
    saveCalendarPlan();
    renderCalendar();
  }

  const repertoireSections = [
    {
      key: "general",
      eyebrow: "Banco general",
      title: "Canciones y piezas por asignar",
      description: "Todas comienzan sin curso. Escribe uno o varios grados solamente cuando decidas quién las montará.",
    },
    {
      key: "mass",
      eyebrow: "Primaria",
      title: "Canciones de misa",
      description: "Lista editable para reservar algunos minutos de canto litúrgico en las clases de Primaria.",
    },
    {
      key: "christmas",
      eyebrow: "Bimestre 2",
      title: "Canciones de Navidad",
      description: "El repertorio del segundo bimestre será navideño. Los títulos se agregarán y asignarán aquí más adelante.",
    },
  ];

  function saveRepertoireBoard() {
    localStorage.setItem("st-repertoire-board", JSON.stringify(state.repertoireBoard));
  }

  function renderRepertoireBoard() {
    setActiveNav("repertorio");
    app.innerHTML = `
      <div class="page">
        <header class="page-header repertoire-header">
          <div>
            <span class="eyebrow">Currículo vivo</span>
            <h1>Repertorio editable</h1>
            <p>Organiza canciones sin fijarlas prematuramente. Puedes cambiar títulos, asignar uno o varios cursos, anotar instrumentos y agregar nuevas piezas.</p>
          </div>
          <button class="button secondary" data-action="export-adjustments">Exportar respaldo</button>
        </header>

        <section class="repertoire-guidance panel">
          <div><span class="label">Criterio común</span><p>La voz será el centro del montaje. Los instrumentos acompañarán o ampliarán la canción según lo que funcione con cada grupo.</p></div>
          <div><span class="label">Asignación flexible</span><p>El campo “Curso(s)” es libre: puedes escribir “Segundo”, “Transición A”, “Primero y Segundo” o “Todos”.</p></div>
          <div><span class="label">Guardado</span><p>Los cambios se guardan automáticamente en este navegador y se incluyen en el respaldo general.</p></div>
        </section>

        <datalist id="grade-options">
          ${["Sin asignar", "Prejardín", "Jardín", "Transición", "Primero", "Segundo", "Tercero", "Cuarto", "Quinto", "Varios cursos", "Todos"].map((option) => `<option value="${option}"></option>`).join("")}
        </datalist>

        ${repertoireSections.map((section) => renderRepertoireSection(section)).join("")}
      </div>`;
  }

  function renderRepertoireSection(section) {
    const items = state.repertoireBoard[section.key] || [];
    return `
      <section class="repertoire-manager panel" aria-labelledby="repertoire-${section.key}">
        <div class="repertoire-manager-heading">
          <div><span class="eyebrow">${escapeHtml(section.eyebrow)}</span><h2 id="repertoire-${section.key}">${escapeHtml(section.title)}</h2><p>${escapeHtml(section.description)}</p></div>
          <span class="status-badge">${items.length} ${items.length === 1 ? "pieza" : "piezas"}</span>
        </div>
        <div class="repertoire-list">
          ${items.length ? items.map((item) => renderRepertoireItem(section.key, item)).join("") : `<div class="empty-repertoire"><p>Aún no hay canciones en esta lista.</p></div>`}
        </div>
        <div class="repertoire-add">
          <label for="new-song-${section.key}"><span>Nueva canción o pieza</span><input id="new-song-${section.key}" placeholder="Escribe el título" /></label>
          <button class="small-button" data-action="add-repertoire" data-category="${section.key}">Agregar</button>
        </div>
      </section>`;
  }

  function renderRepertoireItem(category, item) {
    return `
      <article class="repertoire-item">
        <label class="repertoire-title-field"><span>Título</span><input value="${escapeHtml(item.title)}" data-repertoire-field="title" data-category="${category}" data-id="${escapeHtml(item.id)}" /></label>
        <label><span>Curso(s)</span><input list="grade-options" value="${escapeHtml(item.grades || "")}" placeholder="Sin asignar" data-repertoire-field="grades" data-category="${category}" data-id="${escapeHtml(item.id)}" /></label>
        <label><span>Montaje / instrumentos</span><input value="${escapeHtml(item.notes || "")}" placeholder="Voz, instrumento o decisión pendiente" data-repertoire-field="notes" data-category="${category}" data-id="${escapeHtml(item.id)}" /></label>
        <button class="icon-button repertoire-delete" data-action="delete-repertoire" data-category="${category}" data-id="${escapeHtml(item.id)}" aria-label="Eliminar ${escapeHtml(item.title)}">×</button>
      </article>`;
  }

  function addRepertoireItem(category) {
    const input = document.querySelector(`#new-song-${category}`);
    const title = input?.value.trim();
    if (!title) {
      showToast("Escribe primero el título", true);
      input?.focus();
      return;
    }
    state.repertoireBoard[category].push({ id: `${category}-${Date.now()}`, title, grades: "", notes: "" });
    saveRepertoireBoard();
    renderRepertoireBoard();
    showToast("Canción agregada");
  }

  function deleteRepertoireItem(category, id) {
    const item = state.repertoireBoard[category]?.find((entry) => entry.id === id);
    if (!item || !window.confirm(`¿Eliminar “${item.title}” de esta lista?`)) return;
    state.repertoireBoard[category] = state.repertoireBoard[category].filter((entry) => entry.id !== id);
    saveRepertoireBoard();
    renderRepertoireBoard();
  }

  function updateRepertoireItem(target) {
    const item = state.repertoireBoard[target.dataset.category]?.find((entry) => entry.id === target.dataset.id);
    if (!item) return;
    item[target.dataset.repertoireField] = target.value;
    saveRepertoireBoard();
  }

  function renderTools() {
    setActiveNav("herramientas");
    app.innerHTML = `
      <div class="page">
        <header class="page-header"><div><span class="eyebrow">Apoyos permanentes</span><h1>Herramientas del profesor</h1><p>Rutinas, evaluación, organización física, plataformas y documentos descargables.</p></div></header>

        <div class="section-heading"><div><span class="eyebrow">Primaria</span><h2>La clase de 45 minutos en cuatro momentos</h2></div></div>
        <section class="routine-grid">${data.meta.primaryRoutine.map(renderRoutine).join("")}</section>

        <div class="section-heading"><div><span class="eyebrow">Preescolar</span><h2>La clase en cuatro momentos</h2></div><p>Dos experiencias semanales; si son continuas, se realiza una pausa y un cambio claro de energía.</p></div>
        <section class="routine-grid">${data.meta.preschoolRoutine.map(renderRoutine).join("")}</section>

        <div class="section-heading"><div><span class="eyebrow">Evaluación de primaria</span><h2>Examen focal: dos criterios</h2></div></div>
        <section class="exam-grid">
          ${data.meta.examModel.map((part) => `<div class="tool-card panel"><strong style="font-size:1.55rem;color:var(--navy)">${part.weight} pts</strong><h3>${escapeHtml(part.name)}</h3><p class="muted">${escapeHtml(part.description)}</p></div>`).join("")}
        </section>

        <div class="section-heading"><div><span class="eyebrow">Preescolar</span><h2>Evidencias y banda de guerra final</h2></div></div>
        <section class="grade-summary">
          <div class="panel"><h3>Evaluación cualitativa</h3>${list(data.meta.preschoolAssessment)}</div>
          <div class="panel"><h3>Banda de guerra de preescolar · ${escapeHtml(data.meta.bandPlan.duration)}</h3><p>${escapeHtml(data.meta.bandPlan.principle)}</p>${list(data.meta.bandPlan.form)}</div>
        </section>

        <div class="section-heading"><div><span class="eyebrow">Word ↔ página</span><h2>Importar cambios desde el currículo editable</h2></div><p>Los cambios se comparan primero. Tú decides cuáles se aplican y quedan guardados en este navegador.</p></div>
        <section class="panel word-import-panel">
          <div class="word-import-steps"><span><strong>1.</strong> Descarga el Word de tu etapa.</span><span><strong>2.</strong> Edita los campos delimitados.</span><span><strong>3.</strong> Adjunta el archivo.</span><span><strong>4.</strong> Revisa y aplica.</span></div>
          <div class="button-row"><button class="button" data-action="choose-word-import">Adjuntar currículo Word editado</button></div>
          <input id="word-curriculum-file" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden />
          <div id="word-import-preview">${renderWordImportPreview()}</div>
          <p class="muted">La importación funciona con los Word descargados aquí. Si se eliminan los campos internos o se convierte el documento a otro formato, la página no podrá reconocerlo. El archivo se procesa localmente y no se sube a ningún servidor.</p>
        </section>

        <div class="section-heading"><div><span class="eyebrow">Aula</span><h2>Orden y materiales</h2></div></div>
        <section class="grade-summary">
          <div class="panel"><h3>Organización física</h3>${list(data.meta.classroom)}</div>
          <div class="panel"><h3>Sistema común de notas</h3><p>C–D–E–F–G–A–B–C′ · Do–Re–Mi–Fa–Sol–La–Ti–Do · números 1–8 · color · signo Curwen. El apoyo visual se retira gradualmente.</p><p class="muted">Secuencia: ver → cantar → signar → tocar → apagar pantalla → cambiar o crear.</p></div>
        </section>

        <div class="section-heading"><div><span class="eyebrow">Currículo vivo</span><h2>Edición y respaldo</h2></div><p>Los cambios se guardan en este navegador. Exporta un respaldo para moverlos a otro computador o recuperarlos.</p></div>
        <section class="grade-summary">
          <div class="panel"><h3>Editar y reprogramar</h3><p>Abre cualquier planeación para editar contenido, actividad impresa y frases del observador. Si una clase no se realiza, usa <strong>Aplazar 1 semana</strong>; en el siguiente encuentro podrás escoger la pendiente, la actual o un plan combinado.</p><p><a class="text-button" href="#repertorio">Abrir repertorio editable →</a></p><p class="muted">El currículo original siempre puede restaurarse clase por clase.</p></div>
          <div class="panel backup-panel"><h3>Respaldo de ajustes</h3><div class="button-row"><button class="button" data-action="export-adjustments">Exportar ajustes</button><button class="button secondary" data-action="choose-import">Importar respaldo</button></div><input id="adjustments-file" type="file" accept="application/json,.json" hidden /><p class="muted">El archivo incluye calendario, repertorio, ediciones, notas, clases aplazadas y marcas de preparación; no contiene información de estudiantes.</p></div>
        </section>

        <div class="section-heading"><div><span class="eyebrow">Enlaces</span><h2>Plataformas musicales</h2></div></div>
        <section class="resource-grid">${data.meta.resources.map((resource) => `<a class="resource-card" href="${escapeHtml(resource.url)}" target="_blank" rel="noreferrer"><strong>${escapeHtml(resource.name)} ↗</strong><span>${escapeHtml(resource.use)}</span></a>`).join("")}</section>

        <div class="section-heading"><div><span class="eyebrow">Archivos maestros</span><h2>Descargar los currículos</h2></div></div>
        <section class="resource-grid">
          <div class="resource-card download-card word-download"><div><strong>Preescolar · Word editable</strong><span>Documento maestro con campos vinculados para regresar cambios a la página.</span></div><a class="small-button" href="downloads/Curriculo_Musica_Preescolar_San_Tarsicio_2026-2027_EDITABLE.docx" download>Descargar Word</a></div>
          <div class="resource-card download-card word-download"><div><strong>Primaria · Word editable</strong><span>Documento maestro con campos vinculados para regresar cambios a la página.</span></div><a class="small-button" href="downloads/Curriculo_Musica_Primaria_San_Tarsicio_2026-2027_EDITABLE.docx" download>Descargar Word</a></div>
          <div class="resource-card download-card"><div><strong>Preescolar · PDF actualizado</strong><span>Versión de consulta · calendario escolar, 214 encuentros reales y banda de guerra.</span></div><a class="small-button secondary" href="downloads/Curriculo_Musica_Preescolar_San_Tarsicio_2026-2027_ACTUALIZADO.pdf" download>Descargar PDF</a></div>
          <div class="resource-card download-card"><div><strong>Primaria · PDF actualizado</strong><span>Versión de consulta · calendario escolar, 178 encuentros reales y evaluaciones.</span></div><a class="small-button secondary" href="downloads/Curriculo_Musica_Primaria_San_Tarsicio_2026-2027_ACTUALIZADO.pdf" download>Descargar PDF</a></div>
        </section>
      </div>`;

    document.querySelector("#adjustments-file")?.addEventListener("change", importAdjustments);
    document.querySelector("#word-curriculum-file")?.addEventListener("change", importCurriculumWord);
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
    const calendarConnections = lessonCalendarConnections(lesson);
    const calendarAction = lessonCalendarAction(lesson);
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
          <label class="edit-field" for="edit-printedActivity"><span>Actividad impresa</span><select id="edit-printedActivity" name="printedActivity"><option value="no" ${lesson.printedActivity !== "yes" ? "selected" : ""}>No</option><option value="yes" ${lesson.printedActivity === "yes" ? "selected" : ""}>Sí</option></select></label>
          ${editField("printedActivityName", "Cuál actividad impresa", lesson.printedActivityName || "", false)}
          ${editField("observerFocus", "Foco breve para las frases del observador", lesson.observerFocus || lesson.title, false)}
          ${calendarConnections.length || lesson.calendarAdjustment ? editField("calendarAdjustment", "Ajuste por calendario escolar", calendarAction) : ""}
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
    const massSongs = grade.stage === "primaria" ? assignedRepertoire("mass", grade) : [];
    const christmasSongs = bimester.number === 2 ? assignedRepertoire("christmas", grade) : [];
    const todayPlan = routine.map((moment, index) => {
      let instruction = moment.purpose;
      if (index === 1) instruction = grade.stage === "primaria" && bimester.repertoire
        ? `Cantar y montar el repertorio del bimestre. Reservar 3–5 minutos para canciones de misa.`
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
        ${calendarConnections.length ? `<section class="plan-block full calendar-plan-block"><span class="label">Ajuste por calendario escolar</span><h3>${calendarConnections.map((item) => `${item.calendar?.title || item.event} · ${displayDate(item.calendar?.date || item.date)}`).map(escapeHtml).join(" · ")}</h3><p>${escapeHtml(calendarAction)}</p><a class="text-button no-print" href="#calendario">Ver calendario institucional →</a></section>` : ""}
        <section class="plan-block full"><span class="label">Guion de la clase · cuatro momentos</span><ol class="today-plan">${todayPlan.join("")}</ol></section>
        ${bimester.repertoire ? `<section class="plan-block full"><span class="label">Repertorio del bimestre</span><p><strong>${escapeHtml(bimester.repertoire.focus)}</strong></p>${list(bimester.repertoire.pieces)}</section>` : ""}
        ${bimester.repertoireText ? `<section class="plan-block full"><span class="label">Repertorio del bimestre</span><p>${escapeHtml(bimester.repertoireText)}</p></section>` : ""}
        ${grade.stage === "primaria" ? `<section class="plan-block"><span class="label">Canciones de misa · 3–5 minutos</span>${massSongs.length ? list(massSongs.map((item) => item.title)) : `<p class="muted">Aún no hay canciones asignadas. Agrégalas en <a href="#repertorio">Repertorio</a>.</p>`}</section>` : ""}
        ${bimester.number === 2 ? `<section class="plan-block"><span class="label">Canciones de Navidad</span>${christmasSongs.length ? list(christmasSongs.map((item) => item.title)) : `<p class="muted">Repertorio navideño todavía sin asignar. Agrégalo en <a href="#repertorio">Repertorio</a>.</p>`}</section>` : ""}
        <section class="plan-block"><span class="label">Preparar</span>${list(lesson.materials || [])}</section>
        <section class="plan-block"><span class="label">Interacción visual / recurso</span><p>${escapeHtml(lesson.visual)}</p></section>
        <section class="plan-block"><span class="label">Evidencia de salida</span><p>${escapeHtml(lesson.evidence)}</p></section>
        <section class="plan-block"><span class="label">Actividad impresa</span><p>${escapeHtml(printedActivityText(lesson))}</p></section>
        <section class="plan-block"><span class="label">English word bank del bimestre</span><p>${bimester.english.map((word) => `<span class="tag">${escapeHtml(word)}</span>`).join(" ")}</p></section>
        <section class="plan-block full observer-block"><span class="label">Tres frases para el observador</span>${renderObserverPhrases(lesson)}</section>
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
    if (!duration) return routine;
    const stops = [0, 6, 18, 38, 45];
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
      wordOverrides: state.wordOverrides,
      postponedLessons: state.postponed,
      repertoireBoard: state.repertoireBoard,
      calendarPlan: state.calendarPlan,
      notes: curriculumStorageItems("st-note-"),
      prepared: curriculumStorageItems("st-prepared-"),
      settings: {
        bimester: state.bimester,
        week: state.week,
        date: state.date,
        day: state.day,
        calendarAuto: state.calendarAuto,
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
      state.wordOverrides = payload.wordOverrides || {};
      state.postponed = payload.postponedLessons || {};
      state.repertoireBoard = payload.repertoireBoard || state.repertoireBoard;
      state.calendarPlan = payload.calendarPlan || state.calendarPlan;
      localStorage.setItem("st-curriculum-overrides", JSON.stringify(state.overrides));
      localStorage.setItem("st-word-curriculum-overrides", JSON.stringify(state.wordOverrides));
      applyStoredWordOverrides();
      saveRepertoireBoard();
      saveCalendarPlan();
      savePostponed();
      Object.entries(payload.notes || {}).forEach(([key, value]) => localStorage.setItem(key, value));
      Object.entries(payload.prepared || {}).forEach(([key, value]) => localStorage.setItem(key, value));
      if (payload.settings) {
        state.bimester = Number(payload.settings.bimester) || state.bimester;
        state.week = Number(payload.settings.week) || state.week;
        state.date = payload.settings.date || state.date;
        state.day = weekdayFromIso(state.date);
        state.calendarAuto = payload.settings.calendarAuto !== false;
        state.gradeBimesters = payload.settings.gradeBimesters || state.gradeBimesters;
        localStorage.setItem("st-bimester", state.bimester);
        localStorage.setItem("st-week", state.week);
        localStorage.setItem("st-date", state.date);
        localStorage.setItem("st-day", state.day);
        localStorage.setItem("st-calendar-auto", state.calendarAuto ? "true" : "false");
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

  async function copyObserverText(text) {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const field = document.createElement("textarea");
        field.value = text;
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        document.execCommand("copy");
        field.remove();
      }
      showToast("Frase copiada");
    } catch (_error) {
      showToast("No fue posible copiar la frase", true);
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
    if (dialog.open) dialog.close();
    const hash = window.location.hash.replace(/^#/, "") || "inicio";
    const [view, param] = hash.split("/");
    if (view === "hoy") renderToday();
    else if (view === "semana") renderWeek();
    else if (view === "curriculo") renderCurriculumIndex();
    else if (view === "grado") renderGrade(param);
    else if (view === "calendario") renderCalendar();
    else if (view === "repertorio") renderRepertoireBoard();
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
    if (action === "add-repertoire") addRepertoireItem(target.dataset.category);
    if (action === "delete-repertoire") deleteRepertoireItem(target.dataset.category, target.dataset.id);
    if (action === "add-calendar-event") addCalendarEvent();
    if (action === "delete-calendar-event") deleteCalendarEvent(target.dataset.id);
    if (action === "reset-calendar") resetCalendarPlan();
    if (action === "scroll-calendar") document.querySelector(`#${target.dataset.target}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (action === "copy-observer") copyObserverText(target.dataset.copy || "");
    if (action === "export-adjustments") exportAdjustments();
    if (action === "choose-import") document.querySelector("#adjustments-file")?.click();
    if (action === "choose-word-import") document.querySelector("#word-curriculum-file")?.click();
    if (action === "apply-word-import") applyWordImport();
    if (action === "cancel-word-import") {
      state.wordImportPreview = null;
      renderTools();
    }
    if (action === "print-lesson") {
      document.body.classList.add("printing-lesson");
      window.print();
    }
    if (action === "print-page") window.print();
  });

  document.addEventListener("input", (event) => {
    const target = event.target.closest("[data-repertoire-field]");
    if (target) updateRepertoireItem(target);
    const calendarTarget = event.target.closest("[data-calendar-field]");
    if (calendarTarget) updateCalendarItem(calendarTarget);
  });

  document.addEventListener("change", (event) => {
    const target = event.target.closest("[data-calendar-field]");
    if (!target) return;
    updateCalendarItem(target);
    if (["bimester", "date", "endDate", "noClass"].includes(target.dataset.calendarField)) renderCalendar();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || !event.target.id?.startsWith("new-song-")) return;
    event.preventDefault();
    addRepertoireItem(event.target.id.replace("new-song-", ""));
  });

  document.querySelector("[data-close-dialog]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  window.addEventListener("afterprint", () => document.body.classList.remove("printing-lesson"));
  window.addEventListener("hashchange", route);
  applyStoredWordOverrides();
  route();
})();
