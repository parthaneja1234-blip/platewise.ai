import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});


export const metadata: Metadata = {
  title: "PlateWise AI — Institutional Food Waste Intelligence & Demand Forecasting",
  description:
    "Predict daily cafeteria demand, cook to fit, and eliminate university dining food waste with automated batch analytics.",
  keywords: [
    "food waste reduction",
    "cafeteria demand forecasting",
    "university mess management",
    "institutional dining intelligence",
    "hospitality sustainability",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#1a3a1a] text-[#FAF8F2] antialiased">
        {children}
      </body>
    </html>

  );
}
