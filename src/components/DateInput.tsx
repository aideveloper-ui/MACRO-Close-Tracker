"use client";

import { useRef } from "react";

interface Props {
  value: string;           // yyyy-mm-dd (internal ISO)
  onChange: (iso: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  title?: string;
  size?: "sm" | "md";
}

// Converts stored yyyy-mm-dd → display MM/DD/YYYY
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${m}/${d}/${y}`;
}

export default function DateInput({ value, onChange, disabled, placeholder, className, title, size = "md" }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div className={`dateinput${size === "sm" ? " dateinput-sm" : ""}${disabled ? " dateinput-disabled" : ""}${className ? ` ${className}` : ""}`} title={title}>
      {/* Display the value formatted as MM/DD/YYYY, or placeholder */}
      <span className="di-display">
        {value ? fmtDate(value) : <span className="di-ph">{placeholder ?? "MM/DD/YYYY"}</span>}
      </span>

      {/* Calendar icon — clicking it opens the hidden native date picker */}
      <button
        type="button"
        className="di-icon"
        disabled={disabled}
        onClick={() => ref.current?.showPicker?.() ?? ref.current?.click()}
        tabIndex={-1}
        aria-label="Open calendar"
      >
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      {/* Hidden native date input — handles the actual calendar popup */}
      <input
        ref={ref}
        type="date"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="di-native"
        tabIndex={disabled ? -1 : 0}
        lang="en-US"
      />
    </div>
  );
}
