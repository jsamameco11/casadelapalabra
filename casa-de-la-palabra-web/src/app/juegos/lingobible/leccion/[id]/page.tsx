import { LingobibleLesson } from "@/components/lingobible/lingobible-lesson";

export default async function LeccionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LingobibleLesson lessonId={id} />;
}
