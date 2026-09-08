"use client";

import { Icon } from "@/components/Icon";

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="toast" role="status">
      <span className="toast-check"><Icon name="check" /></span>
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss notification"><Icon name="x" /></button>
    </div>
  );
}
