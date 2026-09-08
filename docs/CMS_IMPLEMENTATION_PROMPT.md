# Ganesh CMS repair and implementation prompt

Act as the senior full-stack architect and implementation engineer for Ganesh Garments. Repair the existing implementation and finish the shared CMS; do not stop at a proposal.

## Projects and scope

- Admin: `C:/xampp/htdocs/ganesh-admin-website`
- Public website: `C:/xampp/htdocs/ganesh-website`
- Database: `ganesh_cms`, MariaDB through XAMPP; phpMyAdmin is its management interface.

Read applicable `AGENTS.md` instructions, current task/handoff documents, dirty changes, and each project's installed Next.js documentation before editing. Inspect the actual state rather than assuming the previous prototype or migration status is still accurate. Preserve unrelated work. Obtain filesystem access for both projects when needed.

## UI boundary

Do not redesign or change the public website UI. Preserve its layout, typography, spacing, colors, CSS classes, DOM relationships, responsive rules, animations, accessibility behavior, data attributes, links, and anchors. Only make minimal internal changes required to feed existing components with published content or fix a verified error. Added records must use the existing design patterns.

Admin UI improvements are allowed. Keep the established Ganesh admin visual language while making loading, editing, errors, validation, conflicts, saving, and publishing understandable. Public brand-color controls must remain disabled or outside scope.

## Backend

Use the existing MariaDB database and a server-side `mysql2/promise` connection pool with parameterized queries and InnoDB transactions. Do not introduce Supabase, PostgreSQL, JSONB, Supabase Auth/Storage, or PostgreSQL RLS. Use MariaDB-compatible JSON columns, foreign keys, indexes, and `utf8mb4`.

Keep database credentials server-only. The public website reads the published snapshot through a server endpoint; the admin writes to the same database. Authentication and authorization are enforced in every protected endpoint and server data operation. Use securely hashed passwords, random opaque sessions stored as hashes, HTTP-only cookies, expiry, revocation, login throttling, and origin checks for cookie-authenticated mutations. Do not expose SQL errors or secrets to browsers.

Retain/complete these tables: `site_drafts`, `site_publications`, `content_revision_history`, `media_assets`, `admin_profiles`, `admin_sessions`, and `audit_logs`. Track migration versions and checksums. Inspect existing records before seeding. Never reset existing content or credentials during a normal setup rerun. Database creation and migration must touch only the named Ganesh database.

## Content model and initial migration

Use one versioned TypeScript/Zod `ContentSnapshot`, validated on load, save, and publish. Include:

- Global identity, navigation, contact information, metadata, logo, favicon, and social image.
- Home hero, brand statement, section headings/copy, contact footer, and legal copy.
- Products: stable ID/slug, name, image/alt, short description, full details, purpose, category, fabric, best use, customization, optional builder label, order, active state.
- Fabrics: stable ID/slug, name, image/alt, description, qualities, order, active state.
- Production steps: stable ID/slug, title, focus, description, order, active state.
- Work categories: stable ID/slug, label, lead copy, story fields, related product IDs, ordered image tiles with title, description, alt and focal point.
- Brand values, size guides and rows, FAQs, builder options/defaults, and Products, Our Work, Production, and Customize page content/metadata.

Audit the real public content in `data/products.ts`, `data/catalog.ts`, `data/fabrics.ts`, `data/production.ts`, `data/work.ts`, `data/work-stories.ts`, and embedded page/component copy. Seed from that content, not the admin preview. Preserve exact initial words, images, order, links, metadata, IDs, and slugs. Use UUIDs for new records; do not change existing anchor IDs without a compatibility mapping.

Keep emphasized/animated words as structured plain-text fields so existing markup and motion hooks survive. No CMS-authored HTML, script URLs, CSS tokens, animation settings, internal messages, or validation copy. Validate duplicate IDs/slugs, references, URLs, bounds, and required alt text. Preserve inactive and unedited data during partial edits. Retain the original public fixtures as a validated emergency fallback.

## Editing and publishing

Load the saved draft before editing. Save Draft persists privately. Save & Publish first saves the current editor changes with the expected version, then atomically publishes that exact validated version, records an immutable revision and audit entry, and requests public cache invalidation. Never publish an older draft while reporting unsaved changes as published.

Use optimistic concurrency and clear conflict recovery. Preserve the unsaved-change warning. Support add/edit, image replacement, ordering, activation/deactivation, and confirmed removal for repeatable collections. Block changes that break required references and identify how to fix them. Load existing settings/account values; never silently replace them with demo defaults.

Use the installed Next.js 16 revalidation APIs. The shared-secret public endpoint must invalidate only the Ganesh tag immediately. If refresh fails after commit, report a successful publication with a refresh warning and working retry. Provide a short fallback refresh interval. Public responses must never contain drafts, account/session data, or credentials.

## Media

Store files on persistent disk outside the database, under generated unique names. Serve runtime uploads through an appropriate route so they work after a production build. Record asset IDs, MIME, size, dimensions, original filename, creator, and timestamps.

Allow PNG, JPEG, WebP and safe SVG, up to 5 MB. Validate actual file contents on the server; decode raster images and strictly sanitize or reject active SVG content. Require meaningful alt text for content images. Set safe response headers and restrict the Next image origin/path. Uploaded images must preview correctly locally and after publish. Retain older assets for published content and rollback. Remove/soft-delete only unreferenced assets, including revision references.

## Repair, verification, and delivery

Reproduce current errors from terminal/browser output, then fix their causes. Repair dependency/lockfile problems with the project's package manager, not fake type declarations or disabled checks. Make CLI migration, seed, and admin-creation tools load the correct environment and close database connections on failure. Provide complete `.env.example` files without real secrets.

Run type checks, ESLint, production builds, and meaningful tests for schema validation, authentication/authorization, uploads, broken references, draft privacy, conflicts, publishing, revalidation and idempotent migration/seed. Verify login, draft-only hero edits, Aircool text/image changes, added fabric/product/work image, publish, public refresh and anonymous access denial. Restore temporary smoke-test content afterward. Compare desktop/mobile public screenshots and correct any regression.

Keep quotation submission, order processing and payment workflows out of scope.

Update setup, task, handoff and verification documentation with actual results, local ports, admin creation/reset, migration/seed, persistent media, least-privilege database access, deployment order, backup/rollback and remaining manual checks. Distinguish prepared migrations, applied schema, seeded content and verified application behavior. Never claim checks that were not run.

Finish with the repaired outcome, links to important files, checks passed, any concrete remaining blocker, and the exact next user action. Also provide this cleaned prompt as a reusable Markdown file.
