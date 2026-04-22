import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Excel to Markdown | 表格转换器",
  description: "快速将 Excel 文件转换为 Markdown 表格，完全本地运行，数据不上传服务器",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className={`${inter.className} min-h-full bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
