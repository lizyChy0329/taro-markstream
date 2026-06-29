---
'taro-markstream-vue': patch
---

Fix checkbox task list rendering: replace literal `[ ]`/`[x]` text with visual checkbox UI; skip `label_open`/`label_close`/`footnote_anchor` inline nodes to eliminate empty `tm-unsupported` elements; trim leading whitespace from inline text nodes