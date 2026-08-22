// Test 2.1: Template gracefully handles missing state.json fields
// Requirement: Machine-readable state alongside human-readable page
// Scenario: state.json is missing required fields

const fs = require('fs');
const path = require('path');
const { assert } = require('./assert');

const INDEX_HTML_PATH = path.join(__dirname, '..', 'public', 'index.html');

module.exports = {
  'test_index_html_exists': () => {
    assert(
      fs.existsSync(INDEX_HTML_PATH),
      `index.html must exist at ${INDEX_HTML_PATH}`
    );
  },

  'test_index_html_contains_js_fetch_for_state_json': () => {
    const htmlContent = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

    assert(
      htmlContent.includes('state.json') || htmlContent.includes('fetch'),
      'index.html must contain code to fetch state.json'
    );
  },

  'test_index_html_gracefully_handles_missing_project_field': () => {
    const htmlContent = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

    // Should NOT contain code that directly accesses state.project without fallback
    // i.e., should use optional chaining, || operator, or conditional checks
    const hasUnsafeDotAccess = /\bstate\.project\b(?!\s*\|\||\..*?\s*\|\||&&)/.test(htmlContent);

    assert(
      !hasUnsafeDotAccess,
      'index.html should not unsafely access state.project; use fallback like state.project || "Unknown"'
    );
  },

  'test_index_html_gracefully_handles_missing_one_liner_field': () => {
    const htmlContent = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

    // Should use optional chaining or default value
    const hasUnsafeOneLinerAccess = /\bstate\.one_liner\b(?!\s*\|\||\..*?\s*\|\||&&)/.test(htmlContent);

    assert(
      !hasUnsafeOneLinerAccess,
      'index.html should not unsafely access state.one_liner; use fallback'
    );
  },

  'test_index_html_gracefully_handles_missing_changes_in_progress': () => {
    const htmlContent = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

    // Should handle undefined/empty changes_in_progress array
    const hasUnsafeChangesAccess = /\bstate\.changes_in_progress\b(?!\s*\|\||\..*?\s*\|\||&&|\.length|\[)/.test(htmlContent);

    assert(
      !hasUnsafeChangesAccess,
      'index.html should not unsafely access state.changes_in_progress; use fallback like state.changes_in_progress?.length'
    );
  },

  'test_index_html_gracefully_handles_missing_open_questions': () => {
    const htmlContent = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

    // Should handle undefined/empty open_questions array
    const hasUnsafeQuestionsAccess = /\bstate\.open_questions\b(?!\s*\|\||\..*?\s*\|\||&&|\.length|\[)/.test(htmlContent);

    assert(
      !hasUnsafeQuestionsAccess,
      'index.html should not unsafely access state.open_questions; use fallback'
    );
  },

  'test_index_html_gracefully_handles_missing_key_files': () => {
    const htmlContent = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

    // Should handle undefined/empty key_files array
    const hasUnsafeKeyFilesAccess = /\bstate\.key_files\b(?!\s*\|\||\..*?\s*\|\||&&|\.length|\[)/.test(htmlContent);

    assert(
      !hasUnsafeKeyFilesAccess,
      'index.html should not unsafely access state.key_files; use fallback'
    );
  },

  'test_index_html_does_not_have_blank_page_on_error': () => {
    const htmlContent = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

    // Should have error handling that displays something instead of breaking
    const hasErrorHandling = htmlContent.includes('catch') || htmlContent.includes('Not available') || htmlContent.includes('Unknown');

    assert(
      hasErrorHandling,
      'index.html should have error handling (catch block or fallback text like "Not available")'
    );
  },

  'test_index_html_supports_light_dark_theme': () => {
    const htmlContent = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

    // Should have theme toggle or media query support
    const hasThemeSupport = htmlContent.includes('dark') || htmlContent.includes('light') || htmlContent.includes('prefers-color-scheme') || htmlContent.includes('theme');

    assert(
      hasThemeSupport,
      'index.html should support light/dark theme (via CSS classes or media query)'
    );
  }
};
