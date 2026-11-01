import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
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
    <html lang="en" className={`${playfair.variable} ${jakarta.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#1a3a1a] text-[#FAF6EE] antialiased">
        {children}
      </body>
    </html>
  );
}
