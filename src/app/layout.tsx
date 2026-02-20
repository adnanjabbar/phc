import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PHC MSDS Compliance Platform",
  description: "Punjab Healthcare Commission Minimum Service Delivery Standards Compliance & Monitoring Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
