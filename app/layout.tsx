import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Event Hub",
  description: "Jouw centrale werkplek voor eventmanagement",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
