import { readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = resolve(__dirname, '..');
const srcRoot = join(packageRoot, 'src');
const vitestEntrypoint = resolve(packageRoot, '../../node_modules/vitest/vitest.mjs');
const batchSize = Number.parseInt(process.env.VITEST_BATCH_SIZE ?? '8', 10);
const nodeHeapMb = process.env.VITEST_HEAP_MB ?? '4096';

function isTestFile(filePath) {
  return /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath);
}

function collectTestFiles(dirPath) {
  const entries = readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTestFiles(fullPath));
      continue;
    }
    if (entry.isFile() && isTestFile(fullPath)) {
      files.push(relative(packageRoot, fullPath));
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

const testFiles = collectTestFiles(srcRoot);
if (testFiles.length === 0) {
  console.error('No frontend test files found.');
  process.exit(1);
}

const batches = chunk(testFiles, Math.max(1, batchSize));

for (const [index, batch] of batches.entries()) {
  const label = `[vitest batch ${index + 1}/${batches.length}]`;
  console.log(`${label} ${batch.length} files`);

  const result = spawnSync(
    process.execPath,
    [`--max-old-space-size=${nodeHeapMb}`, vitestEntrypoint, 'run', ...batch],
    {
      cwd: packageRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
      },
    }
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
