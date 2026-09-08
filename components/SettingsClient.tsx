"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Icon, type IconName } from "@/components/Icon";
import { Toast } from "@/components/Toast";
import { TeamSettings } from "./TeamSettings";
import type { ContentSnapshot } from "@/lib/content/schema";

export type SettingsSection = "general" | "branding" | "contact" | "account" | "users";

const tabs: { id: SettingsSection; icon: IconName; label: string }[] = [
  { id: "general", icon: "building", label: "General" },
  { id: "branding", icon: "paint", label: "Branding" },
  { id: "contact", icon: "phone", label: "Contact information" },
  { id: "account", icon: "lock", label: "Account / Password" },
  { id: "users", icon: "lock", label: "Users & Roles" },
];

function RequiredMark() {
  return <span className="required-mark" aria-hidden="true">*</span>;
}

function FormField({ error, helper, label, multiline = false, onChange, placeholder, required = false, type = "text", value }: { error?: string; helper?: string; label: string; multiline?: boolean; onChange: (value: string) => void; placeholder?: string; required?: boolean; type?: string; value: string }) {
  const id = `field-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`;
  const descriptionId = `${id}-description`;
  return <div className={`settings-field${error ? " has-error" : ""}`}><label htmlFor={id}>{label}{required ? <RequiredMark /> : null}</label><div>{multiline ? <textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} required={required} aria-invalid={Boolean(error)} aria-describedby={helper || error ? descriptionId : undefined} /> : <input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} aria-invalid={Boolean(error)} aria-describedby={helper || error ? descriptionId : undefined} />}{error ? <small className="field-error" id={descriptionId}>{error}</small> : helper ? <small id={descriptionId}>{helper}</small> : null}</div></div>;
}

function PasswordField({ helper, label, onChange, value }: { helper?: string; label: string; onChange: (value: string) => void; value: string }) {
  const [visible, setVisible] = useState(false);
  const id = `field-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`;
  return <div className="settings-field"><label htmlFor={id}>{label}<RequiredMark /></label><div><div className="password-control"><input id={id} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} required autoComplete="new-password" /><button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}><Icon name={visible ? "eye-off" : "eye"} /></button></div>{helper ? <small>{helper}</small> : null}</div></div>;
}

function SaveBar({ label = "Save changes", onSave }: { label?: string; onSave: () => void | Promise<void> }) {
  const [saving, setSaving] = useState(false);
  return <div className="settings-actions"><span><i /> Settings are private until you publish</span><button className="primary-button" type="button" disabled={saving} onClick={async () => { setSaving(true); try { await onSave(); } finally { setSaving(false); } }}>{saving ? <span className="spinner" /> : <Icon name="save" />}{saving ? "Saving…" : label}</button></div>;
}

function GeneralSettings({ initial, onSaved }: { initial: ContentSnapshot; onSaved: (data: { business: string; tagline: string; summary: string; year: string; location: string }) => Promise<void> }) {
  const [data, setData] = useState({ business: initial.global.businessName, tagline: initial.global.tagline, summary: initial.pages.home.brandStatement.copy, year: initial.global.establishedYear, location: initial.global.location });
  const [error, setError] = useState("");
  const set = (key: keyof typeof data, value: string) => setData((current) => ({ ...current, [key]: value }));
  async function validate() { if (!data.business.trim() || !data.tagline.trim() || !data.location.trim()) { setError("Business name, tagline, and location are required."); return; } if (!/^\d{4}$/.test(data.year)) { setError("Enter a four-digit established year."); return; } setError(""); await onSaved(data); }
  return <div className="settings-card"><div className="settings-card-heading"><span className="settings-heading-icon"><Icon name="building" /></span><div><h2>General</h2><p>The core details visitors see across your website.</p></div></div><div className="settings-form"><FormField label="Business name" value={data.business} onChange={(value) => set("business", value)} required /><FormField label="Tagline" value={data.tagline} onChange={(value) => set("tagline", value)} required /><FormField label="About summary" value={data.summary} onChange={(value) => set("summary", value)} multiline helper="A short introduction used in your website summary." /><FormField label="Established year" value={data.year} onChange={(value) => set("year", value)} type="number" required /><FormField label="Location" value={data.location} onChange={(value) => set("location", value)} required />{error ? <p className="settings-error" role="alert">{error}</p> : null}</div><SaveBar onSave={validate} /></div>;
}

function BrandingSettings({ initial }: { initial: ContentSnapshot }) {
  return <div className="settings-card"><div className="settings-card-heading"><span className="settings-heading-icon"><Icon name="paint" /></span><div><h2>Branding</h2><p>Public colors and typography are locked to preserve the approved website design.</p></div></div><div className="settings-form"><p>Manage the logo and hero image in the <Link href="/editor">Visual Editor</Link>. All media, favicon and social preview fields are available in <Link href="/content">Content fields</Link>.</p><p>Current logo: {initial.global.logo.src}</p><p>Current favicon: {initial.global.favicon.src}</p><p>Media changes remain private until you publish.</p></div></div>;
}

function ContactSettings({ initial, onSaved }: { initial: ContentSnapshot; onSaved: (data: { phone: string; email: string; facebook: string; address: string; maps: string; hours: string }) => Promise<void> }) {
  const [data, setData] = useState({ phone: initial.global.phone, email: initial.global.email, facebook: initial.global.facebook, address: initial.global.address, maps: initial.global.maps, hours: initial.global.hours });
  const [error, setError] = useState("");
  const set = (key: keyof typeof data, value: string) => setData((current) => ({ ...current, [key]: value }));
  async function validate() { if (!data.address.trim()) { setError("Business address is required."); return; } if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) { setError("Enter a valid email address."); return; } setError(""); await onSaved(data); }
  return <div className="settings-card"><div className="settings-card-heading"><span className="settings-heading-icon"><Icon name="phone" /></span><div><h2>Contact information</h2><p>Address, directions, and established year feed the existing footer. Optional phone, email, and hours can be assigned to a footer detail in Content fields without adding new UI.</p></div></div><div className="settings-form"><FormField label="Phone number" value={data.phone} onChange={(value) => set("phone", value)} placeholder="Add phone number" /><FormField label="Email address" value={data.email} onChange={(value) => set("email", value)} type="email" placeholder="Add email address" /><FormField label="Facebook page" value={data.facebook} onChange={(value) => set("facebook", value)} type="url" placeholder="Add Facebook page URL" /><FormField label="Business address" value={data.address} onChange={(value) => set("address", value)} multiline required /><FormField label="Google Maps link" value={data.maps} onChange={(value) => set("maps", value)} type="url" /><FormField label="Business hours" value={data.hours} onChange={(value) => set("hours", value)} multiline placeholder="Monday–Saturday, 8:00 AM–5:00 PM" />{error ? <p className="settings-error" role="alert">{error}</p> : null}</div><SaveBar onSave={validate} /></div>;
}

function AccountSettings({ onSaved }: { onSaved: (data: { name: string; email: string; currentPassword: string; newPassword: string }) => Promise<void> }) {
  const [data, setData] = useState({ name: "Admin User", email: "admin@example.com", role: "Administrator", current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const set = (key: keyof typeof data, value: string) => setData((current) => ({ ...current, [key]: value }));
  useEffect(() => { fetch("/api/auth/me", { cache: "no-store" }).then((response) => response.json()).then((profile) => { if (profile?.displayName) setData((current) => ({ ...current, name: profile.displayName, email: profile.email ?? current.email, role: profile.roleName ?? profile.role })); }).catch(() => undefined); }, []);
  async function validate() { if (!data.name.trim() || !data.email.trim()) { setError("Full name and email address are required."); return; } if (!data.current || data.next.length < 10) { setError("Enter your current password and use at least 10 characters for the new password."); return; } if (!/[A-Za-z]/.test(data.next) || !/\d/.test(data.next)) { setError("Use at least one letter and one number in the new password."); return; } if (data.next !== data.confirm) { setError("The new passwords do not match."); return; } setError(""); await onSaved({ name: data.name, email: data.email, currentPassword: data.current, newPassword: data.next }); }
  return <div className="settings-card"><div className="settings-card-heading"><span className="settings-heading-icon"><Icon name="lock" /></span><div><h2>Account / Password</h2><p>Update your administrator profile and password securely.</p></div></div><div className="settings-form"><FormField label="Full name" value={data.name} onChange={(value) => set("name", value)} required /><FormField label="Email address" value={data.email} onChange={(value) => set("email", value)} type="email" required /><div className="settings-field"><label htmlFor="field-role">Role</label><div><select id="field-role" value={data.role} disabled><option>{data.role}</option></select></div></div><PasswordField label="Current password" value={data.current} onChange={(value) => set("current", value)} helper="Enter your current password to make changes." /><PasswordField label="New password" value={data.next} onChange={(value) => set("next", value)} helper="Minimum 10 characters with letters and numbers." /><PasswordField label="Confirm new password" value={data.confirm} onChange={(value) => set("confirm", value)} helper="Re-enter your new password." />{error ? <p className="settings-error" role="alert">{error}</p> : null}</div><SaveBar label="Update password" onSave={validate} /></div>;
}

export function SettingsClient({ section, canManageUsers = false }: { section: SettingsSection; canManageUsers?: boolean }) {
  const [toast, setToast] = useState("");
  const [draft, setDraft] = useState<ContentSnapshot | null>(null);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [dirty]);
  const title = tabs.find((tab) => tab.id === section)?.label ?? "Settings";
  useEffect(() => { if (section === "users" || section === "account") return; fetch("/api/content", { cache: "no-store" }).then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Cannot load settings."); return payload; }).then((payload) => { setDraft(payload.content); setVersion(Number(payload.version)); }).catch((failure) => setError(failure.message || "Cannot load settings.")); }, [section]);
  async function saved(data?: unknown) {
    setError("");
    try {
    if (section === "branding") { setToast("Branding media is managed in the Visual Editor so it can be reviewed and published with the content draft."); window.setTimeout(() => setToast(""), 3500); return; }
    if (section === "account") {
      const values = data as { name?: string; email?: string; currentPassword?: string; newPassword?: string };
      const response = await fetch("/api/auth/account", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not update the account.");
      setDirty(false); setToast("Account updated. Sign in again with your new password.");
      window.setTimeout(() => setToast(""), 3500);
      return;
    }
    if (!draft) { setToast("Load the current draft before saving settings."); window.setTimeout(() => setToast(""), 3500); return; }
    const next = structuredClone(draft) as ContentSnapshot;
    if (section === "general" && data && typeof data === "object") { const values = data as { business: string; tagline: string; summary: string; year: string; location: string }; next.global.businessName = values.business; next.global.tagline = values.tagline; next.global.establishedYear = values.year; next.global.location = values.location; next.pages.home.brandStatement.copy = values.summary; }
    if (section === "contact" && data && typeof data === "object") { const values = data as { phone: string; email: string; facebook: string; address: string; maps: string; hours: string }; Object.assign(next.global, values); if (values.maps) next.pages.home.footer.secondary.href = values.maps; }
    const response = await fetch("/api/content", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ content: next, version }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(response.status === 409 ? "Conflict: the draft changed in another tab. Reload and merge your edits before saving." : [payload.error, payload.issues?.[0]?.message].filter(Boolean).join(" "));
    setDirty(false); setDraft(next); setVersion(Number(payload.version) || version + 1); setToast(`${title} saved as a private draft. Publish from the Visual Editor when ready.`); window.setTimeout(() => setToast(""), 3500);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Cannot reach the CMS. Your changes have been kept."); }
  }
  return <AdminShell eyebrow="Website configuration" title="Settings"><div className="settings-page" onChangeCapture={() => { if (section !== "users") setDirty(true); }}><nav className="settings-tabs" aria-label="Settings sections">{tabs.filter((tab) => tab.id !== "users" || canManageUsers).map((tab) => <Link className={tab.id === section ? "active" : ""} href={`/settings/${tab.id}`} key={tab.id} aria-current={tab.id === section ? "page" : undefined}><Icon name={tab.icon} /><span>{tab.label}</span></Link>)}</nav>{error ? <p className="settings-error" role="alert">{error}</p> : null}{!draft && !error && section !== "account" && section !== "users" ? <p role="status">Loading database settings…</p> : null}{section === "general" ? draft ? <GeneralSettings key={version} initial={draft} onSaved={saved} /> : null : null}{section === "branding" ? draft ? <BrandingSettings initial={draft} /> : null : null}{section === "contact" ? draft ? <ContactSettings key={version} initial={draft} onSaved={saved} /> : null : null}{section === "account" ? <AccountSettings onSaved={saved} /> : null}{section === "users" && canManageUsers ? <TeamSettings /> : null}</div>{toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}</AdminShell>;
}
