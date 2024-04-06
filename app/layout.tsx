import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Roboto } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";
import "./globals.css";

// If loading a variable font, you don't need to specify the font weight
const font = Roboto({
  weight: ["100", "300", "400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Eventer",
  description: "A simple event management app",
  generator: "Next.js",
  applicationName: "Eventer",
  keywords: ["Next.js", "React", "JavaScript"],
  creator: "Timur Kramár",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={font.className}>
      <body
        className={`h-screen bg-background text-foreground ${font.variable}`}
      >
        <main className="h-full min-h-screen w-full">{children}</main>
        <ToastContainer position="top-right" />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
