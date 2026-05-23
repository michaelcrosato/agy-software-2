import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FeedFlow | AI-Powered Customer Feedback & Upvote Board",
  description: "Capture, organize, and prioritize customer feedback with sleek glassmorphic aesthetics and AI-driven duplicate detection.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
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
