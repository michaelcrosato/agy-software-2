import type { Metadata } from "next";
import { Navbar } from "../components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "AnswerFlow AI",
  description: "Smarter answers for every RFP",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        style={{
          margin: 0,
          backgroundColor: "var(--color-background)",
          color: "var(--color-text-primary)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          minHeight: "100vh",
        }}
      >
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
