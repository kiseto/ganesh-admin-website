# Editable content inventory

All content is a validated version-1 snapshot in MariaDB. Use Visual Editor for the canvas and Content fields for the complete structured model. Save Draft stays private; Save & Publish saves the current state then publishes it.

| Admin field | Public consumer |
| --- | --- |
| Global navigation, quote label, logo | Header on all five routes, including inverse logo |
| Global favicon, social preview, SEO | Server-generated metadata |
| Global business/contact values | Metadata/accessibility identity; selectable sources for existing footer detail slots |
| Home hero / brand statement | Existing emphasized purpose/quality markup and motion hooks |
| Home section copy | Original section headings and supporting copy |
| Products | Made by Ganesh, quick views, Products catalog, related work links, builder choices |
| Fabrics | Fabric Explorer and builder options; dynamic total |
| Production steps | Home journey and Production page |
| Work categories / stories / tiles | Home portfolio and Our Work stories; related products by ID |
| Brand values / size guides / FAQs | Home and Customize resources |
| Pages Products / Our Work / Production / Customize | Interior copy, links' labels and page metadata |
| Editorial images | Production and Customize hero images |
| Editorial production preparation / questions | Production guidance and FAQ collections |
| Editorial labels | Header support, quick views, section links, resource and builder labels |
| Order builder configuration | Options, defaults, recommended fabric label and quantity |
| Home footer | Shared footer copy, actions, directory values and legal content |

Collection IDs remain stable; new records use UUIDs. Keep slugs unchanged when preserving inbound links. Reorder/activate/remove controls apply to repeatable records; broken references block saving. All uploaded content images require meaningful alt text. Existing decorative hero imagery may retain empty alt text.

Global phone/email/hours are optional and do not create new UI blocks. Bind them to an existing footer detail Source when needed. Maps changes from Contact settings update the existing directions action. Static routes, validation/status text, internal identifiers, accessibility control messages, CSS tokens and animation configuration remain code-owned. The quotation composer remains client-only; submission/order management is out of scope.

Original six data modules remain untouched as migration provenance. lib/content/initial-content.json and the public lib/initial-content.json are matching validated emergency fixtures. The additive extension preserves existing draft/publication values and does not reset accounts.
