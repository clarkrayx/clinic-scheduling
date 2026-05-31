import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "品叡品沐 | PINRAY DENTAL CARE",
  description: "品叡品沐牙醫診所助理排班管理系統",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className="h-full">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full">{children}</body>
    </html>
  );
}
