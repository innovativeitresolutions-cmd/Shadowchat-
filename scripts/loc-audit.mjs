/**
 * Reproducible physical source-line inventory for SKYCOIN4444.
 *
 * Do not confuse archived code, generated build artifacts, and deployed code.
 * Counts physical lines in source-like files (including comments and blanks).
 * This is a measurement tool, not a release-quality or production-readiness gate.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_EXTENSIONS = new Set([
  '.c', '.cc', '.cpp', '.cs', '.css', '.go', '.h', '.hpp', '.html', '.java', '.js',
  '.jsx', '.kt', '.kts', '.mjs', '.cjs', '.php', '.py', '.rb', '.rs', '.scss',
  '.sh', '.sol', '.sql', '.svelte', '.swift', '.ts', '.tsx', '.vue',
]);
const IGNORED_DIRECTORIES = new Set([
  '.git', '.next', '.turbo', '.cache', 'build', 'build-output', 'coverage',
  'dist', 'node_modules', 'vendor', '__pycache__',
]);
const UTF8 = new TextDecoder('utf-8', { fatal: true });
const MAX_FILE_BYTES = 4 * 1024 * 1024;

function isGeneratedFile(fileName) {
  const lower = fileName.toLowerCase();
  return /(?:\.min\.(?:js|css)|\.generated\.|\.g\.(?:ts|js)|\.map$)/.test(lower);
}

function classifySource(relativePath) {
  const parts = relativePath.split('/');
  if (parts[0] === 'legacy-archive') return 'legacy';
  if (parts.includes('tests') || parts.includes('__tests__') || /\.(?:spec|test)\.[cm]?[jt]sx?$/.test(parts.at(-1))) {
    return 'tests';
  }
  return 'active';
}

export function countPhysicalLines(source) {
  if (!source) return 0;
  return source.split('\n').length - Number(source.endsWith('\n'));
}

export function isCountablePath(relativePath) {
  const parts = relativePath.split('/');
  if (parts.some((segment) => IGNORED_DIRECTORIES.has(segment))) return false;
  const file = parts.at(-1) || '';
  return SOURCE_EXTENSIONS.has(path.extname(file).toLowerCase()) && !isGeneratedFile(file);
}

function emptyGroup() {
  return { files: 0, lines: 0 };
}

/** Count real files only; ignore symlinks to avoid cycles and reading outside root. */
export async function auditLoc(rootDirectory) {
  const root = path.resolve(rootDirectory);
  const results = { methodology: 'physical-source-lines-v1', active: emptyGroup(), tests: emptyGroup(), legacy: emptyGroup(), skippedFiles: 0 };

  async function visit(dir, relative = '') {
    const entries = (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'));
    for (const entry of entries) {
      const relativePath = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) await visit(path.join(dir, entry.name), relativePath);
      } else if (entry.isFile()) {
        if (!isCountablePath(relativePath)) continue;
        const file = path.join(dir, entry.name);
        let contents;
        try {
          const binary = await readFile(file);
          if (binary.length > MAX_FILE_BYTES || binary.includes(0)) {
            results.skippedFiles += 1;
            continue;
          }
          contents = UTF8.decode(binary);
        } catch (error) {
          if (error instanceof TypeError) {
            results.skippedFiles += 1; // invalid UTF-8 is not source text
            continue;
          }
          throw error; // I/O failures must not silently produce a lower count
        }
        const group = results[classifySource(relativePath)];
        group.files += 1;
        group.lines += countPhysicalLines(contents.replace(/\r\n/g, '\n'));
      }
    }
  }

  await visit(root);
  results.total = {
    files: results.active.files + results.tests.files + results.legacy.files,
    lines: results.active.lines + results.tests.lines + results.legacy.lines,
  };
  results.currentRuntimeAndTests = {
    files: results.active.files + results.tests.files,
    lines: results.active.lines + results.tests.lines,
  };
  results.target = {
    requestedLines: 402000,
    // The target is a reporting figure, never a minimum CI threshold.
    activeSourceShortfall: Math.max(0, 402000 - results.active.lines),
    reachedByActiveSource: results.active.lines >= 402000,
  };
  return results;
}

const invokedAsScript = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsScript) {
  const root = path.resolve(process.argv.find((arg) => arg.startsWith('--root='))?.slice('--root='.length) || '.');
  auditLoc(root).then((report) => {
    if (process.argv.includes('--json')) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log('SKYCOIN4444 source inventory (physical lines; not executable SLOC)');
      for (const group of ['active', 'tests', 'legacy', 'total']) {
        console.log(`${group.padEnd(8)} ${String(report[group].files).padStart(6)} files  ${String(report[group].lines).padStart(9)} lines`);
      }
      console.log(`Skipped unreadable/non-text files: ${report.skippedFiles}`);
      console.log('Historical source is not automatically part of the beta runtime.');
      console.log('A larger line count does not establish feature completeness or release readiness.');
    }
  }).catch((error) => {
    console.error(`LOC audit failed: ${error.message}`);
    process.exitCode = 1;
  });
}
