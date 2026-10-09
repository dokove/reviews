import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reviewsDir = path.join(rootDir, 'reviews');
const distDir = path.join(rootDir, 'dist');

console.log('Compilando escenarios de Code Review en pub.review...\n');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const files = fs.readdirSync(reviewsDir).filter(f => f.endsWith('.json')).sort();
const scenarios = [];

let totalFilesCount = 0;
let totalIssuesCount = 0;

for (const file of files) {
  const filePath = path.join(reviewsDir, file);
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    const data = JSON.parse(raw);
    
    // Validar campos mínimos obligatorios
    if (!data.id || !data.title || !data.category || !data.files || !data.rubric) {
      throw new Error(`Escenario ${file} carece de campos obligatorios (id, title, category, files, rubric).`);
    }

    const fileIssues = data.files.reduce((acc, f) => acc + (f.issues ? f.issues.length : 0), 0);
    totalFilesCount += data.files.length;
    totalIssuesCount += fileIssues;

    scenarios.push({
      ...data,
      fileName: file,
      totalIssues: fileIssues,
    });

    console.log(`[OK] [${data.id}] "${data.title}" -> ${data.files.length} archivos, ${fileIssues} issues.`);
  } catch (err) {
    console.error(`[ERROR] Error parseando ${file}:`, err.message);
    process.exit(1);
  }
}

const outputPayload = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  stats: {
    totalScenarios: scenarios.length,
    totalFiles: totalFilesCount,
    totalIssues: totalIssuesCount,
  },
  scenarios,
};

fs.writeFileSync(
  path.join(distDir, 'reviews-data.json'),
  JSON.stringify(outputPayload, null, 2),
  'utf8'
);

const entryJs = `// Generado automáticamente por scripts/build-reviews-data.mjs
import reviewsData from './reviews-data.json' with { type: 'json' };

export const scenarios = reviewsData.scenarios;
export const stats = reviewsData.stats;
export default reviewsData;
`;

fs.writeFileSync(path.join(distDir, 'index.js'), entryJs, 'utf8');

console.log(`\nCompilacion finalizada exitosamente:`);
console.log(`   Escenarios: ${scenarios.length}`);
console.log(`   Archivos modificados: ${totalFilesCount}`);
console.log(`   Fallos/Issues auditados: ${totalIssuesCount}`);
console.log(`   Salida: dist/reviews-data.json y dist/index.js\n`);
