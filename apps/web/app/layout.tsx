import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LegalTech BR — Gestão Jurídica",
  description: "Sistema de gestão para escritórios de advocacia",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
