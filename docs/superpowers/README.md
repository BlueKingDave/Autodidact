# superpowers/

Implementation plans and design specs for Autodidact features.

---

## Purpose

This folder stores structured documents produced during feature development:

- **Specs** (`specs/`) — design documents that explore and define a feature before a plan is written.
- **Plans** (`plans/`) — step-by-step task lists created before coding begins, used to guide agentic workers through multi-step features.

This folder is not responsible for:
- Architectural decisions (→ [`../architecture/ADRs/`](../architecture/ADRs/))
- Product vision (→ [`../product.md`](../product.md))
- Roadmap tracking (→ [`../roadmap.md`](../roadmap.md))

---

## Where this fits

- Parent: [docs/README.md](../README.md)
- Rules: [CLAUDE.md](CLAUDE.md)

---

## Contents

| Folder | Purpose |
|---|---|
| [specs/](specs/) | Design specs — exploration and scoping before planning |
| [plans/](plans/) | Implementation plans — task-level instructions for feature development |

---

## Lifecycle

```
Spec (design) → Plan (task list) → Implementation → Done
```

Plans are not deleted after completion — they serve as a record of how and why something was built.
