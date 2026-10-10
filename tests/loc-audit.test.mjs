import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile, symlink } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { auditLoc, countPhysicalLines, isCountablePath } from '../scripts/loc-audit.mjs';

test('physical LOC counts blank lines but not phantom trailing lines', () => {
  assert.equal(countPhysicalLines(''), 0);
  assert.equal(countPhysicalLines('one'), 1);
  assert.equal(countPhysicalLines('one\n'), 1);
  assert.equal(countPhysicalLines('one\n\n'), 2);
});

test('source filter excludes generated output and dependencies', () => {
  assert.equal(isCountablePath('client/src/App.tsx'), true);
  assert.equal(isCountablePath('legacy-archive/server/service.ts'), true);
  assert.equal(isCountablePath('client/dist/bundle.js'), false);
  assert.equal(isCountablePath('client/build-output/server/index.js'), false);
  assert.equal(isCountablePath('node_modules/package/index.js'), false);
  assert.equal(isCountablePath('vendor/x.go'), false);
  assert.equal(isCountablePath('public/app.min.js'), false);
  assert.equal(isCountablePath('src/types.generated.ts'), false);
  assert.equal(isCountablePath('docs/README.md'), false);
});

test('audit splits active, tests and archival source without padding totals', async (t) => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'skycoin-loc-'));
  t.after(() => rm(tmp, { recursive: true, force: true }));
  for (const folder of ['src', 'tests', 'legacy-archive/src', 'build-output', 'node_modules/x', 'docs']) {
    await mkdir(path.join(tmp, folder), { recursive: true });
  }
  await writeFile(path.join(tmp, 'src', 'index.js'), 'const x = 1;\n\n');
  await writeFile(path.join(tmp, 'tests', 'feature.test.mjs'), 'export const passed = true;\n');
  await writeFile(path.join(tmp, 'legacy-archive', 'src', 'original.ts'), 'export const history = true;');
  await writeFile(path.join(tmp, 'build-output', 'bundled.js'), 'generated\n'.repeat(5000));
  await writeFile(path.join(tmp, 'node_modules', 'x', 'index.js'), 'third-party\n'.repeat(5000));
  await writeFile(path.join(tmp, 'docs', 'README.md'), 'documentation\n'.repeat(5000));
  await writeFile(path.join(tmp, 'src', 'binary.js'), Buffer.from([0xff, 0, 0xfe]));
  await symlink(path.join(tmp, 'src'), path.join(tmp, 'src-alias'));

  const a = await auditLoc(tmp);
  assert.deepEqual(a.active, { files: 1, lines: 2 });
  assert.deepEqual(a.tests, { files: 1, lines: 1 });
  assert.deepEqual(a.legacy, { files: 1, lines: 1 });
  assert.deepEqual(a.total, { files: 3, lines: 4 });
  assert.equal(a.skippedFiles, 1);
  assert.equal(a.target.reachedByActiveSource, false);
  assert.equal(a.target.activeSourceShortfall, 401998);
});

test('UTF-8 BOM and CRLF source lines are counted once', async (t) => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'skycoin-loc-'));
  t.after(() => rm(tmp, { recursive: true, force: true }));
  await writeFile(path.join(tmp, 'index.ts'), '\ufeffconst a = 1;\r\nconst b = 2;\r\n');
  const a = await auditLoc(tmp);
  assert.equal(a.active.lines, 2);
});
