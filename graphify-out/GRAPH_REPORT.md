# Graph Report - /Users/fishtv/Development/Awesome-Dyson  (2026-08-24)

## Corpus Check
- Corpus is ~11,565 words - fits in a single context window. You may not need a graph.

## Summary
- 81 nodes · 94 edges · 6 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]

## God Nodes (most connected - your core abstractions)
1. `assert()` - 5 edges
2. `assertFileExists()` - 4 edges
3. `jsonResponse()` - 4 edges
4. `handleGet()` - 4 edges
5. `handlePost()` - 4 edges
6. `fetch()` - 4 edges
7. `kvKey()` - 3 edges
8. `AssertionError` - 2 edges
9. `assertEqual()` - 2 edges
10. `assertDeepEqual()` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities (6 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (22): ADD_ENTRY_SCRIPT, { assert, assertFileExists, assertDeepEqual }, entriesDir, entry1Data, entry2Data, entryData, file1Content, file2Content (+14 more)

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (13): assert(), assertDeepEqual(), assertEqual(), assertFileExists(), AssertionError, { assert, assertEqual, assertFileExists }, { execSync }, fs (+5 more)

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (12): { assert, assertFileExists }, { execSync }, firstLock, fs, LOCK_DIR, LOCK_SCRIPT, newLock, oldLock (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.18
Nodes (10): { assert }, fs, hasUnsafeChangesAccess, hasUnsafeDotAccess, hasUnsafeKeyFilesAccess, hasUnsafeOneLinerAccess, hasUnsafeQuestionsAccess, htmlContent (+2 more)

### Community 4 - "Community 4"
Cohesion: 0.29
Nodes (6): { execSync }, fs, path, result, testFiles, testPath

### Community 5 - "Community 5"
Cohesion: 0.62
Nodes (6): CORS_HEADERS, fetch(), handleGet(), handlePost(), jsonResponse(), kvKey()

## Knowledge Gaps
- **59 isolated node(s):** `fs`, `path`, `{ execSync }`, `testFiles`, `testPath` (+54 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `assert()` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`?**
  _High betweenness centrality (0.152) - this node is a cross-community bridge._
- **Why does `assertFileExists()` connect `Community 1` to `Community 0`, `Community 2`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **What connects `fs`, `path`, `{ execSync }` to the rest of the system?**
  _59 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._