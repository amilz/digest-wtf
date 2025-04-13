import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.digest.wtf/'),
  title: "digest.wtf",
  description: "Personalized web content aggregation service",
  applicationName: "digest.wtf",
  authors: [{ name: "amilz", url: "https://github.com/amilz" }],
  keywords: [
    "AI",
    "Tracking",
    "Monitoring",
    "Web",
    "Content",
    "Aggregator",
    "Search",
    "Next.js",
    "Vercel"
  ],
  openGraph: {
    type: "website",
    siteName: "digest.wtf",
    title: "digest.wtf",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "digest.wtf - Personalized web content aggregation service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "https://www.digest.wtf/",
    creator: "https://github.com/amilz",
    title: "digest.wtf",
    description: "Personalized web content aggregation service",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      {
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  manifest: "/site.webmanifest",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'