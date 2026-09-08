import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { Icon, type IconName } from "@/components/Icon";
import { getDraftContent } from "@/lib/content/store";
import { getMySqlPool, type DbRow } from "@/lib/mysql/db";

const quickActions: { href: string; icon: IconName; label: string; description: string }[] = [
  { href: "/editor", icon: "edit", label: "Open Visual Editor", description: "Edit the home page directly on a live canvas." },
  { href: "/settings/general", icon: "building", label: "General Settings", description: "Update your business name and site details." },
  { href: "/settings/branding", icon: "paint", label: "Branding", description: "Manage approved imagery; public colors stay locked." },
  { href: "/settings/contact", icon: "phone", label: "Contact Information", description: "Keep customer contact details accurate." },
];

export default async function DashboardPage() {
  const draft = await getDraftContent().catch(() => null);
  const pool = getMySqlPool();
  const [publications, activity] = pool ? await Promise.all([
    pool.query("SELECT version, published_at FROM site_publications WHERE site_key = 'ganesh-main'").then(([rows]) => rows as unknown as DbRow[]).catch(() => []),
    pool.query("SELECT id, action, created_at FROM audit_logs ORDER BY id DESC LIMIT 3").then(([rows]) => rows as unknown as DbRow[]).catch(() => []),
  ]) : [[], []];
  const published = publications[0];
  const site = process.env.PUBLIC_SITE_ORIGIN || "http://localhost:3000";
  return (
    <AdminShell eyebrow="Workspace overview" title="Your Ganesh workspace">
      <div className="dashboard-content">
        <section className="welcome-banner">
          <div>
            <span className="banner-kicker">{draft ? "MariaDB CMS connected" : "Database connection needs attention"}</span>
            <h2>Keep the Ganesh story looking its best.</h2>
            <p>Make visual updates, review your brand details, and prepare changes before they go live.</p>
            <Link className="primary-button" href="/editor"><Icon name="edit" /> Edit home page</Link>
          </div>
          <div className="website-card" aria-label="Website status">
            <span className="live-badge"><i /> {published ? "Publication available" : "No publication loaded"}</span>
            <strong>{site}</strong>
            <small>{published ? `Published revision ${published.version}` : "Check database setup and seed."}</small>
            <div className="mini-site-preview">
              <span className="mini-logo" />
              <span className="mini-nav" />
              <span className="mini-copy wide" />
              <span className="mini-copy" />
              <span className="mini-cta" />
            </div>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-heading"><div><p>Start here</p><h2>Quick actions</h2></div><span>Everything you need, one click away</span></div>
          <div className="quick-grid">
            {quickActions.map((action) => (
              <Link className="quick-card" href={action.href} key={action.href}>
                <span className="quick-icon"><Icon name={action.icon} /></span>
                <span><strong>{action.label}</strong><small>{action.description}</small></span>
                <span className="quick-arrow">→</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="dashboard-lower-grid">
          <section className="status-card">
            <div className="section-heading compact"><div><p>Website health</p><h2>Content status</h2></div><Icon name="activity" /></div>
            <div className="status-row"><span className="status-icon success"><Icon name="check" /></span><span><strong>Current draft</strong><small>{draft ? `${draft.content.products.length} products · ${draft.content.fabrics.length} fabrics` : "Could not load content"}</small></span><b>{draft ? `v${draft.version}` : "Review"}</b></div>
            <div className="status-row"><span className="status-icon"><Icon name="image" /></span><span><strong>Collections and metadata</strong><small>Order, activate, add or remove content</small></span><Link href="/content">Edit fields</Link></div>
            <div className="status-row"><span className="status-icon"><Icon name="phone" /></span><span><strong>Contact information</strong><small>{draft?.content.global.address || "Review customer-facing contact details"}</small></span><b className="attention">Review</b></div>
          </section>
          <section className="activity-card">
            <div className="section-heading compact"><div><p>Publication timeline</p><h2>Recent activity</h2></div><Icon name="clock" /></div>
            <ol className="activity-list">
              {activity.length ? activity.map((item) => <li key={String(item.id)}><span /><div><strong>{String(item.action).replaceAll("_", " ")}</strong><small>{new Date(String(item.created_at)).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}</small></div></li>) : <li><span /><div><strong>No activity loaded</strong><small>Changes will appear here after saving.</small></div></li>}
            </ol>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
