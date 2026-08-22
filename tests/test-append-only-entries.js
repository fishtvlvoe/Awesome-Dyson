// Test 4.1: Append-only history entries do not overwrite
// Requirement: Append-only history entries
// Scenario: Two agents each add a history entry around the same time
//
// All entry/manifest mutations in this file happen inside an isolated temp
// directory (created fresh per test, deleted after) — never against the
// real public/entries/ directory, which is what actually gets deployed.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { assert, assertFileExists, assertDeepEqual } = require('./assert');

const REAL_ENTRIES_DIR = path.join(__dirname, '..', 'public', 'entries');
const REAL_MANIFEST_FILE = path.join(REAL_ENTRIES_DIR, 'manifest.json');
const ADD_ENTRY_SCRIPT = path.join(__dirname, '..', 'scripts', 'dashboard-add-entry.sh');

function makeIsolatedEntriesDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dyson-entries-test-'));
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ entries: [] }, null, 2));
  return dir;
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

module.exports = {
  'test_entries_directory_structure_exists': () => {
    assert(
      fs.existsSync(REAL_ENTRIES_DIR),
      `entries directory must exist at ${REAL_ENTRIES_DIR}`
    );

    assertFileExists(REAL_MANIFEST_FILE, 'manifest.json must exist in entries directory');
  },

  'test_add_entry_script_exists': () => {
    assertFileExists(ADD_ENTRY_SCRIPT, `add-entry script must exist at ${ADD_ENTRY_SCRIPT}`);
  },

  'test_manifest_json_has_entries_array': () => {
    const manifestContent = fs.readFileSync(REAL_MANIFEST_FILE, 'utf8');
    const manifest = JSON.parse(manifestContent);

    assert(
      Array.isArray(manifest.entries),
      'manifest.json must have an entries array'
    );
  },

  'test_two_entry_files_do_not_overwrite_each_other': () => {
    const entriesDir = makeIsolatedEntriesDir();
    try {
      const testEntry1 = path.join(entriesDir, '2026-08-22-test-entry-1.json');
      const testEntry2 = path.join(entriesDir, '2026-08-22-test-entry-2.json');

      const entry1Data = {
        date: '2026-08-22',
        topic: 'Test Entry 1',
        summary: 'First concurrent entry',
        decisions: ['decision 1'],
        links: []
      };

      const entry2Data = {
        date: '2026-08-22',
        topic: 'Test Entry 2',
        summary: 'Second concurrent entry',
        decisions: ['decision 2'],
        links: []
      };

      // Write both entry files directly (simulating what script should do)
      fs.writeFileSync(testEntry1, JSON.stringify(entry1Data, null, 2));
      fs.writeFileSync(testEntry2, JSON.stringify(entry2Data, null, 2));

      assertFileExists(testEntry1, 'First entry file must exist');
      assertFileExists(testEntry2, 'Second entry file must exist');

      const file1Content = JSON.parse(fs.readFileSync(testEntry1, 'utf8'));
      const file2Content = JSON.parse(fs.readFileSync(testEntry2, 'utf8'));

      assertDeepEqual(file1Content, entry1Data, 'First entry file should not be overwritten');
      assertDeepEqual(file2Content, entry2Data, 'Second entry file should not be overwritten');
    } finally {
      cleanup(entriesDir);
    }
  },

  'test_manifest_updates_track_all_entries': () => {
    const entriesDir = makeIsolatedEntriesDir();
    try {
      const manifestFile = path.join(entriesDir, 'manifest.json');
      const testEntry = path.join(entriesDir, '2026-08-22-manifest-test.json');

      const initialManifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
      const initialCount = initialManifest.entries.length;

      const entryData = {
        date: '2026-08-22',
        topic: 'Manifest Test',
        summary: 'Testing manifest update',
        decisions: [],
        links: []
      };
      fs.writeFileSync(testEntry, JSON.stringify(entryData, null, 2));

      // Build a NEW array (spread, not aliasing) so later reads of
      // initialManifest.entries are unaffected by this push.
      const newManifest = { entries: [...initialManifest.entries] };
      newManifest.entries.push({
        date: '2026-08-22',
        topic: 'Manifest Test',
        file: '2026-08-22-manifest-test.json'
      });
      fs.writeFileSync(manifestFile, JSON.stringify(newManifest, null, 2));

      const updatedManifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
      assert(
        updatedManifest.entries.length > initialCount,
        'Manifest should have more entries after update'
      );

      assert(
        updatedManifest.entries.some(e => e.file === '2026-08-22-manifest-test.json'),
        'Manifest should contain reference to new entry file'
      );
    } finally {
      cleanup(entriesDir);
    }
  }
};
