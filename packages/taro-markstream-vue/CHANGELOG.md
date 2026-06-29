# taro-markstream-vue

## 1.1.1

### Patch Changes

- 5554239: fix: use changeset publish instead of pnpm publish for release script to ensure git tags and GitHub releases are auto-created

## 1.1.0

### Minor Changes

- a3fd213: feat: add RTL text support for paragraph rendering with auto-detection and tm-p-rtl CSS class; optimize README structure and content; sync CI config with action version upgrades and createGithubReleases

### Patch Changes

- b8f8cb7: Fix checkbox task list rendering: replace literal `[ ]`/`[x]` text with visual checkbox UI; skip `label_open`/`label_close`/`footnote_anchor` inline nodes to eliminate empty `tm-unsupported` elements; trim leading whitespace from inline text nodes
