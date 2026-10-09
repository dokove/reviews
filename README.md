# @dokove/review

> **Simulador de Code Review y auditoria tecnica de Pull Requests para desarrolladores de alto impacto.**

`pub.review` proporciona escenarios interactivos de Pull Requests donde los ingenieros auditan diffs de codigo reales, identifican vulnerabilidades de seguridad, condiciones de carrera y fugas de memoria, escriben feedback en linea y emiten veredictos basados en rubricas objetivas.

---

## Caracteristicas Principales

- **Arquitectura Ultra-Plana**: Todos los escenarios residen en `reviews/*.json`.
- **Escenarios de Produccion Reales**: Casos de JWT algorithm confusion, memory leaks en Node.js EventEmitters, race conditions en inventarios, timing attacks y SQL injections.
- **Rubricas Objetivas & Calibracion**: Cada fallo incluye explicacion detallada, fix sugerido y deteccion de falsos positivos (*distractors*).
- **Taxonomias Ontologicas**: Integracion con `@dokove/taxonomies` bajo el ambito `review.*`.
- **Previsualizador Interactivo Vite**: Experiencia de Pull Request inspirada en GitHub con diff viewer, comentarios en linea y grading automatizado en el puerto 3017.

---

## Inicio Rapido

```sh
# Instalar dependencias
npm install

# Compilar y validar taxonomias
npm test

# Iniciar el simulador interactivo
npm run dev
```

---

## Estructura de Datos

Consulta [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/TAXONOMIES.md](docs/TAXONOMIES.md) y [docs/STYLEGUIDE.md](docs/STYLEGUIDE.md).
