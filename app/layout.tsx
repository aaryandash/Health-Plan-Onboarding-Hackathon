import type { Metadata, Viewport } from "next";
import { Poppins, Zain } from "next/font/google";
import "./globals.css";

// Emme's own faces, taken from the font link on emme.com.
const zain = Zain({
  variable: "--font-zain",
  subsets: ["latin"],
  weight: ["300", "400", "700", "800"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Emme — set up your plan",
  description:
    "Tell Emme about your health plan so we can show you what your care actually costs.",
};

export const viewport: Viewport = {
  themeColor: "#01447e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${zain.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream">{children}</body>
    </html>
  );
}
