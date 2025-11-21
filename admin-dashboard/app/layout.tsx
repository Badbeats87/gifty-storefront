import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "GiftyV2 Admin Dashboard",
  description: "Multi-tenant gift card platform administration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-white">
      <body className={`${inter.variable} font-sans antialiased bg-white text-black`}>
        <Navigation />
        <main className="min-h-[calc(100vh-4rem)] bg-white">
          {children}
        </main>
      </body>
    </html>
  );
}
