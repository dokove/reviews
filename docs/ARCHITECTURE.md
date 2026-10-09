# Arquitectura de @dokove/review

Este documento describe el diseño técnico, la estructura de datos y el motor de auditoría y simulación de Code Review en Dokove.

---

## 1. Filosofía y Propósito

El propósito de `pub.review` es proveer un banco de desafíos de Pull Request realistas donde desarrolladores y evaluadores practiquen y midan habilidades críticas de ingeniería de software:

1. **Auditoría de Seguridad**: Detección de OWASP Top 10, CWEs, fallos de autenticación/JWT, inyecciones y fallbacks inseguros.
2. **Performance y Fugas de Memoria**: Identificación de listeners huérfanos, estructuras en memoria no acotadas (unbounded sets/maps), queries N+1 y operaciones bloqueantes.
3. **Concurrencia y Carrera**: Detección de patrones check-then-act no atómicos, lecturas/escrituras concurrentes y problemas de aislamiento transaccional.
4. **Resiliencia y Arquitectura**: Acoplamiento excesivo, falta de timeouts, circuit breakers o manejo de fallos distribuidos.
5. **Calibración y Asertividad**: Evitar falsos positivos ("distractors"), comentarios pedantes o bloqueos innecesarios por preferencias de estilo menores.

---

## 2. Estructura Ultra-Plana

Siguiendo el estándar universal de los repositorios de contenido `pub.*` en Dokove:

```
pub.review/
├── reviews/                        # Directorio ultra-plano (sin jerarquías anidadas)
│   ├── 01-showroom-todos-los-escenarios.json
│   ├── 02-auth-jwt-hardcoded-secret.json
│   ├── 03-memory-leak-event-listener.json
│   ├── 04-sql-injection-raw-query.json
│   └── 05-concurrency-race-condition.json
├── docs/                           # Documentación de arquitectura y guías
│   ├── ARCHITECTURE.md
│   ├── TAXONOMIES.md
│   └── STYLEGUIDE.md
├── scripts/                        # Compilación y validadores
│   ├── build-reviews-data.mjs
│   └── validate-taxonomies.mjs
├── preview/                        # Simulador interactivo en Vite (puerto 3017)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.html
├── dist/                           # Artefactos compilados para consumo del workspace
│   ├── reviews-data.json
│   └── index.js
├── AGENTS.md                       # Reglas de desarrollo para agentes IA
├── package.json
└── vite.config.ts
```

---

## 3. Modelo de Datos y Esquema

Cada escenario en `reviews/*.json` declara:

- `id`: Identificador único kebab-case.
- `title`: Título formal de la Pull Request con número.
- `author`: Información del autor simulado (nombre, usuario, avatar, rol).
- `repository`: Repositorio simulado (ej. `dokove/auth-service`).
- `branch`: Rama origen y destino.
- `category`: Categoría taxonómica (`review.security`, `review.performance`, etc.).
- `tags`: Etiquetas taxonómicas registradas en `@dokove/taxonomies`.
- `seniority`: Nivel de dificultad (`junior`, `mid`, `senior`, `lead`).
- `estimatedMinutes`: Tiempo estimado para auditar.
- `description`: Descripción markdown redactada por el autor de la PR.
- `files`: Lista de archivos con diffs unificados y lista de issues (*Ground Truth*).
- `rubric`: Rúbrica de evaluación automatizada con veredicto recomendado (`request_changes`, `approve`, `comment`), puntaje mínimo y resumen pedagógico.

---

## 4. Virtual PR Review vs Pull Requests Reales

| Aspecto | PR Real en GitHub | Simulador Virtual Dokove (`pub.review`) |
| :--- | :--- | :--- |
| **Aislamiento** | ❌ Comentarios compartidos (spoilers) | ✅ Sesión 100% aislada por usuario/candidato |
| **Evaluación** | ❌ Manual y subjetiva | ✅ Comparación automática con Ground Truth Rubric |
| **Distractores** | ❌ Ruido sin calificar | ✅ Detección explícita de falsos positivos y nitpicks |
| **Calibración** | ❌ Desconocida | ✅ Puntuación objetiva: severidad, precisión y tono |
