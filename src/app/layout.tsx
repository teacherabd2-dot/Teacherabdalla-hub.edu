import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "English WonderHub - Grade 1 & 3 English Classroom",
  description:
    "Interactive English learning hub with Gemini phonics games, Canva sight word stories, and printable worksheets for Grade 1 and Grade 3 primary students.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen selection:bg-amber-300 selection:text-amber-950">
        {children}
      </body>
    </html>
  );
}
