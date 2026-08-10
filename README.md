# Currículo Vivo de Música · Colegio San Tarsicio

Sitio estático del currículo de Música de Prejardín a Quinto. Incluye agenda diaria según el horario docente, planeador semanal, navegación por grado, herramientas docentes y un mapa STEAM/transdisciplinar conectado con cada bimestre. No necesita instalación, servidor especial ni proceso de compilación.

## Uso diario y edición

- En **Hoy**, selecciona bimestre, semana y día para ver las clases en orden cronológico, el objetivo, la actividad, la formación humana y todo lo que debes preparar.
- El inicio de 2026–2027 deja sin programación musical el 12 de agosto para Primaria y el 13 para Preescolar, porque son jornadas de bienvenida. Las clases curriculares comienzan, respectivamente, desde el 13 y el 14; la agenda calcula el orden especial de los primeros encuentros hasta el 21 de agosto.
- Usa **Editar** para escribir directamente sobre cualquier planeación. También puedes guardar notas y marcar una clase como preparada.
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
- `app.js`: agenda diaria, navegación, edición local, filtros, notas y planeaciones.
- `curriculum-data.js`: contenido completo de preescolar y primaria.
- `downloads/`: documentos editables originales.

Las ediciones, clases aplazadas, marcas de “clase preparada” y notas del profesor se guardan únicamente en el navegador del dispositivo mediante almacenamiento local; por eso conviene exportar respaldos con regularidad.
