// Lógica pura de la Calculadora de Calificaciones — sin dependencias de React.
// Todas las funciones son deterministas y fáciles de testear de forma aislada.

export function slugify(nombre) {
  return String(nombre ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita diacríticos dejados por normalize('NFD'), ej. "é" -> "e"
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // quita paréntesis, puntuación, etc.
    .replace(/\s+/g, '-');
}

// Calcula el valor (0-10) de un componente dado lo capturado en IndexedDB para él.
// - subcomponentes: promedio ponderado de los hijos que SÍ tienen nota, renormalizando
//   sobre la suma de pesos de esos hijos capturados (mismo criterio que a nivel materia).
// - subNotas: promedio simple de las notas sueltas capturadas (ignora entradas inválidas).
// - hoja simple: el número capturado, o null si no hay nada.
export function calcularComponente(componente, notaOData) {
  if (componente.subcomponentes) {
    if (!notaOData || typeof notaOData !== 'object') return null;
    let sumaPonderada = 0;
    let pesoCapturado = 0;
    for (const sub of componente.subcomponentes) {
      const slug = slugify(sub.nombre);
      const valor = calcularComponente(sub, notaOData[slug]);
      if (valor !== null) {
        sumaPonderada += valor * sub.peso;
        pesoCapturado += sub.peso;
      }
    }
    if (pesoCapturado === 0) return null;
    return sumaPonderada / pesoCapturado;
  }

  if (componente.subNotas) {
    if (!Array.isArray(notaOData)) return null;
    const validas = notaOData.filter((n) => typeof n === 'number' && !isNaN(n));
    if (validas.length === 0) return null;
    return validas.reduce((s, n) => s + n, 0) / validas.length;
  }

  return typeof notaOData === 'number' && !isNaN(notaOData) ? notaOData : null;
}

// Promedia los componentes de primer nivel de una materia, usando SOLO los pesos de
// los que tienen dato capturado (renormalizando a 100%). Si no hay nada capturado,
// promedio es null. `porcentajeEvaluado` refleja cuánto del 100% de la materia ya
// tiene datos (independiente de la renormalización usada para el promedio).
export function calcularPromedioMateria(materia, data) {
  const materiaData = data || {};
  let sumaPonderada = 0;
  let pesoCapturado = 0;
  let pesoTotal = 0;

  for (const componente of materia.componentes) {
    pesoTotal += componente.peso;
    const slug = slugify(componente.nombre);
    const valor = calcularComponente(componente, materiaData[slug]);
    if (valor !== null) {
      sumaPonderada += valor * componente.peso;
      pesoCapturado += componente.peso;
    }
  }

  const porcentajeEvaluado = pesoTotal > 0 ? (pesoCapturado / pesoTotal) * 100 : 0;
  const promedio = pesoCapturado > 0 ? sumaPonderada / pesoCapturado : null;
  const completo = pesoTotal > 0 && pesoCapturado >= pesoTotal;

  return { promedio, porcentajeEvaluado, completo };
}

// Dado que todos los demás componentes de primer nivel ya están capturados, resuelve
// qué nota se necesita en `componenteObjetivoNombre` para que el promedio de la materia
// llegue a `promedioDeseado`. Usa el mismo criterio de renormalización que
// calcularPromedioMateria para los "otros" componentes (si alguno de ellos también
// estuviera sin capturar, simplemente se excluye del peso total, igual que arriba).
// `escala` es opcional (default 0-10) para no acoplar este archivo a grades.config.js;
// la página debe pasar `config.escala` para reflejar la escala real.
export function resolverNecesario(materia, data, componenteObjetivoNombre, promedioDeseado, escala = { min: 0, max: 10 }) {
  const materiaData = data || {};
  const objetivo = materia.componentes.find((c) => c.nombre === componenteObjetivoNombre);
  if (!objetivo || !(objetivo.peso > 0)) return null;

  let sumaOtrosPonderada = 0;
  let pesoOtrosCapturado = 0;
  for (const componente of materia.componentes) {
    if (componente.nombre === componenteObjetivoNombre) continue;
    const slug = slugify(componente.nombre);
    const valor = calcularComponente(componente, materiaData[slug]);
    if (valor !== null) {
      sumaOtrosPonderada += valor * componente.peso;
      pesoOtrosCapturado += componente.peso;
    }
  }

  const pesoTotal = pesoOtrosCapturado + objetivo.peso;
  if (pesoTotal <= 0) return null;

  const necesario = (promedioDeseado * pesoTotal - sumaOtrosPonderada) / objetivo.peso;
  const imposible = necesario > escala.max;

  return { necesario, imposible };
}

export function semaforoColor(promedio, semaforoConfig) {
  if (promedio === null || promedio === undefined || isNaN(promedio)) return null;
  if (promedio >= semaforoConfig.verde) return 'verde';
  if (promedio >= semaforoConfig.ambar) return 'ambar';
  return 'rojo';
}
