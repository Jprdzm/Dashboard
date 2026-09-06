// Configuración de materias y ponderaciones — semestre 7º (Ago-Dic), escala 0-10.
//
// CÓMO AGREGAR UNA MATERIA NUEVA:
// 1. Copia un objeto de `materias` como plantilla.
// 2. Cambia `id` (único, sin espacios, usado como key de almacenamiento) y `nombre`.
// 3. Define `componentes`: cada uno tiene `nombre` y `peso` (% de la materia, deben sumar 100).
//    - Si un componente se subdivide (ej. "Exámenes" = Parcial1+Parcial2+Final), agrega
//      `subcomponentes: [{ nombre, peso }, ...]` — esos pesos son RELATIVOS dentro del
//      padre y también deben sumar 100 (no se multiplican manualmente, la lógica ya lo hace).
//    - Si un componente admite varias notas sueltas que se promedian simple (ej. exámenes
//      sorpresa), agrega `subNotas: true` en vez de `subcomponentes`.
// 4. No es necesario tocar ningún archivo de lógica (`src/utils/grades.js`) ni de UI:
//    la calculadora lee este archivo dinámicamente.
export default {
  semestre: '7º · Ago–Dic',
  escala: { min: 0, max: 10, aprobatoria: 6 },
  semaforo: { verde: 8, ambar: 6 }, // >= verde: verde, >= ambar: ámbar, si no: rojo
  materias: [
    {
      id: 'angiologia',
      nombre: 'Angiología',
      componentes: [
        { nombre: 'Trabajos solicitados', peso: 20 },
        { nombre: 'Fichas bibliográficas', peso: 20 },
        { nombre: 'Parcial 1', peso: 20 },
        { nombre: 'Parcial 2', peso: 20 },
        { nombre: 'Parcial 3', peso: 20 },
      ],
    },
    {
      id: 'cirugia',
      nombre: 'Cirugía General',
      componentes: [
        { nombre: 'Parcial 1', peso: 20 },
        { nombre: 'Parcial 2', peso: 30 },
        { nombre: 'Parcial 3', peso: 50 },
      ],
    },
    {
      id: 'preventiva',
      nombre: 'Medicina Preventiva',
      componentes: [
        {
          nombre: 'Exámenes',
          peso: 50,
          subcomponentes: [
            { nombre: 'Parcial 1', peso: 30 },
            { nombre: 'Parcial 2', peso: 30 },
            { nombre: 'Examen final', peso: 40 },
          ],
        },
        { nombre: 'Tareas en Aula Virtual', peso: 20 },
        { nombre: 'Trabajo final', peso: 30 },
      ],
    },
    {
      id: 'oftalmologia',
      nombre: 'Oftalmología',
      nota: 'Parciales acumulativos',
      componentes: [
        { nombre: 'Parcial 1', peso: 20, subNotas: true },
        { nombre: 'Parcial 2', peso: 30, subNotas: true },
        { nombre: 'Parcial 3', peso: 50, subNotas: true },
      ],
    },
    {
      id: 'orl',
      nombre: 'Otorrinolaringología',
      nota: 'Exámenes acumulativos',
      componentes: [
        { nombre: 'Parcial 1', peso: 20 },
        { nombre: 'Parcial 2', peso: 30 },
        { nombre: 'Examen final', peso: 40 },
        { nombre: 'Presentación de tema', peso: 10 },
      ],
    },
    {
      id: 'seminario',
      nombre: 'Seminario de Integración II',
      componentes: [
        { nombre: 'Parcial 1', peso: 25 },
        { nombre: 'Parcial 2', peso: 25 },
        { nombre: 'Examen final', peso: 25 },
        { nombre: 'Casos clínicos y participación', peso: 25 },
      ],
    },
    {
      id: 'soporte_vital',
      nombre: 'Taller de Soporte Vital',
      componentes: [
        {
          nombre: 'Laboratorio de simulación',
          peso: 70,
          subcomponentes: [
            { nombre: 'Examen escrito final', peso: 20 },
            { nombre: 'Participación en clase', peso: 10 },
            { nombre: 'Simulación de escenarios (paciente crítico)', peso: 70 },
          ],
        },
        {
          nombre: 'Urgencias',
          peso: 30,
          subcomponentes: [
            { nombre: 'Evaluación actitudinal', peso: 40 },
            { nombre: 'Evaluación de habilidades y destrezas', peso: 60 },
          ],
        },
      ],
    },
    {
      id: 'tecnicas_quirurgicas',
      nombre: 'Técnicas Quirúrgicas',
      componentes: [
        { nombre: 'Asistencia y puntualidad', peso: 20 },
        { nombre: 'Participación en clase y uniforme quirúrgico', peso: 30 },
        { nombre: 'Desempeño y habilidad en quirófanos', peso: 30 },
        { nombre: 'Examen final', peso: 20 },
      ],
    },
    {
      id: 'urologia',
      nombre: 'Urología',
      nota: 'Requiere 80% de asistencia a clases',
      componentes: [
        { nombre: 'Parcial 1', peso: 25 },
        { nombre: 'Parcial 2', peso: 25 },
        { nombre: 'Examen ordinario (final)', peso: 50 },
      ],
    },
  ],
};
