"use client";

// Campos base del constructor. Se guardan al salir del campo (onBlur), no en
// cada tecla: así el autoguardado no dispara una escritura por letra.
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

export function TextField({
  value,
  onCommit,
  placeholder,
}: {
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      defaultValue={value}
      placeholder={placeholder}
      onBlur={(e) => e.target.value !== value && onCommit(e.target.value)}
      className={inputClass}
    />
  );
}

export function TextAreaField({
  value,
  onCommit,
  placeholder,
  rows = 5,
}: {
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      defaultValue={value}
      placeholder={placeholder}
      rows={rows}
      onBlur={(e) => e.target.value !== value && onCommit(e.target.value)}
      className={`${inputClass} resize-y leading-relaxed`}
    />
  );
}

export function NumberField({
  value,
  onCommit,
  placeholder,
}: {
  value: number | null;
  onCommit: (value: number | null) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      min={1}
      defaultValue={value ?? ""}
      placeholder={placeholder}
      onBlur={(e) => {
        const next = e.target.value === "" ? null : Number(e.target.value);
        if (next !== value) onCommit(next);
      }}
      className={inputClass}
    />
  );
}

export function SelectField<T extends string>({
  value,
  options,
  onCommit,
}: {
  value: T;
  options: { value: T; label: string }[];
  onCommit: (value: T) => void;
}) {
  return (
    <select value={value} onChange={(e) => onCommit(e.target.value as T)} className={inputClass}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function CheckboxField({
  checked,
  label,
  onCommit,
}: {
  checked: boolean;
  label: string;
  onCommit: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onCommit(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function IconButton({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
        danger ? "text-danger hover:bg-danger/10" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
