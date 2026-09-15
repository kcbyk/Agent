import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenArena Agent OS",
  description: "Next-gen Autonomous AI Agent OS with Gemini, Sandbox Execution, and Media Tools",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark h-full">
      <body className="h-full flex flex-col bg-[#121214] text-white overflow-hidden">
        {children}
      </body>
    </html>
  );
}
