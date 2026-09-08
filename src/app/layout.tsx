import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Does AI Recommend You? | AI Search Recommendation Visibility",
  description: "Find out whether ChatGPT, Gemini, and Perplexity recommend your business — and discover how to become more recommendable.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
