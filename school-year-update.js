(() => {
  "use strict";

  const data = window.CURRICULUM_DATA;
  if (!data) return;

  const preschool = ["prejardin", "jardin", "transicion"];
  const jardinUp = ["jardin", "transicion"];
  const transitionOnly = ["transicion"];

  data.meta.calendarVersion = 3;
  data.meta.calendarSource = "Calendario Interno CST 2026-2027 · actualización del 20 de agosto de 2026";
  data.meta.academicPeriods = [
    { number: 1, start: "2026-08-12", end: "2026-10-02", label: "12 de agosto - 2 de octubre", totalDays: 37 },
    { number: 2, start: "2026-10-13", end: "2026-12-15", label: "13 de octubre - 15 de diciembre", totalDays: 43 },
    { number: 3, start: "2027-01-12", end: "2027-03-08", label: "12 de enero - 8 de marzo", totalDays: 40 },
    { number: 4, start: "2027-03-09", end: "2027-06-11", label: "9 de marzo - 11 de junio", totalDays: 60 },
  ];

  const retiredCalendarIds = new Set(["science-day", "institutional-evaluation"]);
  data.meta.calendarRetiredIds = [...retiredCalendarIds];
  data.meta.schoolCalendar = (data.meta.schoolCalendar || []).filter((item) => !retiredCalendarIds.has(item.id));

  const updateEvent = (id, changes) => {
    const event = data.meta.schoolCalendar.find((item) => item.id === id);
    if (event) Object.assign(event, changes);
  };
  const addEvent = (event) => {
    if (!data.meta.schoolCalendar.some((item) => item.id === event.id)) data.meta.schoolCalendar.push(event);
  };

  updateEvent("october-recess", {
    date: "2026-10-03",
    endDate: "2026-10-12",
    title: "Semana de receso estudiantil",
    noClass: true,
  });
  updateEvent("easter-break", {
    date: "2027-03-20",
    endDate: "2027-03-29",
    title: "Vacaciones de Semana Santa",
    musicPlan: "No programar clases regulares. El regreso a clases es el martes 30 de marzo.",
    preparation: "Dejar registrado el punto de retorno de cada montaje antes del receso.",
    noClass: true,
  });
  updateEvent("field-trips", {
    date: "2027-04-16",
    endDate: "",
    title: "Salidas pedagógicas",
    musicPlan: "No contar este viernes como avance obligatorio. Si un grupo conserva el encuentro, usar paisaje sonoro o bitácora auditiva.",
    preparation: "Confirmar con coordinación qué grupos salen y usar Aplazar si algún encuentro se cancela.",
    noClass: true,
  });
  updateEvent("mothers-day", {
    date: "2027-05-08",
    title: "Día de la Madre · Exposición de Artes y Día de la Ciencia",
    musicPlan: "Articular una experiencia de sonido, vibración, materiales o instrumentos reciclados con una canción de gratitud. El evento ocurre el sábado y no descuenta la clase regular.",
    preparation: "Coordinar con Ciencias y Artes una demostración breve y confirmar si algún curso presenta repertorio.",
    noClass: false,
  });

  [
    ["holiday-assumption-2026", "2026-08-17", 1, "Festivo · Asunción de la Virgen"],
    ["holiday-all-saints-2026", "2026-11-02", 2, "Festivo · Todos los Santos"],
    ["holiday-cartagena-2026", "2026-11-16", 2, "Festivo · Independencia de Cartagena"],
    ["holiday-immaculate-2026", "2026-12-08", 2, "Festivo · Inmaculada Concepción"],
    ["holiday-ascension-2027", "2027-05-10", 4, "Festivo · Ascensión del Señor"],
    ["holiday-corpus-2027", "2027-05-31", 4, "Festivo · Corpus Christi"],
    ["holiday-sacred-heart-2027", "2027-06-07", 4, "Festivo · Sagrado Corazón"],
  ].forEach(([id, date, bimester, title]) => addEvent({
    id,
    date,
    title,
    bimester,
    type: "Sin clase",
    scope: "Todo el colegio",
    gradeIds: ["prejardin", "jardin", "transicion", "primero", "segundo", "tercero", "cuarto", "quinto"],
    noClass: true,
    musicPlan: "No programar clase regular ni avanzar la secuencia.",
    preparation: "La agenda automática descuenta este encuentro cuando coincide con el horario.",
  }));

  data.meta.activityCategories = [
    { id: "warmup", title: "Pulso, cuerpo y activación", description: "Entradas breves para despertar atención, coordinación y disponibilidad corporal." },
    { id: "attention", title: "Eco, memoria y escucha", description: "Juegos para recordar, imitar, anticipar y valorar el silencio." },
    { id: "creation", title: "Creación, dirección e improvisación", description: "Propuestas para tomar decisiones, dirigir y construir música colectivamente." },
    { id: "visual", title: "Pantalla, escucha e instrumentos", description: "Interacciones visuales, auditivas e instrumentales con transferencia inmediata a la práctica." },
    { id: "movement", title: "Movimiento amplio y exterior", description: "Retos corporales que requieren espacio, desplazamiento o una adaptación de seguridad." },
    { id: "kodaly", title: "Rondas y canciones Kodály", description: "Repertorio cantado y jugado, descrito en una frase corta para decidir rápidamente." },
  ];

  const activities = [];
  const add = (id, title, summary, category, levels, space, bimesters, primary = "", energy = "media", enabled = true) => activities.push({
    id, title, summary, category, levels, space, bimesters, primary, energy, enabled,
  });

  add("metronomo", "Metrónomo caminante", "Caminar al pulso y atrapar exactamente en el primer pulso.", "warmup", preschool, "Espacio amplio", [1, 4], "1°-3°");
  add("opuestos", "Patos al agua · opuestos", "Responder con la acción contraria a la palabra o señal del profesor.", "warmup", preschool, "Salón", [1], "1°-2°");
  add("pelota-pulso", "Pelota al pulso", "Pasar la pelota sin acelerar mientras suena la música.", "warmup", preschool, "Salón", [1, 2], "1°-3°");
  add("espejo-musical", "Espejo musical", "Imitar los gestos de un compañero siguiendo la música.", "warmup", preschool, "Flexible", [1, 3], "1°-5°");
  add("aros-saltos", "Aros y saltos con música", "Coordinar pasos, saltos y pausas con señales musicales.", "warmup", preschool, "Exterior", [1, 4], "1°-3°", "alta");
  add("green-red-bells", "Green Light, Red Light con campanas", "Moverse con una campana y congelarse con la señal de alto.", "warmup", preschool, "Espacio amplio", [1], "1°-2°");
  add("instrument-directions", "Me guío por los instrumentos", "Moverse left, right, up o down según el instrumento escuchado.", "warmup", preschool, "Espacio amplio", [1, 3], "1°-3°");
  add("caminata-colectiva", "Caminata colectiva de ritmos", "Caminar tomados de la mano e imitar el ritmo del profesor.", "warmup", preschool, "Exterior", [1], "1°-2°");
  add("flip-flop-boing", "Flip, Flop, Boing", "Enviar el pulso en distintas direcciones sin romper la secuencia.", "warmup", jardinUp, "Salón", [2, 4], "1°-4°");
  add("monstruo-laguna", "El monstruo de la laguna", "Representar animales y responder cantando a las señales del monstruo.", "warmup", preschool, "Espacio amplio", [1, 4], "1°-2°");

  add("telefono-espalda", "Teléfono roto de ritmos", "Transmitir un ritmo por espalda, palmas o escritorio y compararlo al final.", "attention", jardinUp, "Salón", [2], "1°-5°");
  add("cadena-ritmos", "Cadena de ritmos", "Cada participante agrega un turno rítmico diferente.", "attention", jardinUp, "Salón", [2, 4], "1°-5°");
  add("adivinar-cancion", "Adivinar la canción", "Reconocer una canción por su melodía, ritmo o fragmento instrumental.", "attention", preschool, "Salón", [3], "1°-5°");
  add("ritmo-prohibido", "El ritmo prohibido", "Imitar todos los ritmos excepto la señal que exige silencio.", "attention", preschool, "Salón", [1, 2], "1°-5°");
  add("ritmo-detras", "Ritmo detrás del compañero", "Escuchar un patrón de mesa y palmas y repetirlo exactamente.", "attention", jardinUp, "Salón", [2], "1°-4°");
  add("contar-instrumentos", "Contar hasta 10 con instrumentos", "Construir una secuencia de diez entradas instrumentales sin perder el orden.", "attention", jardinUp, "Instrumentos", [2], "1°-3°");
  add("acumulacion", "Acumulación del ritmo", "Memorizar y ampliar una secuencia; puede realizarse con Sa chi-chi.", "attention", jardinUp, "Salón", [2, 4], "1°-5°");
  add("presi-presi", "Presi Presi", "Nombrarse con los pies y llamar a otro compañero con las manos.", "attention", transitionOnly, "Salón", [4], "2°-5°");
  add("cuerpo-telefono", "Mi cuerpo es un teléfono", "Asignar un número a cada parte del cuerpo y responder a la secuencia.", "attention", preschool, "Salón", [1, 2], "1°-3°");
  add("memoria-cartas", "Memoria de cartas musicales", "Encontrar parejas de sonidos, notas, instrumentos o símbolos.", "attention", jardinUp, "Salón", [3], "1°-5°");
  add("radar", "Radar sonoro", "Localizar o identificar sonidos, notas, animales o instrumentos sin mirar.", "attention", preschool, "Flexible", [3], "1°-5°");
  add("challenge-12345678", "12345678 Challenge", "Seguir una secuencia acumulativa de números, gestos y pulsos.", "attention", jardinUp, "Salón", [4], "1°-5°");

  add("director-secreto", "Director secreto", "Descubrir quién cambia los movimientos mientras el grupo lo sigue.", "creation", jardinUp, "Salón", [3], "1°-5°");
  add("soundpainting", "Soundpainting", "Dirigir entradas, silencios, intensidad y textura mediante gestos.", "creation", jardinUp, "Flexible", [3, 4], "2°-5°");
  add("orquesta-improvisada", "Orquesta improvisada", "Asignar una parte a cada fila y activar cada grupo en su momento.", "creation", jardinUp, "Instrumentos", [2, 4], "1°-5°");
  add("me-uno-grupo", "Me uno al grupo", "Cada niño propone un ritmo y el ensamble crece una voz a la vez.", "creation", jardinUp, "Flexible", [3, 4], "2°-5°");
  add("et-vocal", "E.T. vocal", "Pasar una nota con el dedo y transformar labios, timbre y expresividad.", "creation", preschool, "Salón", [3], "1°-5°");
  add("pintar-musica", "Pintar la música", "Representar ambientes, canciones o paisajes sonoros con color y trazo.", "creation", preschool, "Salón", [3], "1°-5°");

  add("claves-juguetes", "Eco rítmico con claves o juguetes", "Copiar patrones cortos y alternar quién propone y quién responde.", "visual", jardinUp, "Instrumentos", [2], "1°-4°");
  add("musicograma", "Seguir un musicograma", "Sincronizar gestos, trazos o instrumentos con la guía visual.", "visual", preschool, "Pantalla", [3], "1°-5°");
  add("body-percussion-video", "Percusión corporal con video", "Seguir un acompañamiento visual y repetirlo luego sin pantalla.", "visual", preschool, "Pantalla", [2, 4], "1°-5°");
  add("playalong-boom", "Play along de Boomwhackers", "Tocar por color y pulso siguiendo una guía visual sencilla.", "visual", jardinUp, "Pantalla e instrumentos", [2, 4], "1°-5°");
  add("playalong-bells", "Play along de campanas o xilófonos", "Seguir notas, colores y entradas con campanas o xilófonos.", "visual", jardinUp, "Pantalla e instrumentos", [2, 4], "1°-5°");
  add("bell-quiz", "Bell Listening Quiz", "Reconocer por escucha la campana, nota o patrón presentado.", "visual", jardinUp, "Instrumentos", [3], "1°-5°");

  add("zombie", "Zombie cantado", "Cantar y desplazarse hacia un espacio vacío; correr solo en el exterior.", "movement", jardinUp, "Exterior", [4], "1°-3°", "alta");
  add("duelo-pulsos", "Duelo de pulsos", "Agacharse con la señal y responder con una palmada o nota, sin armas ni eliminación.", "movement", jardinUp, "Espacio amplio", [4], "1°-4°", "alta");
  add("evolucion-ritmos", "Evolución con ritmos", "Resolver piedra, papel o tijera mediante patrones rítmicos.", "movement", jardinUp, "Exterior", [4], "2°-5°", "alta");
  add("ninja-musical", "Ninja musical sin contacto", "Crear poses al pulso y esquivar movimientos realizados al aire.", "movement", transitionOnly, "Exterior", [4], "2°-5°", "alta");
  add("alturas-parejas", "Parejas por alturas", "Moverse con sonidos agudos y graves y buscar la pareja indicada.", "movement", jardinUp, "Exterior", [4], "1°-4°", "alta");
  add("relevos-musicales", "Relevos musicales", "Correr, memorizar un ritmo y regresar para interpretarlo al equipo.", "movement", transitionOnly, "Exterior", [4], "2°-5°", "alta");

  add("k-a-la-ronda", "A la ronda", "Girar, parar y responder según la fruta.", "kodaly", preschool, "Espacio amplio", [1], "1°");
  add("k-tortuguita", "Tortuguita", "Cantar y acumular movimientos del cuerpo.", "kodaly", preschool, "Flexible", [1], "1°");
  add("k-ya-lloviendo", "Ya lloviendo está", "Cantar la lluvia y respetar los silencios.", "kodaly", preschool, "Salón", [1, 3], "1°-2°");
  add("k-sol-solecito", "Sol solecito", "Cantar y marcar el pulso del clima.", "kodaly", preschool, "Salón", [1, 3], "1°");
  add("k-que-llueva", "Que llueva", "Cantar y representar la lluvia con gestos.", "kodaly", preschool, "Flexible", [1, 3], "1°-2°");
  add("k-con-martillo", "Con mi martillo", "Imitar herramientas siguiendo la canción.", "kodaly", preschool, "Salón", [1, 2], "1°-2°");
  add("k-en-batalla", "En la batalla", "Acumular movimientos de distintas partes del cuerpo.", "kodaly", preschool, "Espacio amplio", [1, 2], "1°-2°");
  add("k-pasajeros", "Pasajeros al tren", "Moverse y responder a las señales del tren sin eliminar jugadores.", "kodaly", preschool, "Espacio amplio", [1], "1°-2°");
  add("k-bosque", "Juguemos en el bosque", "Cantar, preguntar al lobo y convertirse en estatuas.", "kodaly", preschool, "Flexible", [1, 4], "1°-2°");
  add("k-pajarito", "El Pajarito", "Cantar nombres mediante pregunta y respuesta.", "kodaly", preschool, "Flexible", [1, 3], "1°-3°");
  add("k-bunde", "Bunde de San Antonio", "Cantar el estribillo y moverse con el bunde del Pacífico.", "kodaly", preschool, "Flexible", [2], "1°-3°");
  add("k-agua-limones", "Agua de limones", "Caminar al pulso y formar grupos por número.", "kodaly", preschool, "Espacio amplio", [1, 4], "1°-2°");
  add("k-puente-quebrado", "El puente está quebrado", "Pasar bajo el puente y resolver un reto musical cooperativo.", "kodaly", jardinUp, "Espacio amplio", [2, 4], "1°-2°");
  add("k-puente-avignon", "El puente de Aviñón", "Cantar y representar diferentes oficios.", "kodaly", jardinUp, "Espacio amplio", [3, 4], "1°-3°");
  add("k-gavilan", "Gavilán pollero", "Cantar en fila y proteger al grupo sin forcejeos.", "kodaly", jardinUp, "Exterior", [4], "1°-3°", "alta");
  add("k-pin-pon", "Al Pin al Pon", "Pasar un objeto siguiendo pulso y acentos.", "kodaly", jardinUp, "Salón", [2], "1°-3°");
  add("k-ocuacua", "La Ocuacuá", "Pasar la palmada sin perder el pulso.", "kodaly", jardinUp, "Salón", [2], "1°-3°");
  add("k-feria", "En la Feria del Maestro Andrés", "Acumular e imitar instrumentos musicales.", "kodaly", jardinUp, "Flexible", [2, 4], "1°-3°");
  add("k-campesina", "La Campesina", "Acumular acciones de sembrar, moler y hornear.", "kodaly", jardinUp, "Espacio amplio", [2, 3], "1°-3°");
  add("k-esqueletos", "Los Esqueletos", "Contar del uno al doce con movimientos.", "kodaly", jardinUp, "Espacio amplio", [2], "1°-2°");
  add("k-pasala", "Pasalá", "Rotar objetos en los acentos de la canción.", "kodaly", jardinUp, "Salón", [2], "1°-3°");
  add("k-emiliano", "Emiliano", "Cantar y dramatizar un diálogo entre personajes.", "kodaly", jardinUp, "Flexible", [3], "1°-3°");
  add("k-sa-chi-chi", "Sa chi-chi", "Acumular gestos y recordar la secuencia.", "kodaly", jardinUp, "Salón", [2, 4], "1°-4°");
  add("k-pinar", "En el pinar del bosque", "Cantar ecos e inventar respuestas vocales.", "kodaly", jardinUp, "Flexible", [3], "2°-4°");
  add("k-pescador", "El pescador", "Cantar una cumbia y añadir un ostinato corporal.", "kodaly", transitionOnly, "Flexible", [3, 4], "2°-5°");
  add("k-gavan", "El Gaván", "Cantar y reconocer el carácter de la música llanera.", "kodaly", transitionOnly, "Flexible", [3], "2°-5°");
  add("k-ritmo", "Ritmo", "Mantener un ostinato y crear frases con nombres.", "kodaly", jardinUp, "Salón", [1, 4], "1°-5°");
  add("k-pepe", "Pepe Chiquito", "Vocalizar, cantar y probar una entrada de canon.", "kodaly", transitionOnly, "Salón", [4], "2°-5°");
  add("k-soplo", "Soplo la vela", "Explorar respiración, expresión y sonoridad menor.", "kodaly", transitionOnly, "Salón", [3], "2°-5°");
  add("k-cafe", "C-A-F-E", "Cantar una melodía y probar un canon sencillo.", "kodaly", transitionOnly, "Salón", [4], "2°-5°");
  add("k-viva-musica", "Viva la música", "Cantar en grupo e intentar entradas de canon.", "kodaly", transitionOnly, "Salón", [4], "2°-5°");
  add("k-pobre-coja", "La pobre coja · adaptación necesaria", "Transformar texto, nombre y persecución en una ronda respetuosa llamada La caminante.", "kodaly", transitionOnly, "Flexible", [3], "3°-5°", "media", false);

  data.meta.activityBank = activities;

  // Ruta temática de Primaria: un tema claro y transversal por bimestre.
  // Los objetivos musicales, la formación humana, el canto y la evaluación
  // continúan siendo la columna vertebral de cada secuencia.
  const primaryThemeUpdates = {
    primero: {
      1: {
        title: "Mi voz hace música",
        guidingQuestion: "¿Cómo usamos la voz para expresarnos y cantar juntos?",
        themeTopics: [
          "Voz hablada y voz cantada",
          "Respiración, eco y pregunta–respuesta",
          "Canto individual y colectivo",
          "Acuerdos para cantar con confianza",
        ],
        references: [
          "Rondas tradicionales colombianas",
          "Cantos de boga del Pacífico colombiano",
          "Bobby McFerrin y la voz como instrumento",
          "La voz antes de la grabación y la organización de un coro",
        ],
      },
      2: {
        title: "La música de las fiestas y celebraciones",
        guidingQuestion: "¿Cómo utilizamos la música para celebrar juntos?",
        themeTopics: [
          "Canciones de fiestas familiares y comunitarias",
          "Música para bailar, marchar, jugar y reunirse",
          "Celebraciones colombianas y de otras culturas",
          "Pulso, movimiento y repertorio navideño",
        ],
        references: [
          "Marcha de El cascanueces de Chaikovski",
          "Rondas, desfiles y celebraciones de la infancia",
          "Tambor, palmas y movimiento en celebraciones colombianas",
          "La Navidad como encuentro musical de la comunidad",
        ],
      },
      3: {
        title: "La música pinta la naturaleza",
        guidingQuestion: "¿Cómo puede la música representar animales, lugares y estaciones?",
        themeTopics: [
          "Vivaldi y Las cuatro estaciones",
          "Animales, climas y paisajes sonoros colombianos",
          "Rápido–lento y fuerte–suave",
          "Pictogramas, color y dibujo musical",
        ],
        references: [
          "Las cuatro estaciones de Antonio Vivaldi",
          "El carnaval de los animales de Camille Saint-Saëns",
          "Paisajes sonoros de páramo, selva y costa colombiana",
          "Música descriptiva, sinestesia inicial y representación visual",
        ],
      },
      4: {
        title: "Cuentos, personajes y sonidos",
        guidingQuestion: "¿Cómo nos cuenta una historia la música?",
        themeTopics: [
          "Cuentos musicales, folclor y leyendas",
          "Personajes representados mediante timbres",
          "Mickey Mousing y efectos sonoros",
          "Creación de una historia sonora con partitura gráfica",
        ],
        references: [
          "Pedro y el lobo de Serguéi Prokófiev",
          "Mickey Mousing en animación",
          "Relatos y leyendas de tradición colombiana",
          "La narración oral como memoria cultural",
        ],
      },
    },
    segundo: {
      1: {
        title: "Canciones que unen al mundo",
        guidingQuestion: "¿Por qué las personas cantan juntas?",
        themeTopics: [
          "Rondas y canciones colectivas",
          "Músicas del mundo y canto en comunidad",
          "Pregunta–respuesta, frase y ostinato",
          "Beethoven, la sordera y otras maneras de experimentar la música",
        ],
        references: [
          "Rondas colombianas de tradición oral",
          "Oda a la alegría de Beethoven como melodía comunitaria",
          "Beethoven y su experiencia de la sordera",
          "Cantos colectivos de Colombia, Latinoamérica y otras culturas",
        ],
      },
      2: {
        title: "Un viaje por los géneros musicales",
        guidingQuestion: "¿Cómo cambia una canción cuando cambia su género musical?",
        themeTopics: [
          "Pop, rock, jazz, música clásica y electrónica",
          "Géneros colombianos y sus instrumentos",
          "Pulso, velocidad, carácter, timbre y forma",
          "Una canción navideña interpretada con estilos diferentes",
        ],
        objective: "Puedo reconocer diferencias entre géneros e interpretar una canción cambiando el carácter, la voz o el acompañamiento.",
        studentGoal: "Puedo reconocer diferencias entre géneros e interpretar una canción cambiando el carácter, la voz o el acompañamiento.",
        music: [
          "Escucha comparada, canto expresivo y acompañamientos sencillos para descubrir cómo cambia una canción según el género.",
          "Lenguaje musical: género · pulso · tempo · timbre · verso/coro · 2/4 · 3/4 · 4/4 · 6/8",
        ],
        languageKeys: ["género", "pulso", "tempo", "timbre", "verso/coro", "2/4", "3/4", "4/4", "6/8"],
        creation: "Transformación breve de una canción navideña mediante voz, cuerpo e instrumentos para comunicar un género. Sociales: origen y función; Inglés: adjetivos de carácter; Matemáticas: patrones y agrupaciones.",
        visual: "Quizzes de escucha, musicogramas, Music Prodigies y scrolling; comparar primero y transferir después a voz e instrumentos.",
        evidence: "Interpretación breve de una canción con un rasgo audible del género elegido.",
        references: [
          "Rock y pop: pulso, banda y forma verso–coro",
          "Jazz: improvisación, diálogo y swing como primera aproximación",
          "Música clásica: orquesta, contraste y desarrollo",
          "Música electrónica: capas, timbres y repetición",
          "Géneros colombianos seleccionados con su región y contexto",
        ],
        exam: {
          ability: "Escucha e interpretación de géneros",
          format: "En grupos pequeños, interpretar un fragmento del repertorio navideño en un género elegido. Cada estudiante participa con voz o acompañamiento; no hay prueba teórica adicional.",
          musical: "Mantiene su parte y comunica al menos un rasgo audible del género mediante carácter, timbre, pulso o acompañamiento.",
          formative: "Regula cuerpo y volumen, persiste y utiliza una estrategia para recuperarse del error.",
        },
      },
      3: {
        title: "La orquesta y la manera de escuchar",
        guidingQuestion: "¿Cómo reconocemos instrumentos, personajes y maneras diferentes de escuchar?",
        themeTopics: [
          "Familias instrumentales y timbre",
          "Instrumentos y personajes",
          "Orquesta clásica y agrupaciones colombianas",
          "Escucha visual, auditiva y corporal",
        ],
        references: [
          "Pedro y el lobo de Serguéi Prokófiev",
          "El carnaval de los animales de Camille Saint-Saëns",
          "Agrupación colombiana con familias y funciones distintas",
          "Beethoven y otras maneras de percibir la vibración musical",
        ],
      },
      4: {
        title: "Así suena una película",
        guidingQuestion: "¿Qué cambiaría en una escena si no tuviera sonido?",
        themeTopics: [
          "Música de cine y función narrativa",
          "Artistas Foley y efectos sonoros",
          "Sincronización y Mickey Mousing",
          "Motivos para personajes y musicalización de escenas",
        ],
        references: [
          "Artistas Foley y creación de efectos",
          "Mickey Mousing en la animación clásica",
          "Motivos musicales de personajes",
          "Escena audiovisual colombiana seleccionada con contexto y créditos",
        ],
      },
    },
    tercero: {
      1: {
        title: "Los ritmos de Colombia",
        guidingQuestion: "¿Cómo suenan las regiones de Colombia y qué cuentan sus músicas?",
        themeTopics: [
          "Cumbia, bambuco, joropo y músicas del Pacífico",
          "Tiple, bandola, marimba, arpa llanera y percusión tradicional",
          "Relación entre música, región, paisaje y comunidad",
          "Canto colombiano, patrones, acentos y acompañamientos",
        ],
        objective: "Puedo cantar e interpretar un ritmo colombiano reconociendo su región, sus instrumentos y algunas de sus características.",
        studentGoal: "Puedo cantar e interpretar un ritmo colombiano reconociendo su región, sus instrumentos y algunas de sus características.",
        music: [
          "Canto expresivo, escucha regional y ensamble de patrones corporales o instrumentales inspirados en músicas colombianas.",
          "Lenguaje musical: C–D–E–F–G–A · pulso · acento · 2/4 · 3/4 · 6/8 · ostinato · verso/coro",
        ],
        languageKeys: ["C–D–E–F–G–A", "pulso", "acento", "2/4", "3/4", "6/8", "ostinato", "verso/coro"],
        creation: "Mapa sonoro colombiano e interpretación vocal con acompañamiento regional adaptado al aula. Sociales: territorio e identidad; Geografía: regiones; Lenguaje: relato y tradición oral.",
        visual: "Mapas regionales, fragmentos audiovisuales con créditos, Music Prodigies, scrolling y apoyos Curwen aplicados al repertorio colombiano.",
        evidence: "Interpretación vocal e instrumental breve de una música colombiana con identificación de región e instrumentos.",
        references: [
          "Cumbia y gaitas de la región Caribe",
          "Bambuco, tiple y bandola de la región Andina",
          "Joropo y arpa de los Llanos Orientales",
          "Marimba y cantos del Pacífico colombiano",
          "Intérpretes colombianos seleccionados con contexto y créditos",
        ],
        repertoire: {
          focus: "Canto y montaje: Los ritmos de Colombia",
          pieces: ["Canción colombiana de región Caribe", "Canción andina, llanera o del Pacífico", "Estribillo con acompañamiento corporal regional"],
        },
      },
      2: {
        title: "Ritmos que mueven al mundo",
        guidingQuestion: "¿Por qué algunos ritmos nos hacen querer movernos y cómo se construye su groove?",
        themeTopics: [
          "Grooves de África, Latinoamérica, rock y otras músicas del mundo",
          "Pulso, subdivisión, síncopa y ostinato",
          "Capas de voz, percusión corporal e instrumentos",
          "Arreglo rítmico del repertorio navideño",
        ],
        creation: "Mapa de grooves y ensamble de tres capas con voz como eje. Geografía: circulación cultural; Matemáticas: ciclos y subdivisión; Educación física: coordinación.",
        references: [
          "Salsa y clave como organización de capas",
          "Rock y backbeat",
          "Samba y percusión colectiva",
          "Patrones africanos de llamada, respuesta y superposición",
          "Cómo los ritmos viajan, dialogan y se transforman",
        ],
      },
      3: {
        title: "El laboratorio del sonido",
        guidingQuestion: "¿Cómo pasa una vibración a convertirse en música grabada?",
        themeTopics: [
          "Vibración, frecuencia, amplitud y cimática",
          "Sonidos del espacio y sonificación de datos",
          "Sonido acústico, eléctrico y grabado",
          "Micrófono, radio y transformación tecnológica del sonido",
        ],
        references: [
          "Lucho Bermúdez y la transformación orquestal de músicas colombianas",
          "Primeras grabaciones, radio y circulación musical en Colombia",
          "Cimática: patrones visibles producidos por vibraciones",
          "Sonificación de datos del espacio y diferencia entre sonido y representación",
          "Micrófono, electricidad y estudio de grabación",
        ],
      },
      4: {
        title: "Inventar instrumentos y crear mensajes",
        guidingQuestion: "¿Cómo convertimos materiales e ideas en música?",
        themeTopics: [
          "Instrumentos con materiales reciclables",
          "Resonancia, timbre y diseño STEAM",
          "Jingles y logos sonoros",
          "Música, comunicación y medio ambiente",
        ],
        references: [
          "Instrumentos construidos con materiales cotidianos",
          "Jingles, logos sonoros y memoria auditiva",
          "Jorge Velosa y la narración de lo cotidiano",
          "Diseño responsable, reutilización y cuidado ambiental",
        ],
      },
    },
    cuarto: {
      1: {
        title: "La arquitectura de una canción",
        guidingQuestion: "¿Cómo se construye una canción que podemos recordar?",
        themeTopics: [
          "Introducción, verso, precoro, coro y puente",
          "Melodía, armonía y acompañamiento",
          "Estructura de canciones pop, rock y teatro musical",
          "Interpretación vocal, fraseo y presencia escénica",
        ],
        references: [
          "Teatro musical: texto, personaje y puesta en escena",
          "Canción pop y rock en versiones acústicas y producidas",
          "Intérprete colombiano seleccionado con contexto",
          "La forma musical y el coro como centro de memoria",
        ],
      },
      2: {
        title: "Música para videojuegos y mundos imaginarios",
        guidingQuestion: "¿Cómo cambia la música según lo que sucede en una historia o un videojuego?",
        themeTopics: [
          "Música interactiva para niveles, espacios y personajes",
          "Loops, leitmotivs y transiciones",
          "Música orquestal y electrónica para mundos imaginarios",
          "Repertorio navideño convertido en banda sonora",
        ],
        references: [
          "John Williams y el leitmotif cinematográfico",
          "Koji Kondo y la música interactiva de videojuegos",
          "Loops que responden a niveles y decisiones",
          "Producción audiovisual colombiana seleccionada con créditos",
        ],
      },
      3: {
        title: "Música, mente y sociedad",
        guidingQuestion: "¿Cómo influye la música en lo que sentimos, percibimos y compartimos?",
        themeTopics: [
          "Ilusiones auditivas y percepción",
          "Música, atención, emociones y mindfulness",
          "Musicoterapia como profesión, no como intervención de aula",
          "Música, identidad, celebraciones y vida social",
        ],
        references: [
          "Ilusiones auditivas y límites de la percepción",
          "Música para atención, regulación y bienestar escolar",
          "La musicoterapia como disciplina profesional",
          "Celebración, ritual, identidad y canción social en Colombia y Latinoamérica",
        ],
      },
      4: {
        title: "Música interactiva: dirigir y programar",
        guidingQuestion: "¿Cómo puede una obra cambiar según nuestras decisiones?",
        themeTopics: [
          "Soundpainting y dirección mediante gestos",
          "Partituras gráficas y formas abiertas",
          "Reglas, eventos, capas y algoritmos",
          "Escenas musicales creadas con Scratch",
        ],
        references: [
          "Soundpainting creado por Walter Thompson",
          "Partituras gráficas y formas abiertas del siglo XX",
          "Scratch como medio para relacionar escena, evento y sonido",
          "La diferencia entre una regla creativa y hacer cualquier cosa",
        ],
      },
    },
    quinto: {
      1: {
        title: "Canciones, identidad y punto de vista",
        guidingQuestion: "¿Qué nos dice una canción sobre su autor y su sociedad?",
        themeTopics: [
          "Canción social, identidad y territorio",
          "Música y política tratada con contexto y respeto",
          "Autoría, tradición, versión y mercado musical",
          "Mensaje, prosodia e interpretación vocal",
        ],
        references: [
          "Jorge Velosa y la narración de lo cotidiano",
          "Violeta Parra y la canción latinoamericana",
          "Canción social colombiana seleccionada con contexto",
          "Crédito, versión, arreglo e interpretación como decisiones distintas",
        ],
      },
      2: {
        title: "El estudio de producción musical",
        guidingQuestion: "¿Cómo se construye una canción mediante capas y tecnologías?",
        themeTopics: [
          "Software de producción y capas de grabación",
          "Teclados MIDI y orquesta virtual",
          "Compositor, intérprete, arreglista y productor",
          "Producción del repertorio navideño con voz central",
        ],
        references: [
          "Arreglo de rock o pop",
          "Producción electrónica por capas",
          "Orquesta virtual, MIDI y grabación multipista",
          "Fusión colombiana con reconocimiento de sus fuentes",
        ],
      },
      3: {
        title: "Música e inteligencia artificial",
        guidingQuestion: "¿Quién toma las decisiones musicales: la persona o el algoritmo?",
        themeTopics: [
          "Inteligencia artificial generativa",
          "El ser humano frente al algoritmo",
          "Prompt, sample, loop, metadatos y crédito",
          "Autoría, sesgo, privacidad y uso responsable",
        ],
        references: [
          "Lucrecia Dalt como referente colombiano de experimentación sonora",
          "Brian Eno y la música generativa",
          "Resultado de IA musical preparado por el profesor para comparación",
          "Intención humana, selección, autoría y responsabilidad",
        ],
      },
      4: {
        title: "Componer para cine, videojuegos y comunidad",
        guidingQuestion: "¿Cómo creamos música para una imagen y para otras personas?",
        themeTopics: [
          "Banda sonora, sincronización y leitmotifs",
          "Música para cine y videojuegos",
          "Folclor colombiano en animación y medios audiovisuales",
          "Composición comunitaria, créditos y presentación final",
        ],
        references: [
          "Música de cine y construcción de leitmotifs",
          "Música de videojuegos y loops adaptativos",
          "Folclor colombiano en cine, animación y videojuegos",
          "Obra audiovisual colombiana seleccionada con contexto y créditos",
        ],
      },
    },
  };

  data.meta.primaryThemeVersion = 2;
  data.grades.filter((grade) => grade.stage === "primaria").forEach((grade) => {
    const updates = primaryThemeUpdates[grade.id] || {};
    grade.bimesters.forEach((bimester) => {
      const update = updates[bimester.number];
      if (!update) return;
      const previousTitle = bimester.title;
      const { exam, repertoire, ...fields } = update;
      Object.assign(bimester, fields);
      if (exam) Object.assign(bimester.exam, exam);
      if (repertoire) bimester.repertoire = repertoire;
      else if (bimester.repertoire?.focus) bimester.repertoire.focus = bimester.repertoire.focus.replaceAll(previousTitle, update.title);

      const topics = bimester.themeTopics || [];
      bimester.weeks.forEach((week, weekIndex) => week.lessons.forEach((lesson, lessonIndex) => {
        if (typeof lesson.activity === "string") lesson.activity = lesson.activity.replaceAll(previousTitle, update.title);
        lesson.themeConnection = topics.length ? topics[(weekIndex + lessonIndex) % topics.length] : update.title;
      }));
    });
  });

  const targets = {
    prejardin: [14, 18, 16, 26],
    jardin: [15, 18, 16, 25],
    transicion: [15, 18, 16, 26],
  };
  const byGroup = {
    prejardin: { "Prejardín A": [14, 18, 16, 26], "Prejardín B": [14, 17, 16, 26] },
    jardin: { "Jardín A": [15, 18, 16, 25], "Jardín B": [15, 18, 16, 25] },
    transicion: { "Transición A": [14, 18, 16, 26], "Transición B": [15, 17, 16, 25] },
  };

  const makeAddedLesson = (grade, bimester, slot, addedNumber) => ({
    slot,
    title: bimester.number === 4 ? (addedNumber === 1 ? "Ensayo por secciones" : addedNumber === 2 ? "Montaje completo" : "Cierre y confianza escénica") : "Juego, creación y evidencia",
    activity: "Elegir una de las tres actividades sugeridas, conectarla con el repertorio y cerrar con una evidencia breve.",
    musicalObjective: bimester.studentGoal || bimester.objective,
    formativeObjective: `${bimester.formation}: escucho, intento nuevamente y ayudo al grupo a completar la experiencia.`,
    language: (bimester.languageKeys || []).join(" · "),
    english: (bimester.englishPhrases || []).slice(0, 2).join(" / "),
    visual: "Elegir un apoyo visual breve del banco de actividades y transferir inmediatamente la experiencia a voz, cuerpo o instrumentos.",
    evidence: bimester.evidence,
    materials: bimester.number === 4 ? ["Voz y percusión corporal", "Instrumentos de banda de guerra según el rol", "Pantalla preparada si se elige una opción visual"] : ["Voz y percusión corporal", "Material correspondiente al juego elegido"],
    printedActivity: "no",
    printedActivityName: "",
    observerFocus: bimester.number === 4 ? "participación, escucha y seguridad en el montaje" : "participación, creación y escucha",
    calendarConnections: bimester.number === 4 ? [{
      eventId: "preschool-closing",
      event: "Clausura de Preescolar",
      date: "2027-06-12",
      action: "Consolidar la banda de guerra final con seguridad, entradas claras, escucha y cuidado colectivo.",
    }] : [],
  });

  const ensureEncounters = (grade, bimester, target) => {
    let count = bimester.weeks.reduce((total, week) => total + week.lessons.length, 0);
    let added = 0;
    while (count < target) {
      let week = [...bimester.weeks].reverse().find((item) => item.lessons.length < 2);
      if (!week) {
        const lastWeek = bimester.weeks[bimester.weeks.length - 1];
        week = { week: (lastWeek?.week || 0) + 1, lessons: [] };
        bimester.weeks.push(week);
      }
      const slot = week.lessons.some((lesson) => lesson.slot === "A") ? "B" : "A";
      added += 1;
      week.lessons.push(makeAddedLesson(grade, bimester, slot, added));
      count += 1;
    }
    bimester.weeks.forEach((week) => week.lessons.sort((a, b) => String(a.slot).localeCompare(String(b.slot))));
    bimester.plannedEncounters = count;
    bimester.plannedWeeks = bimester.weeks.length;
  };

  data.grades.filter((grade) => grade.stage === "preescolar").forEach((grade) => {
    grade.realEncounterTargets = targets[grade.id];
    grade.realEncounterTargetsByGroup = byGroup[grade.id];
    grade.bimesters.forEach((bimester) => ensureEncounters(grade, bimester, targets[grade.id][bimester.number - 1]));
  });
})();
