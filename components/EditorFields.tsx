"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { ContentSnapshot } from "@/lib/content/schema";

export const fieldLabel = (name: string) => name.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
export function EditorDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; ref.current?.showModal(); return () => previous?.focus(); }, []);
  return <dialog ref={ref} className="ve-dialog" aria-labelledby={id} onCancel={(event) => { event.preventDefault(); onClose(); }}><header><h2 id={id}>{title}</h2><button type="button" aria-label="Close dialog" onClick={onClose}>×</button></header>{children}</dialog>;
}

function MediaField({ value, onChange, publicOrigin, onBusy }: { value: Record<string, unknown>; onChange: (value: unknown) => void; publicOrigin: string; onBusy: (busy: boolean) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [alt, setAlt] = useState(String(value.alt ?? ""));
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const src = String(value.src);
  async function upload() {
    if (!file || uploading) return;
    if (!alt.trim() || alt.length > 300) { setError("Enter meaningful alt text, up to 300 characters."); return; }
    if (file.size > 5 * 1024 * 1024 || !["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type)) { setError("Choose a PNG, JPG, WebP or static SVG under 5 MB."); return; }
    setUploading(true); onBusy(true); setError("");
    try {
      const body = new FormData(); body.append("file", file); body.append("alt", alt.trim());
      const response = await fetch("/api/media", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Upload failed.");
      onChange({ ...value, src: result.src, assetId: result.assetId, alt: alt.trim() }); setFile(null);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Upload failed. Try again."); }
    finally { setUploading(false); onBusy(false); }
  }
  return <div className="ve-media"><img src={src.startsWith("/") ? `${publicOrigin}${src}` : src} alt={String(value.alt ?? "")} /><label>Image alt text<input value={String(value.alt ?? "")} maxLength={300} onChange={(event) => onChange({ ...value, alt: event.target.value })} /></label><label>Image focal point<input placeholder="50% 50%" value={String(value.focalPoint ?? "")} onChange={(event) => onChange({ ...value, focalPoint: event.target.value })} /></label><label className="ve-file">Replace image<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setPreview(event.target.files?.[0] ? URL.createObjectURL(event.target.files[0]) : ""); setAlt(String(value.alt ?? "")); setError(""); event.target.value = ""; }} /></label>{file ? <EditorDialog title="Replace image" onClose={() => { if (!uploading) setFile(null); }}><img className="ve-upload-preview" src={preview || undefined} alt={alt} /><p>{file.name} · {(file.size / 1024).toFixed(0)} KB</p><label>Required image description / Alt text<input value={alt} maxLength={300} disabled={uploading} onChange={(event) => setAlt(event.target.value)} /></label>{error ? <p role="alert">{error}</p> : null}<footer><button disabled={uploading} onClick={() => setFile(null)}>Cancel</button><button className="primary" disabled={uploading} onClick={() => void upload()}>{uploading ? "Uploading…" : "Upload and use image"}</button></footer></EditorDialog> : null}</div>;
}

type Props = { name: string; value: unknown; template?: unknown; onChange: (value: unknown) => void; products: ContentSnapshot["products"]; publicOrigin: string; onBusy: (busy: boolean) => void; requestRemove: (title: string, item: unknown, remove: () => void) => void };
export function EditorFields(props: Props) {
  const { name, value, template, onChange, products, publicOrigin, onBusy, requestRemove } = props;
  const id = useId();
  if (["id", "schemaVersion", "order", "assetId"].includes(name)) return null;
  const child = (key: string, entry: unknown, change: (value: unknown) => void, sample?: unknown) => <EditorFields {...props} key={key} name={key} value={entry} template={sample} onChange={change} />;
  if (name === "relatedProductIds" && Array.isArray(value)) return <fieldset><legend>Related products</legend>{products.map((product) => <label className="ve-check" key={product.id}><input type="checkbox" checked={value.includes(product.id)} onChange={(event) => onChange(event.target.checked ? [...value, product.id] : value.filter((id) => id !== product.id))} />{product.name}</label>)}</fieldset>;
  if (Array.isArray(value)) {
    const items: unknown[] = value;
    const reorder = (next: unknown[]) => onChange(next.map((item, order) => object(item) && "order" in item ? { ...item, order } : item));
    function add() {
      const sample = items[0] ?? (Array.isArray(template) ? template[0] : "New option");
      let next = structuredClone(sample);
      if (object(next)) {
        const newId = crypto.randomUUID();
        next = { ...next, ...(Object.hasOwn(next, "id") ? { id: newId } : {}), ...(Object.hasOwn(next, "slug") ? { slug: newId } : {}), ...(Object.hasOwn(next, "active") ? { active: false } : {}) };
        for (const key of ["name", "title", "question", "label"]) if (key in next) next[key] = "New item";
        if (Array.isArray(next.tiles)) next.tiles = next.tiles.map((tile: unknown) => object(tile) ? { ...tile, id: crypto.randomUUID() } : tile);
      } else next = "New option";
      reorder([...items, next]);
    }
    return <fieldset><legend>{fieldLabel(name)} · {value.length}</legend>{value.length === 0 ? <p>No items yet. Add an item to get started.</p> : null}{value.map((item, index) => {
      const title = object(item) ? String(item.name || item.title || item.label || item.question || `Item ${index + 1}`) : `Option ${index + 1}`;
      return <details className="ve-item" key={object(item) && typeof item.id === "string" ? item.id : index}><summary>{title}{object(item) && item.active === false ? " · Inactive" : ""}</summary><div className="ve-item-actions"><button type="button" disabled={!index} onClick={() => { const next = [...value]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; reorder(next); }}>Move up</button><button type="button" disabled={index === value.length - 1} onClick={() => { const next = [...value]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; reorder(next); }}>Move down</button><button type="button" onClick={() => requestRemove(title, item, () => reorder(value.filter((_, i) => i !== index)))}>Remove</button></div>{child(object(item) ? "Content" : `${fieldLabel(name)} ${index + 1}`, item, (next) => onChange(value.map((entry, i) => i === index ? next : entry)), Array.isArray(template) ? template[0] : undefined)}</details>;
    })}<button type="button" onClick={add}>Add item</button></fieldset>;
  }
  if (object(value)) {
    if (typeof value.src === "string" && "alt" in value) return <fieldset><legend>{fieldLabel(name)}</legend><MediaField value={value} onChange={onChange} publicOrigin={publicOrigin} onBusy={onBusy} /></fieldset>;
    return <fieldset><legend>{fieldLabel(name)}</legend>{Object.entries(value).map(([key, entry]) => child(key, entry, (next) => onChange({ ...value, [key]: next }), object(template) ? template[key] : undefined))}</fieldset>;
  }
  if (typeof value === "boolean") return <label className="ve-check"><input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />{fieldLabel(name)}{name === "active" ? " on the public website" : ""}</label>;
  return <div className="ve-field"><label htmlFor={id}>{fieldLabel(name)}</label>{typeof value === "number" ? <input id={id} type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} /> : <textarea id={id} rows={/description|details|copy|lead|answer/i.test(name) ? 4 : 2} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} />}</div>;
}



