import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveResourceTaxonomy, getCategory, getTag } from '@dokove/taxonomies';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reviewsJsonPath = path.join(rootDir, 'dist', 'reviews-data.json');

console.log('Validando taxonomías y ontología de pub.review con @dokove/taxonomies...\n');

if (!fs.existsSync(reviewsJsonPath)) {
  throw new Error('Falta dist/reviews-data.json. Ejecuta primero `npm run build`.');
}

const data = JSON.parse(fs.readFileSync(reviewsJsonPath, 'utf8'));
let validatedCount = 0;
let issueErrors = 0;

for (const scenario of data.scenarios) {
  const relativePath = `reviews/${scenario.fileName || scenario.id + '.json'}`;

  // 1. Validar categoría
  const cat = getCategory(scenario.category);
  if (!cat) {
    console.error(`[ERROR] Escenario [${scenario.id}]: Categoría '${scenario.category}' no existe en taxonomías.`);
    issueErrors++;
  } else if (cat.scope !== 'review') {
    console.warn(`[WARN] Escenario [${scenario.id}]: Categoría '${scenario.category}' tiene scope '${cat.scope}', se esperaba 'review'.`);
  }

  // 2. Validar tags
  if (Array.isArray(scenario.tags)) {
    for (const tagId of scenario.tags) {
      const tagObj = getTag(tagId);
      if (!tagObj) {
        console.error(`[ERROR] Escenario [${scenario.id}]: Tag '${tagId}' no existe en taxonomías.`);
        issueErrors++;
      }
    }
  }

  // 3. Validar files y issues
  for (const file of scenario.files) {
    if (!file.diffLines || !Array.isArray(file.diffLines)) {
      console.error(`[ERROR] Escenario [${scenario.id}] archivo '${file.path}': Falta diffLines.`);
      issueErrors++;
    }
    if (file.issues) {
      for (const issue of file.issues) {
        if (!issue.id || !issue.title || !issue.explanation || !issue.severity) {
          console.error(`[ERROR] Escenario [${scenario.id}] issue '${issue.id || 'desconocido'}': Datos incompletos.`);
          issueErrors++;
        }
      }
    }
  }

  console.log(`PR [${scenario.id}] - "${scenario.title}"`);
  console.log(`   Categoría: ${scenario.category} (${cat ? cat.label : 'INVALID'})`);
  console.log(`   Tags: ${(scenario.tags || []).join(', ')}`);
  console.log(`   Veredicto esperado: ${scenario.rubric.recommendedVerdict} (Min: ${scenario.rubric.passingScore}%)\n`);

  validatedCount++;
}

if (issueErrors > 0) {
  console.error(`\nSe encontraron ${issueErrors} errores de validación taxonómica.`);
  process.exit(1);
}

console.log('-----------------------------------------------------------');
console.log(`Validación taxonómica exitosa: ${validatedCount} escenarios de Code Review conformes con @dokove/taxonomies.\n`);
