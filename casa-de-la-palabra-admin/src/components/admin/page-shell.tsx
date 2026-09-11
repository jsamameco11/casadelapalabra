export function PageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="p-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>
      <h1 className="mt-1 font-display text-2xl font-medium">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      <div className="mt-8">{children}</div>
    </div>
  );
}

export function BuildingNotice({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
      {label} se implementa en la siguiente fase de construcción del panel.
    </div>
  );
}
