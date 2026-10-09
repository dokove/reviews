# Guía de Estilo y Autoría de Escenarios en @dokove/review

Este documento establece las pautas para diseñar escenarios de Code Review de alto realismo técnico y valor pedagógico.

---

## 1. Principios de Diseño

1. **Código Realista, no Juguete**: El código revisado debe parecer extraído de un microservicio real en producción (Node.js, TypeScript, Go, Python, etc.) con sus dependencias, middleware y estructuras típicas.
2. **Defectos Orgánicos**: El autor simulado no debe escribir "hack me please"; los errores deben provenir de descuidos comunes en la industria (ej. olvidar `algorithms: ['RS256']` en JWT, asumir que `Set` no fuga memoria, o concatenar queries por rapidez).
3. **Inclusión de Distractores**: Cada escenario de nivel Mid o Senior debe incluir al menos un cambio que sea puramente cosmético o una preferencia estilística válida (distractor). El objetivo es calibrar si el evaluado sabe diferenciar un fallo bloqueante de una sugerencia menor.
4. **Rúbricas Precisas con Solución**: Cada issue debe incluir su `explanation` profunda (por qué ocurre y cómo impacta en producción), `keywords` para scoring automático y `suggestedFix` con el código corregido.

---

## 2. Niveles de Severidad de Issues

- `critical`: Defecto de seguridad grave, pérdida de datos, fallo catastrófico en producción o condición de carrera destructiva. **Exige `request_changes` obligatorio**.
- `warning`: Problema de rendimiento mediano, falta de pruebas unitarias críticas o mala práctica de concurrencia que puede degradar el servicio.
- `nitpick`: Sugerencia cosmética, tipado opcional o mejora de legibilidad. **Nunca debe bloquear la aprobación de la PR**.
- `suggestion`: Alternativa arquitectónica o refactor no mandatorio.

---

## 3. Checklist para Nuevos Escenarios

- [ ] Archivo creado en `reviews/<nombre-escenario>.json` (ultra-plano).
- [ ] Categoría asignada existe en `review.*` en `@dokove/taxonomies`.
- [ ] Tags registrados en taxonomías.
- [ ] `diffLines` con números de línea y tipos (`add`, `del`, `normal`).
- [ ] Issues geolocalizados en números de línea exactos.
- [ ] `rubric` con veredicto recomendado y puntaje mínimo.
- [ ] `npm test` ejecuta `build` y `validate:taxonomies` sin advertencias.
