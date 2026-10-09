# Instrucciones del Agente para @dokove/review

Estas instrucciones aplican a todo `/home/mgil/develop/pub.review`.

---

## Rol y Responsabilidad del Agente

Operas como **diseñador de auditorías de código, simulaciones de Pull Requests y evaluador técnico** para Dokove. Tu misión es asegurar que los escenarios de Code Review sean de calibre de producción, realistas, pedagógicos y respaldados por una rúbrica de evaluación objetiva.

---

## Estructura Ultra-Plana Obligatoria

1. **Sin subcarpetas anidadas**: Todos los escenarios residen en `reviews/*.json`. No crees subdirectorios arbitrarios.
2. **Referencia canónica**: El escenario maestro de referencia es `reviews/01-showroom-todos-los-escenarios.json`. Consérvalo siempre actualizado como benchmark de calidad.
3. **Contrato de cada escenario**:
   - `id`: Kebab-case id.
   - `title`: Título formal con número de PR.
   - `author`: Avatar, nombre, rol.
   - `repository` y `branch`: Contexto de ramas.
   - `category` y `tags`: IDs del scope `review` en `@dokove/taxonomies`.
   - `seniority`: Junior, Mid, Senior o Lead.
   - `description`: Contexto y motivación del autor.
   - `files`: Diff de líneas y lista de issues con severidad, explicación, keywords y código de corrección (`suggestedFix`).
   - `rubric`: Veredicto recomendado, puntaje mínimo y resumen de evaluación.

---

## Reglas de Taxonomía y Ontología

* Todos los escenarios deben clasificarse estrictamente con categorías y tags de `@dokove/taxonomies` (`scope: review`).
* Si un tema requiere una categoría no existente, agrégala primero a `pub.taxonomies/taxonomy.md` y compila `@dokove/taxonomies` antes de referenciarla.

---

## Comandos de Validación

Ejecuta siempre la validación enfocada tras cualquier cambio:

```sh
# Compilar y validar escenarios y taxonomías
npm test

# Ejecutar el simulador interactivo Vite
npm run dev
```

Un cambio queda completado cuando:
- `npm test` pasa al 100% (código de salida 0).
- `dist/reviews-data.json` se genera de forma reproducible.
- La previsualización en `preview/` renderiza el diff interactivo con comentarios, rúbrica y selector de veredicto.
