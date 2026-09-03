import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { DemoProvider } from "@/src/context/DemoContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DHARA-SOOCHAK",
  description: "Decision Support Platform",
  icons: {
    icon: [
      { url: '/logo/favicon.ico' },
      { url: '/logo/favicon_16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/logo/favicon_32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/logo/favicon_180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <DemoProvider>
          {children}
        </DemoProvider>
      </body>
    </html>
  );
}
