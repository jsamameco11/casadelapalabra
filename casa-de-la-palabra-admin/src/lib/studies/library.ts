import type { BlockType, SectionLayout } from "@/lib/studies/blocks";

// Catálogo de bloques disponibles al pulsar «Agregar contenido».
// Para sumar un tipo nuevo: agregarlo acá, al enum de la base y al
// renderizador público. Nada más.
export const BLOCK_LIBRARY: { type: BlockType; label: string; hint: string }[] = [
  { type: "text", label: "Texto", hint: "Párrafos con título opcional" },
  { type: "verse", label: "Versículo", hint: "Referencia, texto y reflexión opcional" },
  { type: "reflection", label: "Reflexión", hint: "Bloque de meditación independiente" },
  { type: "image", label: "Imagen", hint: "Imagen a todo el ancho" },
  { type: "image-text", label: "Imagen + texto", hint: "Imagen al lado del texto" },
  { type: "video", label: "Video", hint: "YouTube, Vimeo o URL incrustable" },
  { type: "audio", label: "Audio", hint: "Prédica o meditación en audio" },
  { type: "quote", label: "Cita", hint: "Frase con autor y fuente" },
  { type: "question", label: "Pregunta", hint: "Para detenerse a pensar" },
  { type: "list", label: "Lista", hint: "Puntos o pasos" },
  { type: "highlight", label: "Destacado", hint: "Idea que no debe pasarse por alto" },
  { type: "gallery", label: "Galería", hint: "Varias imágenes juntas" },
  { type: "divider", label: "Separador", hint: "Respiro visual entre ideas" },
];

export const BLOCK_LABEL: Record<BlockType, string> = Object.fromEntries(
  BLOCK_LIBRARY.map((b) => [b.type, b.label])
) as Record<BlockType, string>;

export const SECTION_LAYOUT_OPTIONS: { value: SectionLayout; label: string }[] = [
  { value: "standard", label: "Estándar" },
  { value: "editorial", label: "Editorial" },
  { value: "minimal", label: "Minimalista" },
  { value: "highlight", label: "Destacado" },
  { value: "immersive", label: "Inmersivo" },
  { value: "background-image", label: "Imagen de fondo" },
];

export const VERSE_LAYOUT_OPTIONS = [
  { value: "classic", label: "Clásico — referencia arriba" },
  { value: "editorial", label: "Editorial — texto grande" },
  { value: "highlight", label: "Destacado — fondo diferenciado" },
  { value: "immersive", label: "Inmersivo — sobre imagen" },
  { value: "side", label: "Lateral — composición al costado" },
];
