---
name: deploy-siteatende
description: Deploy an edited siteatende.php/siteatende.js to production on the VPS — backup, scp, docker cp, php -l lint, clear WP Rocket + Elementor cache. Use after editing the GR Cartuchos chat widget plugin locally.
---

Deploy the locally-edited `siteatende` plugin files to the live `gr_wordpress`
container on the VPS (`root@82.25.76.130`), following the exact pipeline
used throughout this project — never edit files directly on the VPS.

Arguments: `$ARGUMENTS` is the new version string to bump to (e.g. `1.1.18`).
If empty, ask the user for the version number before proceeding, or read
the current version from the plugin header and bump the patch number.

## Steps

1. **Bump the version** in both places in
   `wordpress/plugins/siteatende/siteatende.php`:
   - the docblock `Version:` line
   - the `define('SITEATENDE_VERSION', '...')` line

2. **Syntax-check the JS** before touching the VPS at all:
   `node --check wordpress/plugins/siteatende/siteatende.js` — a single
   stray backtick inside the giant template-literal widget string has
   broken this before; never skip this step.

3. **Back up the live files** (always, even for a tiny change):
   ```
   TS=$(date -u +%Y%m%dT%H%MZ)
   ssh root@82.25.76.130 "mkdir -p /root/backups/siteatende-${TS}-claude-<short-label> && \
     docker cp gr_wordpress:/var/www/html/wp-content/plugins/siteatende/siteatende.php /root/backups/siteatende-${TS}-claude-<short-label>/ && \
     docker cp gr_wordpress:/var/www/html/wp-content/plugins/siteatende/siteatende.js /root/backups/siteatende-${TS}-claude-<short-label>/"
   ```
   Replace `<short-label>` with a short slug describing the change (e.g. `ga4`, `whatsapp-rule`).

4. **Deploy**:
   ```
   scp "wordpress/plugins/siteatende/siteatende.php" "wordpress/plugins/siteatende/siteatende.js" root@82.25.76.130:/tmp/
   ssh root@82.25.76.130 "docker cp /tmp/siteatende.php gr_wordpress:/var/www/html/wp-content/plugins/siteatende/siteatende.php && \
     docker cp /tmp/siteatende.js gr_wordpress:/var/www/html/wp-content/plugins/siteatende/siteatende.js && \
     docker exec gr_wordpress php -l /var/www/html/wp-content/plugins/siteatende/siteatende.php && \
     rm /tmp/siteatende.php /tmp/siteatende.js"
   ```
   Confirm the `php -l` output says "No syntax errors detected" before continuing.

5. **Clear both caches** — WP Rocket alone is not enough if `_elementor_data`
   was also touched elsewhere in the same session; always run both:
   ```
   ssh root@82.25.76.130 'docker exec gr_wordpress bash -c "rm -rf /var/www/html/wp-content/cache/wp-rocket/* /var/www/html/wp-content/cache/used-css/* /var/www/html/wp-content/cache/critical-css/* 2>/dev/null; echo done"'
   ssh root@82.25.76.130 "docker exec gr_wordpress wp --allow-root eval \"rocket_clean_domain(); echo 'ROCKET_CLEARED';\""
   ```

6. **Verify live** — fetch the deployed JS/PHP behavior via a real HTTP
   check (curl or `mcp__plugin_context-mode_context-mode__ctx_execute`
   fetch), not just "no error was thrown." For a widget JS change, check
   the served file contains the new code:
   ```
   curl -s "https://grcartuchos.com.br/wp-content/plugins/siteatende/siteatende.js?v=verify" | grep -c "<the new function/string you added>"
   ```
   For a behavior change (system prompt, new rule), send a real test
   message to `POST /wp-json/siteatende/v1/chat` and read the reply.

7. **Commit to git** (this repo tracks the plugin source) and **update
   `ATIVIDADE.md`**'s `## Claude` section with what changed, the version
   number, the commit hash, and the backup path — matching every prior
   entry's style. Check `ATIVIDADE.md`'s `## Codex` section first for
   anything that overlaps before starting step 1, per this repo's
   coordination protocol.

Never skip the backup step, never skip the `node --check`/`php -l` lint,
never skip clearing the cache, and never claim "done" without a live
verification — this exact sequence has caught real bugs (a stray backtick,
a stale WP Rocket cache, a stripped `<style>` tag from a missing
`--user=1`) every single time it's been followed carefully this project.
