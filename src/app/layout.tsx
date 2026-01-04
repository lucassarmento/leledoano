import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lele do Ano",
  description: "Vote no lele do ano! O premio vai pra quem fala mais besteira.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
