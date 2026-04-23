import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://excel2markdown.vercel.app"),
  title: {
    default: "Excel to Markdown | Free Online Table Converter",
    template: "%s | Excel to Markdown Converter",
  },
  description: "Free online Excel to Markdown table converter. Supports .xlsx, .xls, .xlsm formats. 100% local processing, no data uploaded. Custom alignment options, bold headers, clipboard paste support.",
  keywords: ["Excel to Markdown", "Excel converter", "Markdown table", "table converter", "xlsx to markdown", "free online tool", "local conversion", "clipboard paste", "developer tools"],
  authors: [{ name: "Excel to Markdown" }],
  creator: "Excel to Markdown",
  publisher: "Excel to Markdown",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://excel2markdown.vercel.app",
    title: "Excel to Markdown | Free Online Table Converter",
    description: "Convert Excel files to Markdown tables instantly. 100% local processing, your data never leaves your browser.",
    siteName: "Excel to Markdown",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Excel to Markdown Converter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Excel to Markdown | Free Online Table Converter",
    description: "Convert Excel files to Markdown tables instantly. 100% local processing, your data never leaves your browser.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://excel2markdown.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Excel to Markdown",
              "description": "Free online Excel to Markdown table converter. 100% local processing, no data uploaded.",
              "url": "https://excel2markdown.vercel.app",
              "applicationCategory": "DeveloperApplication",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
              },
              "featureList": "Excel to Markdown conversion, Local processing, No data upload, Alignment options, Bold header, Clipboard paste support",
              "inLanguage": "en",
            }),
          }}
        />
      </head>
      <body className={`${inter.className} min-h-full bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
