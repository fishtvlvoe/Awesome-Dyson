// Test 1.2: Expired lock is clearable
// Requirement: Single-writer lock for dashboard updates
// Scenario: Lock expires after agent crash or interruption

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { assert, assertFileExists } = require('./assert');

const LOCK_SCRIPT = path.join(__dirname, '..', 'scripts', 'dashboard-lock.sh');
const LOCK_DIR = path.join(process.env.HOME, '.claude', 'locks', 'dev-dashboards');
const TEST_PROJECT = 'test-project-2';
const TEST_LOCK_FILE = path.join(LOCK_DIR, `${TEST_PROJECT}.lock`);
const LOCK_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

module.exports = {
  'test_expired_lock_can_be_overwritten_by_new_holder': () => {
    // Setup
    if (!fs.existsSync(LOCK_DIR)) {
      fs.mkdirSync(LOCK_DIR, { recursive: true });
    }

    if (fs.existsSync(TEST_LOCK_FILE)) {
      fs.unlinkSync(TEST_LOCK_FILE);
    }

    // Precondition
    assertFileExists(LOCK_SCRIPT, 'Lock script must exist');

    // Action 1: Create an old lock (simulating crashed agent)
    const oldTimestamp = new Date(Date.now() - LOCK_EXPIRY_MS - 1000).toISOString(); // 10 min + 1 sec ago
    const oldLock = {
      holder: 'crashed-agent-123',
      acquired_at: oldTimestamp
    };
    fs.writeFileSync(TEST_LOCK_FILE, JSON.stringify(oldLock));

    // Verify: Old lock exists
    assertFileExists(TEST_LOCK_FILE, 'Old lock file must exist');

    // Action 2: New agent tries to acquire lock
    let acquireError = null;
    let acquireOutput = '';
    try {
      acquireOutput = execSync(`bash ${LOCK_SCRIPT} acquire ${TEST_PROJECT}`, {
        stdio: 'pipe',
        encoding: 'utf8'
      });
    } catch (e) {
      acquireError = e;
      acquireOutput = e.stdout?.toString() || e.message;
    }

    // Verify: New acquire should succeed (old lock is expired)
    assert(
      !acquireError,
      `New agent should be able to acquire expired lock. Error: ${acquireOutput}`
    );

    // Verify: New lock file was created (old one overwritten)
    assertFileExists(TEST_LOCK_FILE, 'New lock file must be created');
    const newLock = JSON.parse(fs.readFileSync(TEST_LOCK_FILE, 'utf8'));

    // Verify: New lock holder is different from old
    assert(
      newLock.holder !== oldLock.holder,
      `Lock holder should be updated: was "${oldLock.holder}", now "${newLock.holder}"`
    );

    // Verify: New lock timestamp is recent
    const lockAge = Date.now() - new Date(newLock.acquired_at).getTime();
    assert(
      lockAge < 5000, // Should be acquired within last 5 seconds
      `New lock timestamp should be recent: ${newLock.acquired_at} (${lockAge}ms ago)`
    );

    // Cleanup
    if (fs.existsSync(TEST_LOCK_FILE)) {
      fs.unlinkSync(TEST_LOCK_FILE);
    }
  },

  'test_valid_lock_cannot_be_overwritten': () => {
    // Setup
    if (!fs.existsSync(LOCK_DIR)) {
      fs.mkdirSync(LOCK_DIR, { recursive: true });
    }

    if (fs.existsSync(TEST_LOCK_FILE)) {
      fs.unlinkSync(TEST_LOCK_FILE);
    }

    // Action 1: First agent acquires fresh lock
    try {
      execSync(`bash ${LOCK_SCRIPT} acquire ${TEST_PROJECT}`, {
        stdio: 'pipe'
      });
    } catch (e) {
      throw new Error(`First acquire failed: ${e.message}`);
    }

    const firstLock = JSON.parse(fs.readFileSync(TEST_LOCK_FILE, 'utf8'));

    // Action 2: Second agent tries to acquire (should fail because lock is fresh)
    let secondError = null;
    try {
      execSync(`bash ${LOCK_SCRIPT} acquire ${TEST_PROJECT}`, {
        stdio: 'pipe'
      });
    } catch (e) {
      secondError = e;
    }

    // Verify: Second acquire must fail
    assert(secondError, 'Second acquire of fresh lock should fail');

    // Verify: Lock file unchanged
    const stillFirstLock = JSON.parse(fs.readFileSync(TEST_LOCK_FILE, 'utf8'));
    assert(
      firstLock.holder === stillFirstLock.holder,
      'Lock holder must not change when lock is still valid'
    );

    // Cleanup
    if (fs.existsSync(TEST_LOCK_FILE)) {
      fs.unlinkSync(TEST_LOCK_FILE);
    }
  }
};
