import { redirect } from "next/navigation";

// Evita que Next la "congele" como pagina estatica: la redireccion se resuelve
// siempre en vivo, asi nunca se queda sin destino.
export const dynamic = "force-dynamic";

export default function Home() {
  redirect("/dashboard");
}
