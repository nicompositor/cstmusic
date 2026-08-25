# Currículo Vivo de Música · Colegio San Tarsicio

Sitio estático del currículo de Música de Prejardín a Quinto. Incluye agenda diaria según el horario docente, planeador semanal, calendario institucional editable, banco de 72 actividades, repertorio editable, navegación por grado, herramientas docentes y un mapa STEAM/transdisciplinar conectado con cada bimestre. No necesita instalación, servidor especial ni proceso de compilación.

## Uso diario y edición

- En **Hoy**, selecciona una fecha para ver las clases en orden cronológico, el objetivo, la actividad, la formación humana y todo lo que debes preparar.
- La opción **Seguir calendario automáticamente** viene activada: la fecha determina el bimestre, el encuentro real de cada grupo y la planeación correspondiente. Recesos y jornadas sin clase no hacen avanzar la secuencia.
- Las clases de **Hoy** aparecen como tarjetas plegables. La vista cerrada muestra hora, grupo, encuentro, estado y alertas; al abrirla aparecen objetivos, actividad, materiales, observador y acciones.
- Si la realidad de un curso se atrasa, desactiva temporalmente el seguimiento automático y elige bimestre y semana de forma manual.
- El inicio de 2026–2027 deja sin programación musical el 12 de agosto para Primaria y el 13 para Preescolar, porque son jornadas de bienvenida. Las clases curriculares comienzan, respectivamente, desde el 13 y el 14; la agenda calcula el orden especial de los primeros encuentros hasta el 21 de agosto.
- Usa **Editar** para escribir directamente sobre cualquier planeación, decidir si llevará actividad impresa y ajustar el foco de las tres frases del observador. También puedes guardar notas y marcar una clase como preparada.
- En **Repertorio**, asigna canciones a uno o varios grados, añade notas de montaje y crea nuevas entradas. La lista general, las canciones de misa y el repertorio navideño se administran por separado.
- En **Calendario**, consulta y edita la respuesta musical a English Day, Día de los Abuelos, Primera Comunión, Navidad, Ciencia, Matemáticas, Día del Idioma, Día de la Madre, Batuta de Plata, clausuras y demás hitos institucionales.
- En **Actividades**, consulta y filtra juegos de pulso, escucha, memoria, creación, pantalla, instrumentos, movimiento exterior y 32 rondas Kodály. Cada planeación de Preescolar ofrece tres opciones y permite guardar cuál se realizará.
- Los festivos, las semanas de receso, las jornadas pedagógicas y las salidas pedagógicas marcadas en el calendario reemplazan automáticamente la clase regular en la vista **Hoy**.
- Las clases anteriores a cada evento muestran su ajuste curricular: preparación del montaje, conexión STEAM, ensayo, presentación o evidencia de evaluación.
- Cada grado tiene una cantidad diferente de encuentros por bimestre. La vista por grado muestra la ventana institucional, el total planeado y el conteo real de cada grupo; ya no se fuerzan nueve clases en todos los periodos.
- En Primaria, cada plan reserva unos minutos para las canciones de misa. El segundo bimestre de todos los grados queda enfocado en repertorio navideño todavía por seleccionar.
- La meta final de Preescolar es una **banda de guerra** con liras, trompetas y percusión; no usa campanas ni Boomwhackers.
- Si una clase no se realiza, pulsa **Aplazar 1 semana**. En el siguiente encuentro equivalente aparecerán la clase pendiente y la actual; podrás hacer la pendiente y mover la actual, mantener la actual y volver a aplazar la pendiente, o generar un plan combinado.
- Los cambios quedan en el almacenamiento local del navegador. En **Herramientas → Edición y respaldo**, exporta periódicamente un archivo JSON para conservarlos o llevarlos a otro dispositivo.
- Si abres el sitio en otro navegador o borras los datos del navegador, importa ese respaldo para recuperar tus ajustes.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub.
2. Sube **todo el contenido de esta carpeta** a la raíz del repositorio.
3. En el repositorio, abre **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Elige la rama `main`, carpeta `/ (root)` y pulsa **Save**.
6. GitHub mostrará la dirección pública cuando termine la publicación.

## Archivos principales

- `index.html`: estructura de la página.
- `styles.css`: diseño adaptable para computador, tableta, celular e impresión.
- `app.js`: agenda diaria, calendario musical, navegación, repertorio editable, edición local, filtros, notas y planeaciones.
- `curriculum-data.js`: contenido completo de preescolar y primaria.
- `school-year-update.js`: calendario interno 2026–2027, conteos reales, banco de actividades y ampliación de las secuencias de Preescolar.
- `downloads/`: PDF de consulta y Word editables de Preescolar y Primaria. Los Word conservan campos CST que la sección Herramientas puede comparar e importar nuevamente.
- `vendor/jszip.min.js`: lector local de archivos `.docx`; permite revisar cambios sin subir el documento a un servidor.

Las ediciones, clases aplazadas, marcas de “clase preparada” y notas del profesor se guardan únicamente en el navegador del dispositivo mediante almacenamiento local; por eso conviene exportar respaldos con regularidad.
