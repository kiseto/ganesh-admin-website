# CMS repair tasks

## Active

- Implementation and local verification complete. Ready for user acceptance and first-login password change.

## Completed

- Repair dependencies and runtime errors; apply MariaDB migrations and actual public seed.
- Repair mysql.db after explicit approval, with verified backup.
- Wire secure auth, media, drafts, publish, revalidation and conflict/error handling.
- Preserve loaded snapshot data; fix unsaved Save & Publish behavior and settings loading.
- Add structured repeatable-content controls and real dashboard state.
- Clean the reusable implementation prompt for MariaDB and the public-UI preservation boundary.
- Run type/lint/build, unit/security, live MariaDB and browser editing checks.

- Complete interior copy/images/metadata, shared header/footer/logo, production guidance/FAQs, builder labels/defaults, dynamic fabric counts and validated server-only fallback.
- Apply the additive content migration with verified backup and idempotence checks.
- Verify 13 unit tests, actual MariaDB/browser publication and normal-motion desktop/mobile interactions. Restore original content.

## Pending

- User confirmation of final public visuals/motion and first-login password change.

## Visual Editor continuation

- Implemented shared canonical views for all five pages, authenticated live preview, edit panels, product dialogs, media upload, immutable state, undo/redo and conflict handling.
- Responsive public checks passed at 1440/768/390; authenticated draft editing/upload/reload verified and original content restored.
- Remaining: user visual acceptance and explicit approval for a temporary-content live publish test. See VISUAL_EDITOR.md.

## Users & Roles — completed September 9, 2026

- Removed Export working draft everywhere in the Visual Editor.
- Added administrator-only account creation, role assignment and custom roles in Settings.
- Enforced Editor draft-only access and optional custom-role publishing in the API and UI.
- Applied the preserving schema migration; all 18 tests, database rollback integration checks, type/lint/build and authenticated UI checks passed.
