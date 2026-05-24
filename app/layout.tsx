import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AnswerFlow AI | Intelligent RFP & Security Questionnaire Workspace",
  description: "Accelerate B2B proposal and vendor questionnaire responses with source-cited, secure, local-first RAG drafts and seamless expert review workflows.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <div className="flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
