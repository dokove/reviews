# Guía de Taxonomías para @dokove/review

Este documento describe la relación ontológica entre los escenarios de `pub.review` y el paquete canónico `@dokove/taxonomies`.

---

## 1. Categorías del Ámbito `review`

Todas las categorías asignadas a los escenarios deben pertenecer al scope `review` en `@dokove/taxonomies`:

| Categoría ID | Etiqueta | Descripción |
| :--- | :--- | :--- |
| `review.security` | Seguridad & Vulnerabilidades | Auditoría de fallos de seguridad (OWASP, JWT, inyecciones, fugas de secretos). |
| `review.performance` | Performance & Fugas de Memoria | Detección de fugas de memoria, loops ineficientes, listeners huérfanos y N+1. |
| `review.concurrency` | Concurrencia & Condiciones de Carrera | Detección de race conditions, bloqueos, operaciones atómicas y sincronización. |
| `review.architecture` | Arquitectura & Acoplamiento | Evaluación de acoplamiento, cohesión, diseño de interfaces y contratos. |
| `review.resilience` | Resiliencia & Tolerancia a Fallos | Circuit breakers, timeouts, reintentos y degradación elegante. |

---

## 2. Etiquetas del Ámbito `review`

Las etiquetas permiten clasificar patrones específicos dentro de las revisiones de código:

- `review.code-smells`: Code smells clásicos (métodos extensos, clases dios, intimidad inapropiada).
- `review.pull-request`: Buenas prácticas de pull requests y comunicación constructiva.
- `review.memory-leak`: Fugas de memoria en runtimes gestionados (Node.js, V8, JVM).
- `review.race-condition`: Condiciones de carrera y problemas de consistencia concurrente.
- `review.sql-injection`: Vulnerabilidades de inyección SQL directa o indirecta.
- `review.jwt-security`: Fallos en validación de firmas, algoritmos y claims de tokens JWT.
- `review.refactoring`: Oportunidades legítimas de refactorización y simplificación.
- `review.anti-patterns`: Anti-patrones de diseño de software y arquitectura.

---

## 3. Validación Continua

Para garantizar la coherencia del catálogo:

```sh
npm run validate:taxonomies
```

Este comando verifica que cada escenario declare categorías y tags válidos existentes en `@dokove/taxonomies`.
