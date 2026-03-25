import type { Metadata } from "next";
import { Manrope, Inter, Geist } from "next/font/google";
import { QueryProvider } from "@/shared/services/query-client/query-client.service";
import "./globals.css";
import { cn } from "@/shared/utils/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Ratio Fit",
  description: "Admin panel for Ratio Fit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased", manrope.variable, inter.variable, geist.variable, "font-sans")}
    >
      <body className="min-h-full">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
