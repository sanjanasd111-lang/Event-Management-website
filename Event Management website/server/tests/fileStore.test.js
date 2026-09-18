import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { loadDataStore, saveDataStore } from '../utils/fileStore.js';

test('loads and saves the persisted store', () => {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'codesky-store-'));
  const filePath = path.join(tempDir, 'store.json');

  const initialStore = loadDataStore(filePath);
  assert.deepEqual(initialStore.users, []);

  saveDataStore(filePath, { ...initialStore, users: [{ name: 'Ada' }] });

  const updatedStore = loadDataStore(filePath);
  assert.equal(updatedStore.users[0].name, 'Ada');

  rmSync(tempDir, { recursive: true, force: true });
});
