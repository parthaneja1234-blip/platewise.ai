import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlateWise AI — Food Waste Intelligence & Demand Forecasting",
  description: "Institutional cafeteria waste reduction, demand forecasting, and inventory analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#FAF8F5] text-[#1B2E24] antialiased">
        {children}
      </body>
    </html>
  );
}
