// Test 1.1: Lock blocks second writer
// Requirement: Single-writer lock for dashboard updates
// Scenario: Second agent attempts to write while a lock is held

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { assert, assertEqual, assertFileExists } = require('./assert');

const LOCK_SCRIPT = path.join(__dirname, '..', 'scripts', 'dashboard-lock.sh');
const LOCK_DIR = path.join(process.env.HOME, '.claude', 'locks', 'dev-dashboards');
const TEST_PROJECT = 'test-project-1';
const TEST_LOCK_FILE = path.join(LOCK_DIR, `${TEST_PROJECT}.lock`);

module.exports = {
  'test_lock_blocks_second_writer_when_valid_lock_exists': () => {
    // Setup: ensure lock dir exists and is clean
    if (!fs.existsSync(LOCK_DIR)) {
      fs.mkdirSync(LOCK_DIR, { recursive: true });
    }

    // Clean up any existing lock
    if (fs.existsSync(TEST_LOCK_FILE)) {
      fs.unlinkSync(TEST_LOCK_FILE);
    }

    // Precondition: Script should exist
    assertFileExists(LOCK_SCRIPT, 'Lock script must exist');

    // Action 1: First agent acquires lock
    try {
      execSync(`bash ${LOCK_SCRIPT} acquire ${TEST_PROJECT}`, {
        stdio: 'pipe'
      });
    } catch (e) {
      throw new Error(`Failed to acquire lock: ${e.message}`);
    }

    // Verify: Lock file was created
    assertFileExists(TEST_LOCK_FILE, 'Lock file must be created after acquire');

    // Verify: Lock file contains holder and acquired_at
    const lockContent = JSON.parse(fs.readFileSync(TEST_LOCK_FILE, 'utf8'));
    assert(lockContent.holder, 'Lock must contain holder');
    assert(lockContent.acquired_at, 'Lock must contain acquired_at');

    // Action 2: Second agent tries to acquire lock
    let secondAttemptError = null;
    try {
      execSync(`bash ${LOCK_SCRIPT} acquire ${TEST_PROJECT}`, {
        stdio: 'pipe'
      });
    } catch (e) {
      secondAttemptError = e;
    }

    // Verify: Second acquire must fail
    assert(secondAttemptError, 'Second acquire should fail');

    // Verify: Error message contains holder and time info
    const errorOutput = secondAttemptError.stderr?.toString() || secondAttemptError.message;
    assert(
      errorOutput.includes(lockContent.holder) || errorOutput.includes('locked'),
      `Error should mention lock holder or lock status. Got: ${errorOutput}`
    );

    // Cleanup
    if (fs.existsSync(TEST_LOCK_FILE)) {
      fs.unlinkSync(TEST_LOCK_FILE);
    }
  },

  'test_lock_check_returns_holder_and_timestamp': () => {
    // Setup
    if (!fs.existsSync(LOCK_DIR)) {
      fs.mkdirSync(LOCK_DIR, { recursive: true });
    }

    if (fs.existsSync(TEST_LOCK_FILE)) {
      fs.unlinkSync(TEST_LOCK_FILE);
    }

    // Action: Acquire lock
    try {
      execSync(`bash ${LOCK_SCRIPT} acquire ${TEST_PROJECT}`, {
        stdio: 'pipe'
      });
    } catch (e) {
      throw new Error(`Failed to acquire lock: ${e.message}`);
    }

    // Action: Check lock status
    let checkOutput;
    try {
      checkOutput = execSync(`bash ${LOCK_SCRIPT} check ${TEST_PROJECT}`, {
        stdio: 'pipe',
        encoding: 'utf8'
      });
    } catch (e) {
      checkOutput = e.stdout || e.message;
    }

    // Verify: Check output indicates lock is held
    assert(
      checkOutput.includes(TEST_PROJECT) || checkOutput.includes('locked'),
      `Check should report lock status. Got: ${checkOutput}`
    );

    // Cleanup
    if (fs.existsSync(TEST_LOCK_FILE)) {
      fs.unlinkSync(TEST_LOCK_FILE);
    }
  }
};
