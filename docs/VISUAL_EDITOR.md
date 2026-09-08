# Visual Editor handoff — September 8, 2026

The Visual Editor is implemented at http://localhost:3001/editor. The public application must run at the configured PUBLIC_SITE_ORIGIN (locally http://localhost:3000).

## Architecture

The public repository owns the canonical presentation components in `components/pages`: HomeView, ProductsView, CustomizeView, OurWorkView and ProductionView. Normal server routes load published content into these components. The private preview uses those exact components with the authenticated editor's working snapshot. Existing styles, typography and motion remain shared.

The admin has one working ContentSnapshot. Panels apply immutable changes to that snapshot; page and viewport switches retain it. Saving persists it with optimistic version checks. Save & Publish first saves the exact snapshot, then publishes the returned version through the existing transactional publication API. Uploads, validation errors and open panels prevent premature saves. Conflicts retain the working copy in the open tab. Coordinate with the other administrator before reloading.

The public preview route serves an empty shell protected by a signed, expiring, origin-bound ticket. It does not fetch or serialize a private draft. Authenticated admin messages deliver content to that iframe, checking source window, origin, token and schema. Preview headers prevent caching/indexing and restrict framing. Uploaded draft images are fetched by the authenticated admin and supplied as in-memory image data; the public image optimizer never receives private draft credentials.

## Administrator workflow

1. Sign in and open **Visual Editor**. Choose Home, Products, Customize, Our Work / Artwork or Production.
2. Use the website normally, including navigation, fabric tabs, FAQs and product dialogs. Switch to **Preview** to hide editing overlays.
3. Select a sidebar section or its **Edit** button. Individual products, fabrics, stories and production steps also have edit targets.
4. On Home or Products, choose **View product**, then **Edit product content** inside the real dialog. Edit name, short description, full details, purpose, category, fabric, best use, customization, image/alt/focal point and builder label. **Apply changes** updates the open dialog without reopening it.
5. **Upload / replace image** accepts a real image file and required alt text. Apply the panel after upload. Collections support adding inactive records, reordering and confirmed removal; IDs remain stable and referenced products cannot be removed until their story references are cleared.
6. Use **Undo / Redo** for applied changes, then **Save Draft**. Saved drafts survive reload; unsaved edits and undo history are browser-local. Keep the tab open and coordinate with the other administrator after a conflict.
7. Review desktop, tablet and mobile. **Save & Publish** opens a confirmation before making the current draft public. If public revalidation fails, use **Retry public refresh**.

## Main files

Admin: `components/VisualEditor.tsx`, `components/EditorFields.tsx`, `components/visual-editor.css`, `lib/visual-editor.ts`, `lib/preview-ticket.ts`, `app/api/editor-preview/route.ts`, `tests/visual-editor.test.ts`, `scripts/smoke-public-preview.mjs`.

Public sibling repository: `components/pages/*View.tsx`, the five `app/**/page.tsx` route wrappers, `components/editor/PreviewCanvas.tsx`, `components/editor/EditorPreviewBridge.tsx`, `app/editor-preview/page.tsx`, `lib/preview-ticket.ts`, `components/sections/ProductQuickView.tsx`, `CatalogQuickViews.tsx`, `WhatWeMake.tsx`, `BuildYourOrder.tsx`, `components/layout/InteriorPage.tsx`, `lib/content.ts`, `data/products.ts`, `next.config.ts`.

## Verification and limits

- Both production builds passed after the canonical-view refactor. Final follow-up checks are recorded below when complete.
- All 16 unit tests passed, including ticket generation and immutable product updates.
- Read-only browser checks passed on all five public routes at 1440, 768 and 390 pixels: every product modal's content and alt, keyboard focus containment/restoration, Escape, scroll lock, fabric keyboard tabs, order controls, FAQs and horizontal overflow. Captures/results are under `.visual-qa/visual-editor`.
- Earlier normal-motion checks passed on desktop/mobile for menus, product dialogs, fabric tabs and FAQs.
- Through the user's existing signed-in browser session, all five editor pages rendered and Preview mode removed overlays. Product field changes updated the open modal; Save Draft persisted after reload. A real uploaded replacement image rendered inside the private modal. Undo restored the original image.
- The verification draft was restored exactly: draft version 28 equals the content backed up at version 26. Publication remains version 26 with identical content. The test upload and revision history are retained. Backup: `.local-setup/current-verification-backup.json`.
- A live publish test with temporary verification text/image was rejected by automatic approval review because it would expose incorrect test content publicly. No such publication occurred. This verification remains pending explicit approval or an intended real-content publication. No test administrator session was created.
- Preview tickets renew periodically. Renewal preserves the admin working snapshot but can reset the iframe's transient state, such as an open dialog. Saved content is unaffected.
- User visual acceptance remains pending; existing manual acceptance checklists have not been marked complete.

## Reproduce checks

From the admin repository: `node --experimental-strip-types --test tests/*.test.ts` and `node scripts/smoke-public-preview.mjs`. The browser script is read-only and uses the bundled Playwright package (override PLAYWRIGHT_PACKAGE_PATH if necessary).

From each repository: `node node_modules/typescript/bin/tsc --noEmit`, `node node_modules/eslint/bin/eslint.js .`, then PowerShell `$env:GANESH_BUILD_DIR='.next-build'; node node_modules/next/dist/bin/next build`. The separate build directory avoids replacing the running dev output.

Final checks: both applications passed TypeScript, ESLint and production builds after all code changes. All 16 admin unit tests passed again. Admin git diff whitespace check passed. The initial escalated admin build request was unavailable due an automatic-review usage limit; the ordinary workspace build subsequently completed successfully.

September 9 update: the Export working draft action was removed at the user’s request. Editor accounts can save drafts; publishing requires Administrator or a custom role with publishing enabled. Accounts and roles are managed in Settings → Users & Roles.
