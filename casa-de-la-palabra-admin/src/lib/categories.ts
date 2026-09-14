export type CategoryModule = "studies" | "videos" | "podcasts" | "courses" | "conferences" | "general";

export const MODULE_OPTIONS: { value: CategoryModule; label: string }[] = [
  { value: "studies", label: "Estudios bíblicos" },
  { value: "videos", label: "Videos" },
  { value: "podcasts", label: "Podcast" },
  { value: "courses", label: "Cursos" },
  { value: "conferences", label: "Conferencias" },
  { value: "general", label: "General" },
];
