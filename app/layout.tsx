// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MTIS Voting System | Mr. & Mrs. MTIS 2026",
  description: "Official voting system for Mr. & Mrs. MTIS 2026 pageant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
