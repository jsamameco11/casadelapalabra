import { LiveRoom } from "@/components/impostor/live-room";

export default async function SalaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LiveRoom roomId={id} />;
}
