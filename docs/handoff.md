# CMS repair handoff — 2026-09-08

Local MariaDB migration and seed are applied and tested. Public app is on localhost:3000, admin on localhost:3001. Read README_CMS.md for setup, safety boundaries, backup/rollback and verification. First-login credentials are only in the git-ignored .local-setup/admin-access.txt.

Key fixes: pnpm/Windows dependency links; public hero blur crash; generated-build Tailwind scanning; current-draft preservation; Save & Publish saving unsaved edits; real settings and dashboard state; structured collection editor; bounded same-origin/authenticated writes; safe persistent media with private draft access; immediate protected revalidation.

mysql.db was corrupted before permissions could be granted. With explicit user approval, a verified table-file backup was taken and targeted repair completed with CHECK TABLE OK. Backup location and procedure are in README_CMS.md.

Both repositories pass type/lint/build checks. All 13 unit tests, MariaDB integration, browser editor and expanded content-coverage smoke tests passed; original content was restored (draft/publication version 20 at final check). Retain test revision history/media for audit and rollback. All five public desktop/mobile captures in .visual-qa/completed returned 200 with no runtime errors/overflow. Normal-motion menu, dialog, fabric keyboard tabs and FAQ checks passed at both widths.

Remaining legacy wiring is complete: interior copy/SEO/images, shared headers/footers, inverse/footer logos, production guidance/FAQs, builder labels/defaults/fabric options. The public loader is server-only with a full validated seed fallback. scripts/extend-content.ts adds missing fields without overwriting edits; verified backup: .local-setup/content-before-extension-1788800494481.json. Optional contact values may use existing footer detail slots, without added UI. No quotation/order backend was added.

The pnpm launcher encountered a registry-signature network verification failure. Checks ran directly against installed Next/TypeScript/ESLint binaries without disabling security verification. A transient Windows public build cache EBUSY warning cleared on the final successful rebuild.

Preserve unrelated dirty changes. Public CSS, fonts and animation modules were not redesigned. Do not mark user manual checks complete without user confirmation.

Visual Editor continuation: see docs/VISUAL_EDITOR.md for the canonical public views, private preview protocol, administrator workflow and current verification. Original content restored exactly (draft 28; publication remains 26). Temporary-content live publication was blocked by automatic approval review and remains unverified.

Final Visual Editor verification: both apps pass final TypeScript, ESLint and production builds; all 16 tests pass. Full verification limits remain documented in VISUAL_EDITOR.md.

## Users & Roles — September 9, 2026

Removed Export working draft from the Visual Editor, including the error-state action. Settings > Users & Roles supports administrator-only account creation, changing another account’s role, and adding/editing custom roles. All roles edit/save drafts; Editor cannot publish, and custom roles can optionally publish. Administrator is the only role that manages users. Role changes revoke the affected user’s sessions; custom role permissions are read from the database on each request. Built-in roles and changing your own role are protected. Optimistic role conflicts are checked and successful changes are audited without passwords.

Migration 003_users_roles.sql applied using the existing local setup database administrator because ganesh_app correctly has no DDL permissions. Existing account-role backup: .local-setup/accounts-before-role-migration.json. Runtime credentials and database grants were unchanged.

Verified: TypeScript, ESLint, production build, 18 unit tests, real MariaDB transaction tests with complete rollback, anonymous API rejection and cross-origin account-write rejection. In the authenticated browser, Users & Roles loads, required create-account/custom-role fields prevent blank submission, self role changes are disabled, there is no horizontal overflow at the current viewport, and the editor no longer shows Export working draft. No real account or role was created for testing.
