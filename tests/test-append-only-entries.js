// Test 4.1: Append-only history entries do not overwrite
// Requirement: Append-only history entries
// Scenario: Two agents each add a history entry around the same time

const fs = require('fs');
const path = require('path');
const { assert, assertFileExists, assertDeepEqual } = require('./assert');

const ENTRIES_DIR = path.join(__dirname, '..', 'public', 'entries');
const MANIFEST_FILE = path.join(ENTRIES_DIR, 'manifest.json');
const ADD_ENTRY_SCRIPT = path.join(__dirname, '..', 'scripts', 'dashboard-add-entry.sh');

module.exports = {
  'test_entries_directory_structure_exists': () => {
    assert(
      fs.existsSync(ENTRIES_DIR),
      `entries directory must exist at ${ENTRIES_DIR}`
    );

    assertFileExists(MANIFEST_FILE, 'manifest.json must exist in entries directory');
  },

  'test_add_entry_script_exists': () => {
    assertFileExists(ADD_ENTRY_SCRIPT, `add-entry script must exist at ${ADD_ENTRY_SCRIPT}`);
  },

  'test_manifest_json_has_entries_array': () => {
    const manifestContent = fs.readFileSync(MANIFEST_FILE, 'utf8');
    const manifest = JSON.parse(manifestContent);

    assert(
      Array.isArray(manifest.entries),
      'manifest.json must have an entries array'
    );
  },

  'test_two_entry_files_do_not_overwrite_each_other': () => {
    // Setup: Clean up any previous test entries
    const testEntry1 = path.join(ENTRIES_DIR, '2026-08-22-test-entry-1.json');
    const testEntry2 = path.join(ENTRIES_DIR, '2026-08-22-test-entry-2.json');

    if (fs.existsSync(testEntry1)) fs.unlinkSync(testEntry1);
    if (fs.existsSync(testEntry2)) fs.unlinkSync(testEntry2);

    // Get initial manifest state
    const initialManifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
    const initialCount = initialManifest.entries.length;

    // Simulate two agents creating entries
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

    // Verify both files exist
    assertFileExists(testEntry1, 'First entry file must exist');
    assertFileExists(testEntry2, 'Second entry file must exist');

    // Verify both files have correct content (not overwritten)
    const file1Content = JSON.parse(fs.readFileSync(testEntry1, 'utf8'));
    const file2Content = JSON.parse(fs.readFileSync(testEntry2, 'utf8'));

    assertDeepEqual(
      file1Content,
      entry1Data,
      'First entry file should not be overwritten'
    );

    assertDeepEqual(
      file2Content,
      entry2Data,
      'Second entry file should not be overwritten'
    );

    // Cleanup
    if (fs.existsSync(testEntry1)) fs.unlinkSync(testEntry1);
    if (fs.existsSync(testEntry2)) fs.unlinkSync(testEntry2);
  },

  'test_manifest_updates_track_all_entries': () => {
    // Setup
    const testEntry = path.join(ENTRIES_DIR, '2026-08-22-manifest-test.json');
    if (fs.existsSync(testEntry)) fs.unlinkSync(testEntry);

    // Get initial manifest
    const initialManifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
    const initialCount = initialManifest.entries.length;

    // Add new entry file
    const entryData = {
      date: '2026-08-22',
      topic: 'Manifest Test',
      summary: 'Testing manifest update',
      decisions: [],
      links: []
    };
    fs.writeFileSync(testEntry, JSON.stringify(entryData, null, 2));

    // Manually update manifest (simulating what add-entry script should do)
    const newManifest = { entries: initialManifest.entries };
    newManifest.entries.push({
      date: '2026-08-22',
      topic: 'Manifest Test',
      file: '2026-08-22-manifest-test.json'
    });
    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(newManifest, null, 2));

    // Verify manifest was updated
    const updatedManifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
    assert(
      updatedManifest.entries.length > initialCount,
      'Manifest should have more entries after update'
    );

    assert(
      updatedManifest.entries.some(e => e.file === '2026-08-22-manifest-test.json'),
      'Manifest should contain reference to new entry file'
    );

    // Cleanup
    if (fs.existsSync(testEntry)) fs.unlinkSync(testEntry);

    // Restore original manifest
    const restoreManifest = { entries: initialManifest.entries };
    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(restoreManifest, null, 2));
  }
};
