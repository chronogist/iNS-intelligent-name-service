import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { WalletProvider } from "@/components/WalletContext";
import GlobalHeader from "@/components/GlobalHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "iNS — Identity Name Service",
  description:
    "Replace complex 0x address with name that grow with you. Intelligent NFTs for evolving digital identities.",

  openGraph: {
    title: "iNS — Identity Name Service",
    description:
      "Replace complex 0x address with name that grow with you. Intelligent NFTs for evolving digital identities.",
    type: "website",
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <ThemeProvider>
          <WalletProvider>
            <GlobalHeader />
            {children}
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
