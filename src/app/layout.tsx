import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SELECT · Control de servicios",
  description: "Gestion de servicios para empresa de seguridad privada",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
