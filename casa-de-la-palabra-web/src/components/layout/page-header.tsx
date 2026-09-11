export function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-16 pb-10 text-center sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>
      <h1 className="mt-3 font-display text-3xl font-medium sm:text-4xl">{title}</h1>
      {description && <p className="mt-3 text-sm text-foreground/70 sm:text-base">{description}</p>}
    </div>
  );
}

export function ComingSoon({ label }: { label: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 text-center sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-dashed border-border p-10">
        <p className="text-sm text-muted-foreground">
          {label} se está preparando y se completará desde el panel de control.
        </p>
      </div>
    </div>
  );
}
