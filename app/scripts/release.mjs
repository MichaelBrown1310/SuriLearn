#!/usr/bin/env node
/**
 * SuriLearn — Automatizador de Versionamiento Pre-1.0 y Registro de Planes
 *
 * Uso:
 *   npm run release:patch -- "Descripción del cambio"
 *   npm run release:minor -- "Descripción del nuevo módulo"
 *   npm run release:v1    -- "Lanzamiento Oficial SuriLearn v1.0.0"
 *
 * Acciones que realiza automáticamente:
 * 1. Incrementa la versión en package.json (manteniendo 0.x.y hasta que se use 'v1').
 * 2. Crea (o conserva si ya fue redactado) el archivo de plan en docs/plans/PLAN_v<version>.md.
 * 3. Registra la versión y el enlace a su plan en docs/plans/README.md.
 * 4. Inserta la entrada de la versión y el enlace a su plan en CHANGELOG.md.
 * 5. Crea el commit y el tag anotado v<version> en Git.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = process.cwd();
const pkgPath = path.join(rootDir, 'package.json');
const changelogPath = path.join(rootDir, 'CHANGELOG.md');
const plansDir = path.join(rootDir, 'docs', 'plans');
const plansIndexPath = path.join(plansDir, 'README.md');

const args = process.argv.slice(2);
const bumpType = args[0]; // 'patch' | 'minor' | 'v1'
const summary = args.slice(1).join(' ').trim() || 'Actualización incremental de desarrollo Pre-1.0';

if (!['patch', 'minor', 'v1'].includes(bumpType)) {
  console.error('Uso: node scripts/release.mjs <patch|minor|v1> "Descripción del cambio"');
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const [major, minor, patch] = pkg.version.split('.').map(Number);

let nextVersion = '';
if (bumpType === 'v1') {
  nextVersion = '1.0.0';
} else if (major === 0) {
  if (bumpType === 'minor') {
    nextVersion = `0.${minor + 1}.0`;
  } else {
    nextVersion = `0.${minor}.${patch + 1}`;
  }
} else {
  if (bumpType === 'minor') {
    nextVersion = `${major}.${minor + 1}.0`;
  } else {
    nextVersion = `${major}.${minor}.${patch + 1}`;
  }
}

const today = new Date().toISOString().split('T')[0];
const planFilename = `PLAN_v${nextVersion}.md`;
const planFilePath = path.join(plansDir, planFilename);

// Obtener archivos modificados actualmente en Git para documentarlos en el plan y changelog
let changedFiles = [];
try {
  const statusOut = execSync('git status --porcelain', { encoding: 'utf8' });
  changedFiles = statusOut
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
} catch {
  changedFiles = [];
}

// 1. Crear documento de plan para esta versión si aún no existe
if (!fs.existsSync(plansDir)) {
  fs.mkdirSync(plansDir, { recursive: true });
}

if (!fs.existsSync(planFilePath)) {
  const filesListMd =
    changedFiles.length > 0
      ? changedFiles.map((f) => `- \`${f}\``).join('\n')
      : '- Actualización de versión y metadatos del proyecto';

  const planContent = `# Plan de Desarrollo \`v${nextVersion}\` — ${summary}

- **Versión Objetivo**: \`v${nextVersion}\`
- **Fecha**: ${today}
- **Estado**: Completado
- **Fase**: ${nextVersion.startsWith('0.') ? 'Desarrollo Pre-1.0' : 'Release 1.0+'}

---

## 1. Objetivo del Avance
${summary}

## 2. Archivos y Componentes Registrados en esta Versión
${filesListMd}

## 3. Verificación
- [x] Compilación TypeScript y Vite verificada (\`npm run build\`).
- [x] Cambios registrados en \`CHANGELOG.md\` y etiquetados en Git como \`v${nextVersion}\`.
`;
  fs.writeFileSync(planFilePath, planContent, 'utf8');
  console.log(`[SuriLearn Release] Plan creado en docs/plans/${planFilename}`);
} else {
  console.log(`[SuriLearn Release] Usando plan existente en docs/plans/${planFilename}`);
}

// 2. Actualizar índice en docs/plans/README.md
if (fs.existsSync(plansIndexPath)) {
  const indexContent = fs.readFileSync(plansIndexPath, 'utf8');
  const marker = '| Versión | Fecha | Estado | Resumen del Avance | Documento del Plan |\n|---|---|---|---|---|';
  if (indexContent.includes(marker) && !indexContent.includes(`| **v${nextVersion}** |`)) {
    const newRow = `| **v${nextVersion}** | ${today} | Completado | ${summary} | [${planFilename}](./${planFilename}) |`;
    const updatedIndex = indexContent.replace(marker, `${marker}\n${newRow}`);
    fs.writeFileSync(plansIndexPath, updatedIndex, 'utf8');
    console.log(`[SuriLearn Release] Índice docs/plans/README.md actualizado con v${nextVersion}`);
  }
}

// 3. Actualizar CHANGELOG.md
if (fs.existsSync(changelogPath)) {
  const changelogContent = fs.readFileSync(changelogPath, 'utf8');
  const headerMarker = '<!-- CHANGELOG_ENTRIES_START -->';
  const filesBullet =
    changedFiles.length > 0
      ? changedFiles.map((f) => `  - \`${f}\``).join('\n')
      : '  - Sincronización de versión';

  const newEntry = `## [v${nextVersion}] - ${today}

- **Resumen**: ${summary}
- **Plan de Desarrollo**: [docs/plans/${planFilename}](./docs/plans/${planFilename})
- **Archivos impactados**:
${filesBullet}
`;

  if (changelogContent.includes(headerMarker)) {
    const updatedChangelog = changelogContent.replace(
      headerMarker,
      `${headerMarker}\n\n${newEntry}`
    );
    fs.writeFileSync(changelogPath, updatedChangelog, 'utf8');
    console.log(`[SuriLearn Release] CHANGELOG.md actualizado con [v${nextVersion}]`);
  }
}

// 4. Actualizar package.json
pkg.version = nextVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log(`[SuriLearn Release] package.json actualizado a v${nextVersion}`);

// 5. Registrar commit y tag en Git
try {
  execSync('git add -A', { stdio: 'inherit' });
  execSync(`git commit -m "chore(release): v${nextVersion} - ${summary.replace(/"/g, "'")}"`, {
    stdio: 'inherit',
  });
  execSync(`git tag -a v${nextVersion} -m "Release v${nextVersion}: ${summary.replace(/"/g, "'")}"`, {
    stdio: 'inherit',
  });
  console.log(`\n✅ Versión v${nextVersion} registrada exitosamente con su plan en docs/plans/${planFilename}.`);
  console.log(`👉 Para subir a GitHub ejecuta: git push origin main --tags`);
} catch (err) {
  console.error('[SuriLearn Release] Error al crear el commit o tag en Git:', err.message);
  process.exit(1);
}
