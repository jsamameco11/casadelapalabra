import { formatReference, type StudyContent, type StudyVerse } from "@/lib/studies/blocks";

// Copia exacta de casa-de-la-palabra-web/src/components/estudios/study-content.tsx
// — es el mismo renderizador que usa el sitio público, para que la
// previsualización del panel muestre pixel a pixel lo que verá el lector.
// Si cambias algo acá, cámbialo también allá.
export function StudyContentBlock({ content, bookNames }: { content: StudyContent; bookNames: Record<string, string> }) {
  switch (content.type) {
    case "verse":
      return <VerseBlock content={content} bookNames={bookNames} />;
    case "reflection":
      return <ReflectionBlock title={content.title} body={content.body} />;
    case "image":
      return <ImageBlock content={content} />;
    case "image-text":
      return <ImageTextBlock content={content} />;
    case "video":
      return <VideoBlock content={content} />;
    case "audio":
      return <AudioBlock content={content} />;
    case "quote":
      return <QuoteBlock content={content} />;
    case "question":
      return <QuestionBlock content={content} />;
    case "list":
      return <ListBlock content={content} />;
    case "highlight":
      return <HighlightBlock content={content} />;
    case "divider":
      return <hr className="mx-auto my-10 w-24 border-t border-border" />;
    case "gallery":
      return <GalleryBlock content={content} />;
    case "text":
    default:
      return <TextBlock content={content} />;
  }
}

function Prose({ text }: { text: string }) {
  return (
    <div className="space-y-4 text-base leading-relaxed text-foreground/80">
      {text.split(/\n{2,}/).map((paragraph, i) => (
        <p key={i} className="whitespace-pre-line">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function TextBlock({ content }: { content: StudyContent }) {
  return (
    <div>
      {content.title && <h3 className="mb-1 font-display text-xl font-medium">{content.title}</h3>}
      {content.subtitle && <p className="mb-3 text-sm text-muted-foreground">{content.subtitle}</p>}
      {content.body && <Prose text={content.body} />}
    </div>
  );
}

function VerseBlock({ content, bookNames }: { content: StudyContent; bookNames: Record<string, string> }) {
  const verse = content.verse;
  if (!verse) return null;

  const layout = (content.configuration.layout as string) ?? "classic";
  const reference = verse.show_reference
    ? formatReference(verse, verse.book_slug ? bookNames[verse.book_slug] : undefined)
    : "";
  const translation = verse.translation_code ? ` · ${verse.translation_code}` : "";
  const hasImage = Boolean(content.media_url);
  const immersive = layout === "immersive" && hasImage;
  // "side" necesita una imagen para tener sentido (es justo lo que compone
  // "al costado"); sin imagen cae de nuevo a una caja simple, como highlight.
  const side = layout === "side" && hasImage;

  const body = (
    <div className={immersive ? "relative bg-black/55 p-10 text-white" : side ? "p-8 sm:flex-1" : ""}>
      {content.title && (
        <p className={`text-xs font-semibold uppercase tracking-widest ${immersive ? "text-white/80" : "text-accent"}`}>
          {content.title}
        </p>
      )}

      {layout === "classic" && reference && (
        <p className={`mt-1 text-sm ${immersive ? "text-white/70" : "text-muted-foreground"}`}>
          {reference}
          {translation}
        </p>
      )}

      {verse.text && (
        <blockquote
          className={`mt-3 font-display leading-relaxed ${
            layout === "editorial" || immersive ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
          }`}
        >
          {verse.text}
        </blockquote>
      )}

      {layout !== "classic" && reference && (
        <figcaption className={`mt-3 text-sm ${immersive ? "text-white/70" : "text-muted-foreground"}`}>
          {reference}
          {translation}
        </figcaption>
      )}

      {verse.reflection_enabled && (verse.reflection_title || verse.reflection_content) && (
        <div className={`mt-6 border-t pt-5 ${immersive ? "border-white/25" : "border-border"}`}>
          <p
            className={`text-xs font-semibold uppercase tracking-widest ${
              immersive ? "text-white/80" : "text-muted-foreground"
            }`}
          >
            {verse.reflection_title || "Para meditar"}
          </p>
          {verse.reflection_content && (
            <div className={immersive ? "mt-2 text-white/90" : "mt-2"}>
              <Prose text={verse.reflection_content} />
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (side) {
    return (
      <figure className="overflow-hidden rounded-3xl border border-border sm:flex sm:items-stretch">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={content.media_url!}
          alt={content.media_alt ?? ""}
          className="h-48 w-full shrink-0 object-cover sm:h-auto sm:w-2/5"
        />
        {body}
      </figure>
    );
  }

  return (
    <figure
      className={
        immersive
          ? "relative overflow-hidden rounded-3xl"
          : layout === "highlight" || layout === "side"
            ? "rounded-3xl border border-border bg-muted/40 p-8"
            : ""
      }
    >
      {immersive && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={content.media_url!} alt={content.media_alt ?? ""} className="absolute inset-0 h-full w-full object-cover" />
      )}
      {body}
    </figure>
  );
}

function ReflectionBlock({ title, body }: { title: string | null; body: string | null }) {
  return (
    <div className="border-l-2 border-accent pl-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title || "Para meditar"}</p>
      {body && <div className="mt-2">{<Prose text={body} />}</div>}
    </div>
  );
}

function ImageBlock({ content }: { content: StudyContent }) {
  if (!content.media_url) return null;
  return (
    <figure>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={content.media_url}
        alt={content.media_alt ?? ""}
        loading="lazy"
        className="w-full rounded-3xl object-cover"
      />
      {content.title && <figcaption className="mt-2 text-sm text-muted-foreground">{content.title}</figcaption>}
    </figure>
  );
}

function ImageTextBlock({ content }: { content: StudyContent }) {
  const reversed = content.configuration.alignment === "right";
  return (
    <div className={`gap-8 sm:flex sm:items-center ${reversed ? "sm:flex-row-reverse" : ""}`}>
      {content.media_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={content.media_url}
          alt={content.media_alt ?? ""}
          loading="lazy"
          className="mb-4 w-full rounded-3xl object-cover sm:mb-0 sm:w-1/2"
        />
      )}
      <div className="sm:flex-1">
        {content.title && <h3 className="mb-2 font-display text-xl font-medium">{content.title}</h3>}
        {content.body && <Prose text={content.body} />}
      </div>
    </div>
  );
}

function VideoBlock({ content }: { content: StudyContent }) {
  if (!content.media_url) return null;
  return (
    <div>
      {content.title && <h3 className="mb-2 font-display text-xl font-medium">{content.title}</h3>}
      <div className="aspect-video overflow-hidden rounded-3xl border border-border">
        <iframe
          src={content.media_url}
          title={content.title ?? "Video"}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
      {content.body && <div className="mt-3">{<Prose text={content.body} />}</div>}
    </div>
  );
}

function AudioBlock({ content }: { content: StudyContent }) {
  if (!content.media_url) return null;
  return (
    <div className="rounded-3xl border border-border p-6">
      {content.title && <h3 className="mb-1 font-display text-lg font-medium">{content.title}</h3>}
      {content.body && <p className="mb-3 text-sm text-muted-foreground">{content.body}</p>}
      <audio controls preload="none" src={content.media_url} className="w-full">
        Tu navegador no puede reproducir este audio.
      </audio>
    </div>
  );
}

function QuoteBlock({ content }: { content: StudyContent }) {
  const author = content.configuration.author as string | undefined;
  const source = content.configuration.source as string | undefined;
  return (
    <blockquote className="border-l-2 border-accent pl-6">
      {content.body && <p className="font-display text-xl leading-relaxed sm:text-2xl">{content.body}</p>}
      {(author || source) && (
        <footer className="mt-3 text-sm text-muted-foreground">
          {author}
          {author && source ? " · " : ""}
          {source}
        </footer>
      )}
    </blockquote>
  );
}

function QuestionBlock({ content }: { content: StudyContent }) {
  return (
    <div className="rounded-3xl bg-muted/50 p-8 text-center">
      {content.title && (
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">{content.title}</p>
      )}
      {content.body && <p className="mt-2 font-display text-xl leading-relaxed sm:text-2xl">{content.body}</p>}
      {content.subtitle && <p className="mt-3 text-sm text-muted-foreground">{content.subtitle}</p>}
    </div>
  );
}

function ListBlock({ content }: { content: StudyContent }) {
  const items = Array.isArray(content.configuration.items) ? content.configuration.items : [];
  if (items.length === 0) return null;
  return (
    <div>
      {content.title && <h3 className="mb-3 font-display text-xl font-medium">{content.title}</h3>}
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-base leading-relaxed text-foreground/80">
            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HighlightBlock({ content }: { content: StudyContent }) {
  return (
    <div className="rounded-3xl border border-accent/30 bg-accent/5 p-8">
      {content.title && <h3 className="mb-2 font-display text-xl font-medium">{content.title}</h3>}
      {content.body && <Prose text={content.body} />}
    </div>
  );
}

function GalleryBlock({ content }: { content: StudyContent }) {
  const images = Array.isArray(content.configuration.images) ? content.configuration.images : [];
  if (images.length === 0) return null;
  return (
    <div>
      {content.title && <h3 className="mb-3 font-display text-xl font-medium">{content.title}</h3>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((image, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={image.url}
            alt={image.alt ?? ""}
            loading="lazy"
            className="aspect-square w-full rounded-2xl object-cover"
          />
        ))}
      </div>
    </div>
  );
}

export type { StudyVerse };
