import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://excel2markdown.vercel.app"),
  title: {
    default: "Excel to Markdown | 在线 Excel 转 Markdown 表格转换器",
    template: "%s | Excel to Markdown 转换器",
  },
  description: "免费在线 Excel 转 Markdown 表格工具，支持 .xlsx, .xls, .xlsm 格式，完全本地运行，数据不上传服务器，支持对齐方式调整、粗体表头、剪贴板粘贴",
  keywords: ["Excel 转 Markdown", "Excel to Markdown", "表格转换器", "Markdown 表格", "在线工具", "Excel 转换", "xlsx to markdown", "本地转换"],
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
    locale: "zh_CN",
    url: "https://excel2markdown.vercel.app",
    title: "Excel to Markdown | 在线 Excel 转 Markdown 表格转换器",
    description: "免费在线 Excel 转 Markdown 表格工具，完全本地运行，数据不上传服务器",
    siteName: "Excel to Markdown",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Excel to Markdown 转换器",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Excel to Markdown | 在线 Excel 转 Markdown 表格转换器",
    description: "免费在线 Excel 转 Markdown 表格工具，完全本地运行，数据不上传服务器",
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
    <html lang="zh-CN" className="h-full">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Excel to Markdown",
              "description": "免费在线 Excel 转 Markdown 表格工具，完全本地运行，数据不上传服务器",
              "url": "https://excel2markdown.vercel.app",
              "applicationCategory": "DeveloperApplication",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "CNY",
              },
              "featureList": "Excel to Markdown conversion, Local processing, No data upload, Alignment options, Bold header, Clipboard paste support",
              "inLanguage": "zh-CN",
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
