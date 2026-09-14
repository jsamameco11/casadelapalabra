import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Nuevo estudio" };

// Una sección necesita que el estudio ya exista (study_id es una llave
// foránea), así que no hay forma de mostrar el constructor antes de tener
// una fila real — pero eso no debería sentirse como "dos pasos" para quien
// edita. En vez de pedir guardar los datos generales primero, se crea el
// estudio en borrador al instante (título vacío, slug provisional) y se
// entra directo a la pantalla completa: datos + constructor + previsualización
// juntos, desde el primer clic en "Nuevo estudio".
export default async function NuevoEstudioPage() {
  const supabase = await createClient();
  const slug = `estudio-sin-titulo-${Date.now().toString(36)}`;

  const { data, error } = await supabase
    .from("casa_studies")
    .insert({ slug, title: "", status: "draft", position: 0 })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo crear el estudio.");
  }

  redirect(`/estudios/${data.id}`);
}
