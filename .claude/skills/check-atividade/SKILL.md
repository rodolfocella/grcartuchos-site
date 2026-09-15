---
name: check-atividade
description: Read this repo's ATIVIDADE.md coordination file before editing anything or deploying to the VPS, to avoid colliding with a concurrent Claude/Codex/Gemini session. Use at the start of any task that will touch files, the VPS, or cron/systemd.
---

Before editing any file, deploying to the VPS, or touching cron/systemd in
this repo (or a sibling repo on the same VPS — `zap-agenda`,
`grcartuchos-coletor`), follow the coordination protocol these projects
already use:

1. Read `ATIVIDADE.md` in full (both/all sections, not just the one
   matching whoever you are — a Claude session should still read the
   Codex section and vice versa).
2. If another session has an entry that is not `(livre)` — i.e. it says
   **EM ANDAMENTO** or otherwise claims to be actively touching the exact
   file, feature, or VPS resource you were about to touch — **stop and
   tell the user** instead of proceeding. Do not silently work around it
   or assume it's stale.
3. If it's genuinely free, add your own entry at the top of your section
   (e.g. `## Claude`) describing what you're about to do, *before*
   starting — not after. Commit and push that entry on its own if the
   work will take more than a couple of minutes, so a concurrent session
   sees it promptly rather than only once you finish.
4. When done (or pausing for more than a few minutes), update your entry
   to describe what was actually done (not just the plan), including any
   relevant commit hashes and backup paths, and mark it `(livre)` again.

If this repo has a sibling project on the same VPS (check `AGENTES.md` one
directory up, if present, for the full list), and the task might touch
shared infrastructure (nginx, a shared Docker volume/network, a cron job),
check that sibling repo's own `ATIVIDADE.md` too — a collision there is
just as real as one in this repo.

This protocol is a convention, not something enforced by any tool — it
only works if it's actually followed before acting, every time, not just
when something feels risky.
